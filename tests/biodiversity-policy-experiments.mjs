import {writeFileSync} from 'node:fs';
import {runBiodiversitySuite,compactBiodiversityRun} from './biodiversity-experiments.mjs';

// This script runs only explicit developer comparisons. The game imports none of it.
const results=[];
for(const cycle of [60,120,180])for(const surface of [3,6]){
 const candidate={hungerScale:2,satietyScale:.5,demandAwareRecentMeal:false,earthwormRefuge:true,earthwormCycleSeconds:cycle,earthwormSurfaceSeconds:surface};
 const suite=runBiodiversitySuite({label:`C-refuge-${cycle}-${surface}`,candidate,scenarios:['unmanaged24','managed24'],worms:false,includeSplit:false});
 results.push({...suite,runs:suite.runs.map(compactBiodiversityRun)});
}
writeFileSync(new URL('./biodiversity.refuge-candidates-results.json',import.meta.url),JSON.stringify({stage:'15.8',results,notes:['Only the approach/exposure rule changes. Real life, hunger, satiety, growth, breeding, movement and resource rates stay at15.7.','The period and exposed duration are educational trial settings, not measured Amynthas koreanus physiology.']},null,2)+'\n');
