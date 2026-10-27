const r=require('express').Router(),db=require('../db'),E=require('../services/engine'),seed=require('../../data/seed.json');
r.get('/nodes',(q,s)=>s.json(db.prepare('SELECT * FROM nodes').all()));
r.get('/partners',(q,s)=>s.json(db.prepare('SELECT id,name,x,y,rating FROM partners WHERE online=1').all()));
r.get('/stats',(q,s)=>s.json(Object.fromEntries(db.prepare('SELECT k,v FROM stats').all().map(x=>[x.k,x.v]))));
r.get('/notifications',(q,s)=>s.json(db.prepare('SELECT * FROM notifications WHERE user_id IS NULL OR user_id=? ORDER BY id DESC LIMIT 30').all(q.uid)));
r.get('/leaderboard',(q,s)=>{const me=db.prepare('SELECT points FROM users WHERE id=?').get(q.uid).points;
s.json([['Annapurna Kitchen',940],['Seva Volunteers',815],['You',me],['Green Leaf Bakery',210]].sort((a,b)=>b[1]-a[1]).map(([name,points],i)=>({rank:i+1,name,points})))});
// Simulated satellite scan (replace with a real imagery/event-detection service)
r.post('/scan',(q,s)=>s.json(seed.scanSpots.sort(()=>Math.random()-.5).slice(0,3).map((n,i)=>({id:i+1,name:n,x:45+Math.random()*310|0,y:45+Math.random()*200|0,portions:30+(Math.random()*90|0)}))));
module.exports=r;