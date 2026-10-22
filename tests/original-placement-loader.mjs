// Historical numerical controls use their original physical boundary. The
// expanded production area is tested without this loader in full-forest tests.
export async function load(url,context,nextLoad){
 const result=await nextLoad(url,context);
 if(url.endsWith('/data/interaction-config.js'))return {...result,source:String(result.source).replaceAll('left: 0.04, right: 0.96','left: 0.08, right: 0.69')};
 return result;
}
