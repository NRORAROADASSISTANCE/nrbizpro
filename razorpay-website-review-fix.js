// Public website review polish for payment/KYC reviewers.
// Adds explicit pricing to the public landing page without changing the login flow.
(function(){
  function apply(){
    const price=document.querySelector('#publicLanding .pl-price');
    if(!price)return;
    const strong=price.querySelector('strong');
    if(strong)strong.textContent='₹2,500 registration';
    const old=price.querySelector('.pl-price-detail');
    if(!old){
      const detail=document.createElement('small');
      detail.className='pl-price-detail';
      detail.textContent='3 Years ₹3,500 • Lifetime ₹6,000';
      detail.style.display='block';
      detail.style.marginTop='6px';
      detail.style.color='#607089';
      price.insertBefore(detail,price.querySelector('button'));
    }
  }
  const observer=new MutationObserver(apply);
  if(document.body)observer.observe(document.body,{childList:true,subtree:true});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply);else apply();
})();
