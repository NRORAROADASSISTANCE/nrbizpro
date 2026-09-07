// Smart Print production rule validation. Money/points must be computed server-side.
const RULES=Object.freeze({
 distributorRegistration:{amount:2000,points:15000},
 directRetailerRegistration:{amount:1050,points:5000},
 distributorRetailer:{amount:600,distributorShare:500,platformFee:100,points:5000},
 recharge:{minimum:300,platformFee:100,points:3000},
 print:{points:10,platformRevenue:1}
});
export function validateRegistration(type,amount){
 const r=RULES[type]; if(!r) throw new Error('Unsupported registration type');
 if(amount!==r.amount) throw new Error('Invalid registration amount'); return r;
}
export function validateRecharge(amount){if(!Number.isFinite(amount)||amount<RULES.recharge.minimum)throw new Error('Minimum recharge is ₹300');return RULES.recharge;}
export function validatePrint(points){if(points!==RULES.print.points)throw new Error('A print consumes exactly 10 points');return RULES.print;}
export {RULES};
