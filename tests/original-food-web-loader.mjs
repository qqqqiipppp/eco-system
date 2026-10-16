// Test-only baseline: keep historical numerical fixtures on their original 22 edges.
// All production modules otherwise run unchanged. No student flag or saved switch.
export async function load(url,context,nextLoad){
 const result=await nextLoad(url,context);
 if(url.endsWith('/data/food-relations.js'))return {...result,source:String(result.source).replace(/\/\/ 15\.7 additions begin[\s\S]*?\/\/ 15\.7 additions end/,'')};
 return result;
}
