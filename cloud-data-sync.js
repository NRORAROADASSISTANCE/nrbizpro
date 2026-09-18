// NR BizPro cloud data layer: keeps products, bills, customers, purchases, expenses and settings in the server DB.
(function(){
  'use strict';
  const originalSave=window.save;
  const originalLoadData=window.loadData;
  let syncing=false,lastUserId='',queue=Promise.resolve(),saveTimer=null;
  const key=id=>'nr-bizpro-cloud-initialized:'+id;
  const DATA_PREFIX='nr-bizpro-data-v2:';
  const PENDING_PREFIX='nr-bizpro-cloud-pending-v1:';
  const hasLocalData=s=>!!(s&&(s.items?.length||s.bills?.length||s.customers?.length||s.purchases?.length||s.expenses?.length));
  const cleanSettings=s=>{const base=s?.settings&&typeof s.settings==='object'?{...s.settings}:{};base.__nrBizProPurchases=Array.isArray(s?.purchases)?s.purchases:[];base.__nrBizProExpenses=Array.isArray(s?.expenses)?s.expenses:[];return base};
  async function getCloud(){const r=await fetch('/api/auth?action=data',{method:'GET',credentials:'include',cache:'no-store'});if(!r.ok)throw new Error('cloud_get_'+r.status);return r.json()}
  async function putCloud(s){const uid=window.currentUser?.id;const pendingKey=uid?PENDING_PREFIX+uid:'';const payload={action:'data',items:Array.isArray(s?.items)?s.items:[],bills:Array.isArray(s?.bills)?s.bills:[],customers:Array.isArray(s?.customers)?s.customers:[],settings:cleanSettings(s)};const r=await fetch('/api/auth?action=data',{method:'PUT',credentials:'include',headers:{'Content-Type':'application/json'},cache:'no-store',body:JSON.stringify(payload)});if(!r.ok)throw new Error('cloud_put_'+r.status);return r.json()}
  function queueSave(){
    const uid=window.currentUser?.id;if(!uid||syncing||!window.state)return;
    const snapshot=JSON.parse(JSON.stringify(window.state));
    try{localStorage.setItem(PENDING_PREFIX+uid,JSON.stringify(snapshot))}catch{}
    queue=queue.then(()=>putCloud(snapshot)).then(()=>{try{localStorage.removeItem(PENDING_PREFIX+uid)}catch{}}).catch(e=>console.warn('NR BizPro cloud save:',e))
  }
  const nativeSetItem=Storage.prototype.setItem;
  if(!Storage.prototype.__nrBizProCloudPatched){Storage.prototype.setItem=function(k,v){nativeSetItem.call(this,k,v);if(this===window.localStorage&&String(k).startsWith(DATA_PREFIX)&&!syncing){clearTimeout(saveTimer);saveTimer=setTimeout(queueSave,150)}};Object.defineProperty(Storage.prototype,'__nrBizProCloudPatched',{value:true,configurable:false})}
  window.NRBizProCloudQueueSave=queueSave;
  window.save=function(){if(typeof originalSave==='function')originalSave();if(!syncing)queueSave()};
  async function syncCurrentUser(){
    const u=window.currentUser;if(!u?.id||syncing||lastUserId===u.id)return;lastUserId=u.id;syncing=true;
    try{
      const pendingKey=PENDING_PREFIX+u.id;
      let pending=null;try{pending=JSON.parse(localStorage.getItem(pendingKey)||'null')}catch{}
      if(pending){await putCloud(pending);try{localStorage.removeItem(pendingKey)}catch{}}
      if(typeof originalLoadData==='function')window.state=originalLoadData(u.id);
      const local=window.state,cloud=await getCloud();if(!cloud.exists){if(hasLocalData(local))await putCloud(local)}else{const localHas=hasLocalData(local),cloudHas=!!(cloud.items?.length||cloud.bills?.length||cloud.customers?.length||cloud.settings?.__nrBizProPurchases?.length||cloud.settings?.__nrBizProExpenses?.length);if(!cloudHas&&localHas&&!localStorage.getItem(key(u.id))){await putCloud(local)}else{const cs=cloud.settings&&typeof cloud.settings==='object'?cloud.settings:{};window.state={...(local||{}),items:Array.isArray(cloud.items)?cloud.items:[],bills:Array.isArray(cloud.bills)?cloud.bills:[],customers:Array.isArray(cloud.customers)?cloud.customers:(local?.customers||[]),purchases:Array.isArray(cs.__nrBizProPurchases)?cs.__nrBizProPurchases:(local?.purchases||[]),expenses:Array.isArray(cs.__nrBizProExpenses)?cs.__nrBizProExpenses:(local?.expenses||[]),settings:{...(local?.settings||{}),...cs}};delete window.state.settings.__nrBizProPurchases;delete window.state.settings.__nrBizProExpenses;if(typeof originalSave==='function')originalSave()}}localStorage.setItem(key(u.id),'1');if(typeof window.renderItems==='function')window.renderItems();if(typeof window.renderBills==='function')window.renderBills();if(typeof window.renderCustomers==='function')window.renderCustomers();if(typeof window.updateStats==='function')window.updateStats()}catch(e){console.warn('NR BizPro cloud sync:',e)}finally{syncing=false}}
  window.NRBizProCloudSync={sync:syncCurrentUser,put:()=>putCloud(window.state),schedule:queueSave};setInterval(syncCurrentUser,1000);window.addEventListener('load',()=>setTimeout(syncCurrentUser,300));
})();
