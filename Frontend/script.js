/* ---------- DATA ---------- */
const NODES={D1:{n:'Annapurna Kitchen',x:60,y:70,t:'donor'},D2:{n:'Green Leaf Bakery',x:315,y:60,t:'donor'},D3:{n:'Punjab Dhaba',x:85,y:235,t:'donor'},D4:{n:'Hotel Sunrise',x:325,y:225,t:'donor'},
D5:{n:'Royal Banquet Hall',x:130,y:175,t:'donor'},H1:{n:'Seva Community Kitchen',x:150,y:110,t:'hub'},H2:{n:'Hope Shelter',x:260,y:260,t:'hub'},H3:{n:'Ashray Orphanage',x:280,y:120,t:'hub'}};
const YOU={x:200,y:155},BASE={x:200,y:285};
const PARTNERS=[{n:'Ravi K.',x:200,y:285},{n:'Aman S.',x:30,y:150},{n:'Priya M.',x:370,y:150},{n:'Sana D.',x:200,y:20}];
const EVENTS=['Wedding reception','Corporate function','Festival or community event','Restaurant closing'];
const SPOTN=['Wedding lawn','Community fair ground','Banquet hall garden','Temple community hall','Marriage garden'];
const now=()=>Date.now();
const SEED=[
{id:1,e:'🍛',name:'Dal & rice boxes',d:'D1',qty:24,mode:'free',price:0,min:55,cat:'Meals',veg:1},
{id:2,e:'🍞',name:'Fresh bread loaves',d:'D2',qty:30,mode:'free',price:0,min:90,cat:'Bakery',veg:1},
{id:3,e:'🍕',name:'Veg pizza slices',d:'D4',qty:18,mode:'sub',price:29,min:35,cat:'Meals',veg:1},
{id:4,e:'🥗',name:'Salad & fruit cups',d:'D3',qty:12,mode:'sub',price:19,min:120,cat:'Fresh',veg:1},
{id:5,e:'🍗',name:'Chicken curry combo',d:'D4',qty:10,mode:'sub',price:49,min:16,cat:'Meals',veg:0},
{id:6,e:'🥛',name:'Milk & curd packs',d:'D1',qty:20,mode:'free',price:0,min:150,cat:'Fresh',veg:1}];
let S;
try{S=JSON.parse(localStorage.getItem('gg3'))}catch(e){}
if(!S||!S.l)S={l:SEED.map(x=>({...x,exp:now()+x.min*60000})),pts:120,notes:[{i:'🌾',t:'Welcome to Grain Grid. Every claim earns Grain Points.',at:now()}],orders:[],stats:{meals:1280,kg:640,co2:1600},online:false,jobs:[],earn:0,seen:0,need:{H1:40,H2:30,H3:25},rescues:[],role:'get'};
if(!S.role)S.role='get';
const save=()=>{try{localStorage.setItem('gg3',JSON.stringify(S))}catch(e){}};
let tab='explore',cat='All',q='',cart={},live=null,sat=false,scan=0,scanP=0,spots=[];
const $=s=>document.querySelector(s);

/* ---------- SIMPLE NAVIGATION: 3 roles, 3 tabs each ---------- */
const ROLES={get:{l:'🍽️ Get food',t:['explore','map','activity']},give:{l:'🏪 Give food',t:['rescue','map','activity']},ride:{l:'🛵 Deliver',t:['deliver','map','activity']}};
const TABS=[['explore','🍱','Food'],['rescue','🎁','Donate'],['deliver','🛵','Deliver'],['map','🗺️','Map'],['activity','📊','Activity']];
const HELP={explore:'Pick food, tap “Get this”, and a delivery partner brings it to you.',map:'See where your food and delivery partners are. Use the satellite to find leftover food.',rescue:'Have leftover food? Fill in 4 boxes and we find shelters for it.',deliver:'Go online, accept a pickup, deliver it and earn money.',activity:'Your alerts and the good you have done.'};
const help=t=>`<p class="help">${HELP[t]}</p>`;
function toast(t){const e=$('#toast');e.textContent=t;e.classList.add('on');clearTimeout(toast.h);toast.h=setTimeout(()=>e.classList.remove('on'),2600)}
function note(i,t){S.notes.unshift({i,t,at:now()});S.notes=S.notes.slice(0,30);toast(i+' '+t);save();head()}
function head(){const u=S.notes.length-S.seen;$('#bd').textContent=u;$('#bd').style.display=u>0?'grid':'none'}
function nav(){const R=ROLES[S.role];
$('#roles').innerHTML=Object.entries(ROLES).map(([k,r])=>`<button class="${S.role==k?'on':''}" data-r="${k}">${r.l}</button>`).join('');
$('#nav').innerHTML=TABS.filter(t=>R.t.includes(t[0])).map(t=>`<button class="${tab==t[0]?'on':''}" data-t="${t[0]}"><span>${t[1]}</span>${t[2]}</button>`).join('')}
$('#roles').onclick=e=>{const b=e.target.closest('button');if(b){S.role=b.dataset.r;tab=ROLES[S.role].t[0];save();nav();render()}};
$('#nav').onclick=e=>{const b=e.target.closest('button');if(b){tab=b.dataset.t;nav();render()}};
$('#bell').onclick=()=>{tab='activity';S.seen=S.notes.length;nav();render();head();save()};
const left=l=>Math.max(0,Math.floor((l.exp-now())/60000));
const dist=id=>{const n=NODES[id];return (Math.hypot(n.x-YOU.x,n.y-YOU.y)/60).toFixed(1)};
const fmt=ms=>{ms=Math.max(0,Math.floor(ms/1000));const h=Math.floor(ms/3600),m=Math.floor(ms%3600/60),s=ms%60;return (h?h+':':'')+String(m).padStart(2,'0')+':'+String(s).padStart(2,'0')};
function render(){({explore:rExplore,map:rMap,rescue:rRescue,deliver:rDeliver,activity:rAct})[tab]();cartUI()}

/* ---------- EXPLORE (home) ---------- */
const pp=(i,t)=>({x:PARTNERS[i].x+Math.sin(t/1800+i*2)*10,y:PARTNERS[i].y+Math.cos(t/2100+i*3)*8});
function pmap(){const t=now(),P=PARTNERS.map((p,i)=>({...pp(i,t),n:p.n}));
const near=P.map(p=>({...p,d:Math.hypot(p.x-YOU.x,p.y-YOU.y)})).sort((a,b)=>a.d-b.d)[0],eta=Math.round(near.d/60*6+3);
let s=`<svg class="map" viewBox="0 0 400 300" role="img" aria-label="Delivery partners near you"><g stroke="var(--ln)">${[...Array(9)].map((_,i)=>`<line x1="${i*50}" y1="0" x2="${i*50}" y2="300"/>`).join('')}${[...Array(7)].map((_,i)=>`<line x1="0" y1="${i*50}" x2="400" y2="${i*50}"/>`).join('')}</g>`;
Object.values(NODES).forEach(n=>s+=`<circle cx="${n.x}" cy="${n.y}" r="6" fill="${n.t=='donor'?'var(--pr)':'var(--gd)'}" opacity=".6"/>`);
s+=`<line x1="${YOU.x}" y1="${YOU.y}" x2="${near.x}" y2="${near.y}" stroke="var(--bl)" stroke-width="2" stroke-dasharray="4 4"/>`;
P.forEach(p=>s+=`<circle cx="${p.x}" cy="${p.y}" r="12" fill="var(--bl)"/><text x="${p.x}" y="${p.y+5}" font-size="14" text-anchor="middle">🛵</text><text x="${p.x}" y="${p.y+25}" font-size="9" text-anchor="middle" fill="var(--tx)">${p.n}</text>`);
s+=`<circle cx="${YOU.x}" cy="${YOU.y}" r="9" fill="var(--rd)"/><circle cx="${YOU.x}" cy="${YOU.y}" r="16" fill="none" stroke="var(--rd)" opacity=".4"/><text x="${YOU.x}" y="${YOU.y-20}" font-size="9" font-weight="700" text-anchor="middle" fill="var(--tx)">You</text></svg>`;
return s+`<div class="row" style="margin-top:8px"><span class="tag">🛵 ${P.length} partners online</span><span class="tag g">Nearest: ${near.n} · about ${eta} min away</span></div>`}
function rExplore(){
const A=S.l.filter(l=>l.exp>now()&&l.qty>0).sort((a,b)=>a.exp-b.exp),n0=A[0];
const L=A.filter(l=>(cat=='All'||l.cat==cat||(cat=='Free'&&l.mode=='free'))&&(l.name+NODES[l.d].n).toLowerCase().includes(q.toLowerCase()));
$('#v').innerHTML=`${help('explore')}
<div class="card"><h3>🛵 Delivery partners near you</h3><div id="pm">${pmap()}</div></div>
${n0?`<div class="big ${left(n0)<15?'u':''}"><div class="bl">⏱ This food must be eaten within</div><div class="bt tm" data-x="${n0.exp}">${fmt(n0.exp-now())}</div><div class="bn">${n0.e} ${n0.name} · ${NODES[n0.d].n}</div><button class="btn" data-a="${n0.id}">Get this now</button></div>`:''}
<input id="q" placeholder="Search dal, bread, restaurant…" value="${q}" aria-label="Search">
<div class="chips">${['All','Free','Meals','Bakery','Fresh'].map(c=>`<button class="${cat==c?'on':''}" data-c="${c}">${c}</button>`).join('')}</div>
<div class="grid">${L.map(l=>{const m=left(l),u=m<40;return `<div class="card"><div class="top"><div class="em">${l.e}</div><div><h3>${l.name}</h3><div class="mu">${NODES[l.d].n} · ${dist(l.d)} km</div></div></div>
<div class="row"><span class="tag ${u?'u':''}">⏱ <span class="tm" data-x="${l.exp}">${fmt(l.exp-now())}</span> left</span><span class="tag g">${l.mode=='free'?'Free':'₹'+l.price}</span><span class="tag">${l.veg?'🟢 Veg':'🔴 Non-veg'}</span></div>
<div class="bar"><i style="width:${Math.min(100,l.qty*4)}%"></i></div>
<div class="row"><span class="mu">${l.qty} portions left</span><span class="sp"></span>${cart[l.id]?`<button class="btn s" data-m="${l.id}">−</button><b>${cart[l.id]}</b>`:''}<button class="btn" data-a="${l.id}">${cart[l.id]?'+':'Get this'}</button></div></div>`}).join('')||'<p class="mu">Nothing matches right now. New food is listed all day.</p>'}</div>
<section class="hero"><h2 class="lg">Surplus food, moved to where it’s needed.</h2><p>Order food or report leftovers from a function or event. Our automation sends surplus to the nearest NGOs and shelters, assigns a delivery partner at once, and re-assigns if one can’t reach.</p>
<div class="stats"><div><b>${S.stats.meals.toLocaleString()}</b>meals redistributed</div><div><b>${S.stats.kg} kg</b>food saved from waste</div><div><b>${S.stats.co2} kg</b>CO₂ avoided</div></div></section>`;
$('#q').oninput=e=>{q=e.target.value;rExplore();$('#q').focus();$('#q').setSelectionRange(q.length,q.length)}}
$('#v').onclick=e=>{const b=e.target.closest('button');if(!b)return;const d=b.dataset;
if(d.c){cat=d.c;rExplore()}
if(d.go){tab=d.go;nav();render()}
if(d.a){const l=S.l.find(x=>x.id==d.a);if((cart[l.id]||0)<Math.min(l.qty,6))cart[l.id]=(cart[l.id]||0)+1;else toast('Limit reached for this item');rExplore();cartUI()}
if(d.m){cart[d.m]--;if(!cart[d.m])delete cart[d.m];rExplore();cartUI()}
if(d.job)takeJob(+d.job);
if(d.sat){sat=!sat;rMap()}
if(d.scan)startScan();
if(d.spot)alertSpot(+d.spot);
if(d.fail){const r=S.rescues.find(x=>String(x.id)==d.fail);if(r&&!r.done&&r.pt<.5){reassign(r);rRescue()}}};
function cartUI(){const n=Object.values(cart).reduce((a,b)=>a+b,0);const tot=Object.entries(cart).reduce((a,[i,c])=>a+c*S.l.find(x=>x.id==i).price,0);
$('#cart').classList.toggle('on',n>0&&tab=='explore');$('#ct').innerHTML=`<b>${n} portion${n>1?'s':''}</b> · ${tot?'₹'+tot:'Free'}`}
$('#co').onclick=()=>{const items=Object.entries(cart).map(([i,c])=>{const l=S.l.find(x=>x.id==i);l.qty-=c;return{n:l.name,c,d:l.d}});
const o={id:Date.now(),items,d:items[0].d,t:0,done:0};S.orders.unshift(o);cart={};S.pts+=10;save();live=o;
note('✅','Order confirmed. Finding the nearest delivery partner…');tab='map';nav();render()};

/* ---------- MAP / NETWORK + SATELLITE ---------- */
function pos(t,from,to,st){const pts=[st||BASE,NODES[from],to||YOU];const seg=t<.5?0:1,k=t<.5?t*2:(t-.5)*2;const a=pts[seg],b=pts[seg+1];return{x:a.x+(b.x-a.x)*k,y:a.y+(b.y-a.y)*k}}
const STEPS=['Order confirmed','Partner assigned','Heading to pickup','Food picked up','On the way to you','Delivered'];
function stage(t){return t>=1?5:t>=.55?4:t>=.5?3:t>=.12?2:t>0?1:0}
function mapSVG(){const o=live&&!live.done?live:null,p=o?pos(o.t,o.d):null,tx=sat?'#fff':'var(--tx)';
let s=`<svg class="map ${sat?'sat':''}" viewBox="0 0 400 300" role="img" aria-label="Network map">`;
if(sat){for(let i=0;i<42;i++)s+=`<rect x="${i*73%400}" y="${i*131%300}" width="${30+i*17%50}" height="${20+i*29%40}" fill="${['#3d5a34','#2f4a2c','#5b5a3a','#46603c'][i%4]}" opacity=".85"/>`;
s+=`<path d="M0 90Q150 130 400 70M120 0Q170 150 260 300" stroke="#a9a79a" stroke-width="3" fill="none" opacity=".5"/>`}
else s+=`<g stroke="var(--ln)">${[...Array(9)].map((_,i)=>`<line x1="${i*50}" y1="0" x2="${i*50}" y2="300"/>`).join('')}${[...Array(7)].map((_,i)=>`<line x1="0" y1="${i*50}" x2="400" y2="${i*50}"/>`).join('')}</g>`;
Object.values(NODES).forEach(n=>s+=`<circle cx="${n.x}" cy="${n.y}" r="13" fill="${n.t=='donor'?'var(--pr)':'var(--gd)'}"/><text x="${n.x}" y="${n.y+4}" font-size="12" text-anchor="middle">${n.t=='donor'?'🍽':'🏠'}</text><text x="${n.x}" y="${n.y+27}" font-size="8.5" text-anchor="middle" fill="${tx}">${n.n}</text>`);
if(o)s+=`<polyline points="${BASE.x},${BASE.y} ${NODES[o.d].x},${NODES[o.d].y} ${YOU.x},${YOU.y}" fill="none" stroke="var(--bl)" stroke-width="2.5" stroke-dasharray="5 4"/>`;
s+=`<circle cx="${YOU.x}" cy="${YOU.y}" r="9" fill="var(--rd)"/><circle cx="${YOU.x}" cy="${YOU.y}" r="16" fill="none" stroke="var(--rd)" opacity=".4"/><text x="${YOU.x}" y="${YOU.y-20}" font-size="9" text-anchor="middle" font-weight="700" fill="${tx}">You</text>`;
if(S.online&&!o)s+=`<text x="${BASE.x}" y="${BASE.y}" font-size="16" text-anchor="middle">🛵</text>`;
if(p)s+=`<circle cx="${p.x}" cy="${p.y}" r="12" fill="var(--bl)"/><text x="${p.x}" y="${p.y+5}" font-size="14" text-anchor="middle">🛵</text>`;
S.rescues.filter(r=>!r.done).forEach(r=>{const P=PARTNERS[r.partner],c=pos(r.pt,r.from,NODES[r.to],P);s+=`<polyline points="${P.x},${P.y} ${NODES[r.from].x},${NODES[r.from].y} ${NODES[r.to].x},${NODES[r.to].y}" fill="none" stroke="var(--gd)" stroke-width="2" stroke-dasharray="4 4"/><circle cx="${c.x}" cy="${c.y}" r="12" fill="var(--gd)"/><text x="${c.x}" y="${c.y+5}" font-size="14" text-anchor="middle">🛵</text>`});
if(scan==2)spots.forEach(k=>s+=`<circle cx="${k.x}" cy="${k.y}" r="18" fill="none" stroke="var(--gd)" stroke-width="2"/><circle cx="${k.x}" cy="${k.y}" r="10" fill="var(--gd)"/><text x="${k.x}" y="${k.y+4}" font-size="11" text-anchor="middle">📡</text><text x="${k.x}" y="${k.y+32}" font-size="9" font-weight="700" text-anchor="middle" fill="${tx}">${k.n}</text>`);
if(scan==1)s+=`<rect x="0" y="0" width="400" height="${scanP*300}" fill="#66ccff" opacity=".13"/><rect x="0" y="${scanP*300-2}" width="400" height="3" fill="#77ddff"/>`;
return s+'</svg>'}
function trackHTML(){const o=live&&!live.done?live:null,st=o?stage(o.t):-1;
return `<h3>${o?'Tracking your order':'No active delivery'}</h3>`+(o?STEPS.map((x,i)=>`<div class="step ${i<=st?'d':''}"><i></i>${x}</div>`).join('')+`<div class="bar"><i style="width:${Math.round(o.t*100)}%"></i></div><div class="mu">Partner: Ravi K. · ⭐ 4.9</div>`:`<p class="mu">Get food from the Food tab and you will see your partner move on the map.</p><button class="btn" data-go="explore">Browse food</button>`)}
function scHTML(){return `<h3>🛰️ Satellite scan</h3>`+(scan==0?`<p class="mu">Scan the area from space to find weddings, fairs and gatherings that may have leftover food.</p>`:scan==1?`<div class="bar"><i style="width:${Math.round(scanP*100)}%"></i></div><p class="mu">Scanning… ${Math.round(scanP*100)}%</p>`:spots.length?spots.map(k=>`<div class="lb"><span><b>${k.n}</b><div class="mu">about ${k.p} portions</div></span><button class="btn s" data-spot="${k.id}">Send rescue</button></div>`).join(''):`<p class="mu">All spots handled. Thank you!</p>`)+`<p class="mu">Demo: scan results are simulated.</p>`}
function rMap(){
$('#v').innerHTML=`${help('map')}<div class="two"><div><div id="mp">${mapSVG()}</div>
<div class="row" style="margin-top:10px"><button class="btn ${sat?'':'s'}" data-sat="1">${sat?'Normal map':'🛰️ Satellite view'}</button><button class="btn" data-scan="1" ${scan==1?'disabled':''}>${scan==1?'Scanning…':'🛰️ Scan for leftover food'}</button></div>
<div class="row mu" style="margin-top:8px"><span>🍽 Food donors</span><span>🏠 Shelters</span><span>🛵 Partners</span><span>🔴 You</span></div></div>
<div><div class="card" id="tr">${trackHTML()}</div><div class="card" id="sc" style="margin-top:12px">${scHTML()}</div></div></div>`}
function refresh(){if(tab!='map'||!$('#mp'))return;$('#mp').innerHTML=mapSVG();if(live&&!live.done)$('#tr').innerHTML=trackHTML()}
function startScan(){sat=true;scan=1;scanP=0;spots=[];rMap()}
function endScan(){scan=2;spots=[...SPOTN].sort(()=>Math.random()-.5).slice(0,3).map((n,i)=>({id:i+1,n,x:45+Math.random()*310|0,y:45+Math.random()*200|0,p:30+(Math.random()*90|0)}));note('🛰️',`Scan complete: ${spots.length} places may have leftover food.`)}
function alertSpot(id){const k=spots.find(x=>x.id==id);if(!k)return;
const dd=a=>Math.hypot(NODES[a].x-k.x,NODES[a].y-k.y),src=Object.keys(NODES).filter(a=>NODES[a].t=='donor').sort((a,b)=>dd(a)-dd(b))[0];
spots=spots.filter(x=>x!=k);report(src,k.n+' leftovers',k.p,60,'Satellite scan');rMap()}

/* ---------- AUTOMATION ENGINE ---------- */
const HN=()=>Object.keys(NODES).filter(k=>NODES[k].t=='hub');
const hd=(a,h)=>Math.hypot(NODES[a].x-NODES[h].x,NODES[a].y-NODES[h].y)/60;
function pickPartner(from,skip){const busy=S.rescues.filter(r=>!r.done).map(r=>r.partner);
const c=PARTNERS.map((p,i)=>({i,d:Math.hypot(p.x-NODES[from].x,p.y-NODES[from].y)})).filter(c=>!skip.includes(c.i)).sort((a,b)=>(busy.includes(a.i)-busy.includes(b.i))||a.d-b.d);
return c.length?c[0].i:0}
function rescue(src,name,e,qty,exp,ev){let rem=qty;
HN().map(h=>({h,d:hd(src,h)})).sort((a,b)=>a.d-b.d).forEach(({h,d})=>{if(rem<=0)return;
const eta=Math.round(d*6+5);if(eta*60000>exp-now()-60000)return;
const n=Math.min(S.need[h],rem);if(n<=0)return;S.need[h]-=n;rem-=n;const p=pickPartner(src,[]);
S.rescues.unshift({id:Date.now()+Math.floor(Math.random()*9999),name,e,qty:n,from:src,to:h,exp,ev,partner:p,tries:[p],pt:0,fail:Math.random()<.4?.15+Math.random()*.3:null,done:0});
note('🚨',`${n}× ${name} sent to ${NODES[h].n}. ${PARTNERS[p].n} assigned instantly.`)});
if(rem>0)note('⚠️',`${rem} portions could not reach a centre in time. Listed free in Food.`);
return rem}
function report(src,name,qty,m,ev){const exp=now()+m*60000,rem=rescue(src,name,'🍲',qty,exp,ev);S.pts+=25;
if(rem>0)S.l.unshift({id:Date.now(),e:'🍲',name,d:src,qty:rem,mode:'free',price:0,min:m,exp,cat:'Meals',veg:1,auto:1});save()}
function reassign(r){const old=PARTNERS[r.partner].n;const skip=r.tries.length>=PARTNERS.length?[]:r.tries;const p=pickPartner(r.from,skip);
r.partner=p;r.tries.push(p);r.pt=0;r.fail=null;note('🔁',`${old} can’t reach the pickup. ${PARTNERS[p].n} is assigned instantly.`)}
let tk=0;
function tickRescue(){tk++;let ch=0;
S.rescues.forEach(r=>{if(r.done)return;ch=1;r.pt=Math.min(1,r.pt+.011);
if(r.fail!=null&&r.pt>=r.fail)reassign(r);
if(r.pt>=1){r.done=1;S.stats.meals+=r.qty;S.pts+=20;note('🎉',`${r.qty}× ${r.name} delivered to ${NODES[r.to].n}. +20 pts`)}});
if(tk%5==0)S.l.forEach(l=>{if(!l.auto&&l.qty>0&&l.exp>now()&&l.exp-now()<9e5){l.auto=1;note('⏰',`${l.name} expires in under 15 min. Auto-rescue started.`);l.qty=rescue(l.d,l.name,l.e,l.qty,l.exp,'Near expiry')}});
if(ch){if(tab=='rescue'&&$('#rj')){$('#rj').innerHTML=jobsHTML();$('#rn').innerHTML=needHTML()}refresh();save()}}

/* ---------- DONATE ---------- */
const needHTML=()=>HN().map(h=>`<div class="lb"><span>${NODES[h].n}</span><b>${S.need[h]} meals needed</b></div>`).join('');
const jobsHTML=()=>S.rescues.slice(0,8).map(r=>{const P=PARTNERS[r.partner],st=r.done?'Delivered':r.pt<.5?'Heading to pickup':'Carrying food to centre';
return `<div class="card"><div class="row"><h3>${r.e} ${r.qty}× ${r.name}</h3><span class="sp"></span><span class="tag ${r.done?'':'u'}">⏱ <span class="tm" data-x="${r.exp}">${fmt(r.exp-now())}</span></span></div>
<div class="mu">${r.ev||'Surplus'} · ${NODES[r.from].n} → ${NODES[r.to].n}</div><div class="bar"><i style="width:${Math.round(r.pt*100)}%"></i></div>
<div class="row"><span class="tag">${r.done?'✅':'🛵'} ${P.n} · ${st}</span>${r.tries.length>1?`<span class="tag g">Re-assigned ×${r.tries.length-1}</span>`:''}<span class="sp"></span>${!r.done&&r.pt<.5?`<button class="btn s" data-fail="${r.id}">Partner can’t reach</button>`:''}</div></div>`}).join('')||'<p class="mu">No donations yet. Fill the form above and we will route your food.</p>';
function rRescue(){
$('#v').innerHTML=`${help('rescue')}<div class="two"><div class="card"><h3>Report leftover food</h3>
<label for="r0">What was the occasion?</label><select id="r0">${EVENTS.map(x=>`<option>${x}</option>`).join('')}</select>
<label for="r1">Food item</label><input id="r1" placeholder="e.g. Paneer, rice and rotis">
<label for="r2">How many portions?</label><input id="r2" type="number" min="1" value="60">
<label for="r3">Safe to eat for (minutes)</label><input id="r3" type="number" min="10" value="60">
<label for="r4">Where is the food?</label><select id="r4">${Object.entries(NODES).filter(([k,n])=>n.t=='donor').map(([k,n])=>`<option value="${k}">${n.n}</option>`).join('')}</select>
<button class="btn" id="rb" style="margin-top:14px">Send to shelters</button></div>
<div class="card"><h3>Who needs food</h3><div id="rn">${needHTML()}</div><p class="mu">Numbers drop as food is allocated.</p></div></div>
<h2 class="sec">Your donations</h2><div class="grid" id="rj">${jobsHTML()}</div>`;
$('#rb').onclick=()=>{const n=$('#r1').value.trim();if(!n)return toast('Add the food name first');
report($('#r4').value,n,+$('#r2').value||1,Math.max(10,+$('#r3').value||60),$('#r0').value);rRescue()}}

/* ---------- DELIVER ---------- */
function rDeliver(){
const jobs=S.l.filter(l=>l.exp>now()&&l.qty>0).slice(0,5);
$('#v').innerHTML=`${help('deliver')}<div class="card"><div class="row"><div><h3>Delivery partner mode</h3><div class="mu">Go online to receive pickups near you.</div></div><span class="sp"></span><button class="btn ${S.online?'':'s'}" id="on">${S.online?'You’re online':'Go online'}</button></div>
<div class="row"><span class="tag g">Today ₹${S.earn}</span><span class="tag">${S.jobs.length} deliveries</span></div></div>
<h2 class="sec">Nearby pickups</h2>${S.online?`<div class="grid">${jobs.map(l=>{const H=HN()[0],pay=30+Math.round(dist(l.d)*8);return `<div class="card"><h3>${l.e} ${l.name}</h3><div class="mu">${NODES[l.d].n} → ${NODES[H].n}</div><div class="row"><span class="tag">${dist(l.d)} km</span><span class="tag g">₹${pay} + 15 pts</span><span class="sp"></span><button class="btn" data-job="${l.id}">Accept</button></div></div>`}).join('')}</div>`:'<p class="mu">You’re offline. Go online to see pickups.</p>'}`;
$('#on').onclick=()=>{S.online=!S.online;save();note(S.online?'🟢':'⚪',S.online?'You’re online. Pickups will appear here.':'You’re offline.');rDeliver()}}
function takeJob(id){const l=S.l.find(x=>x.id==id),pay=30+Math.round(dist(l.d)*8);
note('📦','Pickup accepted at '+NODES[l.d].n+'. Navigate to the kitchen.');
setTimeout(()=>{S.earn+=pay;S.pts+=15;S.jobs.push(id);S.stats.meals+=Math.min(l.qty,10);save();note('🎉','Delivered. You earned ₹'+pay+' and 15 Grain Points.');if(tab=='deliver')rDeliver()},3500)}

/* ---------- ACTIVITY (points live here now) ---------- */
function rAct(){S.seen=S.notes.length;head();save();
$('#v').innerHTML=`${help('activity')}<div class="two"><div class="card"><h3>Notifications</h3>${S.notes.map(n=>`<div class="nt"><span>${n.i}</span><div>${n.t}<div class="mu">${new Date(n.at).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</div></div></div>`).join('')}</div>
<div><div class="card"><h3>Your impact</h3><div class="stats" style="color:var(--tx)"><div><b style="color:var(--pr)">${S.orders.length}</b>orders</div><div><b style="color:var(--pr)">${S.pts}</b>Grain Points</div><div><b style="color:var(--pr)">${S.jobs.length}</b>deliveries</div></div>
<p class="mu">Every 100 points funds 5 portions for a shelter.</p><div class="bar"><i style="width:${S.pts%100}%"></i></div></div>
<div class="card" style="margin-top:12px"><h3>Community leaderboard</h3>${[['Annapurna Kitchen',940],['Seva Volunteers',815],['You',S.pts],['Green Leaf Bakery',210]].sort((a,b)=>b[1]-a[1]).map((r,i)=>`<div class="lb"><span>${i+1}. ${r[0]}</span><b>${r[1]}</b></div>`).join('')}</div></div></div>`}

/* ---------- TIMERS ---------- */
setInterval(()=>{document.querySelectorAll('.tm').forEach(e=>{const ms=e.dataset.x-now();e.textContent=fmt(ms);if(e.parentElement)e.parentElement.classList.toggle('u',ms<9e5)});
if(tab=='explore'){const p=$('#pm');if(p)p.innerHTML=pmap();const b=$('.bt');if(b&&b.dataset.x<now()&&document.activeElement.id!='q')rExplore()}},1000);
setInterval(()=>{if(!backendOnline)tickRescue()},400);
setInterval(()=>{if(scan!=1)return;scanP=Math.min(1,scanP+.025);if(scanP>=1)endScan();if(tab=='map'){$('#mp').innerHTML=mapSVG();$('#sc').innerHTML=scHTML();if(scan==2)rMap()}},100);
setInterval(()=>{if(backendOnline||!live||live.done)return;live.t=Math.min(1,live.t+.012);const s=stage(live.t);
if(live.s!==s){live.s=s;if(s>0)note(['','🛵','📍','🥡','🚀','🎉'][s],STEPS[s]+(s==5?'. Enjoy, and thank you! +10 pts':'.'));if(s==5){live.done=1;S.stats.meals+=live.items.reduce((a,b)=>a+b.c,0);save();if(tab=='map')rMap()}}
refresh()},400);
nav();head();render();
/* ---------- MY PROFILE (load BEFORE script.js) ---------- */
const AV=['🌾','😀','🧑‍🍳','🛵','🦸','👩‍🌾','🧑‍⚕️','🐯'];
const API='/api';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function P(){if(!S.profile)S.profile={name:'Guest User',phone:'',email:'',addr:'',diet:'any',av:'🌾',theme:'auto',id:'u'+Date.now()};return S.profile}
function applyTheme(){const t=P().theme;if(t=='auto')document.documentElement.removeAttribute('data-theme');else document.documentElement.setAttribute('data-theme',t)}
const level=p=>p>=500?'🥇 Gold Giver':p>=250?'🥈 Silver Helper':'🥉 Bronze Starter';
function rProfile(){const p=P(),roleName=ROLES[S.role].l;
$('#v').innerHTML=`${help('profile')}
<div class="two"><div class="card"><div class="top"><div class="em" id="pav">${p.av}</div><div><h3 id="pn">${esc(p.name)}</h3><div class="mu">${roleName} · ${level(S.pts)}</div></div></div>
<label>Choose avatar</label><div class="avs" id="avs">${AV.map(a=>`<button class="${p.av==a?'on':''}" data-av="${a}" aria-label="Avatar ${a}">${a}</button>`).join('')}</div>
<label for="p1">Full name</label><input id="p1" value="${esc(p.name)}" maxlength="40">
<label for="p2">Phone</label><input id="p2" type="tel" value="${esc(p.phone)}" placeholder="+91 98765 43210">
<label for="p3">Email</label><input id="p3" type="email" value="${esc(p.email)}" placeholder="you@example.com">
<label for="p4">Delivery address</label><input id="p4" value="${esc(p.addr)}" placeholder="House no., street, Sonipat">
<label for="p5">Food preference</label><select id="p5">${[['any','Any food'],['veg','Veg only'],['nonveg','Non-veg only']].map(o=>`<option value="${o[0]}" ${p.diet==o[0]?'selected':''}>${o[1]}</option>`).join('')}</select>
<label for="p6">Appearance</label><select id="p6">${[['auto','Match my device'],['light','Light'],['dark','Dark']].map(o=>`<option value="${o[0]}" ${p.theme==o[0]?'selected':''}>${o[1]}</option>`).join('')}</select>
<div class="row" style="margin-top:14px"><button class="btn" id="psave">Save profile</button></div></div>
<div><div class="card"><h3>My numbers</h3><div class="stats" style="color:var(--tx)"><div><b style="color:var(--pr)">${S.orders.length}</b>orders</div><div><b style="color:var(--pr)">${S.pts}</b>points</div><div><b style="color:var(--pr)">${S.jobs.length}</b>deliveries</div><div><b style="color:var(--pr)">₹${S.earn}</b>earned</div></div></div>
<div class="card" style="margin-top:12px"><h3>My orders</h3>${S.orders.slice(0,5).map(o=>`<div class="lb"><span>${o.items.map(i=>i.c+'× '+esc(i.n)).join(', ')}</span><span class="mu">${new Date(o.id).toLocaleDateString()}</span></div>`).join('')||'<p class="mu">No orders yet.</p>'}</div>
<div class="card" style="margin-top:12px"><h3>Account</h3><button class="btn s" id="preset">Reset demo data</button></div></div></div>`;
$('#avs').onclick=e=>{const b=e.target.closest('button');if(!b)return;P().av=b.dataset.av;$('#pav').textContent=P().av;[...$('#avs').children].forEach(x=>x.classList.toggle('on',x==b))};
$('#p6').onchange=e=>{P().theme=e.target.value;applyTheme()};
$('#psave').onclick=async()=>{const n=$('#p1').value.trim();if(!n)return toast('Please enter your name');
Object.assign(P(),{name:n,phone:$('#p2').value.trim(),email:$('#p3').value.trim(),addr:$('#p4').value.trim(),diet:$('#p5').value,theme:$('#p6').value});
applyTheme();save();toast('✅ Profile saved');$('#pn').textContent=n;
try{await fetch(API+'/profile',{method:'PUT',headers:{'Content-Type':'application/json','x-user-id':P().id},body:JSON.stringify(P())})}catch(e){}};
$('#preset').onclick=()=>{if(confirm('Erase all demo data on this device?')){try{localStorage.removeItem('gg3')}catch(e){}location.reload()}}}