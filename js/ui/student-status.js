import {survivalStage} from '../systems/population.js';
import {earthwormAtSurface} from '../systems/prey-access.js';
import {survivalConfig} from '../../data/survival-config.js';
import {relationsByConsumer} from '../../data/food-relations.js';
import {organismById} from '../../data/organisms.js';
import {mealName,particle} from '../../data/student-text.js';

// Read domain state, never infer biological state from sprite coordinates.
export function studentStatus(instance,time){
 if(!instance)return '지금 숲에는 없어요.';
 if(instance.speciesId==='earthworm'&&survivalConfig.earthwormRefuge)return earthwormAtSurface(instance,time)?'땅 위 가까이에서 활동하고 있어요.':'흙과 낙엽 아래에서 활동하고 있어요.';
 const stage=survivalStage(instance);
 if(stage==='weak')return '먹이를 구하지 못해 힘이 없어요.';
 if(stage==='severe')return '먹을 것이 부족해요.';
 if(instance.behaviorState==='eat')return '먹이를 먹고 있어요.';
 if(instance.behaviorState==='moveToFood')return '먹이를 향해 가고 있어요.';
 if(instance.foodShortageDuration>0)return '먹을 것이 부족해요.';
 if(instance.behaviorState==='searchFood'||stage==='hungry')return '먹이를 찾고 있어요.';
 return organismById[instance.speciesId].role==='producer'?'햇빛과 물을 이용해 자라요.':organismById[instance.speciesId].role==='decomposer'?'유기물 분해에 참여해요.':'쉬며 주변을 살펴보고 있어요.';
}
export function studentFood(id){
 if(id==='earthworm')return '먹이: 낙엽과 식물 잔해';
 const species=organismById[id];
 if(species.role==='producer')return '생산자: 햇빛으로 스스로 양분을 만들어요.';
 if(species.role==='decomposer')return '분해자: '+({mushroom:'죽은 나무','soil-bacteria':'동물 유래 유기물','litter-mold':'낙엽과 식물 잔해'}[id]||'유기물')+' 분해에 참여해요.';
 return '먹이: '+(relationsByConsumer.get(id)||[]).map(mealName).join(' · ');
}
export function studentChange(record){
 const name=organismById[record.speciesId]?.name;if(!name)return '';
 if(record.cause==='natural_lifespan')return particle(name,'이','가')+' 수명을 다해 자연으로 돌아갔어요.';
 if(record.cause==='starvation')return particle(name,'이','가')+' 먹이를 오래 구하지 못해 줄었어요.';
 if(record.cause==='life_stage_exit')return name+'의 애벌레 시기가 끝났어요. 번데기와 나방 모습은 이 숲에서 생략해요.';
 if(record.cause==='release')return particle(name,'을','를')+' 숲에서 돌려보냈어요.';
 if(record.cause==='colony_decline')return name+' 군집이 나쁜 환경에서 줄었어요.';
 if(record.cause==='reproduction')return organismById[record.speciesId].role==='producer'?name+' 새싹이 났어요.':name+'의 새 세대가 태어났어요.';
 if(record.cause==='replenishment')return name+'의 새 개체가 나타났어요.';
 return '';
}
