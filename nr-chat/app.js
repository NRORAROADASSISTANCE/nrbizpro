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
