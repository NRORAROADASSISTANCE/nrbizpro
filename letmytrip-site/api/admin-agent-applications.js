const {valid}=require("./_admin-auth");
module.exports=async function(req,res){
 if(req.method!=="GET")return res.status(405).json({error:"Method not allowed"});
 const adminKey=process.env.LETMYTRIP_ADMIN_KEY;
 const bearer=req.headers.authorization==="Bearer "+adminKey;
 if(!adminKey||(!bearer&&!valid(req,adminKey)))return res.status(401).json({error:"Unauthorized"});
 const key=process.env.SUPABASE_SERVICE_ROLE_KEY,url=(process.env.SUPABASE_URL||"").replace(/\/$/,"");
 if(!key||!url)return res.status(500).json({error:"Admin Supabase configuration is missing"});
 try{const r=await fetch(url+"/rest/v1/agent_applications?select=*&order=submitted_at.desc",{headers:(key.startsWith("sb_secret_")?{apikey:key}:{apikey:key,Authorization:"Bearer "+key})});const d=await r.json();if(!r.ok)return res.status(502).json({error:"Unable to load applications"});return res.status(200).json({applications:d})}catch(e){console.error(e);return res.status(500).json({error:"Server error"})}
};