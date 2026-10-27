const r=require('express').Router(),db=require('../db');
r.get('/',(q,s)=>s.json(db.prepare('SELECT * FROM users WHERE id=?').get(q.uid)));
r.put('/',(q,s)=>{const b=q.body||{},t=(v,n)=>String(v??'').slice(0,n);
db.prepare('UPDATE users SET name=?,phone=COALESCE(NULLIF(?,\'\'),phone),email=?,addr=?,diet=?,av=?,theme=?,role=? WHERE id=?')
.run(t(b.name,40)||'Guest User',t(b.phone,20),t(b.email,80),t(b.addr,200),['any','veg','nonveg'].includes(b.diet)?b.diet:'any',t(b.av,8)||'🌾',['auto','light','dark'].includes(b.theme)?b.theme:'auto',['get','give','ride'].includes(b.role)?b.role:'get',q.uid);
s.json({ok:true})});
r.get('/impact',(q,s)=>{const u=db.prepare('SELECT points,earn FROM users WHERE id=?').get(q.uid);
s.json({...u,orders:db.prepare('SELECT COUNT(*) c FROM orders WHERE user_id=?').get(q.uid).c,deliveries:db.prepare('SELECT COUNT(*) c FROM jobs WHERE user_id=?').get(q.uid).c})});
module.exports=r;