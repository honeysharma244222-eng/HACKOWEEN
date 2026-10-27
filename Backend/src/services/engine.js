const db=require('../db');
const now=()=>Date.now(),node=id=>db.prepare('SELECT * FROM nodes WHERE id=?').get(id);
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y)/60;
const notify=(icon,text,user=null)=>db.prepare('INSERT INTO notifications(user_id,icon,text,created_at) VALUES(?,?,?,?)').run(user,icon,text,now());
const stat=(k,n)=>db.prepare('UPDATE stats SET v=v+? WHERE k=?').run(n,k);
function pickPartner(fromId,skip=[]){const f=node(fromId);
const busy=db.prepare("SELECT partner_id p FROM rescues WHERE status='active'").all().map(r=>r.p);
const c=db.prepare('SELECT * FROM partners WHERE online=1').all().filter(p=>!skip.includes(p.id))
.map(p=>({p,b:busy.includes(p.id)?1:0,d:Math.hypot(p.x-f.x,p.y-f.y)})).sort((a,b)=>a.b-b.b||a.d-b.d);
return c.length?c[0].p:db.prepare('SELECT * FROM partners ORDER BY id LIMIT 1').get()}
// Send surplus to nearest hubs that need it and can be reached before expiry. Returns undelivered qty.
function rescue(srcId,name,emoji,qty,exp,event){let rem=qty;const src=node(srcId);
const hubs=db.prepare("SELECT * FROM nodes WHERE type='hub'").all().map(h=>({h,d:dist(src,h)})).sort((a,b)=>a.d-b.d);
for(const{h,d}of hubs){if(rem<=0)break;const eta=Math.round(d*6+5);if(eta*60000>exp-now()-60000)continue;
const n=Math.min(h.need,rem);if(n<=0)continue;
db.prepare('UPDATE nodes SET need=need-? WHERE id=?').run(n,h.id);rem-=n;const p=pickPartner(srcId);
db.prepare('INSERT INTO rescues(name,emoji,qty,from_id,to_id,partner_id,event,fail_at,expires_at,created_at) VALUES(?,?,?,?,?,?,?,?,?,?)')
.run(name,emoji,n,srcId,h.id,p.id,event||'Surplus',Math.random()<.4?.15+Math.random()*.3:null,exp,now());
notify('🚨',`${n}× ${name} sent to ${h.name}. ${p.name} assigned instantly.`)}
if(rem>0)notify('⚠️',`${rem} portions could not reach a centre in time. Listed free in Food.`);return rem}
function report({src,name,qty,minutes,event,emoji='🍲'}){const exp=now()+minutes*60000,rem=rescue(src,name,emoji,qty,exp,event);
if(rem>0)db.prepare("INSERT INTO listings(name,emoji,donor_id,qty,mode,price,category,veg,auto,expires_at) VALUES(?,?,?,?,'free',0,'Meals',1,1,?)").run(name,emoji,src,rem,exp);return rem}
function reassign(r){const old=db.prepare('SELECT name FROM partners WHERE id=?').get(r.partner_id).name;
const used=r.tries>=4?[]:[r.partner_id];const p=pickPartner(r.from_id,used);
db.prepare('UPDATE rescues SET partner_id=?,tries=tries+1,progress=0,fail_at=NULL WHERE id=?').run(p.id,r.id);
notify('🔁',`${old} can’t reach the pickup. ${p.name} is assigned instantly.`)}
const stage=t=>t>=1?5:t>=.55?4:t>=.5?3:t>=.12?2:t>0?1:0;
exports.STEPS=['Order confirmed','Partner assigned','Heading to pickup','Food picked up','On the way to you','Delivered'];
exports.stage=stage;
function tick(){
db.prepare("SELECT * FROM rescues WHERE status='active'").all().forEach(r=>{const p=Math.min(1,r.progress+.02);
db.prepare('UPDATE rescues SET progress=? WHERE id=?').run(p,r.id);
if(r.fail_at!=null&&p>=r.fail_at)return reassign({...r,progress:p});
if(p>=1){db.prepare("UPDATE rescues SET status='done' WHERE id=?").run(r.id);stat('meals',r.qty);notify('🎉',`${r.qty}× ${r.name} delivered to ${node(r.to_id).name}.`)}});
db.prepare("SELECT * FROM orders WHERE status!='delivered'").all().forEach(o=>{const p=Math.min(1,o.progress+.02),s=stage(p);
db.prepare('UPDATE orders SET progress=?,status=? WHERE id=?').run(p,s==5?'delivered':exports.STEPS[s],o.id);
if(s==5)notify('🎉','Your order was delivered. Enjoy! +10 pts',o.user_id)});
db.prepare("SELECT * FROM listings WHERE auto=0 AND qty>0 AND expires_at>? AND expires_at<?").all(now(),now()+9e5).forEach(l=>{
db.prepare('UPDATE listings SET auto=1 WHERE id=?').run(l.id);notify('⏰',`${l.name} expires in under 15 min. Auto-rescue started.`);
db.prepare('UPDATE listings SET qty=? WHERE id=?').run(rescue(l.donor_id,l.name,l.emoji,l.qty,l.expires_at,'Near expiry'),l.id)})}
Object.assign(exports,{rescue,report,reassign,pickPartner,tick,notify,stat,node,dist});