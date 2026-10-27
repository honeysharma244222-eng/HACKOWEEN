const r=require('express').Router(),db=require('../db');
r.get('/',(q,s)=>{let sql='SELECT l.*,n.name donor_name FROM listings l JOIN nodes n ON n.id=l.donor_id WHERE qty>0 AND expires_at>?';const a=[Date.now()];
if(q.query.cat&&q.query.cat!=='All'){if(q.query.cat==='Free')sql+=" AND mode='free'";else{sql+=' AND category=?';a.push(q.query.cat)}}
if(q.query.q){sql+=' AND (l.name LIKE ? OR n.name LIKE ?)';a.push('%'+q.query.q+'%','%'+q.query.q+'%')}
s.json(db.prepare(sql+' ORDER BY expires_at').all(...a))});
r.post('/',(q,s)=>{const b=q.body;if(!b.name||!(b.qty>0)||!b.donor_id)return s.status(400).json({error:'name, qty, donor_id required'});
const i=db.prepare('INSERT INTO listings(name,emoji,donor_id,qty,mode,price,category,veg,expires_at) VALUES(?,?,?,?,?,?,?,?,?)')
.run(String(b.name).slice(0,60),b.emoji||'🍲',b.donor_id,b.qty|0,b.mode==='sub'?'sub':'free',Math.max(0,b.price|0),b.category||'Meals',b.veg===0?0:1,Date.now()+Math.max(10,b.minutes||60)*6e4);
s.json({id:i.lastInsertRowid})});
module.exports=r;