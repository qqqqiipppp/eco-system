// Historical regression only: execute the unchanged 13.5 duration fixtures
// against the new modules. Production and pacing tests never install this hook.
export async function load(url,context,nextLoad){
 if(url.endsWith('/data/pacing-config.js'))return {format:'module',shortCircuit:true,source:`
 export const PACING_REVISION=1;
 export const pacingConfig=Object.freeze({ecologySpeed:1,targetMinutes:[15,20],fastMinutes:[12,15]});
 export const ecologySeconds=v=>v;
 export const ecologyRate=v=>v;
 export function scaleFields(o,fields,scale=ecologySeconds){for(const k of fields)if(Number.isFinite(o[k]))o[k]=scale(o[k]);}
 `};
 return nextLoad(url,context);
}
