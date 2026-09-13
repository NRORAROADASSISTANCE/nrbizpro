// NR BizPro — demo browser/device identifier. Non-invasive: only supplies a stable client id to demo APIs.
(function(){
  'use strict';
  const KEY='nr_bizpro_demo_device_id_v1';
  function id(){
    try{let v=localStorage.getItem(KEY);if(!v){v=(crypto.randomUUID?crypto.randomUUID():Date.now()+'-'+Math.random().toString(36).slice(2));localStorage.setItem(KEY,v)}return v}catch(e){return 'device-'+navigator.userAgent.length+'-'+screen.width+'x'+screen.height}
  }
  window.NRBizProDemoDeviceId=id();
  const originalFetch=window.fetch;
  window.fetch=function(input,init){
    try{
      const url=typeof input==='string'?input:(input&&input.url)||'';
      if(url.includes('/api/auth') && (url.includes('demo-start')||url.includes('demo-print'))){
        const opts=init?Object.assign({},init):{};
        const headers=new Headers(opts.headers||{});headers.set('X-NR-Demo-Device',window.NRBizProDemoDeviceId);opts.headers=headers;
        return originalFetch.call(this,input,opts);
      }
    }catch(e){}
    return originalFetch.call(this,input,init);
  };
})();
