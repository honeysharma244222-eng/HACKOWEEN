const crypto=require('crypto'),cfg=require('../config'),db=require('../db');
const b64=s=>Buffer.from(s).toString('base64url');
const sig=p=>crypto.createHmac('sha256',cfg.secret).update(p).digest('base64url');
exports.sign=id=>{const p=b64(JSON.stringify({id,exp:Date.now()+30*864e5}));return p+'.'+sig(p)};
function verify(t){const[p,s]=String(t||'').split('.');if(!p||!s||s!==sig(p))return null;
try{const o=JSON.parse(Buffer.from(p,'base64url'));return o.exp>Date.now()?o.id:null}catch{return null}}
exports.auth=(req,res,next)=>{const h=req.get('authorization')||'';let id=h.startsWith('Bearer ')?verify(h.slice(7)):null;
if(!id&&cfg.demo&&req.get('x-user-id'))id=String(req.get('x-user-id')).slice(0,64);
if(!id)return res.status(401).json({error:'Login required'});
db.prepare('INSERT OR IGNORE INTO users(id,created_at) VALUES(?,?)').run(id,Date.now());req.uid=id;next()};