const r=require('express').Router(),db=require('../db'),E=require('../services/engine');
r.post('/online',(q,s)=>{db.prepare('UPDATE users SET online=? WHERE id=?').run(q.body.online?1:0,q.uid);s.json({ok:true})});
r.get('/jobs',(q,s)=>{const u=db.prepare('SELECT online,earn FROM users WHERE id=?').get(q.uid);if(!u.online)return s.json({online:false,jobs:[]});
const hub=db.prepare("SELECT * FROM nodes WHERE type='hub' ORDER BY id LIMIT 1").get();
s.json({online:true,earn:u.earn,jobs:db.prepare('SELECT l.id,l.name,l.emoji,l.qty,n.name donor,n.x,n.y FROM listings l JOIN nodes n ON n.id=l.donor_id WHERE qty>0 AND expires_at>? ORDER BY expires_at LIMIT 5').all(Date.now())
.map(l=>{const km=E.dist(l,{x:200,y:155});return{...l,hub:hub.name,km:+km.toFixed(1),pay:30+Math.round(km*8)}})})});
r.post('/accept',(q,s)=>{const l=db.prepare('SELECT * FROM listings WHERE id=? AND qty>0 AND expires_at>?').get(q.body.listingId,Date.now());
if(!l)return s.status(409).json({error:'Pickup no longer available'});
const km=E.dist(E.node(l.donor_id),{x:200,y:155}),pay=30+Math.round(km*8),n=Math.min(l.qty,10);
db.transaction(()=>{db.prepare('UPDATE listings SET qty=qty-? WHERE id=?').run(n,l.id);db.prepare('INSERT INTO jobs(user_id,listing_id,pay,created_at) VALUES(?,?,?,?)').run(q.uid,l.id,pay,Date.now());
db.prepare('UPDATE users SET earn=earn+?,points=points+15 WHERE id=?').run(pay,q.uid);E.stat('meals',n)})();
E.notify('🎉',`Delivered. You earned ₹${pay} and 15 Grain Points.`,q.uid);s.json({pay,points:15})});
module.exports=r;