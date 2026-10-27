const NODES={D1:{n:'Annapurna Kitchen',x:60,y:70,t:'donor'},D2:{n:'Green Leaf Bakery',x:315,y:60,t:'donor'},D3:{n:'Punjab Dhaba',x:85,y:235,t:'donor'},D4:{n:'Hotel Sunrise',x:325,y:225,t:'donor'},
D5:{n:'Royal Banquet Hall',x:130,y:175,t:'donor'},H1:{n:'Seva Community Kitchen',x:150,y:110,t:'hub'},H2:{n:'Hope Shelter',x:260,y:260,t:'hub'},H3:{n:'Ashray Orphanage',x:280,y:120,t:'hub'}};
const YOU={x:200,y:155},BASE={x:200,y:285};
const now=()=>Date.now();
const SEED=[
{id:1,e:'🍛',name:'Dal & rice boxes',d:'D1',qty:24,mode:'free',price:0,min:55,cat:'Meals',veg:1},
{id:2,e:'🍞',name:'Fresh bread loaves',d:'D2',qty:30,mode:'free',price:0,min:90,cat:'Bakery',veg:1},
{id:3,e:'🍕',name:'Veg pizza slices',d:'D4',qty:18,mode:'sub',price:29,min:35,cat:'Meals',veg:1},
{id:4,e:'🥗',name:'Salad & fruit cups',d:'D3',qty:12,mode:'sub',price:19,min:120,cat:'Fresh',veg:1},
{id:5,e:'🍗',name:'Chicken curry combo',d:'D4',qty:10,mode:'sub',price:49,min:16,cat:'Meals',veg:0},
{id:6,e:'🥛',name:'Milk & curd packs',d:'D1',qty:20,mode:'free',price:0,min:150,cat:'Fresh',veg:1}];
let S;
try{S=JSON.parse(localStorage.getItem('gg2'))}catch(e){}
if(!S||!S.l)S={l:SEED.map(x=>({...x,exp:now()+x.min*60000})),pts:120,notes:[{i:'🌾',t:'Welcome to Grain Grid. Every claim earns Grain Points.',at:now()}],orders:[],stats:{meals:1280,kg:640,co2:1600},online:false,jobs:[],earn:0,seen:0,need:{H1:40,H2:30,H3:25},rescues:[]};
const save=()=>{try{localStorage.setItem('gg2',JSON.stringify(S))}catch(e){}};
let tab='explore',cat='All',q='',cart={},live=null;
const $=s=>document.querySelector(s);
const TABS=[['explore','🍱','Explore'],['map','🗺️','Network'],['rescue','🚨','Rescue'],['deliver','🛵','Deliver'],['activity','📊','Impact']];
function toast(t){const e=$('#toast');e.textContent=t;e.classList.add('on');clearTimeout(toast.h);toast.h=setTimeout(()=>e.classList.remove('on'),2600)}
function note(i,t){S.notes.unshift({i,t,at:now()});S.notes=S.notes.slice(0,30);toast(i+' '+t);save();head()}
function head(){$('#pts').textContent='🌾 '+S.pts+' pts';const u=S.notes.length-S.seen;$('#bd').textContent=u;$('#bd').style.display=u>0?'grid':'none'}
function nav(){$('#nav').innerHTML=TABS.map(t=>`<button class="${tab==t[0]?'on':''}" data-t="${t[0]}"><span>${t[1]}</span>${t[2]}</button>`).join('')}
$('#nav').onclick=e=>{const b=e.target.closest('button');if(b){tab=b.dataset.t;nav();render()}};
$('#bell').onclick=()=>{tab='activity';S.seen=S.notes.length;nav();render();head();save()};
const left=l=>Math.max(0,Math.floor((l.exp-now())/60000));
const dist=id=>{const n=NODES[id];return (Math.hypot(n.x-YOU.x,n.y-YOU.y)/60).toFixed(1)};
function render(){({explore:rExplore,map:rMap,rescue:rRescue,deliver:rDeliver,activity:rAct})[tab]();cartUI()}
function rExplore(){
const L=S.l.filter(l=>l.exp>now()&&l.qty>0&&(cat=='All'||l.cat==cat||(cat=='Free'&&l.mode=='free'))&&(l.name+NODES[l.d].n).toLowerCase().includes(q.toLowerCase())).sort((a,b)=>a.exp-b.exp);
$('#v').innerHTML=`<section class="hero"><h1 class="lg">Surplus food, moved to where it’s needed.</h1><p>Order food or report leftovers from a function or event. Our automation sends surplus to the nearest NGOs and shelters, assigns a delivery partner at once, and re-assigns if one can’t reach.</p>
<div class="stats"><div><b>${S.stats.meals.toLocaleString()}</b>meals redistributed</div><div><b>${S.stats.kg} kg</b>food saved from waste</div><div><b>${S.stats.co2} kg</b>CO₂ avoided</div></div></section>
<input id="q" placeholder="Search dal, bread, restaurant…" value="${q}" aria-label="Search">
<div class="chips">${['All','Free','Meals','Bakery','Fresh'].map(c=>`<button class="${cat==c?'on':''}" data-c="${c}">${c}</button>`).join('')}</div>
<div class="grid">${L.map(l=>{const m=left(l),u=m<40;return `<div class="card"><div class="top"><div class="em">${l.e}</div><div><h3>${l.name}</h3><div class="mu">${NODES[l.d].n} · ${dist(l.d)} km</div></div></div>
<div class="row"><span class="tag ${u?'u':''}">⏱ <span class="tm" data-x="${l.exp}">${fmt(l.exp-now())}</span> left</span><span class="tag g">${l.mode=='free'?'Free':'₹'+l.price}</span><span class="tag">${l.veg?'🟢 Veg':'🔴 Non-veg'}</span></div>
<div class="bar"><i style="width:${Math.min(100,l.qty*4)}%"></i></div>
<div class="row"><span class="mu">${l.qty} portions left</span><span class="sp"></span>${cart[l.id]?`<button class="btn s" data-m="${l.id}">−</button><b>${cart[l.id]}</b>`:''}<button class="btn" data-a="${l.id}">${cart[l.id]?'+':'Claim'}</button></div></div>`}).join('')||'<p class="mu">Nothing matches right now. Check back soon, new surplus is listed all day.</p>'}</div>`;
$('#q').oninput=e=>{q=e.target.value;rExplore();$('#q').focus();$('#q').setSelectionRange(q.length,q.length)};
}
$('#v').onclick=e=>{const b=e.target.closest('button');if(!b)return;const d=b.dataset;
if(d.c){cat=d.c;rExplore()}
if(d.a){const l=S.l.find(x=>x.id==d.a);if((cart[l.id]||0)<Math.min(l.qty,6))cart[l.id]=(cart[l.id]||0)+1;else toast('Limit reached for this item');rExplore();cartUI()}
if(d.m){cart[d.m]--;if(!cart[d.m])delete cart[d.m];rExplore();cartUI()}
if(d.job){takeJob(+d.job)}
if(d.fail){const r=S.rescues.find(x=>String(x.id)==d.fail);if(r&&!r.done&&r.pt<.5){reassign(r);rRescue()}}};
function cartUI(){const n=Object.values(cart).reduce((a,b)=>a+b,0);const tot=Object.entries(cart).reduce((a,[i,c])=>a+c*S.l.find(x=>x.id==i).price,0);
$('#cart').classList.toggle('on',n>0&&tab=='explore');$('#ct').innerHTML=`<b>${n} portion${n>1?'s':''}</b> · ${tot?'₹'+tot:'Free'}`}
$('#co').onclick=()=>{const items=Object.entries(cart).map(([i,c])=>{const l=S.l.find(x=>x.id==i);l.qty-=c;return{n:l.name,c,d:l.d}});
const o={id:Date.now(),items,d:items[0].d,t:0,done:0};S.orders.unshift(o);cart={};S.pts+=10;save();live=o;
note('✅','Order confirmed. Finding the nearest delivery partner…');tab='map';nav();render()};
function pos(t,from,to,st){const pts=[st||BASE,NODES[from],to||YOU];const seg=t<.5?0:1,k=t<.5?t*2:(t-.5)*2;const a=pts[seg],b=pts[seg+1];return{x:a.x+(b.x-a.x)*k,y:a.y+(b.y-a.y)*k}}
const STEPS=['Order confirmed','Partner assigned','Heading to pickup','Food picked up','On the way to you','Delivered'];
function stage(t){return t>=1?5:t>=.55?4:t>=.5?3:t>=.12?2:t>0?1:0}
function rMap(){
const o=live&&!live.done?live:null;const p=o?pos(o.t,o.d):null;
let s=`<svg class="map" viewBox="0 0 400 300" role="img" aria-label="Live network map"><g stroke="var(--ln)" stroke-width="1">${[...Array(9)].map((_,i)=>`<line x1="${i*50}" y1="0" x2="${i*50}" y2="300"/>`).join('')}${[...Array(7)].map((_,i)=>`<line x1="0" y1="${i*50}" x2="400" y2="${i*50}"/>`).join('')}</g>`;
Object.entries(NODES).forEach(([k,n])=>{if(n.t=='donor'||n.t=='hub')s+=`<g><circle cx="${n.x}" cy="${n.y}" r="13" fill="${n.t=='donor'?'var(--pr)':'var(--gd)'}"/><text x="${n.x}" y="${n.y+4}" font-size="12" text-anchor="middle">${n.t=='donor'?'🍽':'🏠'}</text><text x="${n.x}" y="${n.y+27}" font-size="8.5" text-anchor="middle" fill="var(--tx)">${n.n}</text></g>`});
if(o){s+=`<polyline points="${BASE.x},${BASE.y} ${NODES[o.d].x},${NODES[o.d].y} ${YOU.x},${YOU.y}" fill="none" stroke="var(--bl)" stroke-width="2.5" stroke-dasharray="5 4"/>`}
s+=`<circle cx="${YOU.x}" cy="${YOU.y}" r="9" fill="var(--rd)"/><circle cx="${YOU.x}" cy="${YOU.y}" r="16" fill="none" stroke="var(--rd)" opacity=".4"/><text x="${YOU.x}" y="${YOU.y-20}" font-size="9" text-anchor="middle" font-weight="700" fill="var(--tx)">You</text>`;
if(S.online&&!o)s+=`<text x="${BASE.x}" y="${BASE.y}" font-size="16" text-anchor="middle">🛵</text>`;
if(p)s+=`<circle cx="${p.x}" cy="${p.y}" r="12" fill="var(--bl)"/><text x="${p.x}" y="${p.y+5}" font-size="14" text-anchor="middle">🛵</text>`;
S.rescues.filter(r=>!r.done).forEach(r=>{const P=PARTNERS[r.partner],q=pos(r.pt,r.from,NODES[r.to],P);s+=`<polyline points="${P.x},${P.y} ${NODES[r.from].x},${NODES[r.from].y} ${NODES[r.to].x},${NODES[r.to].y}" fill="none" stroke="var(--gd)" stroke-width="2" stroke-dasharray="4 4"/><circle cx="${q.x}" cy="${q.y}" r="12" fill="var(--gd)"/><text x="${q.x}" y="${q.y+5}" font-size="14" text-anchor="middle">🛵</text>`});
s+='</svg>';
const st=o?stage(o.t):-1;
$('#v').innerHTML=`<h2 class="sec" style="margin-top:4px">Live food network</h2><div class="two"><div>${s}<div class="row mu" style="margin-top:8px"><span>🍽 Donors</span><span>🏠 Kitchens &amp; shelters</span><span>🛵 Partners</span><span>🔴 You</span></div></div>
<div class="card"><h3>${o?'Tracking your order':'No active delivery'}</h3>${o?STEPS.map((x,i)=>`<div class="step ${i<=st?'d':''}"><i></i>${x}</div>`).join('')+`<div class="bar"><i style="width:${Math.round(o.t*100)}%"></i></div><div class="mu">Partner: Ravi K. · ⭐ 4.9</div>`:`<p class="mu">Claim food from Explore and you will see your partner move across the map in real time. Surplus is auto-matched to the nearest kitchen if no one claims it.</p><button class="btn" data-c="x" onclick="tab='explore';nav();render()">Browse food</button>`}</div></div>`}
const PARTNERS=[{n:'Ravi K.',x:200,y:285},{n:'Aman S.',x:30,y:150},{n:'Priya M.',x:370,y:150},{n:'Sana D.',x:200,y:20}];
const EVENTS=['Wedding reception','Corporate function','Festival or community event','Restaurant closing'];
const HN=()=>Object.keys(NODES).filter(k=>NODES[k].t=='hub');
const hd=(a,h)=>Math.hypot(NODES[a].x-NODES[h].x,NODES[a].y-NODES[h].y)/60;
const fmt=ms=>{ms=Math.max(0,Math.floor(ms/1000));const h=Math.floor(ms/3600),m=Math.floor(ms%3600/60),s=ms%60;return (h?h+':':'')+String(m).padStart(2,'0')+':'+String(s).padStart(2,'0')};
/* AUTOMATION ENGINE: split surplus across the nearest NGOs/shelters that can be reached before expiry */
function pickPartner(from,skip){const busy=S.rescues.filter(r=>!r.done).map(r=>r.partner);
const c=PARTNERS.map((p,i)=>({i,d:Math.hypot(p.x-NODES[from].x,p.y-NODES[from].y)})).filter(c=>!skip.includes(c.i)).sort((a,b)=>(busy.includes(a.i)-busy.includes(b.i))||a.d-b.d);
return c.length?c[0].i:0}
function rescue(src,name,e,qty,exp,ev){let rem=qty;
HN().map(h=>({h,d:hd(src,h)})).sort((a,b)=>a.d-b.d).forEach(({h,d})=>{if(rem<=0)return;
const eta=Math.round(d*6+5);if(eta*60000>exp-now()-60000)return;
const n=Math.min(S.need[h],rem);if(n<=0)return;S.need[h]-=n;rem-=n;const p=pickPartner(src,[]);
S.rescues.unshift({id:Date.now()+Math.floor(Math.random()*9999),name,e,qty:n,from:src,to:h,exp,ev,partner:p,tries:[p],pt:0,fail:Math.random()<.4?.15+Math.random()*.3:null,done:0});
note('🚨',`${n}× ${name} sent to ${NODES[h].n}. ${PARTNERS[p].n} assigned instantly.`)});
if(rem>0)note('⚠️',`${rem} portions could not reach a centre in time. Listed free in Explore.`);
return rem}
/* If a partner can’t reach the pickup, hand the job to the next nearest partner at once */
function reassign(r){const old=PARTNERS[r.partner].n;const skip=r.tries.length>=PARTNERS.length?[]:r.tries;const p=pickPartner(r.from,skip);
r.partner=p;r.tries.push(p);r.pt=0;r.fail=null;note('🔁',`${old} can’t reach the pickup. ${PARTNERS[p].n} is assigned instantly.`)}
let tk=0;
function tickRescue(){tk++;let ch=0;
S.rescues.forEach(r=>{if(r.done)return;ch=1;r.pt=Math.min(1,r.pt+.011);
if(r.fail!=null&&r.pt>=r.fail)reassign(r);
if(r.pt>=1){r.done=1;S.stats.meals+=r.qty;S.pts+=20;note('🎉',`${r.qty}× ${r.name} delivered to ${NODES[r.to].n}. +20 pts`)}});
if(tk%5==0)S.l.forEach(l=>{if(!l.auto&&l.qty>0&&l.exp>now()&&l.exp-now()<9e5){l.auto=1;note('⏰',`${l.name} expires in under 15 min. Auto-rescue started.`);l.qty=rescue(l.d,l.name,l.e,l.qty,l.exp,'Near expiry')}});
if(ch){if(tab=='rescue'&&$('#rj')){$('#rj').innerHTML=jobsHTML();$('#rn').innerHTML=needHTML()}if(tab=='map')rMap();save()}}
const needHTML=()=>HN().map(h=>`<div class="lb"><span>${NODES[h].n}</span><b>${S.need[h]} meals needed</b></div>`).join('');
const jobsHTML=()=>S.rescues.slice(0,8).map(r=>{const P=PARTNERS[r.partner],st=r.done?'Delivered':r.pt<.5?'Heading to pickup':'Carrying food to centre';
return `<div class="card"><div class="row"><h3>${r.e} ${r.qty}× ${r.name}</h3><span class="sp"></span><span class="tag ${r.done?'':'u'}">⏱ <span class="tm" data-x="${r.exp}">${fmt(r.exp-now())}</span></span></div>
<div class="mu">${r.ev||'Surplus'} · ${NODES[r.from].n} → ${NODES[r.to].n}</div><div class="bar"><i style="width:${Math.round(r.pt*100)}%"></i></div>
<div class="row"><span class="tag">${r.done?'✅':'🛵'} ${P.n} · ${st}</span>${r.tries.length>1?`<span class="tag g">Re-assigned ×${r.tries.length-1}</span>`:''}<span class="sp"></span>${!r.done&&r.pt<.5?`<button class="btn s" data-fail="${r.id}">Partner can’t reach</button>`:''}</div></div>`}).join('')||'<p class="mu">No rescues yet. Report leftover food above and the automation will route it.</p>';
function rRescue(){
$('#v').innerHTML=`<h2 class="sec" style="margin-top:4px">Rescue leftover food</h2><div class="two"><div class="card"><p class="mu">Had a function or event with food left? Report it. Grain Grid splits it across the nearest NGOs and shelters and sends delivery partners before the food expires.</p>
<label for="r0">Occasion</label><select id="r0">${EVENTS.map(x=>`<option>${x}</option>`).join('')}</select>
<label for="r1">Food item</label><input id="r1" placeholder="e.g. Paneer, rice and rotis">
<label for="r2">Portions left</label><input id="r2" type="number" min="1" value="60">
<label for="r3">Safe to eat for (minutes)</label><input id="r3" type="number" min="10" value="60">
<label for="r4">Venue</label><select id="r4">${Object.entries(NODES).filter(([k,n])=>n.t=='donor').map(([k,n])=>`<option value="${k}">${n.n}</option>`).join('')}</select>
<button class="btn" id="rb" style="margin-top:14px">Alert automation</button></div>
<div class="card"><h3>Distribution centres</h3><div id="rn">${needHTML()}</div><p class="mu">Needs drop as food is allocated.</p></div></div>
<h2 class="sec">Live rescues</h2><div class="grid" id="rj">${jobsHTML()}</div>`;
$('#rb').onclick=()=>{const n=$('#r1').value.trim();if(!n)return toast('Add the food name first');
const qty=+$('#r2').value||1,m=Math.max(10,+$('#r3').value||60),src=$('#r4').value,exp=now()+m*60000;
const rem=rescue(src,n,'🍲',qty,exp,$('#r0').value);S.pts+=25;
if(rem>0)S.l.unshift({id:Date.now(),e:'🍲',name:n,d:src,qty:rem,mode:'free',price:0,min:m,exp,cat:'Meals',veg:1,auto:1});
save();rRescue()}}
function rDeliver(){
const jobs=S.l.filter(l=>l.exp>now()&&l.qty>0).slice(0,5);
$('#v').innerHTML=`<div class="card"><div class="row"><div><h3>Delivery partner mode</h3><div class="mu">Go online to receive pickups near you.</div></div><span class="sp"></span><button class="btn ${S.online?'':'s'}" id="on">${S.online?'You’re online':'Go online'}</button></div>
<div class="row"><span class="tag g">Today ₹${S.earn}</span><span class="tag">${S.jobs.length} deliveries</span></div></div>
<h2 class="sec">Nearby pickups</h2>${S.online?`<div class="grid">${jobs.map(l=>{const H=Object.keys(NODES).find(k=>NODES[k].t=='hub'),pay=30+Math.round(dist(l.d)*8);return `<div class="card"><h3>${l.e} ${l.name}</h3><div class="mu">${NODES[l.d].n} → ${NODES[H].n}</div><div class="row"><span class="tag">${dist(l.d)} km</span><span class="tag g">₹${pay} + 15 pts</span><span class="sp"></span><button class="btn" data-job="${l.id}">Accept</button></div></div>`}).join('')}</div>`:'<p class="mu">You’re offline. Go online to see pickups.</p>'}`;
$('#on').onclick=()=>{S.online=!S.online;save();note(S.online?'🟢':'⚪',S.online?'You’re online. Pickups will appear here.':'You’re offline.');rDeliver()}}
function takeJob(id){const l=S.l.find(x=>x.id==id),pay=30+Math.round(dist(l.d)*8);
note('📦','Pickup accepted at '+NODES[l.d].n+'. Navigate to the kitchen.');
setTimeout(()=>{S.earn+=pay;S.pts+=15;S.jobs.push(id);S.stats.meals+=Math.min(l.qty,10);save();note('🎉','Delivered. You earned ₹'+pay+' and 15 Grain Points.');if(tab=='deliver')rDeliver()},3500)}
function rAct(){S.seen=S.notes.length;head();save();
$('#v').innerHTML=`<div class="two"><div class="card"><h3>Notifications</h3>${S.notes.map(n=>`<div class="nt"><span>${n.i}</span><div>${n.t}<div class="mu">${new Date(n.at).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</div></div></div>`).join('')}</div>
<div><div class="card"><h3>Your impact</h3><div class="stats" style="color:var(--tx)"><div><b style="color:var(--pr)">${S.orders.length}</b>orders</div><div><b style="color:var(--pr)">${S.pts}</b>Grain Points</div><div><b style="color:var(--pr)">${S.jobs.length}</b>deliveries</div></div>
<p class="mu">Points unlock free meals for others: every 100 points funds 5 portions for a shelter.</p><div class="bar"><i style="width:${S.pts%100}%"></i></div></div>
<div class="card" style="margin-top:12px"><h3>Community leaderboard</h3>${[['Annapurna Kitchen',940],['Seva Volunteers',815],['You',S.pts],['Green Leaf Bakery',210]].sort((a,b)=>b[1]-a[1]).map((r,i)=>`<div class="lb"><span>${i+1}. ${r[0]}</span><b>${r[1]}</b></div>`).join('')}</div></div></div>`}
setInterval(()=>{document.querySelectorAll('.tm').forEach(e=>{const ms=e.dataset.x-now();e.textContent=fmt(ms);if(e.parentElement)e.parentElement.classList.toggle('u',ms<9e5)})},1000);
setInterval(tickRescue,400);
setInterval(()=>{if(!live||live.done)return;live.t=Math.min(1,live.t+.012);const s=stage(live.t);
if(live.s!==s){live.s=s;if(s>0)note(['','🛵','📍','🥡','🚀','🎉'][s],STEPS[s]+(s==5?'. Enjoy, and thank you! +10 pts':'.'));if(s==5){live.done=1;S.stats.meals+=live.items.reduce((a,b)=>a+b.c,0);save()}}
if(tab=='map')rMap()},400);
nav();head();render();
