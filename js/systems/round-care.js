export const careAvailable=s=>s.round?.number>1?s.round.care.remaining:0;
export function payManagement(s,cost){
 const care=Math.min(cost,careAvailable(s));
 if(care){s.round.care.remaining-=care;s.round.care.spent+=care;s.round.care.history.push({actionNumber:s.managementActionCount+1,at:s.simulationTime,amount:care});if(s.round.care.history.length>100)s.round.care.history.shift();}
 s.metrics.points-=cost-care;return care;
}
