const {valid}=require("./_admin-auth");
module.exports=async function(req,res){
 if(req.method!=="GET")return res.status(405).json({error:"Method not allowed"});
 const ak=process.env.LETMYTRIP_ADMIN_KEY,key=process.env.SUPABASE_SERVICE_ROLE_KEY,url=(process.env.SUPABASE_URL||"").replace(/\/$/,"");
 if(!ak||!valid(req,ak))return res.status(401).json({error:"Unauthorized"});
 if(!key||!url)return res.status(500).json({error:"Pricing configuration is missing"});
 try{
  const headers=key.startsWith("sb_secret_")?{apikey:key}:{apikey:key,Authorization:"Bearer "+key};
  const r=await fetch(url+"/rest/v1/letmytrip_service_pricing?select=*&order=service_type.asc",{headers});
  const d=await r.json();
  if(!r.ok){console.error("Service pricing load failed",r.status,JSON.stringify(d).slice(0,400));return res.status(502).json({error:"Unable to load service pricing. Run supabase-service-pricing.sql in Supabase SQL Editor first."});}
  return res.status(200).json({settings:d});
 }catch(e){console.error(e);return res.status(500).json({error:"Server error"});}
};