import {developmentRules,developmentConfig} from '../../data/development-config.js';
import {stageAt} from '../state/development-state.js';
import {naturalEndAt} from '../state/life-state.js';
import {factorValue,growthSuitability} from './environment.js';
import {organismById} from '../../data/organisms.js';
import {populationConfig} from '../../data/population-config.js';

export const developmentStage=instance=>instance.development?.stage||developmentRules[instance.speciesId]?.stages.at(-1).id;
const stageDefinition=instance=>developmentRules[instance.speciesId]?.stages.find(s=>s.id===developmentStage(instance));
export const stageLabel=instance=>stageDefinition(instance)?.label||'';
export const developmentActivity=instance=>stageDefinition(instance)?.activity??1;
export const developmentalCapacity=instance=>stageDefinition(instance)?.capacity??1;
export const canFeed=instance=>!(instance.speciesId==='rabbit'&&developmentStage(instance)==='baby');
export function canReproduce(instance,time){
  const rule=developmentRules[instance.speciesId];
  return (!rule||rule.model==='individual'&&(instance.development?.progressSeconds??rule.maxSeconds)>=rule.breedingSeconds)&&naturalEndAt(instance)>time;
}
export function fungalCondition(state,instance){
  const suitable=['water','soil','air'].every(f=>factorValue(state.environment,f)>=developmentConfig.minimumEnvironment);
  const resource=state.decomposition.organicMatter.wood>=developmentConfig.woodThreshold;
  if(!suitable)return {id:'stressed',label:'서식 환경이 좋지 않아요',description:'물·흙·공기 상태를 살펴봐요. 나쁜 환경이 오래 이어지면 군집이 줄어들 수 있어요.'};
  if(!resource||instance.life.vigor<.5)return {id:'resting',label:'자원이 적어 쉬는 중',description:'목재와 환경이 회복되면 균사체가 다시 활동할 수 있어요. 자실체가 보이지 않아도 군집 전체가 없어진 것은 아니에요.'};
  const stage=developmentStage(instance);
  return {id:stage,label:stageLabel(instance),description:stage==='mycelium'?'균사체가 목재를 이용하며 활동하고 있어요.':stage==='fruiting'?'목재·환경·군집 활력이 적절해 자실체가 형성되는 상태예요.':'자실체에서 포자를 만드는 상태를 간단히 나타내요. 실제 포자 개체나 새 군집은 만들지 않아요.'};
}
export function developmentNotice(record){
  const name=organismById[record.speciesId].name;
  const label=developmentRules[record.speciesId].stages.find(s=>s.id===record.stage)?.label;
  return `${name}의 ${label} 단계를 실제로 관찰했어요. 성장 단계가 달라져도 같은 개체·군집이에요.`;
}
function developmentRate(state,instance){
  const rule=developmentRules[instance.speciesId];
  if(!rule||rule.model==='learning')return 0;
  if(rule.model==='colony')return ['stressed','resting'].includes(fungalCondition(state,instance).id)?0:instance.life.vigor;
  const fields=instance.speciesId==='grass'?['sunlight','water','air','soil']:['water','air','soil'];
  if(!fields.every(f=>factorValue(state.environment,f)>=developmentConfig.minimumEnvironment))return 0;
  if(instance.speciesId==='grass')return growthSuitability('grass',state.environment);
  if(instance.speciesId==='rabbit'&&developmentStage(instance)==='baby')return 1;
  return instance.hunger<=populationConfig.maxHealthyHunger&&instance.lastSuccessfulFeedingAt!==null&&state.simulationTime-instance.lastSuccessfulFeedingAt<=populationConfig.recentMealSeconds?1:0;
}
export function developmentConditions(state,instance){
  const rule=developmentRules[instance.speciesId];
  if(rule?.model==='learning')return {label:'생애주기 학습 정보',description:rule.description};
  if(rule?.model==='colony')return fungalCondition(state,instance);
  if((instance.development?.progressSeconds??0)>=rule?.maxSeconds)return {label:'성숙한 상태',description:'번식에는 성숙한 개체 수·먹이·환경·공간·대기 조건이 함께 필요해요.'};
  return developmentRate(state,instance)>0?{label:'자라고 있어요',description:instance.speciesId==='rabbit'&&developmentStage(instance)==='baby'?'초기 젖먹는 생활을 짧은 생존 적응 기간으로 생략해요. 새끼도 조금씩 움직일 수 있어요.':'알맞은 환경과 먹이를 이용하며 자라요.'}:{label:'성장이 잠시 느려졌어요',description:'환경과 먹이를 살펴봐요. 조건이 회복되면 성장을 이어가요.'};
}
function recordStage(state,instance,stage){
  const memory=state.development;
  const record={sequence:++memory.sequence,instanceId:instance.instanceId,speciesId:instance.speciesId,stage,simulationTime:state.simulationTime,noted:false};
  memory.history.push(record);
  if(memory.history.length>developmentConfig.historyLimit)memory.history.shift();
  return record;
}
// Called only in the shared ecology tick after natural lifespan removal.
export function updateDevelopment(state,seconds){
  const changes=[];
  for(const instance of state.organisms){
    const rule=developmentRules[instance.speciesId],d=instance.development;
    if(!d||!rule||d.progressSeconds>=rule.maxSeconds)continue;
    if(rule.model==='individual'&&naturalEndAt(instance)<=state.simulationTime)continue;
    const rate=developmentRate(state,instance);
    const previous=d.progressSeconds;
    const ceiling=instance.speciesId==='rabbit'&&developmentStage(instance)==='baby'?rule.stages[1].at:rule.maxSeconds;
    d.progressSeconds=Math.min(ceiling,previous+Math.max(0,seconds)*rate);
    d.stage=stageAt(instance.speciesId,d.progressSeconds);
    for(const stage of rule.stages)if(stage.at>previous&&stage.at<=d.progressSeconds)changes.push(recordStage(state,instance,stage.id));
  }
  return changes;
}
export const hasDevelopmentWork=state=>Object.values(state.population.breeding).some(memory=>Boolean(memory.pending));
