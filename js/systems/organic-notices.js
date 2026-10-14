import {organicNoticeConfig as config,organicWorkers,organicLabels} from '../../data/detritus-config.js';
import {organismById} from '../../data/organisms.js';

// Position selects a visual learning partner, never a separate resource pool.
export function eligibleOrganicWorker(state,instance,part){
 return organicWorkers[part]?.includes(instance.speciesId)&&state.decomposition.organicMatter[part]>0;
}
export function nearestOrganicWorker(state,position,part){
 return state.organisms.filter(o=>eligibleOrganicWorker(state,o,part)).sort((a,b)=>
  ((a.position.x-position.x)**2+(a.position.y-position.y)**2)-((b.position.x-position.x)**2+(b.position.y-position.y)**2)||a.instanceId.localeCompare(b.instanceId))[0]||null;
}
export function recordOrganicOrigin(state,instance,part,amount,populationRecord){
 if(!(amount>0))return;
 const notices=state.decomposition.notices||= {sequence:0,history:[]},worker=nearestOrganicWorker(state,instance.position,part);
 notices.history.push({sequence:++notices.sequence,populationSequence:populationRecord.sequence,sourceInstanceId:instance.instanceId,sourceSpeciesId:instance.speciesId,cause:populationRecord.cause,part,amount,position:{...instance.position},at:state.simulationTime,targetInstanceId:worker?.instanceId||null,noted:false});
 if(notices.history.length>config.historyLimit)notices.history.shift();
}
export function organicNoticeCandidates(state){
 const groups=new Map();
 for(const record of state.decomposition.notices?.history||[]){
  if(record.noted||state.simulationTime-record.at>config.lifetimeSeconds||state.decomposition.organicMatter[record.part]<=0)continue;
  let worker=state.organisms.find(o=>o.instanceId===record.targetInstanceId&&eligibleOrganicWorker(state,o,record.part));
  // No recipient at the occurrence means no retroactive arrival notification.
  if(!record.targetInstanceId)continue;
  if(!worker){worker=nearestOrganicWorker(state,record.position,record.part);if(!worker)continue;record.targetInstanceId=worker.instanceId;}
  const key=`${record.part}:${worker.instanceId}`,group=groups.get(key)||{populationSequences:[],urgent:false};
  group.urgent ||= record.cause==='starvation';group.record=record;group.worker=worker;group.populationSequences.push(record.populationSequence);groups.delete(key);groups.set(key,group);
 }
 return [...groups.values()].slice(-config.noticeLimit);
}
export function organicNoticeText(record,worker){
 const source=organismById[record.sourceSpeciesId].name,name=organismById[worker.speciesId].name;
 const role=worker.speciesId==='earthworm'?'식물 잔해를 먹고 분해와 토양을 돕는 소비자':worker.speciesId==='mushroom'?'죽은 나무를 분해하는 균류':worker.speciesId==='litter-mold'?'낙엽 분해에 참여하는 균류 군집':'유기물 분해에 참여하는 세균';
 return {title:`${name}의 유기물 역할 살펴보기`,message:`${source}가 자연으로 돌아가 ${organicLabels[record.part]}이 생겼어요. ${name}은 ${role}예요.`,explanation:'유기물이 생긴 뒤 가까운 생물에게 관심 표시를 연결했어요. 이미 이 잔해를 분해했다고 확인한 것은 아니에요. 숲의 유기물은 함께 사용하는 자원이며, 표시된 개체와 실제 처리량은 구분해요. 물·공기·토양 상태에 따라 실제 활동은 달라져요. 확인만으로 포인트를 받거나 유료 관리를 실행하지 않아요.'};
}
export function acknowledgeOrganicOrigin(state,sequence){
 const record=state.decomposition.notices.history.find(r=>r.sequence===sequence);
 if(record)for(const earlier of state.decomposition.notices.history)if(earlier.part===record.part&&earlier.targetInstanceId===record.targetInstanceId&&earlier.sequence<=record.sequence){earlier.noted=true;const population=state.population.history.find(r=>r.sequence===earlier.populationSequence);if(population)population.noted=true;}
}
