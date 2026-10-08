const crypto=require("crypto");
function verifyPassword(password,stored){try{const [salt,hex]=String(stored||"").split(":");if(!salt||!hex)return false;const a=crypto.scryptSync(String(password),salt,64);const b=Buffer.from(hex,"hex");return b.length===a.length&&crypto.timingSafeEqual(a,b)}catch(e){return false}}
module.exports=async function(req,res){
 if(req.method!=="POST")return res.status(405).json({error:"Method not allowed"});
 try{
  const {identifier,password}=req.body||{};
  if(!String(identifier||"").trim()||!String(password||""))return res.status(400).json({error:"Mobile/email and password are required"});
  const key=process.env.SUPABASE_SERVICE_ROLE_KEY,url=(process.env.SUPABASE_URL||"").replace(/\/$/,"");
  if(!key||!url)return res.status(500).json({error:"Agent login is not configured yet"});
  const id=String(identifier).trim().toLowerCase();
  const mobile=id.replace(/\D/g,"").slice(-10);
  const filter=id.includes("@")?"email=eq."+encodeURIComponent(id):"mobile=eq."+encodeURIComponent(mobile);
  const r=await fetch(url+"/rest/v1/agent_applications?select=application_no,agency_name,owner_name,mobile,email,status,password_hash&"+filter,{headers:{apikey:key,Authorization:"Bearer "+key}});
  const rows=await r.json();
  if(!r.ok)return res.status(502).json({error:"Unable to check agent account"});
  const a=rows[0];
  if(!a||!verifyPassword(password,a.password_hash))return res.status(401).json({error:"Invalid login details"});
  if(a.status!=="APPROVED"){
    if(a.status==="PENDING")return res.status(403).json({error:"Your agent application is still under review."});
    return res.status(403).json({error:"Your agent application was not approved."});
  }
  return res.status(200).json({ok:true,agent:{applicationNo:a.application_no,agencyName:a.agency_name,ownerName:a.owner_name,mobile:a.mobile,email:a.email}});
 }catch(e){console.error(e);return res.status(500).json({error:"Server error"});}
};