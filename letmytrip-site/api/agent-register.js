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

    const dateParts=new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Kolkata",year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(new Date());
    const dateMap=Object.fromEntries(dateParts.map(p=>[p.type,p.value]));
    const dateStamp=dateMap.year+dateMap.month+dateMap.day;
    const applicationPrefix="LMT-"+dateStamp+"-";
    const requestHeaders={
      "apikey":supabaseKey,
      "Content-Type":"application/json",
      "Prefer":"return=minimal"
    };
    if(supabaseKey.startsWith("eyJ")) requestHeaders["Authorization"]="Bearer "+supabaseKey;

    // Continue the daily sequence: LMT-YYYYMMDD-0001, 0002, ...
    let sequence=1;
    const latest=await fetch(supabaseUrl.replace(/\\/$/,"")+"/rest/v1/agent_applications?select=application_no&application_no=like."+encodeURIComponent(applicationPrefix+"*")+"&order=application_no.desc&limit=1",{
      method:"GET",headers:requestHeaders
    });
    if(latest.ok){
      const rows=await latest.json();
      const match=String(rows?.[0]?.application_no||"").match(/-(\\d{4,})$/);
      if(match) sequence=Number(match[1])+1;
    } else {
      const raw=await latest.text();
      console.error("Could not read latest daily application number",latest.status,raw.slice(0,300));
    }
    const applicationNo=applicationPrefix+String(sequence).padStart(4,"0");
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
      headers:requestHeaders,
      body:JSON.stringify(row)
    });
    if(!upstream.ok){
      const raw=await upstream.text();
      console.error("Supabase agent insert failed",upstream.status,raw.slice(0,500));
      return res.status(502).json({saved:false,error:"Could not save the application to Supabase."});
    }
    return res.status(200).json({saved:true,applicationNo});
  }catch(error){
    console.error("Agent registration error",error);
    return res.status(500).json({saved:false,error:"Unable to submit the application right now."});
  }
};
