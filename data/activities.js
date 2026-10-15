import {cardUnlocks} from './card-unlocks.js';
export const activities = [
 {activityId:'producer_quiz',type:'quiz',title:'양분을 만드는 생물',prompt:'햇빛을 이용해 스스로 양분을 만드는 생물은 무엇일까요?',choices:[{id:'grass',label:'강아지풀'},{id:'frog',label:'참개구리'},{id:'rabbit',label:'멧토끼'}],correctAnswer:'grass',hint:'초록색 식물이 햇빛을 이용하는 모습을 생각해 봐요.',learningOutcome:'강아지풀은 햇빛을 이용해 스스로 양분을 만드는 생산자예요.',unlockSpeciesId:null,pointReward:3},
 {activityId:'decomposer_classify',type:'classify',title:'구름송편버섯의 역할',prompt:'구름송편버섯은 죽은 나무의 물질을 다시 이용하도록 도와요. 어떤 역할일까요?',choices:[{id:'producer',label:'생산자'},{id:'consumer',label:'소비자'},{id:'decomposer',label:'분해자'}],correctAnswer:'decomposer',hint:'죽은 생물의 물질을 다른 생물이 다시 이용하도록 돕는 역할이에요.',learningOutcome:'이 활동은 죽은 나무를 분해하는 구름송편버섯을 다뤄요. 이 숲의 버섯은 죽은 목재를 분해하는 역할로 나타내요.',unlockSpeciesId:'mushroom',unlockHint:'구름송편버섯의 역할을 분류해요',pointReward:4},
 {activityId:'grass_observation',type:'observation',title:'관찰에서 다음 먹이 관계로',prompt:'강아지풀을 먹는 방아깨비를 관찰하고 💡에서 발견을 기록해 보세요.',requirements:{relationId:'v2_grass_to_grasshopper'},hint:'강아지풀과 방아깨비를 가까이 놓고 실제로 먹기를 기다린 뒤 💡의 발견 기록하기를 눌러요.',learningOutcome:'이제 참개구리를 놓고 방아깨비와의 관계도 살펴볼 수 있어요.',unlockSpeciesId:'frog',unlockHint:'강아지풀 → 방아깨비 발견을 기록해요',pointReward:4},
 {activityId:'rabbit_habitat',type:'habitat',title:'멧토끼가 살 만한 숲',prompt:'여러 생산자와 강아지풀이 있고 환경이 너무 나쁘지 않은 숲을 만들어 보세요.',requirements:{producerSpecies:2,grass:true,minEnvironment:.4,minStability:60},hint:'상수리나무와 강아지풀을 두고 환경을 돌봐요. 먹이와 역할의 균형도 살펴봐요.',learningOutcome:'조건을 갖춘 숲에서 멧토끼 카드를 사용할 수 있어요. 멧토끼는 직접 배치해요.',unlockSpeciesId:'rabbit',unlockHint:'생산자와 숲의 환경을 돌봐요',pointReward:4},
 ...cardUnlocks,
];
for(const a of activities.filter(a=>!a.collection&&a.choices))for(const c of a.choices)if(c.id!==a.correctAnswer)c.feedback=a.activityId==='producer_quiz'?'스스로 양분을 만드는 식물과 다른 생물을 먹는 동물을 구분해 봐요.':c.id==='producer'?'버섯이 햇빛으로 양분을 만드는 식물인지 다시 생각해 봐요.':'죽은 나무의 물질을 다시 이용하도록 돕는 역할을 살펴봐요.';
export const activityById=Object.fromEntries(activities.map(item=>[item.activityId,item]));
export const activityForSpecies=Object.fromEntries(activities.filter(item=>item.unlockSpeciesId).map(item=>[item.unlockSpeciesId,item]));
