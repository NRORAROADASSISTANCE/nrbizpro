module.exports = async function handler(req,res){
  if(req.method!=="POST") return res.status(405).json({error:"Method not allowed"});
  try{
    const {mobile}=req.body||{};
    const m=String(mobile||"").replace(/\D/g,"").slice(-10);
    if(m.length!==10) return res.status(400).json({error:"Invalid mobile number"});
    const authkey=process.env.MSG91_AUTHKEY;
    const widgetId=process.env.MSG91_WIDGET_ID;
    if(!authkey||!widgetId) return res.status(500).json({error:"MSG91 server configuration is missing"});
    const upstream=await fetch("https://control.msg91.com/api/v5/widget/sendOtp",{
      method:"POST",
      headers:{"Accept":"application/json","Content-Type":"application/json","authkey":authkey},
      body:JSON.stringify({widgetId,identifier:"91"+m})
    });
    const raw=await upstream.text();
    let data; try{data=JSON.parse(raw)}catch{data={raw}};
    const failed=!upstream.ok || data?.type==="error" || data?.code===201 || !data?.message;
    if(failed){
      console.error("MSG91 sendOtp failed",JSON.stringify(data));
      return res.status(502).json({sent:false,error:"MSG91 could not send the OTP.",details:process.env.NODE_ENV==="development"?data:undefined});
    }
    return res.status(200).json({sent:true,reqId:data.message});
  }catch(error){
    console.error("MSG91 sendOtp server error",error);
    return res.status(500).json({sent:false,error:"OTP service is temporarily unavailable."});
  }
};
