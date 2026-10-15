import {organismById} from './organisms.js';
import {foodRelationById} from './food-relations.js';
// Each route uses earlier actual inspection/discovery evidence, never its own locked card.
const route=(id,title,inspect,question,correct,wrong,extra={})=>({activityId:'explore_'+id,type:'exploration',collection:true,title,prompt:question,inspect,choices:[{id:'correct',label:correct},{id:'other',label:wrong}],correctAnswer:'correct',unlockSpeciesId:id,pointReward:0,learningOutcome:correct,...extra});
export const cardUnlocks=[
 route('pine','소나무와 생산자',['oak'],'소나무도 상수리나무처럼 양분을 만들려면 무엇이 필요할까요?','햇빛·물·공기와 알맞은 토양','다른 동물만 먹으면 돼요',{priorActivity:'producer_quiz'}),
 route('raspberry','숲 가장자리 식물',['grass'],'산딸기는 어떤 역할일까요?','햇빛을 이용해 양분을 만드는 생산자','열매를 먹는 소비자',{priorActivity:'producer_quiz'}),
 route('hazel','나무의 잎과 열매',['pine'],'팽나무의 잎과 열매는 어떤 점이 중요할까요?','서로 다른 생물에게 먹이를 제공해요','모든 소비자가 같은 부분만 먹어요'),
 route('chipmunk','나무와 다람쥐',['oak'],'이 숲의 다람쥐가 상수리나무에서 얻는 먹이는?','도토리','나무줄기의 목재'),
 route('field-mouse','풀밭의 곤충 먹이',['grasshopper'],'이 게임에서 고슴도치에게 연결한 먹이는?','방아깨비 같은 곤충','상수리나무 도토리',{relationId:'v2_grass_to_grasshopper'}),
 route('caterpillar','솔잎과 애벌레',['pine'],'솔나방 애벌레가 먹는 소나무의 부분은?','솔잎','소나무의 씨앗'),
 route('aphid','팽나무 잎 탐구',['hazel'],'이 게임의 청동풍뎅이 성충이 이용하는 것은?','팽나무의 잎','팽나무 뿌리만 먹어요'),
 route('snail','습한 풀밭 탐구',['grass'],'명주달팽이의 생활 공간과 먹이로 알맞은 것은?','습한 풀밭에서 식물 잎을 이용해요','마른 하늘에서 새를 잡아요'),
 route('spider','기다리는 소비자',['aphid'],'무당거미의 생활을 어떻게 나타냈을까요?','그물 가까이에서 아주 가까운 곤충을 기다려요','햇빛으로 스스로 양분을 만들어요'),
 route('ladybird','낙엽층의 사냥꾼',['snail'],'이 게임에서 홍단딱정벌레가 먹을 수 있는 것은?','명주달팽이','소나무 솔잎'),
 route('tit','곤충에서 새로',['caterpillar'],'솔나방 애벌레를 먹는 새는?','박새','소나무',{relationId:'v2_pine_to_caterpillar'}),
 route('bulbul','열매와 새',['raspberry'],'이 게임에서 산딸기 열매를 먹는 새는?','직박구리','참개구리'),
 route('snake','개구리와 뱀',['frog'],'유혈목이는 이 숲에서 무엇을 먹을까요?','참개구리','강아지풀',{relationId:'v2_grasshopper_to_frog'}),
 route('weasel','여러 먹이를 이용하는 동물',['chipmunk'],'족제비에게 연결한 먹이로 알맞은 것은?','다람쥐·참개구리·방아깨비','소나무 씨앗만 먹어요'),
 route('goshawk','숲의 상위 소비자',['chipmunk'],'이 숲의 참매가 먹는 생물은?','다람쥐·멧토끼·직박구리','모든 생물을 무조건 먹어요',{relationId:'v2_oak_to_chipmunk'}),
 route('earthworm','낙엽과 토양동물',['mushroom','soil-bacteria'],'참지렁이와 균류·세균은 어떻게 다를까요?','참지렁이는 낙엽 같은 잔해를 먹으며 토양을 돕는 소비자예요','참지렁이도 균류와 같은 생물이에요',{priorActivity:'decomposer_classify'}),
 route('litter-mold','낙엽을 분해하는 균류',['earthworm'],'낙엽 분해 곰팡이 군집의 역할은?','낙엽을 분해하는 여러 균류를 묶어 나타내요','살아 있는 새를 사냥해요'),
];

for(const [index,a]of cardUnlocks.entries()){
 if(index%2)a.choices.reverse(); // Stable ordering without always putting the answer first.
 const names=a.inspect.map(id=>organismById[id].name).join('·');
 const r=foodRelationById[a.relationId];
 a.hint=names+' 실제 개체를 눌러 살펴봐요.'+(a.priorActivity?' 배움에서 '+(a.priorActivity==='producer_quiz'?'양분을 만드는 생물':'구름송편버섯의 역할')+'을 완료해요.':'')+(r?' '+organismById[r.sourceSpeciesId].name+' → '+organismById[r.targetSpeciesId].name+'를 실제로 관찰하고 💡에 기록해요.':'')+' 그 뒤 이 질문에 답해요.';
 a.unlockHint=a.title+' 탐구';
}
