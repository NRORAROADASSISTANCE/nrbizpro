module.exports = async function handler(req,res){
  if(req.method!=="POST") return res.status(405).json({error:"Method not allowed"});
  try{
    const {accessToken}=req.body||{};
    if(!accessToken||typeof accessToken!=="string") return res.status(400).json({error:"Missing access token"});
    const authkey=process.env.MSG91_AUTHKEY;
    if(!authkey) return res.status(500).json({error:"MSG91 server authentication is not configured"});
    const upstream=await fetch("https://control.msg91.com/api/v5/widget/verifyAccessToken",{
      method:"POST",
      headers:{"Content-Type":"application/json","Accept":"application/json"},
      body:JSON.stringify({authkey,"access-token":accessToken})
    });
    const raw=await upstream.text();
    let data; try{data=JSON.parse(raw)}catch{data={raw}};
    const failed=!upstream.ok || data?.type==="error" || data?.code===201 || data?.status==="error";
    if(failed){
      console.error("MSG91 access-token verification failed",JSON.stringify(data));
      return res.status(401).json({verified:false,error:"MSG91 access token verification failed",details:process.env.NODE_ENV==="development"?data:undefined});
    }
    res.setHeader("Set-Cookie","letmytrip_verified=1; Max-Age=28800; Path=/; HttpOnly; Secure; SameSite=Lax");
    return res.status(200).json({verified:true});
  }catch(error){
    console.error("MSG91 access-token verification server error",error);
    return res.status(500).json({verified:false,error:"Verification service unavailable"});
  }
};