import {environmentEventConfig as config,environmentEventDefinitions as definitions,environmentEventSequence as schedule} from '../../data/environment-events.js';
import {factorValue,qualityLabel,growthSuitability} from './environment.js';
import {environmentFactors,producerGrowth} from '../../data/environment-config.js';
import {organismById} from '../../data/organisms.js';
import {developmentRules} from '../../data/development-config.js';
import {developmentRate} from './development.js';
import {evaluateStability} from './stability.js';
import {managementActions} from '../../data/management-actions.js';
import {colonyEnvironmentSuitable,colonyHasResource} from './lifespan.js';

export const currentEnvironmentEvent=state=>state.environmentEvents.history.find(r=>r.eventId===state.environmentEvents.activeId);
export const hasEnvironmentEventWork=state=>Boolean(currentEnvironmentEvent(state));
export function startEnvironmentEvent(state,kind){
 if(!Object.hasOwn(definitions,kind)||currentEnvironmentEvent(state))return null;
 const d=definitions[kind],m=state.environmentEvents,limited=state.metrics.points<config.minimumPoints;
 const beforeValue=factorValue(state.environment,d.factor);
 const record={eventId:`environment-${++m.sequence}`,kind,factor:d.factor,phase:'active',startedAt:state.simulationTime,
  duration:d.duration,recoverySeconds:d.recoverySeconds,intensity:limited?config.limitedIntensity:1,
  floor:limited?config.limitedFloor:config.minimumFloor,beforeValue,valueAfter:beforeValue,appliedDelta:0,effectSeconds:0,
  recoveryElapsed:0,recoveredDelta:0,recoveryTarget:Math.min(config.recoveryCeiling,beforeValue),valueAtEffectEnd:null,
  effectEndedAt:null,endedAt:null,observed:false,choice:null,evidence:[],responses:[]};
 m.history.push(record);if(m.history.length>config.historyLimit)m.history.shift();
 m.activeId=record.eventId;m.nextAt=state.simulationTime+config.interval;
 return record;
}
function change(state,record,amount,floor=0,ceiling=1){
 const old=factorValue(state.environment,record.factor);
 // A negative event cannot improve a previously worse environment. Recovery
 // cannot lower a value already improved by a student's management action.
 const value=amount<0?Math.min(old,Math.max(floor,old+amount)):Math.max(old,Math.min(ceiling,old+amount));
 state.environment[record.factor].value=value;record.valueAfter=value;
 return value-old;
}
// Called once inside the existing ecology tick, after its active clock advances.
// Absolute progress + persisted applied seconds make duplicate calls harmless.
export function updateEnvironmentEvents(state){
 const m=state.environmentEvents,time=state.simulationTime;let record=currentEnvironmentEvent(state);
 if(!record&&time>=m.nextAt){
  const kind=schedule[m.cursor],d=definitions[kind],previous=m.history.findLast(r=>r.kind===kind);
  const ready=state.organisms.length>0&&(state.metrics.stability??evaluateStability(state).score)>=config.minimumStability&&
    (d.magnitude>0||factorValue(state.environment,d.factor)>=config.minimumStartValue)&&
    (!previous||time-previous.startedAt>=config.repeatCooldown);
  if(ready){record=startEnvironmentEvent(state,kind);m.cursor=(m.cursor+1)%schedule.length;}
  else m.nextAt=time+config.postpone;
 }
 if(!record)return false;
 const d=definitions[record.kind],oldPhase=record.phase,oldEffect=record.effectSeconds,oldRecovery=record.recoveryElapsed;
 const elapsed=Math.min(record.duration,Math.max(0,time-record.startedAt));
 if(record.phase==='active'){
  const delta=elapsed-record.effectSeconds;
  if(delta>0)record.appliedDelta+=change(state,record,d.magnitude*record.intensity*delta/record.duration,record.floor);
  record.effectSeconds=elapsed;
  if(elapsed>=record.duration){
   record.effectEndedAt=record.startedAt+record.duration;record.valueAtEffectEnd=factorValue(state.environment,record.factor);
   record.phase=d.magnitude<0?'recovering':'ended';
  }
 }
 if(record.phase==='recovering'){
  const recovery=Math.min(record.recoverySeconds,Math.max(0,time-record.effectEndedAt));
  const delta=Math.max(0,recovery-record.recoveryElapsed);
  const amount=Math.max(0,record.recoveryTarget-record.valueAtEffectEnd)*delta/record.recoverySeconds;
  if(delta>0)record.recoveredDelta+=change(state,record,amount,0,record.recoveryTarget);
  record.recoveryElapsed=recovery;
  if(recovery>=record.recoverySeconds||factorValue(state.environment,record.factor)>=record.recoveryTarget-config.epsilon)record.phase='ended';
 }
 if(record.phase==='ended'){record.endedAt=time;m.activeId=null;}
 return oldPhase!==record.phase||oldEffect!==record.effectSeconds||oldRecovery!==record.recoveryElapsed;
}
export function captureEnvironmentImpact(state){
 return {environment:Object.fromEntries(Object.keys(environmentFactors).map(key=>[key,{value:factorValue(state.environment,key)}])),
  organisms:state.organisms.map(o=>({instanceId:o.instanceId,speciesId:o.speciesId,growth:o.growth,progress:o.development?.progressSeconds,
   stage:o.development?.stage,vigor:o.life.vigor,suitability:growthSuitability(o.speciesId,state.environment)}))};
}
export function observeEnvironmentImpact(state,samples,seconds){
 const record=currentEnvironmentEvent(state)||state.environmentEvents.history.at(-1);
 if(!record||record.phase==='ended'&&record.endedAt!==state.simulationTime)return;
 const environmentalDelta=factorValue(state.environment,record.factor)-factorValue(samples.environment,record.factor);
 if(Math.abs(environmentalDelta)<=config.epsilon)return;
 const reference={...state,environment:samples.environment};
 const byId=new Map(state.organisms.map(o=>[o.instanceId,o]));
 for(const sample of samples.organisms){
  const o=byId.get(sample.instanceId);if(!o)continue;let type;
  const difference=(o.development?.progressSeconds??0)-(sample.progress??0),rule=developmentRules[o.speciesId];
  // Hold post-tick hunger/food/wood conditions equal and reuse the existing
  // growth rule with the preceding environment. A new meal alone is not a
  // weather response, nor is the final fractional step before a stage boundary.
  const referenceRate=developmentRate(reference,o),currentRate=developmentRate(state,o);
  const withinStage=rule&&sample.progress+seconds*Math.max(referenceRate,currentRate)<rule.maxSeconds-config.epsilon&&o.development?.stage===sample.stage;
  if(withinStage&&referenceRate>currentRate+config.epsilon&&difference>=0&&difference<seconds*referenceRate-config.epsilon)type='growth-delay';
  else if(withinStage&&currentRate>referenceRate+config.epsilon&&difference>seconds*referenceRate+config.epsilon)type='growth-recovery';
  else if(producerGrowth[o.speciesId]&&Math.abs(o.growth-sample.growth)>config.epsilon){
   if(o.growth<sample.growth&&growthSuitability(o.speciesId,state.environment)<sample.suitability)type='producer-decline';
   else if(o.growth>sample.growth&&growthSuitability(o.speciesId,state.environment)>sample.suitability)type='producer-recovery';
  }else if(Number.isFinite(sample.vigor)&&Math.abs(o.life.vigor-sample.vigor)>config.epsilon&&
    colonyEnvironmentSuitable(samples.environment)!==colonyEnvironmentSuitable(state.environment)&&colonyHasResource(state,o)){
   if(o.life.vigor<sample.vigor&&environmentalDelta<0)type='colony-decline';
   else if(o.life.vigor>sample.vigor&&environmentalDelta>0)type='colony-recovery';
  }
  if(type&&record.evidence.length<config.evidenceLimit&&!record.evidence.some(e=>e.speciesId===o.speciesId&&e.type===type))record.evidence.push({instanceId:o.instanceId,speciesId:o.speciesId,type,at:state.simulationTime});
 }
}
export function chooseEnvironmentObservation(state,id,choice='observe'){
 const record=state.environmentEvents.history.find(r=>r.eventId===id);
 if(!record||!['observe','wait'].includes(choice))return {ok:false,message:'지금 환경 기록을 다시 살펴봐요.'};
 record.observed=true;record.choice=choice;
 return {ok:true,message:choice==='wait'?'기다리며 환경과 생물의 변화를 살펴보기로 했어요.':'환경 변화 기록에 남겼어요. 실제 생물의 반응도 살펴봐요.'};
}
export function recordEnvironmentResponse(state,record,before){
 const current=currentEnvironmentEvent(state);if(!current)return;
 const factor=record.factor||null;
 const beforeValue=factor?before.environment[factor]:before.hunger??factorValue(state.environment,current.factor);
 const afterValue=factor?factorValue(state.environment,factor):record.actionId==='food-support'?state.organisms.find(o=>o.instanceId===record.sourceId)?.hunger??beforeValue:beforeValue;
 current.responses.push({actionId:record.actionId,at:record.executedAt,cost:record.cost,factor,beforeValue,afterValue});
 if(current.responses.length>config.responseLimit)current.responses.shift();
}
const phaseLabels={active:'환경이 변하는 중',recovering:'사건은 끝났고 환경이 회복 중',ended:'사건을 마쳤어요'};
function actualMessages(state,r){
 const name=environmentFactors[r.factor].name,messages=[];
 if(r.appliedDelta<-config.epsilon)messages.push(`${name}이 줄어드는 변화가 실제로 있었어요.`);
 if(r.appliedDelta>config.epsilon)messages.push(`${name}이 나아지는 변화가 실제로 있었어요.`);
 if(r.recoveredDelta>config.epsilon)messages.push(`사건 뒤 ${name}이 서서히 회복됐어요.`);
 for(const e of r.evidence){const species=organismById[e.speciesId].name;messages.push(`${species}${({ 'growth-delay':'의 실제 성장 진행이 느려진 때가 있었어요.','growth-recovery':'의 실제 성장 진행이 빨라진 때가 있었어요.','producer-decline':'의 생장 상태가 낮아진 때가 있었어요.','producer-recovery':'의 생장 상태가 회복된 때가 있었어요.','colony-decline':' 군집의 활력이 낮아진 때가 있었어요.','colony-recovery':' 군집의 활력이 회복된 때가 있었어요.'})[e.type]}`);}
 return messages;
}
export function environmentEventPresentation(state){
 const m=state.environmentEvents,r=currentEnvironmentEvent(state)||m.history.at(-1);
 const present=r=>({eventId:r.eventId,name:definitions[r.kind].name,phaseLabel:phaseLabels[r.phase],actual:actualMessages(state,r)});
 return {current:r?{...present(r),cause:definitions[r.kind].cause,expected:definitions[r.kind].expected,
  direction:`${environmentFactors[r.factor].name}: ${r.phase==='active'?(definitions[r.kind].magnitude>0?'나아지는 방향':'낮아지는 방향'):r.phase==='recovering'?'회복을 지켜보는 중':'변화 결과를 확인해요'} · 현재 ${qualityLabel(factorValue(state.environment,r.factor))}`,
  observed:r.observed,choice:r.choice,responses:r.responses.map(a=>`${managementActions.find(d=>d.actionId===a.actionId).name}을 선택했어요. ${a.factor&&a.afterValue>a.beforeValue+config.epsilon?'환경 값이 실제로 나아졌어요.':a.actionId==='food-support'&&a.afterValue<a.beforeValue?'배고픔이 실제로 줄었어요.':'즉시 환경 값이 바뀐 행동은 아니에요. 회복을 지켜봐요.'}`)}:null,
  history:m.history.filter(h=>h!==r).slice(-3).map(present)};
}
