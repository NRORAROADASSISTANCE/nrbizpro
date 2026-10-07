module.exports = async function handler(req,res){
  if(req.method!=="POST") return res.status(405).json({error:"Method not allowed"});
  try{
    const {reqId,otp}=req.body||{};
    const code=String(otp||"").replace(/\D/g,"");
    if(!reqId||code.length!==6) return res.status(400).json({verified:false,error:"Invalid OTP request"});
    const authkey=process.env.MSG91_AUTHKEY;
    const widgetId=process.env.MSG91_WIDGET_ID;
    if(!authkey||!widgetId) return res.status(500).json({verified:false,error:"MSG91 server configuration is missing"});
    const upstream=await fetch("https://control.msg91.com/api/v5/widget/verifyOtp",{
      method:"POST",
      headers:{"Accept":"application/json","Content-Type":"application/json","authkey":authkey},
      body:JSON.stringify({widgetId,reqId,otp:code})
    });
    const raw=await upstream.text();
    let data; try{data=JSON.parse(raw)}catch{data={raw}};
    const accessToken=data?.message||data?.accessToken||data?.access_token||data?.token;
    const failed=!upstream.ok || data?.type==="error" || data?.code===201 || !accessToken;
    if(failed){
      console.error("MSG91 verifyOtp failed",JSON.stringify(data));
      return res.status(401).json({verified:false,error:"Incorrect or expired OTP.",details:process.env.NODE_ENV==="development"?data:undefined});
    }
    const check=await fetch("https://control.msg91.com/api/v5/widget/verifyAccessToken",{
      method:"POST",
      headers:{"Accept":"application/json","Content-Type":"application/x-www-form-urlencoded"},
      body:new URLSearchParams({authkey,"access-token":accessToken})
    });
    const checkRaw=await check.text();
    let checkData; try{checkData=JSON.parse(checkRaw)}catch{checkData={raw:checkRaw}};
    const checkFailed=!check.ok || checkData?.type==="error" || checkData?.code===201;
    if(checkFailed){
      console.error("MSG91 access-token verification failed",JSON.stringify(checkData));
      return res.status(401).json({verified:false,error:"Server verification failed.",details:process.env.NODE_ENV==="development"?checkData:undefined});
    }
    res.setHeader("Set-Cookie","letmytrip_verified=1; Max-Age=28800; Path=/; HttpOnly; Secure; SameSite=Lax");
    return res.status(200).json({verified:true});
  }catch(error){
    console.error("MSG91 verify server error",error);
    return res.status(500).json({verified:false,error:"Verification service is temporarily unavailable."});
  }
};
