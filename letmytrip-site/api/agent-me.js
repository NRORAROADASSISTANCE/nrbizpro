const crypto=require("crypto");
function parseCookie(req,name){const raw=req.headers.cookie||"";for(const part of raw.split(";")){const [k,...v]=part.trim().split("=");if(k===name)return v.join("=")}return ""}
function readSession(token,secret){try{const [payload,sig]=String(token||"").split(".");if(!payload||!sig)return null;const expected=crypto.createHmac("sha256",secret).update(payload).digest("base64url");if(sig.length!==expected.length||!crypto.timingSafeEqual(Buffer.from(sig),Buffer.from(expected)))return null;const data=JSON.parse(Buffer.from(payload,"base64url").toString());if(!data.applicationNo||!data.exp||Date.now()>data.exp)return null;return data}catch(e){return null}}
module.exports=async function(req,res){
 if(req.method!=="GET")return res.status(405).json({error:"Method not allowed"});
 try{
  const key=process.env.SUPABASE_SERVICE_ROLE_KEY,url=(process.env.SUPABASE_URL||"").replace(/\/$/,""),session=readSession(parseCookie(req,"letmytrip_agent_session"),key||"");
  if(!key||!url)return res.status(500).json({error:"Agent session is not configured yet"});
  if(!session)return res.status(401).json({error:"Not authenticated"});
  const r=await fetch(url+"/rest/v1/agent_applications?select=application_no,agency_name,owner_name,mobile,email,status&application_no=eq."+encodeURIComponent(session.applicationNo)+"&limit=1",{headers:{apikey:key,Authorization:"Bearer "+key}});
  const rows=await r.json();
  if(!r.ok)return res.status(502).json({error:"Unable to load agent account"});
  const a=rows[0];
  if(!a||a.status!=="APPROVED")return res.status(401).json({error:"Agent account is not approved"});
  return res.status(200).json({ok:true,agent:{applicationNo:a.application_no,agencyName:a.agency_name,ownerName:a.owner_name,mobile:a.mobile,email:a.email,ticketMarkup:a.ticket_markup||0,ticketMarkupMode:a.ticket_markup_mode||"FIXED"}});
 }catch(e){console.error(e);return res.status(500).json({error:"Server error"});}
};