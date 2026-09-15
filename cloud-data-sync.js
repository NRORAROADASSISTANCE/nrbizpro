// NR BizPro cloud data layer: keeps products, bills, customers and settings in the server DB.
(function(){
  'use strict';
  const originalSave=window.save;
  const originalLoadData=window.loadData;
  let syncing=false;
  let lastUserId='';
  let queue=Promise.resolve();
  const key=id=>'nr-bizpro-cloud-initialized:'+id;
  const hasLocalData=s=>!!(s&&(s.items?.length||s.bills?.length||s.customers?.length));

  async function getCloud(){
    const r=await fetch('/api/data',{method:'GET',credentials:'include',cache:'no-store'});
    if(!r.ok) throw new Error('cloud_get_'+r.status);
    return r.json();
  }

  async function putCloud(s){
    const payload={items:Array.isArray(s?.items)?s.items:[],bills:Array.isArray(s?.bills)?s.bills:[],customers:Array.isArray(s?.customers)?s.customers:[],settings:s?.settings||{}};
    const r=await fetch('/api/data',{method:'PUT',credentials:'include',headers:{'Content-Type':'application/json'},cache:'no-store',body:JSON.stringify(payload)});
    if(!r.ok) throw new Error('cloud_put_'+r.status);
    return r.json();
  }

  function queueSave(){
    const uid=window.currentUser?.id;
    if(!uid||syncing||!window.state)return;
    const snapshot=JSON.parse(JSON.stringify(window.state));
    queue=queue.then(()=>putCloud(snapshot)).catch(e=>console.warn('NR BizPro cloud save:',e));
  }

  window.save=function(){
    if(typeof originalSave==='function') originalSave();
    if(!syncing) queueSave();
  };

  async function syncCurrentUser(){
    const u=window.currentUser;
    if(!u?.id || syncing || lastUserId===u.id) return;
    lastUserId=u.id;
    syncing=true;
    try{
      if(typeof originalLoadData==='function') window.state=originalLoadData(u.id);
      const local=window.state;
      const cloud=await getCloud();
      if(!cloud.exists){
        if(hasLocalData(local)) await putCloud(local);
      }else{
        const localHas=hasLocalData(local);
        const cloudHas=!!(cloud.items?.length||cloud.bills?.length||cloud.customers?.length);
        if(!cloudHas && localHas && !localStorage.getItem(key(u.id))){
          await putCloud(local);
        }else{
          window.state={
            ...(local||{}),
            items:Array.isArray(cloud.items)?cloud.items:[],
            bills:Array.isArray(cloud.bills)?cloud.bills:[],
            customers:Array.isArray(cloud.customers)?cloud.customers:(local?.customers||[]),
            settings:{...(local?.settings||{}),...(cloud.settings||{})}
          };
          if(typeof originalSave==='function') originalSave();
        }
      }
      localStorage.setItem(key(u.id),'1');
      if(typeof window.renderItems==='function') window.renderItems();
      if(typeof window.renderBills==='function') window.renderBills();
      if(typeof window.renderCustomers==='function') window.renderCustomers();
      if(typeof window.updateStats==='function') window.updateStats();
    }catch(e){
      console.warn('NR BizPro cloud sync:',e);
    }finally{
      syncing=false;
    }
  }

  window.NRBizProCloudSync={sync:syncCurrentUser,put:()=>putCloud(window.state)};
  setInterval(syncCurrentUser,1000);
  window.addEventListener('load',()=>setTimeout(syncCurrentUser,300));
})();
