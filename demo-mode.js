// Public free demo: no credentials shown. Each visitor gets an isolated demo account with 3-bill limit.
(function(){
  const DEMO_PREFIX='nr-bizpro-demo-v1:';
  const DEMO_LIMIT=3;
  const DEMO_CATEGORIES=[
    'General Business','Grocery / General Store','Footwear / Chappal Shop','Fertilizer / Agriculture',
    'Garage / Service Center','Spare Parts','EV Two-Wheeler Showroom','Retail / Supermarket',
    'Restaurant / Bakery','Hardware / Building Materials','Medical / Pharmacy','Electronics / Mobile',
    'Clothing / Fashion','Furniture','Jewellery','Stationery / Book Store','Dairy / Milk Products',
    'Salon / Beauty Parlour','Printing / Xerox / Online Services','Wholesale / Distributor',
    'Professional Services','Construction / Building Materials','Other Business'
  ];

  function demoData(category){
    const now=new Date().toISOString();
    const ev=category==='EV Two-Wheeler Showroom';
    const items=ev ? [
      {id:crypto.randomUUID(),name:'Demo EV Scooter - City',barcode:'DEMO-EV-001',type:'Product',cost:72000,margin:10,marginType:'percent',sell:79200,gst:5,stock:5},
      {id:crypto.randomUUID(),name:'Demo EV Scooter - Pro',barcode:'DEMO-EV-002',type:'Product',cost:98000,margin:10,marginType:'percent',sell:107800,gst:5,stock:3},
      {id:crypto.randomUUID(),name:'Helmet & Accessories',barcode:'DEMO-ACC-001',type:'Product',cost:1200,margin:25,marginType:'percent',sell:1500,gst:18,stock:12}
    ] : [
      {id:crypto.randomUUID(),name:'Demo Product A',barcode:'DEMO-001',type:'Product',cost:100,margin:20,marginType:'percent',sell:120,gst:5,stock:25},
      {id:crypto.randomUUID(),name:'Demo Product B',barcode:'DEMO-002',type:'Product',cost:250,margin:20,marginType:'percent',sell:300,gst:18,stock:15},
      {id:crypto.randomUUID(),name:'Demo Service',barcode:'DEMO-SVC-001',type:'Service',cost:0,margin:0,marginType:'fixed',sell:500,gst:18,stock:0}
    ];
    return {items,bills:[],customers:[],settings:{name:'NR BizPro Demo Business',category,mobile:'',gst:'',address:'Demo workspace'}};
  }

  function addDemoUI(){
    const host=document.getElementById('authContent');
    if(!host || document.getElementById('demoBox')) return;
    const box=document.createElement('div');
    box.id='demoBox';
    box.className='demo-box';
    box.innerHTML=`<div class="auth-divider"><span>OR</span></div><div class="auth-title"><h2>Try Free Demo</h2><p>Explore the software before creating your business account.</p></div><label>Choose Business Type<select id="demoCategory">${DEMO_CATEGORIES.map(x=>`<option value="${x.replace(/&/g,'&amp;').replace(/"/g,'&quot;')}">${x}</option>`).join('')}</select></label><button type="button" class="secondary auth-btn" id="startDemo">Try Demo — 3 Bills Free</button><small class="demo-note">No payment or account credentials required. Demo data is separate from real accounts.</small>`;
    host.appendChild(box);
    document.getElementById('startDemo').onclick=startDemo;
  }

  function startDemo(){
    const category=document.getElementById('demoCategory')?.value||'General Business';
    const id='demo-'+crypto.randomUUID();
    currentUser={id,business:'NR BizPro Demo Business',owner:'Demo Customer',mobile:'',email:'demo-'+Date.now()+'@demo.local',category,gst:'',password:'',status:'active',plan:'demo',subscriptionEnds:new Date(Date.now()+86400000).toISOString(),pendingPlan:null,pendingAmount:0,lastPaymentId:null,isDemo:true,demoBills:0};
    state=demoData(category);
    localStorage.setItem('nr-bizpro-demo-active',id);
    localStorage.setItem(DATA_PREFIX+id,JSON.stringify(state));
    localStorage.setItem(SESSION_KEY,id);
    showApp();
    if(typeof showBusinessModules==='function') showBusinessModules(category);
  }

  function installBillLimit(){
    if(window.__demoBillLimitInstalled || typeof saveBill!=='function') return;
    const original=saveBill;
    window.saveBill=function(){
      if(currentUser?.isDemo){
        const count=state?.bills?.length||0;
        if(count>=DEMO_LIMIT){
          alert('Your free demo limit of 3 bills is completed. Create your business account to continue.');
          return;
        }
      }
      return original();
    };
    window.__demoBillLimitInstalled=true;
  }

  function patchLogout(){
    if(window.__demoLogoutPatched || typeof logout!=='function') return;
    const original=logout;
    window.logout=function(){
      localStorage.removeItem('nr-bizpro-demo-active');
      return original();
    };
    window.__demoLogoutPatched=true;
  }

  function observe(){
    addDemoUI();
    installBillLimit();
    patchLogout();
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',observe);
  else observe();
  const root=document.getElementById('authScreen')||document.body;
  new MutationObserver(observe).observe(root,{childList:true,subtree:true});
})();
