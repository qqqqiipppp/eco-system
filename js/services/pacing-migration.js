import {ecologySeconds} from '../../data/pacing-config.js';
import {originalLifespanRules} from '../../data/lifespan-config.js';
const object=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const scale=(o,keys)=>{if(!object(o))return;for(const k of keys)if(Number.isFinite(o[k]))o[k]=ecologySeconds(o[k]);};
const anchor=(o,keys,time)=>{if(!object(o))return;for(const k of keys)if(Number.isFinite(o[k])&&o[k]>=0)o[k]=time+ecologySeconds(o[k]-time);};
export function compressLife(life,time){
 const result={...life};scale(result,['duration','initialAge','renewalSeconds','stressSeconds']);anchor(result,['startedAt','nextRenewalAt'],time);return result;
}
// Runs once, before the normal version-specific validators. The absolute
// foreground clock, historical rewards, organic origins and money stay intact.
// No passage of wall time, ecological effect, death or reward is replayed here.
export function migratePacingInput(input){
 if(input.schemaVersion>=15)return;
 const d=input.domain,t=d.simulationTime;if(!Number.isFinite(t)||t<0)return;
 for(const o of Array.isArray(d.organisms)?d.organisms:[]){
  if(!object(o))continue;
  if(input.schemaVersion>=10&&Object.hasOwn(originalLifespanRules,o.speciesId)&&object(o.life)){
   const l=o.life,r=originalLifespanRules[o.speciesId];
   const duration=r.model==='individual'?l.duration:l.renewalSeconds;
   if(Number.isFinite(duration)&&duration>=r.min&&duration<=r.max)o.life=compressLife(l,t);
   else o.life=null; // Invalid legacy duration cannot become a valid short life.
  }
  scale(o,['deprivationSeconds']);anchor(o,['bornAt','lastSuccessfulFeedingAt','satietyUntil','lastLitterFeedingAt'],t);
  scale(o.development,['progressSeconds']);
 }
 for(const group of ['breeding','replenishment'])for(const m of Object.values(object(d.population?.[group])?d.population[group]:{})){
  scale(m,['healthySeconds']);anchor(m,['nextAt'],t);scale(m?.pending,['remainingSeconds']);
 }
 for(const effect of Array.isArray(d.managementEffects)?d.managementEffects:[])anchor(effect,['startedAt','expiresAt'],t);
 const env=d.environmentEvents;
 anchor(env,['nextAt'],t);
 for(const r of Array.isArray(env?.history)?env.history:[]){
  scale(r,['duration','recoverySeconds','effectSeconds','recoveryElapsed']);
  anchor(r,['startedAt','effectEndedAt','endedAt'],t);
  for(const e of Array.isArray(r?.evidence)?r.evidence:[])anchor(e,['at'],t);
  for(const a of Array.isArray(r?.responses)?r.responses:[])anchor(a,['at'],t);
 }
}
