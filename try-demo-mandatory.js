// NR BizPro — Mandatory public Try Demo entry
(function(){
  const DEMO_USER={id:'nr-bizpro-demo',business:'NR BizPro Demo Showroom',owner:'Demo Owner',mobile:'9000000000',email:'demo@nrbizpro.in',category:'EV Two-Wheeler Showroom',gst:'36ABCDE1234F1Z5',password:'',status:'active',plan:'demo',subscriptionEnds:'2099-12-31T23:59:59.000Z'};
  function demoState(){return {items:[{id:'demo-ev-1',name:'NR Demo EV Scooter',barcode:'DEMO-EV-001',type:'Product',cost:45000,margin:10,marginType:'percent',sell:49500,gst:5,stock:10,businessCategory:'EV Two-Wheeler Showroom'}],bills:[],customers:[],settings:{name:'NR BizPro Demo Showroom',category:'EV Two-Wheeler Showroom',businessCategory:'EV Two-Wheeler Showroom',mobile:'9000000000',gst:'36ABCDE1234F1Z5',address:'Demo Business Address, Telangana'}}}
  function startDemo(){
    window.currentUser={...DEMO_USER}; window.state=demoState(); window.nrBizProDemoMode=true;
    try{localStorage.setItem('nr-bizpro-demo-category','EV Two-Wheeler Showroom')}catch(e){}
    localStorage.removeItem('nr-bizpro-session-v1');
    document.getElementById('publicLanding')?.remove(); document.getElementById('authScreen')?.classList.add('hidden');
    if(typeof window.showApp==='function')window.showApp();
    setTimeout(()=>{try{window.NRBizProDemoCategory?.restore?.()}catch(e){} try{window.NRBizProBusinessModules?.sync?.();window.renderItems?.();window.updateStats?.()}catch(e){}},150);
  }
  function addTryDemo(){
    const landing=document.getElementById('publicLanding'); if(!landing)return false;
    if(document.getElementById('plTryDemo'))return true;
    const actions=landing.querySelector('.pl-actions'); if(!actions)return false;
    const b=document.createElement('button'); b.id='plTryDemo'; b.className='pl-primary'; b.type='button'; b.textContent='Try Demo'; b.onclick=startDemo; actions.insertBefore(b,actions.firstChild); return true;
  }
  window.startDemo=startDemo;
  function boot(){let attempts=0;const timer=setInterval(()=>{attempts++;if(addTryDemo()||attempts>100)clearInterval(timer)},100);addTryDemo()}
  window.addEventListener('load',()=>setTimeout(boot,50)); window.addEventListener('DOMContentLoaded',()=>setTimeout(boot,50));
})();
