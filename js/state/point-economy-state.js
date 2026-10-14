import {pointEconomyConfig as config} from '../../data/point-economy.js';

export function createPointEconomyState(balance=0,time=0,sequence=0,legacyClaimed=[]){
 return {openingBalance:balance,openingAt:time,studyStartSequence:sequence,legacyClaimed:[...new Set(legacyClaimed)],studyClaims:[],studyClaimedIds:[],studyUnidentifiedCount:0,studyCount:0,
  support:{used:false,grantedAt:null,amount:0,budget:0,remaining:0,factors:[]},sequence:0,totals:{legacy:0,study:0,support:0,spent:0},ledger:[]};
}
export const ledgerBalance=p=>p.openingBalance+p.totals.legacy+p.totals.study+p.totals.support-p.totals.spent;
// Imported balances are authoritative. Carry is not a reward or new points;
// it also lets an explicitly funded test fixture start a new accounting period.
export function recordPointChange(state,type,amount,id,sourceId=''){
 const p=state.pointEconomy,before=state.metrics.points-amount;
 p.openingBalance+=before-ledgerBalance(p);
 if(type==='management')p.totals.spent-=amount;else p.totals[type]+=amount;
 if(type==='legacy'&&!p.legacyClaimed.includes(id))p.legacyClaimed.push(id);
 const row={sequence:++p.sequence,id,type,amount,at:state.simulationTime,balance:state.metrics.points,sourceId};
 p.ledger.push(row);if(p.ledger.length>config.ledgerLimit)p.ledger.shift();return row;
}
