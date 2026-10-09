const crypto=require("crypto");

function hashPassword(password){
  const salt=crypto.randomBytes(16).toString("hex");
  const hash=crypto.scryptSync(password,salt,64).toString("hex");
  return salt+":"+hash;
}

module.exports = async function handler(req,res){
  if(req.method!=="POST") return res.status(405).json({error:"Method not allowed"});
  try{
    const body=req.body||{};
    const required=["agencyName","ownerName","mobile","email","password","businessType","pan","pincode","state","city","address","accountName","bankName","accountNumber","ifsc"];
    for(const key of required){
      if(!String(body[key]||"").trim()) return res.status(400).json({error:"Missing required field: "+key});
    }
    const mobile=String(body.mobile).replace(/\D/g,"").slice(-10);
    const password=String(body.password||"");
    if(password.length<8) return res.status(400).json({error:"Password must be at least 8 characters"});
    if(mobile.length!==10) return res.status(400).json({error:"Invalid mobile number"});
    const supabaseUrl=process.env.SUPABASE_URL;
    const supabaseKey=process.env.SUPABASE_SERVICE_ROLE_KEY||process.env.SUPABASE_PUBLISHABLE_KEY;
    if(!supabaseUrl||!supabaseKey) return res.status(500).json({error:"Supabase configuration is missing"});

    const applicationNo="LMT-A"+Date.now().toString().slice(-9);
    const row={
      application_no:applicationNo,
      agency_name:String(body.agencyName).trim(),
      owner_name:String(body.ownerName).trim(),
      mobile,
      whatsapp:String(body.whatsapp||"").replace(/\D/g,"").slice(-10)||null,
      email:String(body.email).trim().toLowerCase(),
      business_type:String(body.businessType).trim(),
      pan:String(body.pan).trim().toUpperCase(),
      gst:String(body.gst||"").trim().toUpperCase()||null,
      website:String(body.website||"").trim()||null,
      pincode:String(body.pincode).trim(),
      state:String(body.state).trim(),
      city:String(body.city).trim(),
      address:String(body.address).trim(),
      account_name:String(body.accountName).trim(),
      bank_name:String(body.bankName).trim(),
      account_number:String(body.accountNumber).trim(),
      ifsc:String(body.ifsc).trim().toUpperCase(),
      status:"PENDING",
      password_hash:hashPassword(password)
    };

    const upstream=await fetch(supabaseUrl.replace(/\/$/,"")+"/rest/v1/agent_applications",{
      method:"POST",
      headers:{
        "apikey":supabaseKey,
        "Authorization":"Bearer "+supabaseKey,
        "Content-Type":"application/json",
        "Prefer":"return=minimal"
      },
      body:JSON.stringify(row)
    });
    if(!upstream.ok){
      const raw=await upstream.text();
      console.error("Supabase agent insert failed",raw);
      return res.status(502).json({saved:false,error:"Could not save the application to Supabase."});
    }
    return res.status(200).json({saved:true,applicationNo});
  }catch(error){
    console.error("Agent registration error",error);
    return res.status(500).json({saved:false,error:"Unable to submit the application right now."});
  }
};
