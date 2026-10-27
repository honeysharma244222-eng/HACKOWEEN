const r=require('express').Router(),db=require('../db'),cfg=require('../config'),{sign}=require('../middleware/auth');
r.post('/otp',(q,s)=>{const ph=String(q.body.phone||'').replace(/\D/g,'');if(ph.length<10)return s.status(400).json({error:'Valid phone required'});
const code=String(Math.floor(100000+Math.random()*900000));db.prepare('INSERT OR REPLACE INTO otps VALUES(?,?,?)').run(ph,code,Date.now()+5*6e4);
console.log('OTP for',ph,code); // TODO: send via SMS provider (Twilio/MSG91)
s.json({ok:true,...(cfg.prod?{}:{demoCode:code})})});
r.post('/verify',(q,s)=>{const ph=String(q.body.phone||'').replace(/\D/g,''),o=db.prepare('SELECT * FROM otps WHERE phone=?').get(ph);
if(!o||o.code!==String(q.body.code)||o.exp<Date.now())return s.status(401).json({error:'Invalid or expired code'});
db.prepare('DELETE FROM otps WHERE phone=?').run(ph);const id='u'+ph;
db.prepare('INSERT OR IGNORE INTO users(id,phone,created_at) VALUES(?,?,?)').run(id,ph,Date.now());s.json({token:sign(id),userId:id})});
module.exports=r;