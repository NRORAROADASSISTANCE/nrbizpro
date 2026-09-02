// Demo mode disabled for payment/KYC review.
// Keep the application login and real account flow unchanged.
// No demo login, demo credentials, or public demo entry point is rendered.
(function(){
  try{
    localStorage.removeItem('nr-bizpro-demo-active');
  }catch(e){}
})();
