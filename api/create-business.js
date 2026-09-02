import {sql,initDb,hashPassword,sessionAdmin} from './db.js';
function send(res,c,b){res.setHeader('Content-Type','application/json');res.status(c).json(b)}
function normalizeUserId(v){return String(v||'').trim().toLowerCase()}
function validUserId(v){return /^[a-z0-9._-]{3,50}$/.test(v)}
export default async function handler(req,res){await initDb();try{
 if(req.method!=='POST')return send(res,405,{error:'Method not allowed.'});
 if(!(await sessionAdmin(req)))return send(res,401,{error:'Admin login required'});
 const {business,owner,mobile,email,category,address,gst,password}=req.body||{};
 const userId=normalizeUserId(req.body?.userId);
 if(!userId||!validUserId(userId))return send(res,400,{error:'Login ID is required. Use 3-50 characters: a-z, 0-9, dot, underscore or hyphen.'});
 if(!business||!owner||!mobile||!email||!category||!address||!password||String(password).length<6)return send(res,400,{error:'Business, owner, mobile, email, category, address and password are required. Password must be at least 6 characters.'});
 const byName=await sql`SELECT id FROM businesses WHERE lower(business)=lower(${String(business).trim()})`;
 if(byName.rowCount)return send(res,409,{error:'This Business Name is already registered. Please use a different Business Name.'});
 const byLogin=await sql`SELECT id FROM businesses WHERE lower(user_id)=lower(${userId})`;
 if(byLogin.rowCount)return send(res,409,{error:'This Login ID is already in use. Please choose another Login ID.'});
 const id=globalThis.crypto?.randomUUID?.()||`${Date.now()}-${Math.random().toString(36).slice(2)}`;
 const h=await hashPassword(String(password));
 await sql`INSERT INTO businesses(id,user_id,business,owner,mobile,email,category,gst,password_hash,status) VALUES(${id},${userId},${String(business).trim()},${String(owner).trim()},${String(mobile).trim()},${String(email).trim().toLowerCase()},${String(category).trim()},${String(gst||'').trim().toUpperCase()},${h},'pending')`;
 await sql`INSERT INTO business_data(business_id,settings) VALUES(${id},${JSON.stringify({name:String(business).trim(),category:String(category).trim(),mobile:String(mobile).trim(),gst:String(gst||'').trim().toUpperCase(),address:String(address).trim(),owner:String(owner).trim(),email:String(email).trim().toLowerCase(),createdBy:'admin-direct'})}::jsonb)`;
 return send(res,200,{ok:true,businessId:id,loginId:userId,status:'pending'});
}catch(e){console.error(e);return send(res,500,{error:'Create Business server error'})}}
