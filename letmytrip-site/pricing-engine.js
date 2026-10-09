// Shared LETMYTRIP pricing calculation helpers.
// Supplier fare is passed in by the supplier integration; this file never invents a fare.
function amount(value){const n=Number(value);return Number.isFinite(n)&&n>0?n:0;}
function markup(base,mode,value,max=0){
  const raw=mode==="PERCENT"?(base*amount(value)/100):amount(value);
  const capped=amount(max)>0?Math.min(raw,amount(max)):raw;
  return Math.round((capped+Number.EPSILON)*100)/100;
}
function calculateServicePrice(baseFare,settings={}){
  const base=amount(baseFare);
  const platformFee=amount(settings.platform_fee);
  const companyMarkup=markup(base,settings.company_markup_mode,settings.company_markup,settings.company_markup_max);
  const customerMarkup=markup(base,settings.customer_markup_mode,settings.customer_markup,settings.customer_markup_max);
  const total=Math.round((base+platformFee+companyMarkup+customerMarkup+Number.EPSILON)*100)/100;
  return {baseFare:base,platformFee,companyMarkup,customerMarkup,total,breakdown:{supplierFare:base,platformFee,companyMarkup,customerMarkup}};
}
function calculateLetmytripPrice(baseFare,platformFee=200,agentMarkup=0,customerMarkup=0){
  const b=amount(baseFare),p=amount(platformFee),a=amount(agentMarkup),c=amount(customerMarkup);
  return {baseFare:b,otherCharges:p+a+c,platformFee:p,agentMarkup:a,customerMarkup:c,total:Math.round((b+p+a+c+Number.EPSILON)*100)/100};
}
function customerDisplay(price,showOtherCharges=false){return showOtherCharges?{baseFare:price.baseFare,otherCharges:price.otherCharges,total:price.total}:{total:price.total};}
if(typeof module!=="undefined")module.exports={calculateServicePrice,calculateLetmytripPrice,customerDisplay,markup};
