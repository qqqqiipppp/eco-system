import {lifespanRules} from '../../data/lifespan-config.js';

// Stable per-ID sampling supports deterministic clocks. Only sample on creation
// or old-save migration; schema 9 restoration copies the saved life instead.
function variation(id){let hash=2166136261;for(const c of id)hash=Math.imul(hash^c.charCodeAt(0),16777619);hash=Math.imul(hash^(hash>>>16),0x85ebca6b);hash=Math.imul(hash^(hash>>>13),0xc2b2ae35);return ((hash^(hash>>>16))>>>0)/4294967296;}
export function createLifeState(speciesId,instanceId,time=0,newborn=false){
 const rule=lifespanRules[speciesId],unit=variation(`${speciesId}:${instanceId}`);
 const duration=rule.min+(rule.max-rule.min)*unit;
 if(rule.model==='colony')return {renewalSeconds:duration,nextRenewalAt:time+duration,vigor:1,stressSeconds:0,generation:0};
 return {startedAt:time,initialAge:newborn?0:duration*rule.initialAge,duration};
}
export const effectiveAge=(instance,time)=>instance.life.initialAge+Math.max(0,time-instance.life.startedAt);
export const naturalEndAt=instance=>instance.life.startedAt+instance.life.duration-instance.life.initialAge;
