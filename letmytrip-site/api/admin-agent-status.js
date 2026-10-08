module.exports=async function(req,res){
  if(req.method!=="POST") return res.status(405).json({error:"Method not allowed"});
  const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
  const url=(process.env.SUPABASE_URL||"").replace(/\/$/,"");
  if(!key||!url) return res.status(500).json({error:"Admin Supabase configuration is missing"});
  try{
    const {applicationNo,status,rejectionReason}=req.body||{};
    if(!applicationNo||!["PENDING","APPROVED","REJECTED"].includes(status)) return res.status(400).json({error:"Invalid application or status"});
    if(status==="REJECTED"&&!String(rejectionReason||"").trim()) return res.status(400).json({error:"Rejection reason is required"});
    const r=await fetch(url+"/rest/v1/agent_applications?application_no=eq."+encodeURIComponent(applicationNo),{
      method:"PATCH",headers:{apikey:key,Authorization:"Bearer "+key,"Content-Type":"application/json","Prefer":"return=representation"},
      body:JSON.stringify({status,rejection_reason:status==="REJECTED"?String(rejectionReason).trim():null,reviewed_at:status==="PENDING"?null:new Date().toISOString(),reviewer:status==="PENDING"?null:"LETMYTRIP ADMIN"})
    });
    const d=await r.json();if(!r.ok)return res.status(502).json({error:"Unable to update application"});
    return res.status(200).json({updated:d[0]||null});
  }catch(e){console.error(e);return res.status(500).json({error:"Server error"});}
};