import {feedingConfig} from '../../data/ecology-config.js';
import {populationConfig as config,starvationLimits,reproductionRules} from '../../data/population-config.js';
import {removeOrganism,addOrganism,countSpecies} from './lifecycle.js';
import {organismById} from '../../data/organisms.js';
import {relationsByConsumer} from '../../data/food-relations.js';
import {foodResourceConfig} from '../../data/ecology-config.js';
import {environmentQuality,factorValue} from './environment.js';
import {hasFoodStock} from './food-resources.js';
import {hasSpace,isPositionAllowed} from './placement-rules.js';
import {placementConfig} from '../../data/interaction-config.js';
import {lifespanRules,replenishmentRules} from '../../data/lifespan-config.js';

export function populationMessage(record){
  const name=organismById[record.speciesId].name,unit=lifespanRules[record.speciesId].unit,counts=`현재 ${name}: ${record.countBefore}${unit} → ${record.countAfter}${unit}`;
  if(record.cause==='natural_lifespan')return `${name} 한 ${unit}가 ${['oak','pine','hazel'].includes(record.speciesId)?'긴 생애를 마치고 수명을 다해':'수명을 다해'} 자연으로 돌아갔어요. ${counts}.${record.speciesId==='grass'?' 새로운 풀이 자랄 수 있는 환경인지 살펴보세요.':' 자연스러운 세대교체가 이어질 수 있어요.'}`;
  if(record.cause==='life_stage_exit')return `${name} 한 마리가 애벌레 시기를 마쳤어요. 번데기와 나방 시기는 이 화면에서 생략해요. ${counts}. 수명을 다한 것이 아니에요.`;
  if(record.cause==='colony_renewal')return `${name} 군집 안에서 새로운 세대가 이어졌어요. ${counts}. 군집 전체가 한꺼번에 바뀐 것은 아니에요.`;
  if(record.cause==='colony_decline')return `${name} 한 군집이 나쁜 서식 환경이 오래 이어져 줄었어요. ${counts}. 환경을 회복하고 획득한 카드로 다시 들일 수 있어요.`;
  if(record.cause==='replenishment'&&record.mode==='egg-hatch')return `${name}의 앞선 번식으로 남은 알에서 한 마리가 새로 나타났어요. ${counts}. 먹이와 서식 조건이 계속 적절해야 해요.`;
  if(record.cause==='replenishment')return `${name} 한 ${unit}가 ${record.mode==='larval-recruitment'?'참나무 잎 주변에서 새 애벌레로 나타났어요. 화면에 없는 나방의 산란을 간단히 나타냈어요.':'먹이가 있는 숲 주변에서 찾아왔어요.'} ${counts}.`;
  if(record.cause==='starvation')return `먹이가 오랫동안 부족해 ${name} 한 마리가 자연으로 돌아갔어요. ${counts}. 먹이가 충분한지 살펴보세요.`;
  if(record.cause==='predation')return `${organismById[record.consumerSpeciesId]?.name||'다른 소비자'}가 ${name}를 먹이로 이용해 ${name} 한 마리가 자연으로 돌아갔어요. ${counts}.`;
  if(record.cause==='reproduction')return `${name}의 수가 늘어났어요! ${record.mode==='seed-spread'?'씨앗 확산을 간단히 나타냈어요.':'먹이와 환경 조건이 번식에 도움이 됐어요.'} ${counts}.`;
  return `학생의 선택으로 ${name} 한 ${unit}${unit==='군집'?'이':'가'} 자연으로 돌아갔어요. ${counts}.`;
}

export function survivalStage(instance){
  if(!feedingConfig[instance.speciesId])return 'static';
  if(instance.deprivationSeconds>=config.weakAfter)return 'weak';
  if(instance.deprivationSeconds>=config.severeAfter)return 'severe';
  return instance.hunger>=feedingConfig[instance.speciesId].hungryAt?'hungry':'normal';
}
export const survivalActivity=instance=>survivalStage(instance)==='weak'?config.weakActivity:1;
export function recoverSurvival(instance){instance.deprivationSeconds=0;}
export function supportSurvival(instance){instance.deprivationSeconds=Math.max(0,instance.deprivationSeconds-config.supportReliefSeconds);}
export function updateSurvival(state,seconds){
  const removed=[];
  for(const instance of [...state.organisms]){
    if(!feedingConfig[instance.speciesId])continue;
    if(state.simulationTime<Math.max(instance.bornAt+config.graceSeconds,instance.acclimationUntil||0))continue;
    if(instance.hunger>=config.severeHunger)instance.deprivationSeconds+=seconds;
    else instance.deprivationSeconds=Math.max(0,instance.deprivationSeconds-seconds*2);
    if(instance.deprivationSeconds>= (starvationLimits[instance.speciesId]||config.deathAfter)){
      removeOrganism(state,instance.instanceId,'starvation');removed.push(instance.instanceId);
    }
  }
  return removed;
}

// Explicit developer installation, not a stored flag or URL option.
const developmentStates=new WeakSet();
export const enableDevelopmentPlacement=state=>developmentStates.add(state);
export function usableFood(state,consumer,layout){
 const edges=relationsByConsumer.get(consumer.speciesId)||[];
 return state.organisms.filter(food=>edges.some(edge=>edge.sourceSpeciesId===food.speciesId&&hasFoodStock(food,edge))&&(!consumer.position||Math.hypot(food.position.x-consumer.position.x,food.position.y-consumer.position.y)<=feedingConfig[consumer.speciesId].searchRadius)&&(!layout||isPositionAllowed(consumer.speciesId,food.position,layout)));
}
export function validateIntroduction(state,id,position,layout){
 if(developmentStates.has(state))return {ok:true};
 const role=organismById[id].role,count=countSpecies(state,id),intro=state.population.introductions[id];
 if(count>=config.speciesCap[role])return {ok:false,reason:'density',message:'이 생물은 지금 충분히 많아요. 먹이와 공간을 살펴보세요.'};
 if(intro?.nextAt>state.simulationTime)return {ok:false,reason:'cooldown',message:`다시 들이기까지 ${Math.ceil(intro.nextAt-state.simulationTime)}초 기다려요. 먹이와 환경을 먼저 살펴보세요.`};
 const later=(intro?.count||0)>=config.bootstrap[role]||count===0&&Boolean(intro);
 if(later&&role==='consumer'&&!usableFood(state,{speciesId:id,position},layout).length)return {ok:false,reason:'food',message:'이 생물이 먹을 수 있는 먹이를 먼저 숲에 마련해 주세요.'};
 return {ok:true,reintroduction:count===0&&Boolean(intro)};
}
export function recordIntroduction(state,id){
 const role=organismById[id].role,intro=state.population.introductions[id]||{count:0,nextAt:0};
 intro.count++;if(intro.count>=config.bootstrap[role])intro.nextAt=state.simulationTime+config.introductionCooldown;
 state.population.introductions[id]=intro;
}
export function updateReproduction(state,seconds,layout){
 const added=[];
 for(const [id,rule]of Object.entries(reproductionRules)){
  const parents=state.organisms.filter(o=>o.speciesId===id);
  const memory=state.population.breeding[id]||{healthySeconds:0,nextAt:state.simulationTime+rule.healthySeconds};
  state.population.breeding[id]=memory;
  const ready=parents.filter(o=>{
   if('hunger'in o)return o.hunger<=config.maxHealthyHunger&&o.lastSuccessfulFeedingAt!==null&&state.simulationTime-o.lastSuccessfulFeedingAt<=config.recentMealSeconds&&survivalStage(o)!=='weak'&&usableFood(state,o,layout).length>0;
   return o.growth>=.85&&o.foodStock>=foodResourceConfig[id].maximum*.6;
  });
  const healthy=environmentQuality(state.environment)>=config.minimumEnvironment&&['water','air'].every(f=>factorValue(state.environment,f)>=.4)&&ready.length>=rule.minimum&&parents.length<rule.maximum&&state.organisms.length<placementConfig.maxOrganisms;
  memory.healthySeconds=healthy?Math.min(rule.healthySeconds,memory.healthySeconds+seconds):0;
  if(!healthy||memory.healthySeconds<rule.healthySeconds||memory.nextAt>state.simulationTime)continue;
  const parent=ready[0];
  for(const [dx,dy]of [[.05,0],[-.05,0],[.08,.03],[-.08,-.03],[.12,0],[-.12,0]]){
   const position={x:parent.position.x+dx,y:parent.position.y+dy};
   if(!hasSpace(state,id,position,layout)||state.organisms.filter(o=>Math.hypot(o.position.x-position.x,o.position.y-position.y)<config.localRadius).length>=config.localLimit)continue;
   const child=addOrganism(state,id,position,'reproduction',{mode:rule.mode});
   if(child)added.push(child);
   if(child&&id==='grasshopper'){
    const rule=replenishmentRules.grasshopper,m=state.population.replenishment.grasshopper||{healthySeconds:0,nextAt:state.simulationTime+rule.healthySeconds};m.reserve=rule.reserveMaximum;state.population.replenishment.grasshopper=m;
   }
   memory.healthySeconds=0;memory.nextAt=state.simulationTime+rule.cooldown;break;
  }
 }
 return added;
}

// Separate from the four existing reproduction rules. These represent limited
// arrivals from surrounding habitat, not spontaneous birth from one parent.
export function updateReplenishment(state,seconds,layout){
 const added=[];
 for(const [id,rule]of Object.entries(replenishmentRules)){
  const count=countSpecies(state,id),memory=state.population.replenishment[id]||{healthySeconds:0,nextAt:state.simulationTime+rule.healthySeconds,...(rule.seedBank?{reserve:0}:{})};
  state.population.replenishment[id]=memory;
  const permitted=state.inventory.find(c=>c.speciesId===id)?.acquired&&state.population.introductions[id]?.count>0&&(!rule.seedBank||memory.reserve>0);
  const food=permitted?usableFood(state,{speciesId:id},layout):[];
  const healthy=permitted&&food.length>0&&(rule.seedBank||count<rule.target)&&state.organisms.length<placementConfig.maxOrganisms&&environmentQuality(state.environment)>=config.minimumEnvironment&&['water','air','soil'].every(f=>factorValue(state.environment,f)>=.4);
  memory.healthySeconds=healthy?Math.min(rule.healthySeconds,memory.healthySeconds+seconds):0;
  if(!healthy||count>=rule.target||memory.healthySeconds<rule.healthySeconds||memory.nextAt>state.simulationTime||state.population.introductions[id].nextAt>state.simulationTime)continue;
  for(const anchor of food){
   let arrived=false;
   for(const [dx,dy]of [[.05,0],[-.05,0],[.08,.03],[-.08,-.03],[.12,0],[-.12,0],[.18,0],[-.18,0],[.16,.04],[-.16,.04]]){
    const position={x:anchor.position.x+dx,y:anchor.position.y+dy};
    if(!hasSpace(state,id,position,layout)||!usableFood(state,{speciesId:id,position},layout).length||state.organisms.filter(o=>Math.hypot(o.position.x-position.x,o.position.y-position.y)<config.localRadius).length>=config.localLimit)continue;
    const instance=addOrganism(state,id,position,'replenishment',{mode:rule.mode});if(instance)added.push(instance);
    if(instance&&rule.seedBank)memory.reserve--;
    memory.healthySeconds=0;memory.nextAt=state.simulationTime+rule.cooldown;arrived=true;break;
   }
   if(arrived)break;
  }
 }
 return added;
}
