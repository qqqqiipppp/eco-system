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
export const organisms = [
  { id: 'oak', name: '상수리나무', role: 'producer', behaviorType: 'static', caption: '햇빛으로 양분 만들기', description: '햇빛을 이용해 스스로 양분을 만들어요. 도토리와 잎은 서로 다른 생물의 먹이가 돼요.', habitat:'낙엽수 숲과 산기슭',image: './assets/images/oak.svg' },
  { id: 'grass', name: '풀', role: 'producer', behaviorType: 'static', caption: '메뚜기의 먹이', description: '햇빛을 이용해 양분을 만들어요. 이 카드는 숲 가장자리의 벼과 풀을 대표해요.',habitat:'숲 가장자리 풀밭', image: './assets/images/grass.svg' },
  { id: 'grasshopper', name: '메뚜기', role: 'consumer', behaviorType: 'forager', caption: '풀을 찾아 먹어요', description: '이 카드의 메뚜기는 벼과 풀의 잎을 먹어요. 개구리의 먹이가 되기도 해요.',habitat:'해가 드는 풀밭', placeholder: '🦗' },
  { id: 'frog', name: '개구리', role: 'consumer', behaviorType: 'forager', caption: '작은 동물을 먹어요', description: '이 카드는 성체 개구리를 대표해요. 가까운 메뚜기와 작은 거미를 찾아 먹어요.',habitat:'습한 숲 가장자리와 물가 주변', placeholder: '🐸' },
  { id: 'rabbit', name: '토끼', role: 'consumer', behaviorType: 'forager', caption: '풀을 먹는 초식 동물', description: '풀의 잎을 찾아 먹어요. 이 카드는 숲 가장자리의 멧토끼를 대표해요.', habitat:'숲 가장자리와 풀밭', image: './assets/images/rabbit.svg' },
  { id: 'mushroom', name: '버섯', role: 'decomposer', behaviorType: 'static', caption: '숲의 양분을 돌려주기', description: '죽은 나무를 분해하는 버섯 유형이에요. 죽은 나무의 유기물 분해를 도와 토양 양분에 기여해요.',habitat:'숲의 죽은 나무 주변', image: './assets/images/mushroom.svg' },
  { id:'pine',name:'소나무',role:'producer',behaviorType:'static',caption:'씨앗을 공급해요',description:'햇빛으로 양분을 만들어요. 다람쥐가 소나무 씨앗을 먹을 수 있어요.',habitat:'산지의 소나무 숲',placeholder:'🌲',unlockStage:14 },
  { id:'raspberry',name:'산딸기',role:'producer',behaviorType:'static',caption:'새가 먹는 열매',description:'숲 가장자리에서 자라요. 직박구리가 열매를 먹을 수 있어요.',habitat:'햇빛이 드는 숲 가장자리',placeholder:'🌿',unlockStage:14 },
  { id:'hazel',name:'개암나무',role:'producer',behaviorType:'static',caption:'열매와 수액',description:'개암 열매는 다람쥐의 먹이예요. 개암나무에 사는 진딧물은 수액을 빨아 먹어요.',habitat:'산지 숲 가장자리',placeholder:'🌳',unlockStage:14 },
  { id:'chipmunk',name:'다람쥐',role:'consumer',behaviorType:'forager',caption:'도토리·씨앗·개암',description:'가까운 도토리, 소나무 씨앗, 개암 열매를 찾아 먹어요.',habitat:'낙엽수와 침엽수가 있는 숲',placeholder:'🐿️',unlockStage:14 },
  { id:'field-mouse',name:'등줄쥐',role:'consumer',behaviorType:'forager',caption:'씨앗도 작은 동물도',description:'도토리와 풀의 씨앗, 작은 나방 애벌레를 먹을 수 있는 잡식 동물이에요.',habitat:'숲 가장자리와 풀밭',placeholder:'🐁',unlockStage:14 },
  { id:'caterpillar',name:'나방 애벌레',role:'consumer',behaviorType:'forager',caption:'참나무 잎을 먹어요',description:'이 카드는 참나무 잎을 먹는 작은 나방 유충 유형을 대표해요. 모든 나방이 같은 식물을 먹지는 않아요.',habitat:'참나무 잎 주변',placeholder:'🐛',unlockStage:14 },
  { id:'aphid',name:'진딧물',role:'consumer',behaviorType:'forager',caption:'개암나무 수액',description:'이 카드는 개암나무에 사는 진딧물 유형이에요. 잎을 통째로 먹지 않고 수액을 빨아요.',habitat:'개암나무 잎과 가지 주변',placeholder:'•',unlockStage:14 },
  { id:'snail',name:'달팽이',role:'consumer',behaviorType:'forager',caption:'풀의 잎을 천천히',description:'이 카드는 잎을 먹는 육상 달팽이 유형이에요. 천천히 풀의 잎을 찾아 먹어요.',habitat:'습한 풀밭과 낙엽 주변',placeholder:'🐌',unlockStage:14 },
  { id:'spider',name:'거미',role:'consumer',behaviorType:'forager',caption:'작은 곤충을 사냥해요',description:'작은 진딧물과 나방 애벌레를 먹는 사냥 거미 유형이에요. 거미줄 사냥은 아직 표현하지 않아요.',habitat:'풀과 낮은 식물 주변',placeholder:'🕷️',unlockStage:14 },
  { id:'ladybird',name:'무당벌레',role:'consumer',behaviorType:'forager',caption:'진딧물을 먹어요',description:'이 카드의 무당벌레는 진딧물을 잡아먹어요. 모든 무당벌레가 같은 먹이를 먹는 것은 아니에요.',habitat:'진딧물이 있는 식물 주변',placeholder:'🐞',unlockStage:14 },
  { id:'tit',name:'박새',role:'consumer',behaviorType:'forager',caption:'애벌레와 거미',description:'나방 애벌레와 거미를 찾아 먹어요. 실제 박새는 계절에 따라 열매와 씨앗도 먹어요.',habitat:'나무가 있는 숲과 숲 가장자리',placeholder:'🐦',unlockStage:14 },
  { id:'bulbul',name:'직박구리',role:'consumer',behaviorType:'forager',caption:'산딸기 열매',description:'산딸기 열매를 찾아 먹어요. 실제로는 다른 열매와 곤충도 먹지만 이 게임에는 확인한 관계만 연결해요.',habitat:'숲과 관목이 있는 숲 가장자리',placeholder:'🐦',unlockStage:14 },
  { id:'snake',name:'유혈목이',role:'consumer',behaviorType:'forager',caption:'개구리를 먹는 뱀',description:'개구리를 찾아 먹는 뱀이에요. 실제 야생 뱀은 가까이 가거나 만지지 않아요.',habitat:'습한 숲 가장자리와 풀밭',placeholder:'🐍',unlockStage:14 },
  { id:'weasel',name:'족제비',role:'consumer',behaviorType:'forager',caption:'여러 동물을 먹어요',description:'쥐, 다람쥐, 개구리, 메뚜기 등 이용할 수 있는 먹이를 찾아요.',habitat:'숲 가장자리와 농경지 주변',placeholder:'🐾',unlockStage:14 },
  { id:'goshawk',name:'참매',role:'consumer',behaviorType:'forager',caption:'숲의 상위 소비자',description:'토끼, 다람쥐, 직박구리 같은 동물을 사냥해요. 이 게임은 가까운 먹이를 향한 이동으로 단순화했어요.',habitat:'큰 나무가 있는 산림',placeholder:'🦅',unlockStage:14 },
  { id:'litter-mold',name:'낙엽 분해 곰팡이',role:'decomposer',behaviorType:'static',caption:'죽은 낙엽의 물질',description:'낙엽을 분해하는 곰팡이 무리를 대표해요. 낙엽의 유기물 분해를 도와요.',habitat:'습한 낙엽층',placeholder:'〰',unlockStage:14 },
  { id:'soil-bacteria',name:'토양 분해 세균',role:'decomposer',behaviorType:'static',caption:'작은 분해자의 역할',description:'죽은 생물의 유기물 분해를 돕는 토양 세균 무리를 대표해요. 눈에 보이지 않는 생물을 표시로 나타냈어요.',habitat:'유기물이 있는 토양',placeholder:'⋯',unlockStage:14 },
];
export const roleLabels = { producer: '생산자', consumer: '소비자', decomposer: '분해자' };
export const organismById = Object.fromEntries(organisms.map(organism => [organism.id, organism]));
