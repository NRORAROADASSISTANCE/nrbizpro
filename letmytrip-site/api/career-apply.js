const crypto=require("crypto");
module.exports=async function(req,res){
 if(req.method!=="POST")return res.status(405).json({error:"Method not allowed"});
 try{
  const f=req.body||{};
  const required=["fullName","mobile","email","position"];
  for(const k of required) if(!String(f[k]||"").trim()) return res.status(400).json({error:"Please fill all required fields"});
  if(!f.cvBase64||!f.cvName)return res.status(400).json({error:"Please upload your CV"});
  const key=process.env.SUPABASE_SERVICE_ROLE_KEY,url=(process.env.SUPABASE_URL||"").replace(/\/$/,"");
  if(!key||!url)return res.status(500).json({error:"Career application is not configured yet"});
  const ext=(String(f.cvName).match(/\.([a-z0-9]+)$/i)||[])[1]||"pdf";
  const allowed=["pdf","doc","docx"]; if(!allowed.includes(ext.toLowerCase()))return res.status(400).json({error:"CV must be PDF, DOC or DOCX"});
  const raw=String(f.cvBase64).replace(/^data:[^;]+;base64,/,""),buf=Buffer.from(raw,"base64");
  if(buf.length>5*1024*1024)return res.status(400).json({error:"CV size must be 5 MB or less"});
  const appNo="LMT-CAREER-"+Date.now().toString(36).toUpperCase()+"-"+crypto.randomBytes(2).toString("hex").toUpperCase();
  const safe=String(f.cvName).replace(/[^a-zA-Z0-9._-]/g,"_"),path=appNo+"/"+safe;
  const up=await fetch(url+"/storage/v1/object/letmytrip-cvs/"+encodeURIComponent(path),{method:"POST",headers:{apikey:key,Authorization:"Bearer "+key,"Content-Type":f.cvType||"application/octet-stream","x-upsert":"false"},body:buf});
  if(!up.ok)return res.status(502).json({error:"Unable to upload CV"});
  const ins=await fetch(url+"/rest/v1/career_applications",{method:"POST",headers:{apikey:key,Authorization:"Bearer "+key,"Content-Type":"application/json",Prefer:"return=minimal"},body:JSON.stringify({application_no:appNo,full_name:String(f.fullName).trim(),mobile:String(f.mobile).trim(),email:String(f.email).trim().toLowerCase(),position:String(f.position).trim(),qualification:String(f.qualification||"").trim(),experience:String(f.experience||"").trim(),location:String(f.location||"").trim(),cv_path:path})});
  if(!ins.ok){await fetch(url+"/storage/v1/object/letmytrip-cvs/"+encodeURIComponent(path),{method:"DELETE",headers:{apikey:key,Authorization:"Bearer "+key}});return res.status(502).json({error:"Unable to save career application"});}
  return res.status(200).json({ok:true,applicationNo:appNo});
 }catch(e){console.error(e);return res.status(500).json({error:"Server error"});}
};