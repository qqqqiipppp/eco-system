import {writeFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {survivalConfig} from '../data/survival-config.js';
import {biodiversitySeeds,biodiversityScenarios,wormScenarios,runBiodiversity,withSurvivalCandidate} from './biodiversity-fixtures.mjs';

export function compactBiodiversityRun(data){
 const {kind,seed,peak,samples,final,causeCounts,wormIndividuals,saveChecks,diagnostics}=data;
 const intervals={};for(const o of data.individuals)if(o.mealTimes.length>1){const list=intervals[o.speciesId]||=[];for(let i=1;i<o.mealTimes.length;i++)list.push(o.mealTimes[i]-o.mealTimes[i-1]);}
 return {kind,seed,peak,samples,final,causeCounts,wormIndividuals,saveChecks,diagnostics,meanMealIntervals:Object.fromEntries(Object.entries(intervals).map(([id,v])=>[id,{count:v.length,mean:v.reduce((a,b)=>a+b,0)/v.length,minimum:Math.min(...v),maximum:Math.max(...v)}])),firstLoss:data.individuals.filter(o=>o.removedAt!==null).sort((a,b)=>a.removedAt-b.removedAt)[0]||null,actions:data.actions,pointsLedger:data.pointsLedger};
}

export function runHungerCandidates(){
 const candidates=[];
 for(const hungerScale of [1.2,1.4,1.6])for(const satietyScale of [.75,1]){
  const result=runBiodiversitySuite({label:`B-hunger${hungerScale}-satiety${satietyScale}`,candidate:{hungerScale,satietyScale,demandAwareRecentMeal:false,earthwormRefuge:false},worms:false,includeSplit:false});
  candidates.push({...result,runs:result.runs.map(compactBiodiversityRun)});
 }
 return {stage:'15.8',label:'B-only six hunger/satiety candidates against unchanged15.7 production ecology',candidates,notes:['Rates reference the historical uncompressed rate. Existing15.7 rate is2 and satiety .5.','Search retry, approach movement, starvation thresholds, reproduction conditions, lifespans, worm exposure and food graph are unchanged.','Each candidate uses five forests and all three fixed seeds; records store actual measured meal intervals, not a theoretical replacement.']};
}

export function runBiodiversitySuite({label='15.8-final',seeds=biodiversitySeeds,scenarios=biodiversityScenarios,worms=true,candidate={...survivalConfig},seconds=1200,includeSplit=true}={}){
 return withSurvivalCandidate(candidate,()=>{
  const runs=[];
  for(const kind of [...scenarios,...(worms?wormScenarios:[])])for(const seed of seeds){const r=runBiodiversity({kind,seed,seconds});runs.push(r.data);process.stderr.write(`${label} ${kind} seed=${seed}: ${r.data.final.species} species, ${r.data.final.meals} meals, worm=${r.data.final.wormProcessed.toFixed(6)}\n`);}
  const split=includeSplit?runBiodiversity({kind:'managed24',seed:seeds[0],seconds,splitAt:seconds/2}).data:null;
  return {stage:'15.8',label,generatedAt:'2026-10-19',seeds,candidate:{...survivalConfig,configure:Boolean(candidate.configure)},seconds,runs,split,notes:['All24/scenario starts are explicit diagnostic fixtures; fresh-student uses actual starting cards and zero points.','Actual30Hz wandering and .5s ecology; observed removals attributed from real same-tick population records, never inferred from final counts.','Management is automated but all actions use existing domain gates, current points, inventory, cooldown and maximum30.','No actual S5e or actual pupil observations.']};
 });
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const label=process.argv[2]||'15.8-final',candidates=label==='--candidates',output=process.argv[3]||new URL(candidates?'./biodiversity.candidates-results.json':'./biodiversity.final-results.json',import.meta.url),data=candidates?runHungerCandidates():runBiodiversitySuite({label});
 writeFileSync(output,JSON.stringify(data,null,2)+'\n');
}
