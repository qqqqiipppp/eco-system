// Historical tests retain their original goal cohort, while all production
// ecology/save code stays current. New learning-goal tests run without this.
export async function load(url,context,nextLoad){
 const result=await nextLoad(url,context);
 if(url.endsWith('/js/state/game-state.js'))return {...result,source:String(result.source).replace('goalRevision=GOAL_REVISION','goalRevision=1')};
 return result;
}
