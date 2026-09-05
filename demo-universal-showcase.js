// NR BizPro — Universal customer demo showcase
(function(){
  function uniqueDemoFeatures(){
    const api=window.NRBizProBusinessModules;
    if(!api?.profiles)return [];
    return [...new Set(Object.values(api.profiles).flat())];
  }
  function renderUniversalDemo(){
    if(!window.nrBizProDemoMode)return;
    const api=window.NRBizProBusinessModules;
    if(!api)return;
    const features=uniqueDemoFeatures();
    const panel=document.getElementById('industryModule');
    if(panel){
      panel.innerHTML=`<div class="panel-head"><div><p class="eyebrow">CUSTOMER DEMO</p><h2>NR BizPro Universal Modules</h2><p class="muted">Explore billing and business-management features across all supported business types.</p></div><button class="secondary" type="button" id="featureTest">Feature Test</button></div><div class="quick-grid">${features.map((x,i)=>`<button type="button" class="industry-feature" data-demo-feature="${i}"><b>✓ ${String(x).replace(/[&<>\"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[m]))}</b><span>Open demo workspace</span></button>`).join('')}</div><div id="industryWorkspace"></div>`;
      panel.querySelectorAll('[data-demo-feature]').forEach(b=>b.onclick=()=>api.openFeature(features[+b.dataset.demoFeature]));
      document.getElementById('featureTest').onclick=api.runTest;
    }
    const tab=document.getElementById('industryTab');
    if(tab){tab.textContent='All Business Modules';tab.style.display='';}
  }
  function hook(){
    const original=window.startDemo;
    if(typeof original==='function'&&!original.__universalDemo){
      const wrapped=function(){
        original();
        window.nrBizProDemoMode=true;
        setTimeout(()=>{window.NRBizProBusinessModules?.sync();setTimeout(renderUniversalDemo,50)},100);
      };
      wrapped.__universalDemo=true;
      window.startDemo=wrapped;
    }
    if(window.nrBizProDemoMode)renderUniversalDemo();
  }
  window.addEventListener('load',()=>setTimeout(hook,100));
  setInterval(hook,500);
})();
