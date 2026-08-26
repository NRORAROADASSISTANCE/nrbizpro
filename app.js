const USERS_KEY='nr-bizpro-users-v1';
const SESSION_KEY='nr-bizpro-session-v1';
const DATA_PREFIX='nr-bizpro-data-v2:';
const PLAN_MONTHLY=199;
const PLAN_YEARLY=1999;
let currentUser=null;
let state=null;

const money=n=>new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:2}).format(Number(n)||0);
const esc=v=>String(v??'').replace(/[&<>\"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\\':'&#39;'}[m]));
const readUsers=()=>JSON.parse(localStorage.getItem(USERS_KEY)||'[]');
const writeUsers=u=>localStorage.setItem(USERS_KEY,JSON.stringify(u));
const save=()=>{if(currentUser&&state)localStorage.setItem(DATA_PREFIX+currentUser.id,JSON.stringify(state));};
const loadData=id=>JSON.parse(localStorage.getItem(DATA_PREFIX+id)||'null')||{items:[],bills:[],settings:{name:'Your Business',category:'General Business',mobile:'',gst:'',address:''}};
const getSession=()=>localStorage.getItem(SESSION_KEY);

function renderAuth(mode='login',message=''){
  const el=document.getElementById('authContent');
  if(mode==='login') el.innerHTML=`<div class="auth-title"><h1>Welcome back</h1><p>Login to your NR BizPro business account.</p></div>${message?`<div class="notice">${esc(message)}</div>`:''}<form onsubmit="login(event)"><label>Email or Mobile<input id="loginId" required autocomplete="username" placeholder="you@example.com"></label><label>Password<input id="loginPassword" required type="password" autocomplete="current-password" placeholder="••••••••"></label><button class="primary auth-btn">Login</button></form><p class="auth-switch">New business? <button onclick="renderAuth('signup')">Create account</button></p>`;
  if(mode==='signup') el.innerHTML=`<div class="auth-title"><h1>Create your business account</h1><p>Sign up first. Billing activates only after subscription payment.</p></div>${message?`<div class="notice">${esc(message)}</div>`:''}<form onsubmit="signup(event)"><div class="auth-grid"><label>Business Name<input id="suBusiness" required placeholder="ABC Traders"></label><label>Owner Name<input id="suOwner" required placeholder="Owner name"></label><label>Mobile<input id="suMobile" required inputmode="tel" placeholder="10 digit mobile"></label><label>Email<input id="suEmail" required type="email" placeholder="you@example.com"></label><label>Business Category<input id="suCategory" required placeholder="Garage / Retail / Service..."></label><label>GSTIN <span>(optional)</span><input id="suGst" placeholder="Optional"></label></div><label>Password<input id="suPassword" required minlength="6" type="password" placeholder="Minimum 6 characters"></label><button class="primary auth-btn">Continue to Plans</button></form><p class="auth-switch">Already registered? <button onclick="renderAuth('login')">Login</button></p>`;
  if(mode==='plans') el.innerHTML=`<div class="auth-title"><h1>Choose your plan</h1><p>Subscription is paid to NR BizPro. Your customers' payments are never collected by this software.</p></div><div class="plans"><button class="plan" onclick="startSubscription('monthly')"><b>Monthly</b><strong>${money(PLAN_MONTHLY)}</strong><span>30 days billing access</span></button><button class="plan featured" onclick="startSubscription('yearly')"><b>Yearly</b><strong>${money(PLAN_YEARLY)}</strong><span>12 months billing access</span><em>Best value</em></button></div>${message?`<div class="notice">${esc(message)}</div>`:''}<p class="small-note">Payments are securely processed by Razorpay. Billing access is activated only after payment signature verification.</p>`;
  if(mode==='payment') el.innerHTML=`<div class="auth-title"><h1>Subscription payment</h1><p>Selected plan: <b>${currentUser.pendingPlan==='yearly'?'Yearly':'Monthly'}</b> — <b>${money(currentUser.pendingAmount)}</b></p></div><div class="payment-box"><div class="fake-card"><span>NR BizPro Subscription</span><strong>${money(currentUser.pendingAmount)}</strong><small>Secure checkout by Razorpay</small></div><button class="primary auth-btn" onclick="openRazorpayCheckout()">Pay with Razorpay</button><button class="secondary auth-btn" onclick="renderAuth('plans')">Back to Plans</button></div><p class="small-note">You will complete payment on Razorpay Checkout. NR BizPro never collects your business customers' payments.</p>`;
}

function signup(e){
  e.preventDefault();
  const business=document.getElementById('suBusiness').value.trim(),owner=document.getElementById('suOwner').value.trim(),mobile=document.getElementById('suMobile').value.trim(),email=document.getElementById('suEmail').value.trim().toLowerCase(),category=document.getElementById('suCategory').value.trim(),gst=document.getElementById('suGst').value.trim(),password=document.getElementById('suPassword').value;
  const users=readUsers();
  if(users.some(u=>u.email===email||u.mobile===mobile)){renderAuth('login','An account already exists with this email or mobile.');return;}
  currentUser={id:crypto.randomUUID(),business,owner,mobile,email,category,gst,password,status:'pending',plan:null,subscriptionEnds:null,pendingPlan:null,pendingAmount:0,lastPaymentId:null};
  users.push(currentUser);writeUsers(users);renderAuth('plans');
}

function startSubscription(plan){
  if(!currentUser)return;
  currentUser.pendingPlan=plan;currentUser.pendingAmount=plan==='yearly'?PLAN_YEARLY:PLAN_MONTHLY;
  persistUser();renderAuth('payment');
}

async function openRazorpayCheckout(){
  if(!currentUser?.pendingPlan)return;
  if(typeof Razorpay==='undefined'){alert('Razorpay Checkout did not load. Please refresh and try again.');return;}
  const btn=document.querySelector('.auth-btn');if(btn){btn.disabled=true;btn.textContent='Opening secure payment...';}
  try{
    const orderRes=await fetch('/api/create-order',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({plan:currentUser.pendingPlan,businessName:currentUser.business,email:currentUser.email,mobile:currentUser.mobile})});
    const order=await orderRes.json();
    if(!orderRes.ok)throw new Error(order.error||'Could not create payment order.');
    const options={key:order.keyId,amount:order.amount,currency:order.currency,name:'NR BizPro',description:`${currentUser.pendingPlan==='yearly'?'Yearly':'Monthly'} Billing Software`,order_id:order.orderId,prefill:{name:currentUser.owner,email:currentUser.email,contact:currentUser.mobile},notes:{business_id:currentUser.id,plan:currentUser.pendingPlan},theme:{color:'#172033'},modal:{ondismiss:()=>{if(btn){btn.disabled=false;btn.textContent='Pay with Razorpay';}}},handler:async function(response){await verifyRazorpayPayment(response);}};
    const rzp=new Razorpay(options);
    rzp.on('payment.failed',function(response){alert(response.error?.description||'Payment failed. Please try again.');if(btn){btn.disabled=false;btn.textContent='Pay with Razorpay';}});
    rzp.open();
  }catch(error){alert(error.message||'Unable to start payment.');if(btn){btn.disabled=false;btn.textContent='Pay with Razorpay';}}
}

async function verifyRazorpayPayment(response){
  try{
    const res=await fetch('/api/verify-payment',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(response)});
    const data=await res.json();
    if(!res.ok||!data.verified)throw new Error(data.error||'Payment verification failed.');
    activateAfterVerifiedPayment(data.paymentId);
  }catch(error){alert(error.message||'Payment verification failed. Your account was not activated.');}
}

function activateAfterVerifiedPayment(paymentId){
  const days=currentUser.pendingPlan==='yearly'?365:30;
  const now=new Date();
  const base=currentUser.status==='active'&&currentUser.subscriptionEnds&&new Date(currentUser.subscriptionEnds)>now?new Date(currentUser.subscriptionEnds):now;
  base.setDate(base.getDate()+days);
  currentUser.status='active';currentUser.plan=currentUser.pendingPlan;currentUser.subscriptionEnds=base.toISOString();currentUser.pendingPlan=null;currentUser.pendingAmount=0;currentUser.lastPaymentId=paymentId;persistUser();localStorage.setItem(SESSION_KEY,currentUser.id);state=loadData(currentUser.id);state.settings.name=currentUser.business;state.settings.category=currentUser.category;state.settings.mobile=currentUser.mobile;state.settings.gst=currentUser.gst;save();showApp();
}

function persistUser(){const users=readUsers().map(u=>u.id===currentUser.id?currentUser:u);writeUsers(users);}
function login(e){
  e.preventDefault();const id=document.getElementById('loginId').value.trim().toLowerCase(),password=document.getElementById('loginPassword').value;const user=readUsers().find(u=>(u.email===id||u.mobile===id)&&u.password===password);
  if(!user){renderAuth('login','Invalid login details.');return;}
  currentUser=user;
  if(user.status==='active'&&user.subscriptionEnds&&new Date(user.subscriptionEnds)<=new Date()){currentUser.status='expired';persistUser();}
  if(currentUser.status==='pending'||currentUser.status==='expired'){renderAuth('plans',currentUser.status==='expired'?'Your subscription has expired. Renew to continue billing.':'Your account is created. Choose a subscription to activate billing.');return;}
  localStorage.setItem(SESSION_KEY,currentUser.id);state=loadData(user.id);showApp();
}
function logout(){localStorage.removeItem(SESSION_KEY);currentUser=null;state=null;document.getElementById('app').classList.add('hidden');document.getElementById('authScreen').classList.remove('hidden');renderAuth('login');}
function checkSession(){const id=getSession();if(!id){renderAuth('login');return}const user=readUsers().find(u=>u.id===id);if(!user){logout();return}currentUser=user;if(user.status!=='active'||!user.subscriptionEnds||new Date(user.subscriptionEnds)<=new Date()){currentUser.status='expired';persistUser();localStorage.removeItem(SESSION_KEY);renderAuth('plans','Subscription expired. Renew to restore billing access.');return}state=loadData(user.id);showApp();}
function showApp(){document.getElementById('authScreen').classList.add('hidden');document.getElementById('app').classList.remove('hidden');const days=Math.max(0,Math.ceil((new Date(currentUser.subscriptionEnds)-new Date())/86400000));document.getElementById('accountStatus').textContent=`Active • ${days} days left`;document.getElementById('subscriptionStat').textContent=currentUser.plan==='yearly'?'Yearly':'Monthly';loadSettings();renderItems();renderBills();updateStats();}

function showTab(id){document.querySelectorAll('.tab-panel').forEach(x=>x.classList.toggle('active',x.id===id));document.querySelectorAll('.tab').forEach(x=>x.classList.toggle('active',x.dataset.tab===id));if(id==='items')renderItems();if(id==='bills')renderBills();}
document.querySelectorAll('.tab').forEach(b=>b.onclick=()=>showTab(b.dataset.tab));
function openModal(title,body){document.getElementById('modalTitle').textContent=title;document.getElementById('modalBody').innerHTML=body;document.getElementById('modal').classList.remove('hidden')}
function closeModal(){document.getElementById('modal').classList.add('hidden')}
function openItemModal(){openModal('Add Product / Service',`<div class="modal-grid"><label class="field">Item Name<input id="mName" placeholder="e.g. General Service"></label><label class="field">Type<select id="mType"><option>Product</option><option>Service</option></select></label><label class="field">Cost Price<input id="mCost" type="number" min="0" value="0"></label><label class="field">Margin Type<select id="mMarginType"><option value="percent">Percentage</option><option value="fixed">Fixed Amount</option></select></label><label class="field">Margin<input id="mMargin" type="number" min="0" value="0"></label><label class="field">GST %<input id="mGst" type="number" min="0" value="0"></label><label class="field wide">Selling Price <input id="mSell" type="number" min="0" value="0"></label></div><div class="modal-actions"><button class="secondary" onclick="closeModal()">Cancel</button><button class="primary" onclick="addItem()">Save Item</button></div>`);['mCost','mMargin','mMarginType'].forEach(id=>document.getElementById(id).addEventListener('input',calcSell));calcSell()}
function calcSell(){const c=+document.getElementById('mCost').value||0,m=+document.getElementById('mMargin').value||0,t=document.getElementById('mMarginType').value;document.getElementById('mSell').value=(c+(t==='percent'?c*m/100:m)).toFixed(2)}
function addItem(){const name=document.getElementById('mName').value.trim();if(!name)return alert('Enter item name');const cost=+document.getElementById('mCost').value||0,margin=+document.getElementById('mMargin').value||0,type=document.getElementById('mMarginType').value,sell=+(document.getElementById('mSell').value||0);state.items.push({id:crypto.randomUUID(),name,type:document.getElementById('mType').value,cost,margin,marginType:type,sell,gst:+document.getElementById('mGst').value||0});save();closeModal();renderItems();updateStats()}
function renderItems(){const tb=document.getElementById('itemTable');if(!state.items.length){tb.innerHTML='<tr><td colspan="6" class="empty">No products or services yet. Add your first item.</td></tr>';return}tb.innerHTML=state.items.map(i=>`<tr><td><b>${esc(i.name)}</b></td><td>${i.type}</td><td>${money(i.cost)}</td><td>${i.margin}${i.marginType==='percent'?'%':' fixed'}</td><td><b>${money(i.sell)}</b></td><td><button class="secondary" onclick="deleteItem('${i.id}')">Delete</button></td></tr>`).join('')}
function deleteItem(id){state.items=state.items.filter(i=>i.id!==id);save();renderItems();updateStats()}
function openBillModal(){if(!state.items.length){alert('Add at least one product/service first.');showTab('items');return}openModal('Create New Bill',`<div class="modal-grid"><label class="field">Customer Name<input id="bCustomer" placeholder="Customer name"></label><label class="field">Customer Mobile<input id="bMobile" placeholder="Optional"></label><label class="field wide">Select Item<select id="bItem">${state.items.map(i=>`<option value="${i.id}">${esc(i.name)} — ${money(i.sell)}</option>`).join('')}</select></label><label class="field">Quantity<input id="bQty" type="number" min="1" value="1"></label><label class="field">Discount<input id="bDiscount" type="number" min="0" value="0"></label></div><div class="bill-lines"><div class="bill-line"><b>Item</b><b>Qty</b><b>Amount</b><span></span></div><div id="billPreview"></div></div><div class="bill-total">Total: <span id="bTotal" style="margin-left:8px">₹0</span></div><div class="modal-actions"><button class="secondary" onclick="closeModal()">Cancel</button><button class="primary" onclick="saveBill()">Generate Bill</button></div>`);['bItem','bQty','bDiscount'].forEach(id=>document.getElementById(id).addEventListener('input',updateBillPreview));updateBillPreview()}
function updateBillPreview(){const item=state.items.find(i=>i.id===document.getElementById('bItem').value),qty=Math.max(1,+document.getElementById('bQty').value||1),discount=Math.max(0,+document.getElementById('bDiscount').value||0),subtotal=(item?.sell||0)*qty,total=Math.max(0,subtotal-discount);document.getElementById('billPreview').innerHTML=item?`<div class="bill-line"><span>${esc(item.name)}</span><span>${qty}</span><span>${money(subtotal)}</span><span></span></div>`:'';document.getElementById('bTotal').textContent=money(total)}
function saveBill(){const item=state.items.find(i=>i.id===document.getElementById('bItem').value),qty=Math.max(1,+document.getElementById('bQty').value||1),discount=Math.max(0,+document.getElementById('bDiscount').value||0),total=Math.max(0,item.sell*qty-discount),no=`INV-${String(state.bills.length+1).padStart(4,'0')}`;state.bills.unshift({id:crypto.randomUUID(),invoice:no,date:new Date().toISOString(),customer:document.getElementById('bCustomer').value.trim()||'Walk-in Customer',mobile:document.getElementById('bMobile').value.trim(),items:[{name:item.name,qty,price:item.sell}],discount,total});save();closeModal();renderBills();updateStats();showTab('bills')}
function renderBills(){const q=(document.getElementById('billSearch')?.value||'').toLowerCase(),bills=state.bills.filter(b=>`${b.invoice} ${b.customer}`.toLowerCase().includes(q)),tb=document.getElementById('billTable');if(!bills.length){tb.innerHTML='<tr><td colspan="6" class="empty">No bills found.</td></tr>';return}tb.innerHTML=bills.map(b=>`<tr><td><b>${b.invoice}</b></td><td>${new Date(b.date).toLocaleDateString('en-IN')}</td><td>${esc(b.customer)}</td><td>${b.items.length}</td><td><b>${money(b.total)}</b></td><td><button class="secondary" onclick="printBill('${b.id}')">Print</button></td></tr>`).join('')}
function printBill(id){const b=state.bills.find(x=>x.id===id),s=state.settings,rows=b.items.map(i=>`<tr><td>${esc(i.name)}</td><td>${i.qty}</td><td>${money(i.price)}</td><td>${money(i.qty*i.price)}</td></tr>`).join(''),w=window.open('','_blank');w.document.write(`<html><head><title>${b.invoice}</title><style>body{font-family:Arial;padding:30px;color:#111}h1{margin:0 0 4px}table{width:100%;border-collapse:collapse;margin-top:25px}th,td{border-bottom:1px solid #ddd;padding:10px;text-align:left}.total{text-align:right;font-size:20px;font-weight:bold;margin-top:20px}</style></head><body><h1>${esc(s.name)}</h1><div>${esc(s.address||'')}</div><div>${esc(s.mobile||'')}</div><div>${esc(s.gst||'')}</div><hr><h2>Invoice ${b.invoice}</h2><div>Customer: ${esc(b.customer)}</div><table><tr><th>Item</th><th>Qty</th><th>Price</th><th>Amount</th></tr>${rows}</table><div class="total">Total: ${money(b.total)}</div><script>window.print()<\/script></body></html>`);w.document.close()}
function saveSettings(){state.settings={name:document.getElementById('businessName').value.trim()||'Your Business',category:document.getElementById('businessCategory').value.trim(),mobile:document.getElementById('businessMobile').value.trim(),gst:document.getElementById('businessGst').value.trim(),address:document.getElementById('businessAddress').value.trim()};currentUser.business=state.settings.name;currentUser.category=state.settings.category;currentUser.mobile=state.settings.mobile;currentUser.gst=state.settings.gst;persistUser();save();alert('Business settings saved.')}
function updateStats(){document.getElementById('billCount').textContent=state.bills.length;document.getElementById('itemCount').textContent=state.items.length;const d=new Date().toDateString();document.getElementById('todaySales').textContent=money(state.bills.filter(b=>new Date(b.date).toDateString()===d).reduce((a,b)=>a+b.total,0))}
function loadSettings(){document.getElementById('businessName').value=state.settings.name;document.getElementById('businessCategory').value=state.settings.category;document.getElementById('businessMobile').value=state.settings.mobile;document.getElementById('businessGst').value=state.settings.gst;document.getElementById('businessAddress').value=state.settings.address}

checkSession();
