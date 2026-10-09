const {valid}=require("./_admin-auth");
module.exports=async function(req,res){
 if(req.method!=="POST")return res.status(405).json({error:"Method not allowed"});
 const ak=process.env.LETMYTRIP_ADMIN_KEY,key=process.env.SUPABASE_SERVICE_ROLE_KEY,url=(process.env.SUPABASE_URL||"").replace(/\/$/,"");
 if(!ak||!valid(req,ak))return res.status(401).json({error:"Unauthorized"});
 if(!key||!url)return res.status(500).json({error:"Pricing configuration is missing"});
 try{
  const b=req.body||{},allowed=["BUS","FLIGHT","HOTEL","PACKAGE"];
  const serviceType=String(b.serviceType||"").toUpperCase();
  if(!allowed.includes(serviceType))return res.status(400).json({error:"Invalid service type"});
  const num=(v,d=0)=>Number.isFinite(Number(v))?Math.max(0,Number(v)):d;
  const mode=v=>v==="PERCENT"?"PERCENT":"FIXED";
  const data={service_type:serviceType,platform_fee:num(b.platformFee),company_markup_mode:mode(b.companyMarkupMode),company_markup:num(b.companyMarkup),company_markup_max:num(b.companyMarkupMax),customer_markup_mode:mode(b.customerMarkupMode),customer_markup:num(b.customerMarkup),customer_markup_max:num(b.customerMarkupMax),updated_at:new Date().toISOString()};
  if(data.company_markup_mode==="PERCENT"&&data.company_markup>100)return res.status(400).json({error:"Company markup percent cannot exceed 100"});
  if(data.customer_markup_mode==="PERCENT"&&data.customer_markup>100)return res.status(400).json({error:"Customer markup percent cannot exceed 100"});
  const headers=key.startsWith("sb_secret_")?{apikey:key,"Content-Type":"application/json",Prefer:"resolution=merge-duplicates,return=representation"}:{apikey:key,Authorization:"Bearer "+key,"Content-Type":"application/json",Prefer:"resolution=merge-duplicates,return=representation"};
  const r=await fetch(url+"/rest/v1/letmytrip_service_pricing?on_conflict=service_type",{method:"POST",headers,body:JSON.stringify(data)});
  const d=await r.json().catch(()=>[]);
  if(!r.ok){console.error("Service pricing save failed",r.status,JSON.stringify(d).slice(0,400));return res.status(502).json({error:"Unable to save service pricing. Check the Supabase table and logs."});}
  return res.status(200).json({settings:Array.isArray(d)?d[0]:d});
 }catch(e){console.error(e);return res.status(500).json({error:"Server error"});}
};