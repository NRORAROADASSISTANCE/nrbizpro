/* Customer test policy: 5 successful document/ID test pages. Passport is Premium only. */
(function(){
  const LIMIT=5;
  function remaining(){return Math.max(0,LIMIT-(window.data?.trialCopies||0));}
  window.nrCustomerTrialLimit=LIMIT;
  window.updateCustomerTrialUI=function(){
    if(!window.data)return;
    const active=typeof window.isLicensed==='function'&&window.isLicensed();
    const sub=document.getElementById('licenseSub'),note=document.getElementById('trialNote');
    if(sub)sub.textContent=active?`Valid until ${new Date(window.data.expires).toLocaleDateString('en-IN')}`:`${remaining()} test pages left`;
    if(note)note.textContent=active?'Premium: 5-Year Unlimited Printing. Passport-size photos included.':'Customer Test: 5 successful document/ID test pages. Passport-size photos are Premium only.';
  };
  const oldCanPrint=window.canPrint;
  window.canPrint=function(){
    if(!window.account)return false;
    const active=typeof window.isLicensed==='function'&&window.isLicensed();
    if(!active){
      if(window.type==='passport'){alert('Passport-size photos are Premium only. Please activate Smart Print Premium.');return false;}
      const copies=Math.max(1,+(document.getElementById('copies')?.value)||1);
      if(copies>remaining()){alert(`Customer test limit reached. Only ${remaining()} test pages remain. Premium is required for unlimited printing and passport photos.`);return false;}
    }
    return true;
  };
  const oldUpdate=window.updateLicense;
  window.updateLicense=function(){
    if(typeof oldUpdate==='function')oldUpdate();
    const active=typeof window.isLicensed==='function'&&window.isLicensed();
    const text=document.getElementById('licenseText');
    if(text&&!active)text.textContent='Customer Test';
    window.updateCustomerTrialUI();
  };
})();