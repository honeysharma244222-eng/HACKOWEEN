const r=require('express').Router(),db=require('../db'),E=require('../services/engine');
r.post('/',(q,s)=>{const b=q.body;if(!b.name||!db.prepare("SELECT 1 FROM nodes WHERE id=? AND type='donor'").get(b.src))return s.status(400).json({error:'name and valid src required'});
const rem=E.report({src:b.src,name:String(b.name).slice(0,60),qty:Math.max(1,b.qty|0),minutes:Math.max(10,b.minutes|0||60),event:b.event});
db.prepare('UPDATE users SET points=points+25 WHERE id=?').run(q.uid);s.json({unallocated:rem})});
r.get('/',(q,s)=>s.json(db.prepare('SELECT r.*,p.name partner FROM rescues r JOIN partners p ON p.id=r.partner_id ORDER BY r.id DESC LIMIT 20').all()));
r.post('/:id/fail',(q,s)=>{const x=db.prepare("SELECT * FROM rescues WHERE id=? AND status='active' AND progress<.5").get(q.params.id);
if(!x)return s.status(409).json({error:'Cannot re-assign now'});E.reassign(x);s.json({ok:true})});
r.get('/needs',(q,s)=>s.json(db.prepare("SELECT id,name,need FROM nodes WHERE type='hub'").all()));
module.exports=r;