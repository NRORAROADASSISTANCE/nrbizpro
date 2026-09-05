// NR BizPro — Mandatory public Try Demo entry
(function(){
  const DEMO_USER={id:'nr-bizpro-demo',business:'NR BizPro Demo Showroom',owner:'Demo Owner',mobile:'9000000000',email:'demo@nrbizpro.in',category:'EV Two-Wheeler Showroom',gst:'36ABCDE1234F1Z5',password:'',status:'active',plan:'demo',subscriptionEnds:'2099-12-31T23:59:59.000Z'};
  function demoState(){return {items:[{id:'demo-ev-1',name:'NR Demo EV Scooter',barcode:'DEMO-EV-001',type:'Product',cost:45000,margin:10,marginType:'percent',sell:49500,gst:5,stock:10,businessCategory:'EV Two-Wheeler Showroom'}],bills:[],customers:[],settings:{name:'NR BizPro Demo Showroom',category:'EV Two-Wheeler Showroom',mobile:'9000000000',gst:'36ABCDE1234F1Z5',address:'Demo Business Address, Telangana'}}}
  function startDemo(){
    window.currentUser={...DEMO_USER};
    window.state=demoState();
    window.nrBizProDemoMode=true;
    localStorage.removeItem('nr-bizpro-session-v1');
    document.getElementById('publicLanding')?.remove();
    document.getElementById('authScreen')?.classList.add('hidden');
    if(typeof window.showApp==='function')window.showApp();
    setTimeout(()=>alert('Demo Mode: no real payment, registration or business account is created.'),100);
  }
  function addTryDemo(){
    const landing=document.getElementById('publicLanding');
    if(!landing||document.getElementById('plTryDemo'))return;
    const actions=landing.querySelector('.pl-actions');
    if(!actions)return;
    const b=document.createElement('button');
    b.id='plTryDemo'; b.className='pl-primary'; b.type='button'; b.textContent='Try Demo';
    b.onclick=startDemo;
    actions.insertBefore(b,actions.firstChild);
  }
  window.startDemo=startDemo;
  const timer=setInterval(()=>{if(document.getElementById('publicLanding')){addTryDemo();clearInterval(timer)}},100);
  window.addEventListener('load',()=>setTimeout(addTryDemo,200));
})();
