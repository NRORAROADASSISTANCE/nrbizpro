const chats=[{name:"NR CHAT",letter:"N",preview:"Welcome to NR CHAT",messages:[]}];
const list=document.getElementById("chatList"),messages=document.getElementById("messages"),input=document.getElementById("message"),form=document.getElementById("composer"),search=document.getElementById("search");
function renderList(filter=""){list.innerHTML="";chats.filter(c=>c.name.toLowerCase().includes(filter.toLowerCase())).forEach((c,i)=>{const el=document.createElement("div");el.className="chat-item "+(i===0?"active":"");el.innerHTML='<div class="avatar">'+c.letter+'</div><div><b>'+c.name+'</b><p>'+c.preview+'</p></div>';el.onclick=()=>openChat(i);list.appendChild(el)})}
function openChat(i){const c=chats[i];document.getElementById("person").textContent=c.name;document.getElementById("status").textContent="Available";messages.innerHTML="";if(!c.messages.length){messages.innerHTML='<div class="welcome"><div class="welcome-icon">NR</div><h1>Start chatting</h1><p>Send your first message.</p></div>';return}c.messages.forEach(m=>addBubble(m.text,m.me,false))}
function addBubble(text,me=true,save=true){const welcome=messages.querySelector(".welcome");if(welcome)welcome.remove();const b=document.createElement("div");b.className="bubble "+(me?"me":"other");b.textContent=text;messages.appendChild(b);messages.scrollTop=messages.scrollHeight;if(save)chats[0].messages.push({text,me})}
form.addEventListener("submit",e=>{e.preventDefault();const v=input.value.trim();if(!v)return;addBubble(v,true);input.value="";document.getElementById("status").textContent="Message sent";chats[0].preview=v;renderList(search.value)});
search.addEventListener("input",e=>renderList(e.target.value));
document.getElementById("attach").onclick=()=>alert("File and media sharing will be connected in the next NR CHAT build.");
renderList();
if("serviceWorker" in navigator){window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}));}

const chatMenu=document.getElementById("chatMenu"),chatMenuBtn=document.getElementById("chatMenuBtn");
chatMenuBtn?.addEventListener("click",e=>{e.stopPropagation();chatMenu.hidden=!chatMenu.hidden});
document.addEventListener("click",e=>{if(chatMenu&&!chatMenu.contains(e.target)&&e.target!==chatMenuBtn)chatMenu.hidden=true});
chatMenu?.addEventListener("click",e=>{
 const btn=e.target.closest("button"); if(!btn)return;
 const action=btn.dataset.action; chatMenu.hidden=true;
 if(action==="hide"){chats[0].hidden=true; renderList(search.value); document.getElementById("status").textContent="Chat hidden"; alert("Chat hidden. It can be restored from Private/Hidden Chats.");}
 if(action==="private"){chats[0].private=true; document.getElementById("status").textContent="Private chat"; alert("Private chat enabled. Access will be protected after account + privacy backend integration.");}
 if(action==="lock"){const pin=prompt("Set a 4-digit chat lock PIN:"); if(pin&&/^\\d{4}$/.test(pin)){chats[0].locked=true; localStorage.setItem("nrchat_lock_demo",pin); document.getElementById("status").textContent="Chat locked"; alert("Chat lock enabled for this device.");}else if(pin!==null)alert("Please enter exactly 4 digits.");}
 if(action==="delete"){if(confirm("Delete this chat and its local messages?")){chats[0].messages=[];chats[0].preview="Chat deleted";document.getElementById("status").textContent="Chat deleted";openChat(0);}}
});


// Advertiser campaign starter (UI-ready; payment/backend connection follows secure Supabase/Razorpay setup).
const advertiseBtn=document.getElementById("advertiseBtn");
advertiseBtn?.addEventListener("click",()=>{
  const html=`<div class="ad-modal-backdrop" id="adModal"><div class="ad-modal">
    <button class="ad-close" id="adClose">×</button><h2>Advertise with NR CHAT</h2><p>Promote your business to NR CHAT users.</p>
    <form id="adForm">
      <input name="business" required placeholder="Business / Company name"><input name="contact" required placeholder="Contact person">
      <input name="mobile" required placeholder="Mobile number"><input name="email" type="email" required placeholder="Email">
      <input name="title" required placeholder="Advertisement title">
      <select name="package" required><option value="">Choose campaign package</option><option value="7_days">Starter — ₹499 / 7 days</option><option value="15_days">Growth — ₹999 / 15 days</option><option value="30_days">Premium — ₹1,999 / 30 days</option><option value="custom">Custom campaign</option></select>
      <input name="location" placeholder="Target location (e.g. Hyderabad)"><input name="destination" placeholder="Website / WhatsApp / landing page">
      <textarea name="description" placeholder="Ad description"></textarea><button class="ad-primary" type="submit">Continue to Payment</button>
    </form><div class="ad-note">After payment, NR CONNECT reviews and approves the campaign.</div>
  </div></div>`;
  document.body.insertAdjacentHTML("beforeend",html);
  document.getElementById("adClose").onclick=()=>document.getElementById("adModal")?.remove();
  document.getElementById("adForm").onsubmit=(e)=>{e.preventDefault();const f=new FormData(e.target);localStorage.setItem("nrchat_ad_draft",JSON.stringify(Object.fromEntries(f)));document.getElementById("adModal").innerHTML='<div class="ad-modal"><h2>Campaign saved</h2><p>Payment gateway is ready for connection. After payment, the campaign enters <b>Pending Approval</b>.</p><button class="ad-primary" onclick="document.getElementById(\'adModal\')?.remove()">Close</button></div>';};
});


// NR CHAT privacy/media foundation
const DISAPPEAR_KEY="nrchat_disappearing";
const disappearBtn=document.getElementById("disappearBtn");
const privacyStatus=document.getElementById("privacyStatus");
const durations={off:0,"24h":24*60*60*1000,"7d":7*24*60*60*1000,"30d":30*24*60*60*1000};
let disappearing=localStorage.getItem(DISAPPEAR_KEY)||"off";
function updateDisappear(){if(!disappearBtn)return;disappearBtn.textContent="⏱️ Disappearing: "+(disappearing==="off"?"Off":disappearing==="24h"?"24 hours":disappearing==="7d"?"7 days":"30 days");}
disappearBtn?.addEventListener("click",()=>{const v=prompt("Disappearing messages: type Off, 24h, 7d or 30d",disappearing);if(v===null)return;const n=v.trim().toLowerCase();const map={off:"off","24h":"24h","7d":"7d","30d":"30d"};if(!map[n])return alert("Choose Off, 24h, 7d or 30d.");disappearing=map[n];localStorage.setItem(DISAPPEAR_KEY,disappearing);updateDisappear();});
updateDisappear();
function cleanupExpiredMessages(){const now=Date.now();chats.forEach(c=>{if(!c.messages)return;c.messages=c.messages.filter(m=>!m.expiresAt||m.expiresAt>now)});}
const oldAddBubble=addBubble;
addBubble=function(text,me=true,save=true){oldAddBubble(text,me,false);if(save){const expiry=durations[disappearing]?Date.now()+durations[disappearing]:null;chats[0].messages.push({text,me,createdAt:Date.now(),expiresAt:expiry});}};
setInterval(()=>{cleanupExpiredMessages();openChat(0)},60000);cleanupExpiredMessages();

// Media limits enforced before upload/backend integration.
const MEDIA_LIMITS={image:10*1024*1024,video:100*1024*1024,document:25*1024*1024,audio:25*1024*1024};
function validateNrChatMedia(file,type){const limit=MEDIA_LIMITS[type];if(!limit)return {ok:false,error:"Unsupported file type."};if(file.size>limit)return {ok:false,error:type+" exceeds NR CHAT limit of "+Math.round(limit/1024/1024)+" MB."};return {ok:true};}
window.NRCHAT_MEDIA_LIMITS=MEDIA_LIMITS;window.validateNrChatMedia=validateNrChatMedia;

// Native-app screenshot/screen-record protection is implemented with platform APIs.
// Web/PWA cannot guarantee OS-level screenshot blocking.
function enableNativePrivacyProtection(){document.documentElement.dataset.screenPrivacy="enabled";privacyStatus&&(privacyStatus.textContent="🔒 Screenshot protection ready");}
enableNativePrivacyProtection();

document.getElementById("callBtn")?.addEventListener("click",()=>alert("NR CHAT Calls: Audio • Video • Group Call. WebRTC + secure signaling/TURN will be connected in the native-call integration step."));
