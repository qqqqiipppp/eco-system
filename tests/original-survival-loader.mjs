// Test-only pre15.8 policy. Historical numerical snapshots keep their original
// meaning; the actual production settings run separately in the same runner.
export async function load(url,context,nextLoad){
 if(url.endsWith('/data/survival-config.js'))return {format:'module',shortCircuit:true,source:`export const survivalConfig={hungerScale:2,satietyScale:.5,demandAwareRecentMeal:false,earthwormRefuge:false,earthwormCycleSeconds:120,earthwormSurfaceSeconds:3};`};
 return nextLoad(url,context);
}
