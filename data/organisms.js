import {speciesTaxonomy} from './species-taxonomy.js';
/** Species definitions are independent of inventory and placed instances.
 * @typedef {Object} OrganismDefinition
 * @property {string} id Stable key used by state, assets and future food relationships.
 * @property {string} name
 * @property {'producer'|'consumer'|'decomposer'} role
 * @property {string} description
 * @property {string} caption
 * @property {string} habitat Representative habitat, not a new simulation factor.
 * @property {number} [unlockStage] Planned release metadata; no student unlock bypass.
 * @property {string} [image]
 * @property {string} [placeholder]
 * @property {'static'|'wander'|'forager'} behaviorType
 */
/** @type {ReadonlyArray<OrganismDefinition>} */
const definitions = [
  { id: 'oak', name: '상수리나무', role: 'producer', behaviorType: 'static', caption: '햇빛으로 양분 만들기', description: '햇빛을 이용해 스스로 양분을 만들어요. 도토리와 잎은 서로 다른 생물의 먹이가 돼요.', habitat:'낙엽수 숲과 산기슭',image: './assets/images/oak.svg' },
  { id: 'grass', name: '강아지풀', role: 'producer', behaviorType: 'static', caption: '한해살이 풀', description: '햇빛으로 양분을 만드는 한해살이 벼과 식물이에요. 씨앗으로 다음 세대를 이어가요.',habitat:'숲 가장자리 풀밭', image: './assets/images/grass.svg' },
  { id: 'grasshopper', name: '방아깨비', role: 'consumer', behaviorType: 'forager', caption: '벼과 잎을 먹어요', description: '벼과 식물의 잎을 갉아 먹어요. 이 게임에서는 강아지풀을 벼과 잎 먹이로 단순화해요.',habitat:'해가 드는 풀밭', placeholder: '🦗' },
  { id: 'frog', name: '참개구리', role: 'consumer', behaviorType: 'forager', caption: '작은 곤충을 먹어요', description: '물가의 습한 풀밭에 사는 성체예요. 메뚜기목 곤충 먹이를 이 게임에서는 방아깨비로 단순화해요.',habitat:'습한 숲 가장자리와 물가 주변', placeholder: '🐸' },
  { id: 'rabbit', name: '멧토끼', role: 'consumer', behaviorType: 'forager', caption: '풀을 먹는 초식 동물', description: '풀과 어린 나뭇가지를 먹어요. 게임에서는 강아지풀 잎 먹이로 단순화해요. 굴토끼와 다른 야생 토끼예요.', habitat:'숲 가장자리와 풀밭', image: './assets/images/rabbit.svg' },
  { id: 'mushroom', name: '구름송편버섯', role: 'decomposer', behaviorType: 'static', caption: '죽은 나무를 분해해요', description: '죽은 나무를 분해하는 균류예요. 보이는 버섯은 자실체이며 나무 속의 균사체와 함께 군집으로 나타내요.',habitat:'숲의 죽은 나무 주변', image: './assets/images/mushroom.svg' },
  { id:'pine',name:'소나무',role:'producer',behaviorType:'static',caption:'씨앗을 공급해요',description:'햇빛으로 양분을 만들어요. 다람쥐가 소나무 씨앗을 먹을 수 있어요.',habitat:'산지의 소나무 숲',placeholder:'🌲',unlockStage:14 },
  { id:'raspberry',name:'산딸기',role:'producer',behaviorType:'static',caption:'새가 먹는 열매',description:'숲 가장자리에서 자라요. 직박구리가 열매를 먹을 수 있어요.',habitat:'햇빛이 드는 숲 가장자리',placeholder:'🌿',unlockStage:14 },
  { id:'hazel',name: '팽나무',role:'producer',behaviorType:'static',caption: '잎과 작은 열매',description: '여러 해 동안 자라는 큰 나무예요. 작은 열매를 먹는 새가 씨앗을 옮기는 데 도움을 줘요.',habitat:'산지 숲 가장자리',placeholder:'🌳',unlockStage:14 },
  { id:'chipmunk',name:'다람쥐',role:'consumer',behaviorType:'forager',caption:'도토리·침엽수 씨앗',description:'도토리와 침엽수 씨앗을 이용해요. 소나무 씨앗 먹이는 먹이군을 단순화한 관계예요.',habitat:'낙엽수와 침엽수가 있는 숲',placeholder:'🐿️',unlockStage:14 },
  { id:'field-mouse',name: '고슴도치',role:'consumer',behaviorType:'forager',caption: '곤충을 먹는 잡식 동물',description: '숲 바닥의 곤충과 지렁이 등을 먹어요. 게임은 먹이군을 단순화했어요.',habitat:'숲 가장자리와 풀밭',placeholder:'🦔',unlockStage:14 },
  { id:'caterpillar',name: '솔나방 애벌레(송충이)',role:'consumer',behaviorType:'forager',caption: '솔잎을 먹어요',description: '솔나방의 유충이에요. 소나무 솔잎을 먹고 박새의 먹이가 되기도 해요. 유충 시기가 끝나면 화면에서 나가요.',habitat:'소나무 솔잎 주변',placeholder:'🐛',unlockStage:14 },
  { id:'aphid',name: '청동풍뎅이',role:'consumer',behaviorType:'forager',caption: '잎을 먹는 성충',description: '이번 카드는 성충이에요. 팽나무를 먹이 식물로 이용한 조사 자료가 있어요. 게임에서는 팽나무 잎을 먹어요. 뿌리를 이용하는 유충과 구분하며, 수액 먹이와 빠른 번식은 적용하지 않아요.',habitat:'숲 가장자리 잎 주변',placeholder:'🪲',unlockStage:14 },
  { id:'snail',name: '명주달팽이',role:'consumer',behaviorType:'forager',caption: '습한 곳의 잎 먹이',description: '습한 곳에서 식물 잎 등을 갉아 먹어요. 이 게임의 강아지풀 잎은 먹이군을 단순화한 것이에요.',habitat:'습한 풀밭과 낙엽 주변',placeholder:'🐌',unlockStage:14 },
  { id:'spider',name: '무당거미',role:'consumer',behaviorType:'forager',caption: '그물 가까이에서 기다려요',description: '그물을 치고 먹이를 기다리는 거미예요. 게임에서는 이동을 멈추고 아주 가까운 먹이를 이용해요. 청동풍뎅이는 딱정벌레목 먹이를 단순화한 관계예요.',habitat:'풀과 낮은 식물 주변',placeholder:'🕷️',unlockStage:14 },
  { id:'ladybird',name: '홍단딱정벌레',role:'consumer',behaviorType:'forager',caption: '땅에서 먹이를 찾아요',description: '땅에서 달팽이와 지렁이 먹이를 찾아요. 게임은 먹이군을 단순화했어요.',habitat:'숲 바닥과 낙엽층',placeholder:'🪲',unlockStage:14 },
  { id:'tit',name:'박새',role:'consumer',behaviorType:'forager',caption:'애벌레와 거미',description:'솔나방 애벌레와 거미를 먹어요. 무당거미 먹이는 거미 먹이군을 단순화한 관계예요. 실제 박새는 계절에 따라 열매와 씨앗도 먹어요.',habitat:'나무가 있는 숲과 숲 가장자리',placeholder:'🐦',unlockStage:14 },
  { id:'bulbul',name:'직박구리',role:'consumer',behaviorType:'forager',caption:'열매와 애벌레',description:'열매와 애벌레를 먹어요. 먹이 자료를 바탕으로 게임에 단순화했어요.',habitat:'숲과 관목이 있는 숲 가장자리',placeholder:'🐦',unlockStage:14 },
  { id:'snake',name:'유혈목이',role:'consumer',behaviorType:'forager',caption:'개구리를 먹는 뱀',description:'개구리를 찾아 먹는 뱀이에요. 실제 야생 뱀은 가까이 가거나 만지지 않아요.',habitat:'습한 숲 가장자리와 풀밭',placeholder:'🐍',unlockStage:14 },
  { id:'weasel',name:'족제비',role:'consumer',behaviorType:'forager',caption:'여러 동물을 먹어요',description:'다람쥐류·개구리류·곤충·지렁이 등을 먹어요. 게임에서는 가까운 유효 먹이를 찾아요.',habitat:'숲 가장자리와 농경지 주변',placeholder:'🐾',unlockStage:14 },
  { id:'goshawk',name:'참매',role:'consumer',behaviorType:'forager',caption:'숲의 상위 소비자',description:'멧토끼, 다람쥐, 직박구리 같은 동물을 사냥해요. 이 게임은 가까운 먹이를 향한 이동으로 단순화했어요.',habitat:'큰 나무가 있는 산림',placeholder:'🦅',unlockStage:14 },
  { id:'litter-mold',name: '낙엽 분해 곰팡이 군집',role:'decomposer',behaviorType:'static',caption: '낙엽을 분해하는 여러 균류',description: '낙엽을 분해하는 여러 곰팡이를 묶은 군집이에요. 한 종의 이름이 아니며 낙엽의 유기물을 다시 이용하도록 도와요.',habitat:'습한 낙엽층',placeholder:'〰',unlockStage:14 },
  { id:'soil-bacteria',name: '고초균',role:'decomposer',behaviorType:'static',caption: '유기물을 이용하는 세균',description: '여러 유기물을 이용하는 토양 세균이에요. 게임은 동물 잔존물 분해를 우선 나타내요. 동물 잔존물만 먹는다는 뜻은 아니에요. 영양이 적으면 포자로 쉬는 생활을 군집 휴식으로 단순화해요.',habitat:'유기물이 있는 토양',placeholder:'⋯' },
  { id:'earthworm',name:'참지렁이',role:'consumer',behaviorType:'wander',caption:'분해를 돕는 토양동물',description:'낙엽을 먹고 토양을 돕는 소비자예요. 다른 동물의 먹이가 되기도 해요. 균류·세균과 역할이 달라요.',habitat:'습한 흙과 낙엽층',placeholder:'∿',unlockStage:14 },
];
export const organisms = definitions.map(definition=>({...definition,...speciesTaxonomy[definition.id]}));
export const roleLabels = { producer: '생산자', consumer: '소비자', decomposer: '분해자' };
export const organismById = Object.fromEntries(organisms.map(organism => [organism.id, organism]));
