const Database=require('better-sqlite3'),fs=require('fs'),path=require('path'),cfg=require('./config');
fs.mkdirSync(path.dirname(path.resolve(cfg.dbFile)),{recursive:true});
const db=new Database(cfg.dbFile);db.pragma('journal_mode = WAL');db.pragma('foreign_keys = ON');
db.exec(fs.readFileSync(path.join(__dirname,'schema.sql'),'utf8'));
function seed(){const d=require('../data/seed.json'),now=Date.now();
db.transaction(()=>{
d.nodes.forEach(n=>db.prepare('INSERT OR IGNORE INTO nodes VALUES(?,?,?,?,?,?)').run(...n));
d.partners.forEach(p=>db.prepare('INSERT OR IGNORE INTO partners(id,name,x,y) VALUES(?,?,?,?)').run(...p));
Object.entries(d.stats).forEach(([k,v])=>db.prepare('INSERT OR IGNORE INTO stats VALUES(?,?)').run(k,v));
if(!db.prepare('SELECT 1 FROM listings').get())d.listings.forEach(l=>db.prepare('INSERT INTO listings(name,emoji,donor_id,qty,mode,price,category,veg,expires_at) VALUES(?,?,?,?,?,?,?,?,?)').run(...l.slice(0,8),now+l[8]*60000))})()}
seed();module.exports=db;module.exports.seed=seed;
if(require.main===module)console.log('Seeded.');