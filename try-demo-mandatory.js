// NR BizPro — polished one-time customer demo entry + isolated demo state
(function(){
  const DEMO_USER={id:'nr-bizpro-demo',business:'NR BizPro Demo Showroom',owner:'Demo Owner',mobile:'9000000000',email:'demo@nrbizpro.in',category:'Universal Demo',gst:'',password:'',status:'active',plan:'demo',subscriptionEnds:'2099-12-31T23:59:59.000Z'};
  function demoState(){return {items:[
    {id:'demo-item-1',name:'Demo Product A',barcode:'890000000001',type:'Product',cost:80,margin:25,marginType:'percent',sell:100,gst:5,stock:25,businessCategory:'Universal Demo'},
    {id:'demo-item-2',name:'Demo Product B',barcode:'890000000002',type:'Product',cost:150,margin:20,marginType:'percent',sell:180,gst:12,stock:15,businessCategory:'Universal Demo'},
    {id:'demo-item-3',name:'Demo Service',barcode:'',type:'Service',cost:0,margin:0,marginType:'fixed',sell:250,gst:18,stock:0,businessCategory:'Universal Demo'}
  ],bills:[],customers:[],settings:{name:'NR BizPro Demo Showroom',category:'Universal Demo',businessCategory:'Universal Demo',mobile:'9000000000',gst:'',address:'Demo Business Address, Telangana'}}}
  async function startDemo(){
    if(window.nrBizProDemoMode)return;
    try{
      const r=await fetch('/api/auth?action=demo-start',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'include',body:JSON.stringify({action:'demo-start'})});
      const d=await r.json();if(!r.ok)throw Error(d.error||'Demo could not be started.');
      window.currentUser={...DEMO_USER,...(d.user||{}),category:'Universal Demo',plan:'demo',status:'active'};
      window.nrBizProDemoMode=true;
      window.state=demoState();
      try{localStorage.removeItem('nrBizProBusinessType');localStorage.removeItem('nrBizProCategory')}catch(e){}
    }catch(e){alert(e.message);return}
    document.getElementById('publicLanding')?.remove();
    document.getElementById('authScreen')?.classList.add('hidden');
    document.getElementById('app')?.classList.remove('hidden');
    if(typeof window.showApp==='function')window.showApp();
    window.dispatchEvent(new CustomEvent('demoStarted'));
    setTimeout(()=>{
      try{
        window.currentUser={...DEMO_USER,...window.currentUser,category:'Universal Demo',plan:'demo',status:'active'};
        window.state=window.state||demoState();
        window.state.items=window.state.items?.length?window.state.items:demoState().items;
        window.NRBizProBusinessModules?.sync?.();
        window.renderItems?.();
        window.updateStats?.();
        window.renderUniversalDemo?.();
        window.NRBizProBusinessModules?.sync?.();
      }catch(e){}
    },300);
  }
  function addTryDemo(){const landing=document.getElementById('publicLanding');if(!landing)return false;if(document.getElementById('plTryDemo'))return true;const actions=landing.querySelector('.pl-actions');if(!actions)return false;const b=document.createElement('button');b.id='plTryDemo';b.className='pl-primary';b.type='button';b.textContent='Try Demo';b.onclick=startDemo;actions.insertBefore(b,actions.firstChild);return true}
  window.startDemo=startDemo;
  function boot(){let attempts=0;const timer=setInterval(()=>{attempts++;if(addTryDemo()||attempts>100)clearInterval(timer)},100);addTryDemo()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,50),{once:true});else setTimeout(boot,50);
})();
