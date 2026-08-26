const ADMIN_EMAIL='admin@nrbizpro.in';
const ADMIN_PASSWORD='NRBizPro@2026';
const USERS_KEY='nr-bizpro-users-v1';
const SESSION='nr-bizpro-admin-session';
const read=()=>{try{return JSON.parse(localStorage.getItem(USERS_KEY)||'[]')}catch{return[]}};
const esc=v=>String(v??'').replace(/[&<>\"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\\':'&#39;'}[m]));
function login(e){e.preventDefault();const email=document.getElementById('email').value.trim().toLowerCase(),pass=document.getElementById('password').value;if(email!==ADMIN_EMAIL||pass!==ADMIN_PASSWORD){document.getElementById('error').textContent='Invalid admin credentials.';return}sessionStorage.setItem(SESSION,'1');show()}
function logout(){sessionStorage.removeItem(SESSION);location.reload()}
function show(){document.getElementById('login').classList.add('hidden');document.getElementById('panel').classList.remove('hidden');render()}
function render(){const users=read(),q=(document.getElementById('search')?.value||'').toLowerCase();document.getElementById('total').textContent=users.length;document.getElementById('active').textContent=users.filter(u=>u.status==='active').length;document.getElementById('pending').textContent=users.filter(u=>u.status==='pending').length;document.getElementById('expired').textContent=users.filter(u=>u.status==='expired').length;const rows=users.filter(u=>`${u.business} ${u.owner} ${u.email} ${u.mobile} ${u.category}`.toLowerCase().includes(q));document.getElementById('users').innerHTML=rows.length?rows.map(u=>{const s=u.status||'pending';return `<tr><td><b>${esc(u.business)}</b></td><td>${esc(u.owner)}</td><td>${esc(u.email)}<br>${esc(u.mobile)}</td><td>${esc(u.category)}</td><td><span class="pill ${s}">${esc(s)}</span></td><td>${esc(u.plan||'—')}</td><td>${u.subscriptionEnds?new Date(u.subscriptionEnds).toLocaleDateString('en-IN'):'—'}</td></tr>`}).join(''):'<tr><td colspan="7">No business accounts found.</td></tr>'}
if(sessionStorage.getItem(SESSION)==='1')show();