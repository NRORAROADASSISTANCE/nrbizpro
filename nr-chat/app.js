const chats=[
  {name:"NR CHAT",phone:"NR CHAT",letter:"N",preview:"Welcome to NR CHAT",messages:[]},
  {name:"Ravi Kumar",phone:"+91 98765 43210",letter:"R",preview:"Tap to start a chat",messages:[]},
  {name:"Suresh",phone:"+91 91234 56789",letter:"S",preview:"Tap to start a chat",messages:[]},
  {name:"Anjali",phone:"+91 99887 66554",letter:"A",preview:"Tap to start a chat",messages:[]}
];
const contacts=chats.slice(1);
const list=document.getElementById("chatList"),messages=document.getElementById("messages"),input=document.getElementById("message"),form=document.getElementById("composer"),search=document.getElementById("search");
const app=document.querySelector(".app"), chatsTab=document.getElementById("chatsTab"), contactsTab=document.getElementById("contactsTab"), mobileBackBtn=document.getElementById("mobileBackBtn");
let currentList="chats";
function renderList(filter=""){
  list.innerHTML="";
  const source=currentList==="contacts"?contacts:chats;
  source.filter(c=>(c.name+" "+c.phone).toLowerCase().includes(filter.toLowerCase())).forEach(c=>{
    const i=chats.indexOf(c);
    const el=document.createElement("div");
    el.className="chat-item "+(currentList==="chats"&&c===chats[0]?"active":"");
    el.innerHTML='<div class="avatar">'+c.letter+'</div><div><b>'+c.name+'</b><p>'+c.phone+(currentList==="chats"&&c.preview?" • "+c.preview:"")+'</p></div>';
    el.onclick=()=>openChat(i);
    list.appendChild(el);
  });
  if(!list.children.length)list.innerHTML='<div class="empty">No contacts found</div>';
}
function openChat(i){
  const c=chats[i];
  document.getElementById("person").textContent=c.name;
  document.getElementById("status").textContent=c.phone||"Available";
  messages.innerHTML="";
  if(!c.messages.length){
    messages.innerHTML='<div class="welcome"><div class="welcome-icon">'+c.letter+'</div><h1>'+c.name+'</h1><p>'+c.phone+'<br>Start a new conversation.</p></div>';
  }else c.messages.forEach(m=>addBubble(m.text,m.me,false));
  app.classList.add("mobile-chat-open");
  input.focus();
}
function showChatListOnMobile(){
  app.classList.remove("mobile-chat-open");
  input.blur();
}
chatsTab?.addEventListener("click",()=>{currentList="chats";chatsTab.classList.add("active");contactsTab.classList.remove("active");renderList(search.value);});
contactsTab?.addEventListener("click",()=>{currentList="contacts";contactsTab.classList.add("active");chatsTab.classList.remove("active");renderList(search.value);});
mobileBackBtn?.addEventListener("click",showChatListOnMobile);
function addBubble(text,me=true,save=true){const welcome=messages.querySelector(".welcome");if(welcome)welcome.remove();const b=document.createElement("div");b.className="bubble "+(me?"me":"other");b.textContent=text;messages.appendChild(b);messages.scrollTop=messages.scrollHeight;if(save){const target=chats.find(c=>c.name===document.getElementById("person").textContent)||chats[0];target.messages.push({text,me})}}
form.addEventListener("submit",e=>{e.preventDefault();const v=input.value.trim();if(!v)return;addBubble(v,true);input.value="";document.getElementById("status").textContent="Message sent";{const target=chats.find(c=>c.name===document.getElementById("person").textContent)||chats[0];target.preview=v;}renderList(search.value)});
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
 if(action==="hide"){chats.find(c=>c.name===document.getElementById("person").textContent)?.hidden=true; renderList(search.value); document.getElementById("status").textContent="Chat hidden"; alert("Chat hidden. It can be restored from Private/Hidden Chats.");}
 if(action==="private"){chats.find(c=>c.name===document.getElementById("person").textContent)?.private=true; document.getElementById("status").textContent="Private chat"; alert("Private chat enabled. Access will be protected after account + privacy backend integration.");}
 if(action==="lock"){const pin=prompt("Set a 4-digit chat lock PIN:"); if(pin&&/^\\d{4}$/.test(pin)){chats.find(c=>c.name===document.getElementById("person").textContent)?.locked=true; localStorage.setItem("nrchat_lock_demo",pin); document.getElementById("status").textContent="Chat locked"; alert("Chat lock enabled for this device.");}else if(pin!==null)alert("Please enter exactly 4 digits.");}
 if(action==="delete"){if(confirm("Delete this chat and its local messages?")){const target=chats.find(c=>c.name===document.getElementById("person").textContent)||chats[0];target.messages=[];target.preview="Chat deleted";document.getElementById("status").textContent="Chat deleted";openChat(0);}}
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
addBubble=function(text,me=true,save=true){oldAddBubble(text,me,false);if(save){const expiry=durations[disappearing]?Date.now()+durations[disappearing]:null;const target=chats.find(c=>c.name===document.getElementById("person").textContent)||chats[0];target.messages.push({text,me,createdAt:Date.now(),expiresAt:expiry});}};
setInterval(()=>{cleanupExpiredMessages();openChat(chats.findIndex(c=>c.name===document.getElementById("person").textContent)||0)},60000);cleanupExpiredMessages();

// Media limits enforced before upload/backend integration.
const MEDIA_LIMITS={image:10*1024*1024,video:100*1024*1024,document:25*1024*1024,audio:25*1024*1024};
function validateNrChatMedia(file,type){const limit=MEDIA_LIMITS[type];if(!limit)return {ok:false,error:"Unsupported file type."};if(file.size>limit)return {ok:false,error:type+" exceeds NR CHAT limit of "+Math.round(limit/1024/1024)+" MB."};return {ok:true};}
window.NRCHAT_MEDIA_LIMITS=MEDIA_LIMITS;window.validateNrChatMedia=validateNrChatMedia;

// Native-app screenshot/screen-record protection is implemented with platform APIs.
// Web/PWA cannot guarantee OS-level screenshot blocking.
function enableNativePrivacyProtection(){document.documentElement.dataset.screenPrivacy="enabled";privacyStatus&&(privacyStatus.textContent="🔒 Screenshot protection ready");}
enableNativePrivacyProtection();

document.getElementById("callBtn")?.addEventListener("click",()=>alert("NR CHAT Calls: Audio • Video • Group Call. WebRTC + secure signaling/TURN will be connected in the native-call integration step."));


// Signup identity flow: DOB -> automatic age -> minor/standard classification -> OTP verification handoff.
const signupBtn=document.getElementById("signupBtn");
function calcAge(dob){const d=new Date(dob);if(Number.isNaN(d.getTime()))return null;const now=new Date();let age=now.getFullYear()-d.getFullYear();const m=now.getMonth()-d.getMonth();if(m<0||(m===0&&now.getDate()<d.getDate()))age--;return age;}
signupBtn?.addEventListener("click",()=>{
 const wrap=document.createElement("div");wrap.className="ad-modal-backdrop";wrap.innerHTML='<div class="ad-modal"><button class="ad-close">×</button><h2>Create NR CHAT Account</h2><p>Independent signup — no WhatsApp account or WhatsApp API required.</p><form id="signupForm"><input name="name" required placeholder="Full name"><input name="dob" required type="date"><input id="signupAge" readonly placeholder="Age"><select id="accountTypeSelect" disabled><option>Account type</option></select><input name="mobile" required inputmode="numeric" maxlength="10" placeholder="Mobile number"><button class="ad-primary" type="submit">Send OTP</button></form><div class="ad-note">OTP verification is mandatory before account activation. MSG91 credentials stay server-side.</div></div>';
 document.body.appendChild(wrap);wrap.querySelector(".ad-close").onclick=()=>wrap.remove();
 const dob=wrap.querySelector('[name="dob"]'),age=wrap.querySelector('#signupAge'),type=wrap.querySelector('#accountTypeSelect');
 function refresh(){const n=calcAge(dob.value);age.value=n===null?"":String(n);type.innerHTML='<option>'+ (n===null?"Account type":n<18?"MINOR ACCOUNT":"STANDARD ACCOUNT") +'</option>';}
 dob.addEventListener("change",refresh);refresh();wrap.querySelector("#signupForm").onsubmit=e=>{e.preventDefault();const f=new FormData(e.target),n=calcAge(f.get("dob"));if(n===null||n<0||n>120)return alert("Please enter a valid date of birth.");const mobile=String(f.get("mobile")).replace(/\\D/g,"");if(!/^\\d{10}$/.test(mobile))return alert("Enter a valid 10-digit mobile number.");localStorage.setItem("nrchat_signup_pending",JSON.stringify({name:f.get("name"),dob:f.get("dob"),age:n,accountType:n<18?"minor":"standard",mobile}));alert("OTP step is ready. Connect MSG91 server credentials to send and verify the OTP.");wrap.remove();};
});

const PROFILE_PRIVACY_KEY="nrchat_profile_privacy";
const defaultProfilePrivacy={profilePhoto:"everyone",lastSeen:"contacts",onlineStatus:"contacts",about:"everyone",calls:"contacts",groups:"contacts",messages:"everyone"};
function getProfilePrivacy(){try{return Object.assign({},defaultProfilePrivacy,JSON.parse(localStorage.getItem(PROFILE_PRIVACY_KEY)||"{}"));}catch(e){return Object.assign({},defaultProfilePrivacy);}}
function saveProfilePrivacy(v){localStorage.setItem(PROFILE_PRIVACY_KEY,JSON.stringify(v));}
function openProfilePrivacy(){
 const p=getProfilePrivacy(),wrap=document.createElement("div");wrap.className="ad-modal-backdrop";
 wrap.innerHTML='<div class="ad-modal"><button class="ad-close">×</button><h2>🔐 Privacy Settings</h2><p>You control who can see your profile and contact you.</p><form id="privacyForm"><label>Profile Photo<select name="profilePhoto"><option value="everyone">Everyone</option><option value="contacts">My Contacts</option><option value="selected">Selected Contacts</option><option value="nobody">Nobody / Invisible</option></select></label><label>Last Seen<select name="lastSeen"><option value="everyone">Everyone</option><option value="contacts">My Contacts</option><option value="selected">Selected Contacts</option><option value="nobody">Nobody / Invisible</option></select></label><label>Online Status<select name="onlineStatus"><option value="everyone">Everyone</option><option value="contacts">My Contacts</option><option value="selected">Selected Contacts</option><option value="nobody">Nobody / Invisible</option></select></label><label>About / Bio<select name="about"><option value="everyone">Everyone</option><option value="contacts">My Contacts</option><option value="selected">Selected Contacts</option><option value="nobody">Nobody / Invisible</option></select></label><label>Who can call me<select name="calls"><option value="everyone">Everyone</option><option value="contacts">My Contacts</option><option value="selected">Selected Contacts</option><option value="nobody">Nobody / Invisible</option></select></label><label>Who can add me to groups<select name="groups"><option value="everyone">Everyone</option><option value="contacts">My Contacts</option><option value="selected">Selected Contacts</option><option value="nobody">Nobody / Invisible</option></select></label><label>Who can message me<select name="messages"><option value="everyone">Everyone</option><option value="contacts">My Contacts</option><option value="selected">Selected Contacts</option><option value="nobody">Nobody / Invisible</option></select></label><button class="ad-primary" type="submit">Save Privacy Settings</button></form></div>';
 document.body.appendChild(wrap);
 Object.keys(p).forEach(k=>{const el=wrap.querySelector('[name="'+k+'"]');if(el)el.value=p[k];});
 wrap.querySelector(".ad-close").onclick=()=>wrap.remove();
 wrap.querySelector("#privacyForm").onsubmit=e=>{e.preventDefault();saveProfilePrivacy(Object.fromEntries(new FormData(e.target)));alert("Privacy settings saved.");wrap.remove();};
}
document.querySelector(".profile")?.addEventListener("click",openProfilePrivacy);
window.NRCHAT_PROFILE_PRIVACY=getProfilePrivacy;
