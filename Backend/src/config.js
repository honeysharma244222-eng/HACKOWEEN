const path=require('path');
require('dotenv').config();
module.exports={
  port:Number(process.env.PORT)||3000,
  prod:process.env.NODE_ENV==='production',
  secret:process.env.TOKEN_SECRET||'dev-secret',
  demo:process.env.ALLOW_DEMO_AUTH!=='0',
  dbFile:process.env.DB_FILE||path.join(__dirname,'..','data','grain.db')
};