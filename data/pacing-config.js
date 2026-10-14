// Active seconds remain actual foreground play seconds. Only ecological
// durations/rates use this policy; reading, input, rendering and money do not.
export const PACING_REVISION=1;
export const pacingConfig=Object.freeze({ecologySpeed:2,targetMinutes:[15,20],fastMinutes:[12,15]});
export const ecologySeconds=seconds=>seconds/pacingConfig.ecologySpeed;
export const ecologyRate=rate=>rate*pacingConfig.ecologySpeed;
export function scaleFields(object,fields,scale=ecologySeconds){
 for(const key of fields)if(Number.isFinite(object[key]))object[key]=scale(object[key]);
}
