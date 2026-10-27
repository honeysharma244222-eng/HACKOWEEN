const r=require('express').Router(),db=require('../db'),E=require('../services/engine');
r.post('/',(q,s)=>{const items=q.body.items;if(!Array.isArray(items)||!items.length)return s.status(400).json({error:'items required'});
try{s.json(db.transaction(()=>{let total=0,donor=null;const rows=[];
for(const i of items){const n=Math.min(6,i.qty|0),l=db.prepare('SELECT * FROM listings WHERE id=?').get(i.id);
if(!l||n<1||l.qty<n||l.expires_at<=Date.now())throw new Error('Item unavailable');
db.prepare('UPDATE listings SET qty=qty-? WHERE id=?').run(n,l.id);total+=l.price*n;donor=donor||l.donor_id;rows.push([l,n])}
const p=E.pickPartner(donor),o=db.prepare('INSERT INTO orders(user_id,donor_id,total,partner_id,created_at) VALUES(?,?,?,?,?)').run(q.uid,donor,total,p.id,Date.now()).lastInsertRowid;
rows.forEach(([l,n])=>db.prepare('INSERT INTO order_items VALUES(?,?,?,?,?)').run(o,l.id,l.name,n,l.price));
db.prepare('UPDATE users SET points=points+10 WHERE id=?').run(q.uid);E.notify('✅','Order confirmed. Finding the nearest delivery partner…',q.uid);
return{id:o,total,partner:p.name}})())}catch(e){s.status(409).json({error:e.message})}});
r.get('/',(q,s)=>s.json(db.prepare('SELECT * FROM orders WHERE user_id=? ORDER BY id DESC LIMIT 20').all(q.uid).map(o=>({...o,items:db.prepare('SELECT name,qty,price FROM order_items WHERE order_id=?').all(o.id)}))));
r.get('/:id/track',(q,s)=>{const o=db.prepare('SELECT o.*,p.name partner,p.rating FROM orders o JOIN partners p ON p.id=o.partner_id WHERE o.id=? AND o.user_id=?').get(q.params.id,q.uid);
if(!o)return s.status(404).json({error:'Not found'});s.json({...o,stage:E.stage(o.progress),steps:E.STEPS})});
module.exports=r;