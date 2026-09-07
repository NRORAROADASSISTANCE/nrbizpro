/* NR BizPro Smart Print — server auth contract.
   UI must never be treated as authoritative for money/points. Backend should issue IDs and sessions. */
(function(){
 window.smartPrintPartnerAuth={
  roles:['admin','distributor','retailer'],
  requiredServerChecks:['authenticated session','role authorization','unique partner ID','server-side points balance','idempotent transaction ID'],
  endpoints:{login:'/api/smart-print/auth/login',registerDistributor:'/api/smart-print/partners/distributor',registerRetailer:'/api/smart-print/partners/retailer',mapRetailer:'/api/smart-print/partners/map',wallet:'/api/smart-print/wallet',transactions:'/api/smart-print/transactions'},
  note:'Implement these routes in the production backend before enabling real-money payments or withdrawals.'
 };
})();