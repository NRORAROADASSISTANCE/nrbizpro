// NR BizPro — Mandatory public Try Demo entry
(function(){
  const DEMO_USER={id:'nr-bizpro-demo',business:'NR BizPro Demo Showroom',owner:'Demo Owner',mobile:'9000000000',email:'demo@nrbizpro.in',category:'General Business',gst:'',password:'',status:'active',plan:'demo',subscriptionEnds:'2099-12-31T23:59:59.000Z'};
  function demoState(){return {items:[],bills:[],customers:[],settings:{name:'NR BizPro Demo Showroom',category:'General Business',businessCategory:'General Business',mobile:'9000000000',gst:'',address:'Demo Business Address, Telangana'}}}
  function startDemo(){
    window.currentUser={...DEMO_USER}; window.state=demoState(); window.nrBizProDemoMode=true;
    try{localStorage.setItem('nr-bizpro-demo-category','General Business')}catch(e){}
    localStorage.removeItem('nr-bizpro-session-v1');
    document.getElementById('publicLanding')?.remove(); document.getElementById('authScreen')?.classList.add('hidden');
    if(typeof window.showApp==='function')window.showApp();
    setTimeout(()=>{try{window.NRBizProDemoCategory?.restore?.()}catch(e){} try{window.NRBizProBusinessModules?.sync?.();window.renderItems?.();window.updateStats?.();window.renderUniversalDemo?.()}catch(e){}},150);
  }
  function addTryDemo(){
    const landing=document.getElementById('publicLanding'); if(!landing)return false;
    if(document.getElementById('plTryDemo'))return true;
    const actions=landing.querySelector('.pl-actions'); if(!actions)return false;
    const b=document.createElement('button'); b.id='plTryDemo'; b.className='pl-primary'; b.type='button'; b.textContent='Try Demo'; b.onclick=startDemo; actions.insertBefore(b,actions.firstChild); return true;
  }
  window.startDemo=startDemo;
  function boot(){
    let attempts=0;
    const timer=setInterval(()=>{attempts++;if(addTryDemo()||attempts>100)clearInterval(timer)},100);
    addTryDemo();
  }
  // This script is loaded dynamically after index.html's load event, so do not
  // rely on window.load or DOMContentLoaded firing again.
  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,50),{once:true});
  }else{
    setTimeout(boot,50);
  }
})();
