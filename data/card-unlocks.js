
import {organismById} from './organisms.js';
import {foodRelationById} from './food-relations.js';
// Stable IDs preserve v16 completions. Difficulty is an editorial estimate for
// teacher review, never a timer, reward multiplier or per-round card limit.
const lesson=(id,title,inspect,prompt,answer,wrong,compare,reason,extra={})=>({activityId:'explore_'+id,type:'exploration',collection:true,title,prompt,inspect,choices:[{id:'correct',label:answer},{id:'other',label:wrong[0],feedback:wrong[1]},{id:'compare',label:compare[0],feedback:compare[1]}],correctAnswer:'correct',unlockSpeciesId:id,pointReward:0,learningOutcome:reason,difficulty:'보통',...extra});
export const cardUnlocks=[
 lesson('pine','소나무와 생산자',['oak'],'상수리나무를 살펴보았어요. 소나무가 양분을 만드는 데에도 필요한 것은?', '햇빛·물 등 알맞은 환경',['흙 속 양분만 있으면 돼요','식물은 흙에서 재료를 얻지만, 햇빛을 이용해 양분을 만들어요.'],['다른 동물을 먹어야 해요','다른 생물을 먹어 양분을 얻는 소비자와 식물을 구분해 봐요.'],'소나무도 햇빛을 이용해 양분을 만드는 생산자예요.',{priorActivity:'producer_quiz',difficulty:'쉬움'}),
 lesson('raspberry','숲 가장자리 식물',['grass'],'산딸기가 숲에서 하는 역할로 알맞은 것은?', '스스로 양분을 만드는 생산자',['열매를 먹는 소비자','열매를 만드는 식물과 그 열매를 먹는 동물을 구분해 봐요.'],['동물 잔해를 분해하는 분해자','산딸기는 초록색 식물이에요. 양분을 얻는 방법을 생각해 봐요.'],'산딸기는 생산자예요. 열매는 다른 생물의 먹이가 될 수 있어요.',{priorActivity:'producer_quiz',difficulty:'쉬움'}),
 lesson('hazel','나무의 잎과 열매',['pine'],'소나무의 먹이 관계와 비교해 봐요. 팽나무의 잎과 열매는 어떻게 이용될까요?', '생물에 따라 먹는 부분이 달라요',['모든 소비자가 같은 부분을 먹어요','먹이그물에는 잎·씨앗·열매를 이용하는 서로 다른 소비자가 있어요.'],['나무가 다른 동물을 먹는 데 써요','나무는 생산자예요. 동물에게 제공하는 먹이를 생각해 봐요.'],'식물의 잎과 열매는 서로 다른 소비자가 이용할 수 있어요.',{relationId:'v2_pine_to_caterpillar'}),
 lesson('chipmunk','나무와 다람쥐',['oak'],'이 숲의 다람쥐가 상수리나무에서 얻는 먹이는?', '도토리',['죽은 나무의 목재','죽은 목재를 분해하는 균류와 도토리를 먹는 동물은 역할이 달라요.'],['상수리나무의 잎','이 게임의 먹이그물에서 다람쥐에게 이어지는 먹이 부분을 살펴봐요.'],'이 게임의 다람쥐는 도토리와 소나무 씨앗을 이용해요.',{difficulty:'쉬움'}),
 lesson('field-mouse','풀밭의 곤충 먹이',['grasshopper'],'방아깨비를 먹는 고슴도치는 어떤 역할일까요?', '다른 생물을 먹는 소비자',['햇빛으로 양분을 만드는 생산자','방아깨비를 먹어 양분을 얻는 동물과 식물을 구분해 봐요.'],['낙엽을 분해하는 균류','고슴도치는 동물이에요. 낙엽을 분해하는 균류와 달라요.'],'이 게임의 고슴도치는 방아깨비 같은 곤충을 먹는 소비자예요.',{relationId:'v2_grass_to_grasshopper'}),
 lesson('caterpillar','솔잎과 애벌레',['pine'],'소나무 주변에 솔나방 애벌레를 놓으려 해요. 어떤 먹이를 살펴봐야 할까요?', '소나무의 솔잎',['소나무의 씨앗','같은 소나무에서도 다람쥐와 애벌레가 먹는 부분은 달라요.'],['죽은 나무의 목재','애벌레의 잎 먹이와 분해자가 이용하는 죽은 목재를 구분해 봐요.'],'솔나방 애벌레는 솔잎을 먹어요. 다람쥐의 씨앗 먹이와 구분해요.',{difficulty:'쉬움'}),
 lesson('aphid','팽나무 잎 탐구',['hazel'],'이 게임의 청동풍뎅이 성충에게 필요한 먹이는?', '팽나무의 잎',['팽나무의 뿌리','이번 카드는 성충이에요. 유충의 생활과 구분해 봐요.'],['팽나무의 열매','팽나무의 잎을 먹는 곤충과 열매를 먹는 새를 구분해 봐요.'],'이 게임의 청동풍뎅이 성충은 팽나무 잎을 먹어요.',{relationId:'v2_grass_to_grasshopper'}),
 lesson('snail','습한 풀밭 탐구',['grass'],'물이 부족해 식물의 잎 먹이 회복이 느려지면, 명주달팽이는 어떤 영향을 받을 수 있을까요?', '이용할 잎 먹이도 줄 수 있어요',['잎 먹이는 물과 관계없어요','물은 식물의 성장과 잎 먹이 회복에 영향을 줘요.'],['잎 대신 물만 먹으면 돼요','달팽이에게도 알맞은 환경과 실제 잎 먹이가 함께 필요해요.'],'환경은 식물에 영향을 주고, 식물을 이용하는 소비자에게도 이어질 수 있어요.',{difficulty:'쉬움'}),
 lesson('spider','기다리는 소비자',['aphid'],'팽나무 → 청동풍뎅이에서 무당거미까지 연결하면 화살표는 어떻게 이어질까요?', '팽나무 → 청동풍뎅이 → 무당거미',['무당거미 → 청동풍뎅이 → 팽나무','화살표는 먹이에서 먹는 생물로 이어져요.'],['팽나무 → 무당거미 → 청동풍뎅이','이 게임에서 무당거미는 식물 대신 아주 가까운 곤충 먹이를 이용해요.'],'화살표는 먹이에서 먹는 생물로 이어져요. 카드 획득과 실제 무당거미 섭식 발견은 따로 기록해요.',{relationId:'v2_hazel_to_aphid'}),
 lesson('ladybird','낙엽층의 사냥꾼',['snail'],'명주달팽이를 먹는 홍단딱정벌레를 놓으면 어떤 변화가 생길 수 있을까요?', '먹이가 된 달팽이 수가 줄 수 있어요',['달팽이 수가 반드시 늘어요','포식으로 먹이를 얻는 쪽과 줄어드는 먹이 생물을 함께 생각해 봐요.'],['딱정벌레가 햇빛으로 양분을 만들어요','먹이를 사냥하는 동물과 스스로 양분을 만드는 식물은 역할이 달라요.'],'이 게임에서 홍단딱정벌레는 명주달팽이를 먹는 소비자예요.',{relationId:'v2_grass_to_snail'}),
 lesson('tit','곤충에서 새로',['caterpillar'],'솔잎을 먹는 애벌레가 줄면, 이를 먹는 박새는 어떤 영향을 받을까요?', '이용할 먹이가 줄 수 있어요',['애벌레 수와 새의 먹이는 관계없어요','먹이그물에서 애벌레 → 박새로 이어지는 관계를 살펴봐요.'],['박새가 솔잎을 대신 먹어요','이 게임에서 박새에게 연결한 동물 먹이를 살펴봐요.'],'박새의 먹이에는 솔나방 애벌레가 있어요. 한 생물의 변화는 다른 생물에게 이어질 수 있어요.',{relationId:'v2_pine_to_caterpillar'}),
 lesson('bulbul','열매와 새',['raspberry','hazel'],'이 숲의 직박구리에게 먹이를 제공할 조합은?', '산딸기 열매와 팽나무 열매',['소나무 솔잎과 팽나무 잎','식물마다, 또 같은 식물 안에서도 소비자가 먹는 부분은 달라요.'],['죽은 목재와 동물 잔해','열매를 먹는 새와 유기물을 분해하는 생물을 구분해 봐요.'],'이 게임의 직박구리는 산딸기와 팽나무 열매를 이용해요.'),
 lesson('snake','개구리와 뱀',['frog'],'방아깨비 → 참개구리를 기록했어요. 유혈목이까지 이어지는 이 게임의 관계는?', '방아깨비 → 참개구리 → 유혈목이',['유혈목이 → 참개구리 → 방아깨비','화살표가 먹는 생물 쪽으로 향하는지 살펴봐요.'],['방아깨비 → 유혈목이 → 참개구리','이 게임의 유혈목이는 개구리를 먹어요. 두 번째 연결을 다시 살펴봐요.'],'참개구리는 곤충을 먹고 유혈목이의 먹이가 될 수 있어요.',{relationId:'v2_grasshopper_to_frog'}),
 lesson('weasel','여러 먹이를 이용하는 동물',['chipmunk'],'여러 먹이 관계를 바탕으로, 족제비를 놓기 전에 어떤 구성을 생각해야 할까요?', '여러 먹이와 생물 수의 균형',['먹이 동물 없이 포식자만 늘리기','소비자에게는 실제 먹이가 필요해요. 포식자가 늘면 먹이 생물도 영향을 받아요.'],['식물만 있으면 동물 먹이도 충분해요','생산자에서 동물 먹이까지 이어지는 관계를 함께 살펴봐요.'],'이 게임의 족제비는 다람쥐·참개구리·방아깨비를 먹어요. 먹이와 개체 수를 함께 돌봐요.',{relationId:'v2_oak_to_chipmunk',relationIds:['v2_grasshopper_to_frog'],difficulty:'도전'}),
 lesson('goshawk','숲의 상위 소비자',['chipmunk'],'다람쥐와 직박구리의 먹이 관계를 생각해 봐요. 참매를 놓을 때 함께 살필 것은?', '먹이 동물과 그 먹이가 되는 식물',['참매 수만 늘리고 먹이는 줄이기','상위 소비자도 먹이가 필요해요. 식물에서 이어지는 관계까지 생각해 봐요.'],['참매가 낙엽만으로 살아가게 하기','참매의 동물 먹이와 토양동물의 낙엽 섭식을 구분해 봐요.'],'이 게임의 참매는 멧토끼·다람쥐·직박구리를 먹어요. 여러 먹이 관계가 이어져요.',{relationId:'v2_oak_to_chipmunk',relationIds:['v2_raspberry_to_bulbul'],difficulty:'도전'}),
 lesson('earthworm','낙엽과 토양동물',['mushroom','soil-bacteria'],'참지렁이를 어떤 생물로 구분할까요?', '낙엽 잔해를 먹는 토양동물·소비자',['낙엽을 분해하는 균류 군집','참지렁이는 동물이에요. 버섯·곰팡이 같은 균류와 달라요.'],['햇빛으로 양분을 만드는 생산자','흙 속에 산다고 식물은 아니에요. 양분을 얻는 방법을 생각해 봐요.'],'참지렁이는 낙엽 잔해를 먹으며 분해와 토양을 돕는 소비자예요.',{priorActivity:'decomposer_classify'}),
 lesson('litter-mold','낙엽을 분해하는 균류',['earthworm'],'참지렁이의 낙엽 섭식과 낙엽 분해 곰팡이 군집을 비교하면?', '둘 다 잔해를 이용하지만 서로 다른 생물이에요',['참지렁이도 곰팡이와 같은 균류예요','같은 낙엽 잔해를 이용해도 동물과 균류는 달라요.'],['느낌표를 누르면 모든 분해가 끝나요','느낌표는 잔해 발생에 대한 안내예요. 실제 섭식·분해와 구분해요.'],'곰팡이 군집은 낙엽을 분해하는 여러 균류예요. 참지렁이의 동물 섭식과 구분해요.',{requiresLitterMeal:true,difficulty:'도전'}),
];
for(const [index,a]of cardUnlocks.entries()){
 const offset=index%3;a.choices=[...a.choices.slice(offset),...a.choices.slice(0,offset)];
 const names=a.inspect.map(id=>organismById[id].name).join('·');
 const relations=[...new Set([...(a.relationId?[a.relationId]:[]),...(a.relationIds||[])])].map(id=>foodRelationById[id]);
 a.hint=names+' 개체를 눌러 살펴봐요.'+(a.priorActivity?' 배움에서 '+(a.priorActivity==='producer_quiz'?'양분을 만드는 생물':'구름송편버섯의 역할')+'을 완료해요.':'')+(relations.length?' '+relations.map(r=>organismById[r.sourceSpeciesId].name+' → '+organismById[r.targetSpeciesId].name).join(', ')+'를 실제로 관찰하고 💡에 기록해요.':'')+(a.requiresLitterMeal?' 이번 숲에서 참지렁이가 실제 낙엽 잔해를 먹는지 확인해요.':'')+' 그 뒤 질문에 답해요.';
 a.unlockHint=a.title+' 탐구';
}
