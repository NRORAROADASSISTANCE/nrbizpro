// Demo mode disabled for payment/KYC review.
// Keep the application login and real account flow unchanged.
// No demo login, demo credentials, or public demo entry point is rendered.
(function(){
  try{
    localStorage.removeItem('nr-bizpro-demo-active');
  }catch(e){}

  // Load the public-website pricing polish after the landing page is created.
  const s=document.createElement('script');
  s.src='razorpay-website-review-fix.js?v=20260902-1';
  s.async=true;
  document.head.appendChild(s);
})();
