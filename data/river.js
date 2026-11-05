// The river theme (강): its own organisms, living spaces and chapters, put in
// place of the forest's when the student explores the river (main.js, chapter
// mode only). The forest's tables are only added to, so nothing of the forest
// changes; its chapter list is swapped for the river's.
// Teaching-game values, not measurements, like the forest's.
import {organisms,organismById} from './organisms.js';
import {foodResourceConfig,feedingConfig} from './ecology-config.js';
import {producerGrowth} from './environment-config.js';
import {lifespanRules} from './lifespan-config.js';
import {starvationLimits,satietySeconds,decompositionConfig} from './population-config.js';
import {organicWorkers} from './detritus-config.js';
import {placementConfig,speciesProfiles} from './interaction-config.js';
import {speciesHabitats,habitatZones} from './habitats.js';
import {speciesCards} from './species-cards.js';
import {foodEvidence} from './food-evidence.js';
import {edge,addFoodRelations,foodPartLabels} from './food-relations.js';
import {addDiscoveryEvent,addShortageEvent} from './event-config.js';
import {chapters,stages,stageById,stageConfig,breeding,growth as stageGrowth,invaderPrey} from './chapters.js';
import {ecologySeconds,ecologyRate,scaleFields} from './pacing-config.js';
import {survivalConfig} from './survival-config.js';
import {crisisQuestions} from './crisis-reflection.js';

// Living spaces on the river picture (2400 x 940, assets/images/backgrounds):
// the waterline at y 423 (.45), the riverbed band from y 799 (.85). The bank
// slopes from the waterline at x 1776 (.74) down-left to x 1500 (.63) at the
// bottom, so the land widens with depth; underwater spaces stay left of it.
// A position is where the organism's feet or base is.
// Spaces overlap where an animal meets its food: small algae grow low in the
// water just above the bed, where both water animals and bed animals reach them.
export const riverZones = {
  surface: {left: .2, right: .72, top: .22, bottom: .43},
  water: {left: .04, right: .6, top: .56, bottom: .88},
  algae: {left: .04, right: .6, top: .83, bottom: .88},
  bottom: {left: .04, right: .6, top: .83, bottom: .95},
  shore: {left: .74, right: .96, top: .3, bottom: .6},
  // Plants of the bank (부들) stand on the land above the waterline.
  bank: {left: .77, right: .95, top: .32, bottom: .44},
  // A frog sits on the bank and the water's edge, where water striders skate.
  frogShore: {left: .56, right: .95, top: .3, bottom: .44},
};
const riverHabitatZones = {surface: '수면', water: '물속', algae: '물 바닥 가까운 물속', bottom: '물 바닥', shore: '물가', bank: '물가 흙', frogShore: '물가와 물 가장자리'};

const life = (min, max, label, unit, extra = {}) => ({model: 'individual', min: min * 60, max: max * 60, initialAge: .08, label, unit, ...extra});
const card = (intro, rows) => ({intro, rows: rows.map(([key, label, text]) => ({key, label, text})), photos: []});
const producerRows = (needs, eatenBy, home) => [['role', '역할', '햇빛을 받아 스스로 양분을 만들어서 생산자예요.'], ['needs', '필요한 것', needs], ['eatenBy', '나를 먹는 것', eatenBy], ['home', '사는 곳', home]];

// zone: the living space; motion: how it moves (none for a producer).
export const riverSpecies = [
  {id: 'algae', name: '작은 조류', role: 'producer', behaviorType: 'static', zone: 'algae',
    caption: '물속에서 양분을 만들어요', description: '반달말·해캄처럼 아주 작은 조류를 묶었어요. 물속에서 햇빛으로 양분을 만들어요.', habitat: '고인 물속',
    scientificName: null, taxonKind: 'functional-group', taxonomyNote: '반달말·해캄 같은 여러 작은 조류를 묶은 무리예요.',
    food: {maximum: 3, portion: 1, recoveryPerSecond: .07, parts: ['whole']}, growth: {sunlight: .45, water: .4, air: .1, soil: .05},
    life: life(24, 32, '빠르게 자라고 새로 생기는 작은 조류예요', '무리', {matter: 'litter', matterAmount: 1}), size: [48, 36],
    card: card('현미경으로 보아야 잘 보이는 아주 작은 초록 생물이에요.', producerRows('햇빛 · 물 · 공기', '물벼룩, 올챙이, 우렁이가 먹어요.', '논, 연못처럼 고인 물'))},
  {id: 'duckweed', name: '개구리밥', role: 'producer', behaviorType: 'static', zone: 'surface',
    caption: '물에 떠서 자라요', description: '작은 잎이 물 위에 떠서 자라고, 짧은 뿌리를 물속에 늘어뜨려요.', habitat: '논과 연못의 수면',
    scientificName: 'Spirodela polyrhiza', growth: {sunlight: .45, water: .4, air: .1, soil: .05},
    life: life(24, 32, '물 위에서 빠르게 늘어나는 풀이에요', '포기', {matter: 'litter', matterAmount: 1}), size: [48, 30],
    card: card('잎이 물 위에 동동 떠 있는 아주 작은 풀이에요.', producerRows('햇빛 · 물 · 공기', '오리, 물고기, 우렁이가 먹어요.', '논, 연못의 물 위'))},
  {id: 'water-lily', name: '수련', role: 'producer', behaviorType: 'static', zone: 'surface',
    caption: '물 위에 잎을 띄워요', description: '물 바닥 흙에 뿌리를 내리고, 둥근 잎과 꽃을 물 위에 띄워요.', habitat: '연못',
    scientificName: 'Nymphaea tetragona', growth: {sunlight: .4, water: .35, air: .1, soil: .15},
    life: life(60, 90, '여러 해 사는 물풀이에요', '포기', {matter: 'litter', matterAmount: 1}), size: [60, 40],
    card: card('낮에 꽃이 피었다가 저녁에 오므라드는 연못의 물풀이에요.', producerRows('햇빛 · 물 · 공기 · 흙', '곤충과 우렁이가 잎을 갉아 먹어요.', '연못 바닥 흙에 뿌리를 내려요'))},
  {id: 'daphnia', name: '물벼룩', role: 'consumer', behaviorType: 'forager', zone: 'water',
    caption: '작은 조류를 먹어요', description: '몸이 투명한 아주 작은 동물이에요. 물속을 톡톡 뛰듯이 헤엄치며 작은 조류를 먹어요.', habitat: '고인 물속',
    scientificName: 'Daphnia pulex', feeding: {initialHunger: .45, hungerPerSecond: .035, hungryAt: .6, mealRelief: .65, searchRadius: .34, speed: .03},
    motion: {speedX: .012, speedY: .008, walkSeconds: [.6, 1.2], pauseSeconds: [.6, 1.4]}, life: life(12, 18, '짧은 생애를 가지며 세대가 빨리 바뀌어요', '마리'), size: [40, 32],
    card: card('현미경으로 보면 몸속까지 비쳐 보이는 작은 동물이에요.', [['role', '역할', '작은 조류를 먹고 살아서 소비자예요.'], ['eats', '먹는 것', '물속의 작은 조류를 걸러 먹어요.'], ['eatenBy', '나를 먹는 것', '송사리 같은 작은 물고기가 먹어요.'], ['home', '사는 곳', '논, 연못처럼 고인 물']])},
  {id: 'medaka', name: '송사리', role: 'consumer', behaviorType: 'forager', zone: 'water',
    caption: '물벼룩을 먹어요', description: '논과 연못에 사는 작은 물고기예요. 물벼룩 같은 작은 동물을 잡아먹어요.', habitat: '논, 연못, 느린 개울',
    scientificName: 'Oryzias latipes', feeding: {initialHunger: .45, hungerPerSecond: .02, hungryAt: .6, mealRelief: .7, searchRadius: .3, speed: .05},
    motion: {speedX: .035, speedY: .008, walkSeconds: [1, 2], pauseSeconds: [.5, 1.2]}, life: life(40, 55, '한두 해 사는 작은 물고기예요', '마리'), size: [48, 32],
    starvation: 420, satiety: 240, predatorSatiety: .4,
    card: card('눈이 크고 몸이 작은 물고기로, 물 위쪽에서 떼 지어 헤엄쳐요.', [['role', '역할', '물벼룩을 잡아먹고 살아서 소비자예요.'], ['eats', '먹는 것', '물벼룩, 장구벌레 같은 작은 동물을 먹어요.'], ['eatenBy', '나를 먹는 것', '물방개, 메기, 왜가리가 먹어요.'], ['home', '사는 곳', '논, 연못, 물살이 느린 개울']])},
  {id: 'pond-snail', name: '논우렁이', role: 'consumer', behaviorType: 'forager', zone: 'bottom',
    caption: '조류를 갉아 먹어요', description: '물 바닥을 천천히 기어 다니며 작은 조류와 물풀을 갉아 먹어요.', habitat: '논과 연못 바닥',
    scientificName: 'Cipangopaludina chinensis malleata', feeding: {initialHunger: .45, hungerPerSecond: .025, hungryAt: .6, mealRelief: .65, searchRadius: .3, speed: .012},
    motion: {speedX: .006, speedY: .002, walkSeconds: [2, 4], pauseSeconds: [1, 2]}, life: life(50, 70, '여러 해 사는 우렁이예요', '마리'), size: [44, 34], starvation: 480,
    card: card('둥근 껍데기를 지고 물 바닥을 기어 다니는 우렁이예요.', [['role', '역할', '작은 조류와 물풀을 먹고 살아서 소비자예요.'], ['eats', '먹는 것', '물 바닥과 돌에 붙은 작은 조류, 물풀을 갉아 먹어요.'], ['eatenBy', '나를 먹는 것', '왜가리 같은 물새와 가재가 먹어요.'], ['home', '사는 곳', '논, 연못의 바닥']])},
  // It eats small insects that fall onto the water, which the river does not
  // show: it is never hungry in the game (a simplification).
  {id: 'water-strider', name: '소금쟁이', role: 'consumer', behaviorType: 'forager', zone: 'surface',
    caption: '물 위에 떨어진 벌레를 먹어요', description: '긴 다리로 물 위에 서서 미끄러지듯 다녀요. 물에 떨어진 작은 벌레를 잡아먹어요. 이 게임에서는 그 먹이를 따로 보여 주지 않아요.', habitat: '연못과 개울의 수면',
    scientificName: 'Aquarius paludum', motion: {speedX: .05, speedY: .012, walkSeconds: [.4, .9], pauseSeconds: [.8, 1.6]}, life: life(30, 40, '한 해 사는 곤충이에요', '마리'), size: [52, 30],
    card: card('가늘고 긴 다리로 물 위에 떠서 다니는 곤충이에요.', [['role', '역할', '다른 동물을 먹고 살아서 소비자예요.'], ['eats', '먹는 것', '물에 떨어진 작은 곤충의 즙을 빨아 먹어요.'], ['eatenBy', '나를 먹는 것', '개구리와 물고기가 먹어요.'], ['home', '사는 곳', '연못, 논, 개울의 물 위']])},
  {id: 'cattail', name: '부들', role: 'producer', behaviorType: 'static', zone: 'bank',
    caption: '물가에 뿌리를 내려요', description: '물가의 축축한 흙에 뿌리를 내리고 길쭉한 잎과 소시지 모양 이삭을 올려요.', habitat: '연못과 강의 물가',
    scientificName: 'Typha orientalis', growth: {sunlight: .4, water: .3, air: .1, soil: .2},
    life: life(60, 90, '여러 해 사는 물가 풀이에요', '포기', {matter: 'litter', matterAmount: 1}), size: [100, 75],
    card: card('갈색 소시지 모양 이삭이 달리는 물가 풀이에요.', producerRows('햇빛 · 물 · 공기 · 흙', '뉴트리아가 뿌리를 갉아 먹어요.', '연못과 강의 물가 흙'))},
  // A frog's young: grows into a frog on the bank when it keeps eating (stageGrowth).
  {id: 'frog-tadpole', name: '올챙이', role: 'consumer', behaviorType: 'forager', zone: 'water',
    caption: '작은 조류를 먹고 자라요', description: '참개구리의 어린 시기예요. 물속에서 꼬리로 헤엄치며 작은 조류를 먹고 자라 개구리가 돼요.', habitat: '연못과 논의 물속',
    scientificName: 'Pelophylax nigromaculatus', taxonomyNote: '참개구리의 올챙이 시기예요.', feeding: {initialHunger: .5, hungerPerSecond: .035, hungryAt: .5, mealRelief: .65, searchRadius: .34, speed: .03},
    motion: {speedX: .02, speedY: .008, walkSeconds: [.8, 1.6], pauseSeconds: [.6, 1.2]}, life: life(30, 40, '자라서 참개구리가 되는 어린 시기예요', '마리'), size: [40, 28],
    card: card('꼬리로 헤엄치는 참개구리의 어린 시기예요.', [['role', '역할', '작은 조류를 먹고 살아서 소비자예요.'], ['eats', '먹는 것', '물속의 작은 조류와 물풀을 갉아 먹어요.'], ['eatenBy', '나를 먹는 것', '물방개, 메기, 물고기가 먹어요.'], ['life', '한살이', '알 → 올챙이 → 뒷다리 → 앞다리 → 꼬리가 줄어 개구리 (탈바꿈)']])},
  {id: 'diving-beetle', name: '물방개', role: 'consumer', behaviorType: 'forager', zone: 'water',
    caption: '올챙이와 작은 물고기를 먹어요', description: '노처럼 생긴 뒷다리로 물속을 헤엄치는 곤충이에요. 올챙이와 작은 물고기를 잡아먹어요.', habitat: '연못과 논의 물속',
    scientificName: 'Cybister chinensis', feeding: {initialHunger: .45, hungerPerSecond: .02, hungryAt: .6, mealRelief: .7, searchRadius: .3, speed: .045},
    motion: {speedX: .03, speedY: .012, walkSeconds: [.8, 1.6], pauseSeconds: [.6, 1.4]}, life: life(50, 70, '여러 해 사는 물속 곤충이에요', '마리'), size: [44, 32],
    starvation: 480, satiety: 300, predatorSatiety: .4,
    card: card('매끈한 검녹색 몸에 노란 테두리가 있는 물속 곤충이에요.', [['role', '역할', '다른 동물을 잡아먹고 살아서 소비자예요.'], ['eats', '먹는 것', '올챙이, 작은 물고기, 물속 곤충을 먹어요.'], ['eatenBy', '나를 먹는 것', '메기, 새가 먹어요.'], ['home', '사는 곳', '연못과 논의 물속, 물풀 사이']])},
  {id: 'catfish', name: '메기', role: 'consumer', behaviorType: 'forager', zone: 'bottom',
    caption: '물고기와 올챙이를 먹어요', description: '납작한 머리와 긴 수염으로 바닥 근처를 다니며 작은 물고기, 올챙이, 물방개를 잡아먹어요.', habitat: '연못과 강의 바닥',
    scientificName: 'Silurus asotus', feeding: {initialHunger: .45, hungerPerSecond: .018, hungryAt: .6, mealRelief: .75, searchRadius: .32, speed: .04},
    motion: {speedX: .02, speedY: .004, walkSeconds: [1.5, 3], pauseSeconds: [1, 2]}, life: life(80, 110, '여러 해 사는 큰 물고기예요', '마리'), size: [60, 36],
    starvation: 600, satiety: 360, predatorSatiety: .5,
    card: card('수염 두 쌍으로 먹이를 찾는 바닥의 물고기예요.', [['role', '역할', '다른 동물을 잡아먹고 살아서 소비자예요.'], ['eats', '먹는 것', '작은 물고기, 올챙이, 개구리, 물속 곤충을 먹어요.'], ['eatenBy', '나를 먹는 것', '다 자라면 먹는 동물이 거의 없어요. 어릴 때는 큰 물고기와 새가 먹어요.'], ['home', '사는 곳', '연못과 강의 진흙 바닥']])},
  {id: 'water-decomposer', name: '물속 분해자', role: 'decomposer', behaviorType: 'static', zone: 'bottom',
    caption: '죽은 생물을 분해해요', description: '물 바닥의 세균과 곰팡이를 묶었어요. 가라앉은 낙엽과 죽은 생물을 분해해 물과 흙의 양분으로 돌려보내요.', habitat: '연못과 강의 바닥',
    scientificName: null, taxonKind: 'functional-group', taxonomyNote: '물 바닥의 여러 세균과 곰팡이를 묶은 무리예요.',
    life: {model: 'colony', min: 8 * 60, max: 12 * 60, resource: 'litter', stressSeconds: 20 * 60, label: '죽은 생물을 이용하며 새로 자라는 군집이에요', unit: '군집'}, size: [48, 34],
    card: card('현미경으로 보아야 보이는 세균과 하얀 실 같은 곰팡이예요.', [['role', '역할', '죽은 생물을 분해해 양분을 얻어서 분해자예요.'], ['job', '하는 일', '가라앉은 낙엽과 죽은 생물을 분해해 물과 흙의 양분으로 돌려보내요.'], ['home', '사는 곳', '연못과 강의 바닥, 썩은 낙엽 위']])},
  // Invaders (외래종): the stage's boss, not a card. Drawn bigger (about 1.6x).
  {id: 'bullfrog', name: '황소개구리', role: 'consumer', behaviorType: 'forager', zone: 'frogShore', invader: true,
    caption: '외래종: 무엇이든 잡아먹어요', description: '북아메리카에서 들여온 큰 개구리예요. 올챙이, 물고기, 참개구리까지 잡아먹어 생태계 교란 생물로 지정되었어요.', habitat: '연못, 저수지, 느린 강',
    scientificName: 'Lithobates catesbeianus', motion: {speedX: .02, speedY: .006, walkSeconds: [.8, 1.6], pauseSeconds: [1, 2]}, life: life(300, 400, '외래종이에요', '마리'), size: [84, 64],
    card: card('참개구리보다 훨씬 큰 외래종 개구리예요.', [['role', '역할', '다른 동물을 잡아먹고 살아서 소비자예요.'], ['eats', '먹는 것', '곤충, 올챙이, 물고기, 개구리, 작은 뱀까지 먹어요.'], ['eatenBy', '나를 먹는 것', '우리나라에는 천적이 적어서 빨리 늘어나요.'], ['wow', '알아 두기', '1998년에 생태계 교란 생물로 지정되었어요.']])},
  {id: 'red-swamp-crayfish', name: '미국가재', role: 'consumer', behaviorType: 'forager', zone: 'bottom', invader: true,
    caption: '외래종: 물풀을 자르고 작은 동물을 먹어요', description: '북아메리카에서 들여온 붉은 가재예요. 물풀을 잘라 먹고 올챙이, 우렁이, 작은 물고기를 먹어 생태계 교란 생물로 지정되었어요.', habitat: '연못, 논, 느린 강',
    scientificName: 'Procambarus clarkii', motion: {speedX: .015, speedY: .003, walkSeconds: [1, 2], pauseSeconds: [1, 2]}, life: life(300, 400, '외래종이에요', '마리'), size: [84, 64],
    card: card('붉고 오돌토돌한 큰 집게를 가진 외래종 가재예요.', [['role', '역할', '여러 생물을 먹고 살아서 소비자예요.'], ['eats', '먹는 것', '물풀, 올챙이, 우렁이, 작은 물고기를 먹어요.'], ['eatenBy', '나를 먹는 것', '천적이 적어서 빨리 늘어나요.'], ['wow', '알아 두기', '2019년에 생태계 교란 생물로 지정되었어요.']])},
];

// Eaten -> eater, like the forest's food relations. R: river sources.
export const riverFoodRelations = [
  edge('algae', 'daphnia', 'whole', 'R1', 'B', true),
  edge('daphnia', 'medaka', 'animal', 'R2', 'B', true),
  edge('algae', 'pond-snail', 'whole', 'R3'),
  edge('algae', 'frog-tadpole', 'whole', 'R4'),
  edge('frog-tadpole', 'diving-beetle', 'animal', 'R5', 'B', true),
  edge('medaka', 'diving-beetle', 'animal', 'R5'),
  edge('water-strider', 'frog', 'animal', 'R6'),
  edge('medaka', 'catfish', 'animal', 'R7', 'B', true),
  edge('frog-tadpole', 'catfish', 'animal', 'R7'),
  edge('diving-beetle', 'catfish', 'animal', 'R7'),
];
// What an invader eats while it stays (the boss rule, not the feeding system).
export const riverInvaderPrey = {
  bullfrog: ['frog-tadpole', 'medaka', 'frog', 'diving-beetle'],
  'red-swamp-crayfish': ['frog-tadpole', 'pond-snail', 'medaka', 'daphnia'],
};
const riverEvidence = {
  R1: {url: 'https://species.nibr.go.kr/', location: '물벼룩류 > 먹이', note: '물벼룩은 물속의 작은 조류를 걸러 먹어요. 특정 조류 종과의 쌍은 단순화했어요.'},
  R2: {url: 'https://species.nibr.go.kr/', location: '송사리 > 먹이', note: '송사리는 물벼룩 같은 작은 동물성 플랑크톤을 먹어요.'},
  R3: {url: 'https://species.nibr.go.kr/', location: '논우렁이 > 먹이', note: '우렁이는 바닥과 물풀에 붙은 조류를 갉아 먹어요.'},
  R4: {url: 'https://species.nibr.go.kr/', location: '참개구리 올챙이 > 먹이', note: '올챙이는 물속의 조류와 물풀을 갉아 먹어요.'},
  R5: {url: 'https://genebank.rda.go.kr/PB/jw/insectView.bo?page=1&species_id=ZO1CR0046&use_kind=03', location: '물방개 > 먹이', note: '물방개는 올챙이와 작은 물고기 같은 물속 동물을 잡아먹어요.'},
  R7: {url: 'https://www.gb.go.kr/Main/marinefishery/page.do?mnu_uid=15943', location: '메기 > 먹이', note: '메기는 밤에 바닥 근처에서 작은 물고기와 개구리, 물속 곤충을 잡아먹어요.'},
  R6: {url: 'https://www.honda.co.jp/outdoor/adventure/tonosamagaeru.html', location: '참개구리 > 먹이', note: '참개구리는 물가와 물 위의 곤충을 잡아먹어요. 소금쟁이 특정 쌍은 단순화했어요.'},
};

export const riverPrices = {algae: 3, duckweed: 3, 'water-lily': 5, cattail: 3, daphnia: 3, medaka: 6, 'pond-snail': 5, 'water-strider': 5, 'frog-tadpole': 4, 'diving-beetle': 7, catfish: 9, 'water-decomposer': 5};
const relation = (food, eater) => riverFoodRelations.find(r => r.sourceSpeciesId === food && r.targetSpeciesId === eater).relationId;

// Organisms: [species, x, y], y on the species' living space.
export const riverChapters = [
  {chapterId: 'river-pond', number: 1, title: '연못·습지', events: ['drought'], seedSeconds: 50,
    newSpecies: ['algae', 'daphnia', 'medaka', 'duckweed', 'water-lily', 'pond-snail', 'water-strider', 'cattail', 'frog-tadpole', 'diving-beetle', 'catfish', 'water-decomposer'],
    intro: '고인 물에 사는 생산자와 소비자를 만나요.',
    art: {src: './assets/images/backgrounds/river-pond.webp', alt: '연못을 비스듬히 내려다본 수면과 물속 단면, 진흙 바닥, 오른쪽의 물가 비탈과 흙 단면.'}, stages: [
    {stageId: '1-1', title: '연못의 시작', points: 12,
      goal: '생산자인 작은 조류를 물벼룩이 먹고, 물벼룩을 송사리가 먹어요. 송사리를 놓아 먹이사슬을 이어 강 별 3개를 모아요.',
      tasks: [{text: '송사리 놓기', have: 'medaka'}, {text: '먹이사슬 3단계 잇기', observe: relation('daphnia', 'medaka'), icon: 'medaka'}],
      inventory: ['algae', 'daphnia', 'medaka'], requiredSpecies: {daphnia: 2, medaka: 1}, observeRequired: relation('daphnia', 'medaka'),
      organisms: [['algae', .18, .85], ['algae', .36, .86], ['algae', .54, .85], ['daphnia', .24, .66], ['daphnia', .34, .72], ['daphnia', .46, .68], ['daphnia', .58, .74]]},
    {stageId: '1-2', title: '수면의 이웃', points: 12,
      goal: '물 위에는 개구리밥과 수련, 소금쟁이가 살고 물 바닥에는 논우렁이가 살아요. 논우렁이를 길러 강 별 3개를 모아요.',
      tasks: [{text: '논우렁이 기르기', have: 'pond-snail'}, {text: '소금쟁이 놓기', have: 'water-strider'}],
      inventory: ['algae', 'duckweed', 'water-lily', 'daphnia', 'medaka', 'pond-snail', 'water-strider'], requiredSpecies: {daphnia: 2, medaka: 1, 'pond-snail': 1},
      organisms: [['algae', .14, .85], ['algae', .3, .86], ['algae', .5, .85], ['algae', .58, .86], ['duckweed', .3, .3], ['water-lily', .5, .36],
        ['daphnia', .24, .66], ['daphnia', .36, .74], ['daphnia', .48, .7], ['medaka', .54, .62]]},
    {stageId: '1-3', title: '올챙이의 연못', points: 14,
      goal: '올챙이는 작은 조류를 먹고 자라 참개구리가 돼요. 물방개는 올챙이를 잡아먹어요. 올챙이가 개구리로 자라게 해 강 별 3개를 모아요.',
      tasks: [{text: '올챙이가 개구리로', grow: 'frog', icon: 'frog-tadpole'}, {text: '가뭄 견디기', crisis: 'drought'}],
      inventory: ['algae', 'duckweed', 'cattail', 'daphnia', 'medaka', 'frog-tadpole', 'diving-beetle', 'water-strider'], requiredSpecies: {daphnia: 2, medaka: 1}, growRequired: 'frog',
      organisms: [['algae', .12, .85], ['algae', .26, .86], ['algae', .4, .85], ['algae', .54, .86], ['cattail', .86, .4], ['duckweed', .34, .3], ['water-strider', .5, .34], ['water-strider', .64, .4],
        ['daphnia', .2, .7], ['daphnia', .34, .76], ['daphnia', .46, .68], ['medaka', .3, .62], ['frog-tadpole', .16, .74], ['frog-tadpole', .44, .78], ['diving-beetle', .56, .66]]},
    // The invaders come here instead of the chapter's drought (one event at a time).
    {stageId: '1-4', title: '연못의 메기와 침입자', points: 16, events: [],
      goal: '메기는 연못 바닥에서 작은 물고기를 먹고, 물속 분해자는 죽은 생물을 분해해요. 그런데 외래종이 들어와 토종 생물을 먹어요. 외래종을 빨리 내보내고 강 별 3개를 모아요.',
      tasks: [{text: '메기 기르기', have: 'catfish'}, {text: '외래종 내보내기', invader: true, icon: 'bullfrog'}],
      inventory: ['algae', 'duckweed', 'cattail', 'daphnia', 'medaka', 'pond-snail', 'frog-tadpole', 'water-strider', 'catfish', 'water-decomposer'], requiredSpecies: {daphnia: 2, medaka: 2, catfish: 1},
      boss: {species: ['bullfrog', 'red-swamp-crayfish'], taps: 15},
      organisms: [['algae', .1, .85], ['algae', .22, .86], ['algae', .34, .85], ['algae', .46, .86], ['algae', .56, .85], ['cattail', .86, .4], ['duckweed', .3, .3], ['water-strider', .52, .34],
        ['daphnia', .16, .7], ['daphnia', .28, .76], ['daphnia', .42, .68], ['daphnia', .5, .74], ['medaka', .24, .62], ['medaka', .44, .64], ['pond-snail', .12, .92], ['frog-tadpole', .36, .74], ['water-decomposer', .5, .93]]},
  ]},
];

// The question after each river crisis: river organisms and the abiotic
// factor that changed (the forest's ask about grasshoppers and grass).
export const riverQuestions = {
  drought: [
    {question: '가뭄으로 연못의 물이 줄면 왜 송사리 같은 소비자도 힘들어질까요?',
      choices: ['물이 줄면 송사리의 몸 색깔이 바뀌어서', '사는 물이 좁아지고, 먹이인 물벼룩과 작은 조류도 줄어서', '물이 줄면 분해자가 너무 많아져서'], answer: 1,
      explanation: '연못의 생물은 물속에서 살아요. 물이 줄면 사는 곳이 좁아지고, 생산자인 작은 조류가 줄어 먹이 관계를 따라 물벼룩과 송사리까지 영향을 받아요.'},
    {question: '가뭄이 오기 전에 연못 생태계를 튼튼하게 하려면 어떻게 하면 좋을까요?',
      choices: ['생산자인 작은 조류와 물풀을 넉넉히 길러 둬요', '송사리를 더 많이 놓아요', '물벼룩을 모두 없애요'], answer: 0,
      explanation: '생산자가 넉넉하면 물이 줄어 생산자가 덜 자라는 동안에도 물벼룩과 논우렁이가 먹을 것이 남아요.'},
  ],
  // After tapping an invader out (kind invader:<species>).
  'invader:bullfrog': [
    {question: '황소개구리가 연못에 들어오면 왜 토종 생물이 줄어들까요?',
      choices: ['황소개구리가 토종 생물을 많이 잡아먹고, 먹이를 두고 다투어서', '황소개구리가 물을 깨끗하게 해서', '황소개구리는 작은 조류만 먹어서'], answer: 0,
      explanation: '황소개구리는 원래 우리나라에 살지 않던 외래종이에요. 몸집이 크고 무엇이든 잘 먹어 올챙이, 물고기, 참개구리까지 잡아먹어요. 천적도 적어서 빨리 늘어나요.'},
    {question: '외래종이 늘어나지 않게 하려면 어떻게 해야 할까요?',
      choices: ['기르던 생물을 강이나 연못에 함부로 놓아주지 않아요', '외래종을 더 많이 데려와요', '토종 생물을 다른 곳으로 모두 옮겨요'], answer: 0,
      explanation: '집에서 기르던 생물을 자연에 풀어 주면 생태계 교란 생물이 될 수 있어요. 함부로 놓아주지 않는 것이 가장 중요해요.'},
  ],
  'invader:red-swamp-crayfish': [
    {question: '미국가재가 연못에 많아지면 어떤 일이 생길까요?',
      choices: ['물풀을 자르고 올챙이와 우렁이를 먹어 토종 생물이 줄어요', '물이 더 맑아지고 토종 생물이 늘어요', '아무 변화가 없어요'], answer: 0,
      explanation: '미국가재는 생태계 교란 생물이에요. 물풀을 잘라 먹고 올챙이, 우렁이, 작은 물고기를 먹어서 연못의 먹이그물이 흔들려요.'},
    {question: '기르던 가재를 더 기를 수 없게 되면 어떻게 해야 할까요?',
      choices: ['가까운 개울에 놓아줘요', '자연에 풀어 주지 않고 어른이나 기관에 물어봐요', '아파트 연못에 넣어 줘요'], answer: 1,
      explanation: '외래종을 자연에 풀어 주면 토종 생물을 먹고 빠르게 퍼질 수 있어요. 버리지 말고 어른이나 관련 기관에 도움을 청해요.'},
  ],
};

// Breeding in a stage, as in the forest: two fed parents make a young one.
const riverBreeding = {
  daphnia: {healthySeconds: 30, waitSeconds: 15, sign: '알', young: '새끼', cycle: '어미 몸속의 알주머니에서 새끼가 나와 금방 자라요.'},
};

let used = false;
export function useRiverTheme() {
  if (used) return;
  used = true;
  Object.assign(placementConfig.zones, riverZones);
  Object.assign(habitatZones, riverHabitatZones);
  Object.assign(foodPartLabels, {whole: ''});
  Object.assign(foodEvidence, riverEvidence);
  for (const s of riverSpecies) {
    const {zone, food, growth, feeding, motion, size, starvation, satiety, predatorSatiety, card: speciesCard, ...definition} = s;
    const species = {taxonKind: 'species', taxonomySource: 'https://species.nibr.go.kr/', taxonomyNote: '', aliases: [], ...definition};
    delete species.life;
    organisms.push(species);
    organismById[s.id] = species;
    speciesProfiles[s.id] = {zone, width: size[0], height: size[1], labelHeight: 20, ...(motion && {wanders: true, motion})};
    // Drawn where it is: the forest's ground and tree supports do not apply.
    speciesHabitats[s.id] = {primary: zone, additional: [], movement: motion ? 'swim' : 'stationary', preferredPlants: [], stationary: !motion, fallback: 'nearby-ground', direct: true};
    if (food) { foodResourceConfig[s.id] = {...food}; scaleFields(foodResourceConfig[s.id], ['recoveryPerSecond'], ecologyRate); }
    if (growth) producerGrowth[s.id] = {weights: growth};
    if (feeding) { feedingConfig[s.id] = {...feeding}; scaleFields(feedingConfig[s.id], ['hungerPerSecond'], value => ecologyRate(value) * survivalConfig.hungerScale / 2); }
    lifespanRules[s.id] = {...s.life}; scaleFields(lifespanRules[s.id], ['min', 'max', 'stressSeconds']);
    if (starvation) starvationLimits[s.id] = ecologySeconds(starvation);
    if (satiety) satietySeconds[s.id] = ecologySeconds(satiety) * survivalConfig.satietyScale / .5;
    if (predatorSatiety) stageConfig.predatorSatiety = {...stageConfig.predatorSatiety, [s.id]: predatorSatiety};
    speciesCards[s.id] = speciesCard;
  }
  addFoodRelations(riverFoodRelations);
  for (const r of riverFoodRelations) addDiscoveryEvent(r);
  for (const s of riverSpecies) if (s.feeding) addShortageEvent(s.id);
  Object.assign(stageConfig.prices, riverPrices);
  Object.assign(breeding.species, riverBreeding);
  // A tadpole fed for a while grows into a frog on the bank. The frog keeps
  // its forest data, living here at the water's edge and eating water striders.
  stageGrowth['frog-tadpole'] = {into: 'frog', seconds: 40};
  Object.assign(invaderPrey, riverInvaderPrey);
  Object.assign(speciesProfiles.frog, {zone: 'frogShore'});
  speciesHabitats.frog = {...speciesHabitats.frog, primary: 'frogShore', additional: [], direct: true};
  Object.assign(crisisQuestions, riverQuestions);
  // The water decomposer breaks down plant and animal remains.
  decompositionConfig.rates['water-decomposer'] = {litter: ecologyRate(.006), remains: ecologyRate(.006)};
  organicWorkers.litter.push('water-decomposer'); organicWorkers.remains.push('water-decomposer');
  // The river's cards only (the forest's stay known by id); invaders are no card.
  organisms.splice(0, organisms.length, ...riverSpecies.filter(s => !s.invader).map(s => organismById[s.id]));
  const riverStages = riverChapters.flatMap(chapter => chapter.stages.map(stage => ({...stage, chapter, events: stage.events ?? chapter.events, seedSeconds: chapter.seedSeconds})));
  chapters.splice(0, chapters.length, ...riverChapters);
  stages.splice(0, stages.length, ...riverStages);
  for (const id of Object.keys(stageById)) delete stageById[id];
  Object.assign(stageById, Object.fromEntries(riverStages.map(stage => [stage.stageId, stage])));
}
