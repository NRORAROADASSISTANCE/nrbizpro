export default async function handler(req,res){
  if(req.method!=="POST")return res.status(405).json({error:"Method not allowed"});
  const authkey=process.env.MSG91_AUTHKEY;
  if(!authkey)return res.status(500).json({error:"MSG91_AUTHKEY is not configured"});
  let body={};
  try{body=typeof req.body==="string"?JSON.parse(req.body||"{}"):(req.body||{});}catch{return res.status(400).json({error:"Invalid JSON"});}
  const accessToken=body.accessToken||body.access_token;
  if(!accessToken)return res.status(400).json({error:"accessToken is required"});
  try{
    const r=await fetch("https://control.msg91.com/api/v5/widget/verifyAccessToken",{method:"POST",headers:{"Content-Type":"application/json","authkey":authkey},body:JSON.stringify({access_token:accessToken})});
    const t=await r.text();let data;try{data=JSON.parse(t)}catch{data={raw:t}}
    return res.status(r.status).json(data);
  }catch(e){return res.status(502).json({error:"MSG91 verification request failed"});}
}
