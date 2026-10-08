module.exports=async function(req,res){
  if(req.method!=="GET") return res.status(405).json({error:"Method not allowed"});
  const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
  const url=(process.env.SUPABASE_URL||"").replace(/\/$/,"");
  if(!key||!url) return res.status(500).json({error:"Admin Supabase configuration is missing"});
  try{
    const r=await fetch(url+"/rest/v1/agent_applications?select=*&order=submitted_at.desc",{headers:{apikey:key,Authorization:"Bearer "+key}});
    const d=await r.json();
    if(!r.ok) return res.status(502).json({error:"Unable to load applications"});
    return res.status(200).json({applications:d});
  }catch(e){console.error(e);return res.status(500).json({error:"Server error"});}
};