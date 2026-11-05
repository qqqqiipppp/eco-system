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
import {decomposerIds} from './learning-goals.js';
import {placementConfig,speciesProfiles} from './interaction-config.js';
import {speciesHabitats,habitatZones} from './habitats.js';
import {speciesCards} from './species-cards.js';
import {foodEvidence} from './food-evidence.js';
import {edge,addFoodRelations,foodPartLabels} from './food-relations.js';
import {addDiscoveryEvent,addShortageEvent} from './event-config.js';
import {chapters,stages,stageById,stageConfig,breeding,growth as stageGrowth,invaderPrey,crises} from './chapters.js';
import {environmentEventDefinitions} from './environment-events.js';
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
  // Water plants rooted in the bed (붕어마름, 나사말): base on the bed's top edge.
  rooted: {left: .04, right: .6, top: .83, bottom: .88},
  // A turtle swims in the water and rests on its surface.
  turtle: {left: .2, right: .6, top: .3, bottom: .88},
  // A heron wades at the water's edge: on the surface and just under the waterline,
  // where a crucian carp comes up now and then (its motion.rise).
  shallows: {left: .3, right: .66, top: .3, bottom: .62},
};
const riverHabitatZones = {surface: '수면', water: '물속', algae: '물 바닥 가까운 물속', bottom: '물 바닥', shore: '물가', bank: '물가 흙', frogShore: '물가와 물 가장자리', rooted: '물 바닥에 뿌리', turtle: '물속과 수면', shallows: '물가의 얕은 물'};

const life = (min, max, label, unit, extra = {}) => ({model: 'individual', min: min * 60, max: max * 60, initialAge: .08, label, unit, ...extra});
const card = (intro, rows) => ({intro, rows: rows.map(([key, label, text]) => ({key, label, text})), photos: []});
const producerRows = (needs, eatenBy, home) => [['role', '역할', '햇빛을 받아 스스로 양분을 만들어서 생산자예요.'], ['needs', '필요한 것', needs], ['eatenBy', '나를 먹는 것', eatenBy], ['home', '사는 곳', home]];

// zone: the living space; motion: how it moves (none for a producer).
// size: drawn size in px; animals that are big in nature (catfish, perch,
// the invaders) are drawn bigger than their prey.
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
    motion: {speedX: .02, speedY: .004, walkSeconds: [1.5, 3], pauseSeconds: [1, 2]}, life: life(80, 110, '여러 해 사는 큰 물고기예요', '마리'), size: [88, 66],
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
    scientificName: 'Lithobates catesbeianus', motion: {speedX: .02, speedY: .006, walkSeconds: [.8, 1.6], pauseSeconds: [1, 2]}, life: life(300, 400, '외래종이에요', '마리'), size: [104, 78],
    card: card('참개구리보다 훨씬 큰 외래종 개구리예요.', [['role', '역할', '다른 동물을 잡아먹고 살아서 소비자예요.'], ['eats', '먹는 것', '곤충, 올챙이, 물고기, 개구리, 작은 뱀까지 먹어요.'], ['eatenBy', '나를 먹는 것', '우리나라에는 천적이 적어서 빨리 늘어나요.'], ['wow', '알아 두기', '1998년에 생태계 교란 생물로 지정되었어요.']])},
  {id: 'red-swamp-crayfish', name: '미국가재', role: 'consumer', behaviorType: 'forager', zone: 'bottom', invader: true,
    caption: '외래종: 물풀을 자르고 작은 동물을 먹어요', description: '북아메리카에서 들여온 붉은 가재예요. 물풀을 잘라 먹고 올챙이, 우렁이, 작은 물고기를 먹어 생태계 교란 생물로 지정되었어요.', habitat: '연못, 논, 느린 강',
    scientificName: 'Procambarus clarkii', motion: {speedX: .015, speedY: .003, walkSeconds: [1, 2], pauseSeconds: [1, 2]}, life: life(300, 400, '외래종이에요', '마리'), size: [104, 78],
    card: card('붉고 오돌토돌한 큰 집게를 가진 외래종 가재예요.', [['role', '역할', '여러 생물을 먹고 살아서 소비자예요.'], ['eats', '먹는 것', '물풀, 올챙이, 우렁이, 작은 물고기를 먹어요.'], ['eatenBy', '나를 먹는 것', '천적이 적어서 빨리 늘어나요.'], ['wow', '알아 두기', '2019년에 생태계 교란 생물로 지정되었어요.']])},
  // 상류 (upstream): cold, clear, fast water over stones.
  {id: 'stone-diatom', name: '돌말', role: 'producer', behaviorType: 'static', zone: 'algae',
    caption: '돌에 붙어 양분을 만들어요', description: '물속 돌 표면에 얇은 막처럼 붙어 사는 아주 작은 조류예요. 햇빛으로 양분을 만들어요.', habitat: '맑은 개울의 돌 위',
    scientificName: null, taxonKind: 'functional-group', taxonomyNote: '돌에 붙어 사는 여러 규조류를 묶었어요.',
    food: {maximum: 3, portion: 1, recoveryPerSecond: .07, parts: ['whole']}, growth: {sunlight: .45, water: .4, air: .1, soil: .05},
    life: life(24, 32, '빠르게 자라고 새로 생기는 조류예요', '무리', {matter: 'litter', matterAmount: 1}), size: [48, 36],
    card: card('돌을 만지면 미끌미끌한 갈색 막이 바로 돌말이에요.', producerRows('햇빛 · 물 · 공기', '다슬기, 날도래 애벌레, 엽새우가 갉아 먹어요.', '맑은 개울의 돌 위'))},
  {id: 'water-dropwort', name: '미나리', role: 'producer', behaviorType: 'static', zone: 'bank',
    caption: '물가에서 자라요', description: '물가의 축축한 흙에 뿌리를 내리고 깃 모양 잎을 펼쳐요.', habitat: '개울과 논의 물가',
    scientificName: 'Oenanthe javanica', growth: {sunlight: .4, water: .35, air: .1, soil: .15},
    life: life(40, 60, '여러 해 사는 물가 풀이에요', '포기', {matter: 'litter', matterAmount: 1}), size: [70, 52],
    card: card('향이 좋아 나물로도 먹는 물가 풀이에요.', producerRows('햇빛 · 물 · 공기 · 흙', '곤충과 달팽이가 잎을 갉아 먹어요.', '개울과 논의 물가'))},
  {id: 'pussy-willow', name: '갯버들', role: 'producer', behaviorType: 'static', zone: 'bank',
    caption: '물가의 작은 버드나무', description: '계곡 물가에 자라는 키 작은 버드나무예요. 떨어진 잎은 물속에 가라앉아 분해자와 작은 동물의 먹이가 돼요.', habitat: '계곡과 개울의 물가',
    scientificName: 'Salix gracilistyla', growth: {sunlight: .35, water: .3, air: .1, soil: .25},
    life: life(80, 120, '여러 해 사는 나무예요', '그루', {matter: 'litter', matterAmount: 2}), size: [96, 72],
    card: card('봄이 오면 가지 끝에 솜털 같은 꽃이삭이 달리는 물가 나무예요.', producerRows('햇빛 · 물 · 공기 · 흙', '떨어진 잎을 엽새우와 날도래 애벌레가 먹어요.', '계곡과 개울의 물가'))},
  {id: 'caddisfly-larva', name: '날도래 애벌레', role: 'consumer', behaviorType: 'forager', zone: 'bottom',
    caption: '돌말과 낙엽을 갉아 먹어요', description: '작은 돌과 나뭇잎 조각으로 집을 짓고 사는 애벌레예요. 돌말과 가라앉은 낙엽을 갉아 먹어요.', habitat: '맑은 개울의 돌 밑',
    scientificName: null, taxonKind: 'functional-group', taxonomyNote: '여러 날도래류 애벌레를 묶었어요.', feeding: {initialHunger: .45, hungerPerSecond: .03, hungryAt: .6, mealRelief: .65, searchRadius: .3, speed: .01},
    motion: {speedX: .005, speedY: .002, walkSeconds: [2, 4], pauseSeconds: [1, 2]}, life: life(20, 30, '애벌레 시기를 물속에서 보내요', '마리'), size: [44, 30],
    card: card('돌과 나뭇잎으로 지은 집을 지고 다니는 애벌레예요.', [['role', '역할', '돌말과 낙엽을 먹고 살아서 소비자예요.'], ['eats', '먹는 것', '돌에 붙은 돌말과 물에 가라앉은 낙엽을 먹어요.'], ['eatenBy', '나를 먹는 것', '버들치, 가재, 미유기가 먹어요.'], ['life', '한살이', '알 → 애벌레 → 번데기 → 어른벌레(물 밖으로 날아가요)']])},
  {id: 'melania-snail', name: '다슬기', role: 'consumer', behaviorType: 'forager', zone: 'bottom',
    caption: '돌말을 갉아 먹어요', description: '길쭉한 원뿔 껍데기를 지고 돌 위를 기어 다니며 돌말을 갉아 먹어요.', habitat: '맑은 개울과 강의 돌 위',
    scientificName: 'Semisulcospira libertina', feeding: {initialHunger: .45, hungerPerSecond: .025, hungryAt: .6, mealRelief: .65, searchRadius: .3, speed: .01},
    motion: {speedX: .005, speedY: .002, walkSeconds: [2, 4], pauseSeconds: [1, 2]}, life: life(50, 70, '여러 해 사는 고둥이에요', '마리'), size: [40, 34], starvation: 480,
    card: card('맑은 물에서만 사는 길쭉한 고둥이에요.', [['role', '역할', '돌말을 먹고 살아서 소비자예요.'], ['eats', '먹는 것', '돌에 붙은 돌말을 갉아 먹어요.'], ['eatenBy', '나를 먹는 것', '가재, 물고기, 새가 먹어요.'], ['home', '사는 곳', '맑은 개울과 강의 돌 위']])},
  {id: 'amphipod', name: '엽새우', role: 'consumer', behaviorType: 'forager', zone: 'bottom',
    caption: '돌말과 낙엽을 먹어요', description: '옆으로 납작한 작은 새우 무리예요. 돌 밑에 살며 돌말과 가라앉은 낙엽을 먹어요.', habitat: '맑은 개울의 돌 밑',
    scientificName: 'Gammarus sp.', feeding: {initialHunger: .45, hungerPerSecond: .035, hungryAt: .6, mealRelief: .65, searchRadius: .32, speed: .02},
    motion: {speedX: .015, speedY: .004, walkSeconds: [.6, 1.2], pauseSeconds: [.8, 1.6]}, life: life(14, 20, '짧은 생애를 가져요', '마리'), size: [40, 30],
    card: card('옆으로 누워 헤엄치는 작은 새우예요.', [['role', '역할', '돌말과 낙엽을 먹고 살아서 소비자예요.'], ['eats', '먹는 것', '돌말과 물속에 가라앉은 낙엽을 먹어요.'], ['eatenBy', '나를 먹는 것', '버들치, 가재가 먹어요.'], ['home', '사는 곳', '깨끗한 개울의 돌 밑']])},
  {id: 'minnow', name: '버들치', role: 'consumer', behaviorType: 'forager', zone: 'water',
    caption: '작은 물속 동물을 먹어요', description: '맑고 차가운 개울에 사는 작은 물고기예요. 날도래 애벌레와 엽새우를 잡아먹어요.', habitat: '계곡과 개울',
    scientificName: 'Rhynchocypris oxycephala', feeding: {initialHunger: .45, hungerPerSecond: .02, hungryAt: .6, mealRelief: .7, searchRadius: .32, speed: .05},
    motion: {speedX: .035, speedY: .008, walkSeconds: [1, 2], pauseSeconds: [.5, 1.2]}, life: life(40, 55, '몇 해 사는 작은 물고기예요', '마리'), size: [50, 32],
    starvation: 420, satiety: 240, predatorSatiety: .4,
    card: card('계곡 물웅덩이에 떼 지어 사는 갈색 물고기예요.', [['role', '역할', '작은 동물을 잡아먹고 살아서 소비자예요.'], ['eats', '먹는 것', '날도래 애벌레, 엽새우, 물에 떨어진 곤충을 먹어요.'], ['eatenBy', '나를 먹는 것', '꺽지, 미유기, 물새가 먹어요.'], ['home', '사는 곳', '맑고 차가운 계곡과 개울']])},
  {id: 'native-crayfish', name: '가재', role: 'consumer', behaviorType: 'forager', zone: 'bottom',
    caption: '돌 밑에서 작은 동물을 먹어요', description: '우리나라 토종 가재예요. 맑은 계곡의 돌 밑에 숨어 살며 작은 동물을 잡아먹어요.', habitat: '맑은 계곡의 돌 밑',
    scientificName: 'Cambaroides similis', feeding: {initialHunger: .45, hungerPerSecond: .018, hungryAt: .6, mealRelief: .7, searchRadius: .3, speed: .02},
    motion: {speedX: .01, speedY: .003, walkSeconds: [1, 2], pauseSeconds: [1, 2]}, life: life(70, 100, '여러 해 사는 가재예요', '마리'), size: [60, 45],
    starvation: 540, satiety: 300, predatorSatiety: .4,
    card: card('맑은 물에서만 사는 우리나라 토종 가재예요.', [['role', '역할', '여러 생물을 먹고 살아서 소비자예요.'], ['eats', '먹는 것', '날도래 애벌레, 엽새우, 가라앉은 낙엽을 먹어요.'], ['eatenBy', '나를 먹는 것', '꺽지, 수달, 새가 먹어요.'], ['home', '사는 곳', '맑은 계곡의 돌 밑']])},
  {id: 'korean-catfish', name: '미유기', role: 'consumer', behaviorType: 'forager', zone: 'bottom',
    caption: '바닥에서 작은 물고기를 먹어요', description: '우리나라에만 사는 작은 메기예요. 맑은 계곡 바닥에서 작은 물고기와 애벌레를 잡아먹어요.', habitat: '맑은 계곡의 바닥',
    scientificName: 'Silurus microdorsalis', feeding: {initialHunger: .45, hungerPerSecond: .018, hungryAt: .6, mealRelief: .75, searchRadius: .3, speed: .035},
    motion: {speedX: .015, speedY: .003, walkSeconds: [1.5, 3], pauseSeconds: [1, 2]}, life: life(70, 100, '여러 해 사는 물고기예요', '마리'), size: [72, 54],
    starvation: 600, satiety: 360, predatorSatiety: .5,
    card: card('메기를 닮은 작고 날씬한 우리나라 고유종이에요.', [['role', '역할', '다른 동물을 잡아먹고 살아서 소비자예요.'], ['eats', '먹는 것', '작은 물고기와 물속 애벌레를 먹어요.'], ['eatenBy', '나를 먹는 것', '수달과 큰 새가 먹어요.'], ['home', '사는 곳', '맑은 계곡의 돌 사이 바닥']])},
  {id: 'aucha-perch', name: '꺽지', role: 'consumer', behaviorType: 'forager', zone: 'water',
    caption: '물고기와 가재를 먹어요', description: '우리나라에만 사는 물고기예요. 돌 틈에 숨어 있다가 작은 물고기와 가재를 잡아먹어요.', habitat: '맑은 계곡과 개울',
    scientificName: 'Coreoperca herzi', feeding: {initialHunger: .45, hungerPerSecond: .018, hungryAt: .6, mealRelief: .75, searchRadius: .32, speed: .045},
    motion: {speedX: .025, speedY: .006, walkSeconds: [1, 2], pauseSeconds: [1, 2]}, life: life(70, 100, '여러 해 사는 물고기예요', '마리'), size: [72, 54],
    starvation: 600, satiety: 360, predatorSatiety: .5,
    card: card('아가미뚜껑에 파란 테두리의 검은 점이 있는 우리나라 고유종이에요.', [['role', '역할', '다른 동물을 잡아먹고 살아서 소비자예요.'], ['eats', '먹는 것', '작은 물고기, 가재, 물속 곤충을 먹어요.'], ['eatenBy', '나를 먹는 것', '수달과 큰 새가 먹어요.'], ['home', '사는 곳', '맑은 계곡의 돌 틈']])},
  // 중류 (midstream): slower water over gravel and sand, water plants rooted in the bed.
  {id: 'hornwort', name: '붕어마름', role: 'producer', behaviorType: 'static', zone: 'rooted',
    caption: '물속에서 양분을 만들어요', description: '물 바닥에 붙어 물속에 잠겨 자라는 물풀이에요. 가는 잎이 돌려나서 붕어가 숨기 좋아요.', habitat: '느린 강과 연못의 물속',
    scientificName: 'Ceratophyllum demersum', food: {maximum: 3, portion: 1, recoveryPerSecond: .06, parts: ['whole']}, growth: {sunlight: .45, water: .4, air: .1, soil: .05},
    life: life(40, 60, '물속에 잠겨 여러 해 사는 물풀이에요', '포기', {matter: 'litter', matterAmount: 1}), size: [64, 48],
    card: card('잎이 실처럼 가늘게 갈라져 물속에서 흔들리는 물풀이에요.', producerRows('햇빛 · 물 · 공기', '붕어가 잎을 뜯어 먹어요.', '느린 강과 연못의 물속'))},
  {id: 'tape-grass', name: '나사말', role: 'producer', behaviorType: 'static', zone: 'rooted',
    caption: '물 바닥에 뿌리를 내려요', description: '물 바닥 모래나 진흙에 뿌리를 내리고 리본 같은 긴 잎을 물속에 펼쳐요.', habitat: '느린 강의 물속',
    scientificName: 'Vallisneria natans', food: {maximum: 3, portion: 1, recoveryPerSecond: .06, parts: ['whole']}, growth: {sunlight: .4, water: .4, air: .1, soil: .1},
    life: life(40, 60, '물속에 잠겨 여러 해 사는 물풀이에요', '포기', {matter: 'litter', matterAmount: 1}), size: [64, 48],
    card: card('꽃줄기가 나사처럼 꼬여 있어서 나사말이라고 해요.', producerRows('햇빛 · 물 · 공기 · 흙', '붕어가 잎을 뜯어 먹어요.', '느린 강의 모래·진흙 바닥'))},
  {id: 'pale-chub', name: '피라미', role: 'consumer', behaviorType: 'forager', zone: 'water',
    caption: '돌말과 작은 동물을 먹어요', description: '물살이 느린 강에 떼 지어 사는 물고기예요. 돌에 붙은 돌말과 작은 물속 동물을 먹어요.', habitat: '강의 중류',
    scientificName: 'Zacco platypus', feeding: {initialHunger: .45, hungerPerSecond: .02, hungryAt: .6, mealRelief: .7, searchRadius: .32, speed: .05},
    motion: {speedX: .035, speedY: .008, walkSeconds: [1, 2], pauseSeconds: [.5, 1.2]}, life: life(40, 55, '몇 해 사는 작은 물고기예요', '마리'), size: [52, 39],
    starvation: 420, satiety: 240, predatorSatiety: .4,
    card: card('여름에 수컷의 몸이 분홍빛과 푸른빛으로 화려해지는 물고기예요.', [['role', '역할', '돌말과 작은 동물을 먹고 살아서 소비자예요.'], ['eats', '먹는 것', '돌에 붙은 돌말과 물속 곤충을 먹어요.'], ['eatenBy', '나를 먹는 것', '쏘가리, 동사리, 수달이 먹어요.'], ['home', '사는 곳', '물살이 느린 강의 여울']])},
  {id: 'crucian-carp', name: '붕어', role: 'consumer', behaviorType: 'forager', zone: 'water',
    caption: '물풀을 뜯어 먹어요', description: '강과 연못 어디에나 사는 물고기예요. 붕어마름과 나사말 같은 물풀과 작은 동물을 먹어요. 물속 산소가 모자라면 가끔 수면 가까이 올라와 입을 뻐끔거려요.', habitat: '강과 연못',
    scientificName: 'Carassius auratus', feeding: {initialHunger: .45, hungerPerSecond: .02, hungryAt: .6, mealRelief: .7, searchRadius: .32, speed: .045},
    motion: {speedX: .03, speedY: .008, walkSeconds: [1, 2], pauseSeconds: [.6, 1.4], rise: {chance: .35, speed: .06, staySeconds: [5, 9]}}, life: life(60, 80, '여러 해 사는 물고기예요', '마리'), size: [60, 45],
    starvation: 480, satiety: 300, predatorSatiety: .4,
    card: card('몸이 납작하고 등이 높은 우리 강의 흔한 물고기예요.', [['role', '역할', '물풀과 작은 동물을 먹고 살아서 소비자예요.'], ['eats', '먹는 것', '붕어마름, 나사말 같은 물풀과 작은 동물을 먹어요.'], ['eatenBy', '나를 먹는 것', '쏘가리, 수달, 왜가리가 먹어요.'], ['home', '사는 곳', '강과 연못, 물풀이 많은 곳']])},
  {id: 'sand-gudgeon', name: '모래무지', role: 'consumer', behaviorType: 'forager', zone: 'bottom',
    caption: '모래 바닥에서 먹이를 찾아요', description: '모래 바닥에 붙어 살며 입으로 모래를 빨아들였다가 먹이만 걸러 먹어요. 놀라면 모래 속에 숨어요.', habitat: '강 중류의 모래 바닥',
    scientificName: 'Pseudogobio esocinus', feeding: {initialHunger: .45, hungerPerSecond: .022, hungryAt: .6, mealRelief: .7, searchRadius: .3, speed: .02},
    motion: {speedX: .012, speedY: .002, walkSeconds: [1, 2.5], pauseSeconds: [1, 2]}, life: life(50, 70, '몇 해 사는 물고기예요', '마리'), size: [56, 42],
    starvation: 480, satiety: 300, predatorSatiety: .4,
    card: card('모래 색 몸으로 모래 바닥에 숨는 물고기예요.', [['role', '역할', '바닥의 작은 먹이를 먹고 살아서 소비자예요.'], ['eats', '먹는 것', '모래와 돌에 붙은 돌말과 작은 동물을 걸러 먹어요.'], ['eatenBy', '나를 먹는 것', '동사리, 쏘가리가 먹어요.'], ['home', '사는 곳', '강 중류의 모래 바닥']])},
  {id: 'dark-sleeper', name: '동사리', role: 'consumer', behaviorType: 'forager', zone: 'bottom',
    caption: '바닥에서 작은 물고기를 먹어요', description: '우리나라에만 사는 물고기예요. 바닥의 돌 틈에 가만히 숨어 있다가 다가온 작은 물고기를 잡아먹어요.', habitat: '강 중류의 바닥',
    scientificName: 'Odontobutis platycephala', feeding: {initialHunger: .45, hungerPerSecond: .018, hungryAt: .6, mealRelief: .75, searchRadius: .3, speed: .035},
    motion: {speedX: .01, speedY: .002, walkSeconds: [.8, 1.6], pauseSeconds: [1.5, 3]}, life: life(70, 100, '여러 해 사는 물고기예요', '마리'), size: [64, 48],
    starvation: 600, satiety: 360, predatorSatiety: .5,
    card: card('머리가 크고 납작하며 바닥에서 꼼짝 않고 기다리는 우리나라 고유종이에요.', [['role', '역할', '다른 동물을 잡아먹고 살아서 소비자예요.'], ['eats', '먹는 것', '피라미, 모래무지 같은 작은 물고기와 물속 곤충을 먹어요.'], ['eatenBy', '나를 먹는 것', '수달이 먹어요.'], ['home', '사는 곳', '강 중류의 돌 틈 바닥']])},
  {id: 'mandarin-fish', name: '쏘가리', role: 'consumer', behaviorType: 'forager', zone: 'water',
    caption: '물고기를 잡아먹어요', description: '표범 무늬가 있는 큰 물고기예요. 바위 틈에 숨었다가 피라미와 붕어를 잡아먹어요.', habitat: '강 중류의 바위가 많은 곳',
    scientificName: 'Siniperca scherzeri', feeding: {initialHunger: .45, hungerPerSecond: .018, hungryAt: .6, mealRelief: .75, searchRadius: .34, speed: .045},
    motion: {speedX: .025, speedY: .006, walkSeconds: [1, 2], pauseSeconds: [1, 2]}, life: life(80, 110, '여러 해 사는 큰 물고기예요', '마리'), size: [80, 60],
    starvation: 600, satiety: 360, predatorSatiety: .5,
    card: card('누런 몸에 검은 표범 무늬가 있는 강의 사냥꾼이에요.', [['role', '역할', '다른 동물을 잡아먹고 살아서 소비자예요.'], ['eats', '먹는 것', '피라미, 붕어 같은 물고기를 먹어요.'], ['eatenBy', '나를 먹는 것', '다 자라면 수달 말고는 먹는 동물이 거의 없어요.'], ['home', '사는 곳', '강 중류의 바위 틈']])},
  // It also rests in its burrow in the bank (the picture's hole); in the game it hunts in the water.
  {id: 'otter', name: '수달', role: 'consumer', behaviorType: 'forager', zone: 'water',
    caption: '물고기를 잡아먹어요', description: '물갈퀴 달린 발로 헤엄치는 동물이에요. 강둑의 굴에서 쉬고, 물속에서 물고기를 잡아먹어요. 천연기념물이에요.', habitat: '깨끗한 강과 강둑',
    scientificName: 'Lutra lutra', feeding: {initialHunger: .45, hungerPerSecond: .016, hungryAt: .6, mealRelief: .75, searchRadius: .36, speed: .05},
    motion: {speedX: .03, speedY: .008, walkSeconds: [1, 2], pauseSeconds: [1, 2]}, life: life(90, 120, '여러 해 사는 동물이에요', '마리'), size: [100, 75],
    starvation: 660, satiety: 360, predatorSatiety: .5,
    card: card('강둑에 굴을 파고 사는 천연기념물이에요. 물이 깨끗한 강에만 살아요.', [['role', '역할', '다른 동물을 잡아먹고 살아서 소비자예요.'], ['eats', '먹는 것', '붕어, 쏘가리, 동사리 같은 물고기와 개구리, 가재를 먹어요.'], ['eatenBy', '나를 먹는 것', '다 자라면 먹는 동물이 거의 없어요.'], ['home', '사는 곳', '강물과 강둑의 굴']])},
  {id: 'largemouth-bass', name: '배스', role: 'consumer', behaviorType: 'forager', zone: 'water', invader: true,
    caption: '외래종: 토종 물고기를 잡아먹어요', description: '북아메리카에서 들여온 큰 물고기예요. 입이 커서 토종 물고기와 새우, 올챙이를 마구 잡아먹어 생태계 교란 생물로 지정되었어요.', habitat: '저수지, 느린 강',
    scientificName: 'Micropterus salmoides', motion: {speedX: .025, speedY: .006, walkSeconds: [1, 2], pauseSeconds: [1, 2]}, life: life(300, 400, '외래종이에요', '마리'), size: [110, 82],
    card: card('입이 아주 큰 외래종 물고기예요.', [['role', '역할', '다른 동물을 잡아먹고 살아서 소비자예요.'], ['eats', '먹는 것', '토종 물고기, 새우, 올챙이를 먹어요.'], ['eatenBy', '나를 먹는 것', '천적이 적어서 빨리 늘어나요.'], ['wow', '알아 두기', '1998년에 생태계 교란 생물로 지정되었어요.']])},
  {id: 'bluegill', name: '블루길', role: 'consumer', behaviorType: 'forager', zone: 'water', invader: true,
    caption: '외래종: 알과 작은 동물을 먹어요', description: '북아메리카에서 들여온 물고기예요. 토종 물고기의 알과 새끼, 작은 물속 동물을 먹어 생태계 교란 생물로 지정되었어요.', habitat: '저수지, 느린 강',
    scientificName: 'Lepomis macrochirus', motion: {speedX: .025, speedY: .008, walkSeconds: [1, 2], pauseSeconds: [1, 2]}, life: life(300, 400, '외래종이에요', '마리'), size: [92, 69],
    card: card('아가미뚜껑 끝에 파란 점이 있는 외래종 물고기예요.', [['role', '역할', '다른 동물을 먹고 살아서 소비자예요.'], ['eats', '먹는 것', '토종 물고기의 알과 새끼, 다슬기, 물속 곤충을 먹어요.'], ['eatenBy', '나를 먹는 것', '천적이 적어서 빨리 늘어나요.'], ['wow', '알아 두기', '1998년에 생태계 교란 생물로 지정되었어요.']])},
  // 하류 (downstream): wide, slow water over mud, reed beds on the bank.
  {id: 'reed', name: '갈대', role: 'producer', behaviorType: 'static', zone: 'bank',
    caption: '물가에 크게 자라요', description: '강 하류의 물가에 무리 지어 자라는 키 큰 풀이에요. 갈대밭은 물새와 작은 동물이 숨는 곳이 돼요.', habitat: '강 하류의 물가',
    scientificName: 'Phragmites australis', growth: {sunlight: .4, water: .3, air: .1, soil: .2},
    life: life(60, 90, '여러 해 사는 물가 풀이에요', '포기', {matter: 'litter', matterAmount: 2}), size: [110, 82],
    card: card('가을이면 솜털 같은 이삭이 바람에 흔들리는 키 큰 물가 풀이에요.', producerRows('햇빛 · 물 · 공기 · 흙', '뉴트리아가 뿌리와 줄기를 갉아 먹어요.', '강 하류의 물가 흙'))},
  {id: 'water-chestnut', name: '마름', role: 'producer', behaviorType: 'static', zone: 'surface',
    caption: '물 위에 잎을 띄워요', description: '물 바닥에 뿌리를 내리고 마름모꼴 잎을 물 위에 띄워요. 뿔이 달린 열매가 열려요.', habitat: '느린 강과 저수지의 수면',
    scientificName: 'Trapa japonica', food: {maximum: 3, portion: 1, recoveryPerSecond: .06, parts: ['whole']}, growth: {sunlight: .45, water: .35, air: .1, soil: .1},
    life: life(40, 60, '한 해 사는 물풀이에요', '포기', {matter: 'litter', matterAmount: 1}), size: [60, 45],
    card: card('마름모꼴 잎이 물 위에 둥글게 모여 떠 있는 물풀이에요.', producerRows('햇빛 · 물 · 공기 · 흙', '남생이가 잎과 열매를 먹어요.', '느린 강과 저수지의 물 위'))},
  {id: 'freshwater-clam', name: '말조개', role: 'consumer', behaviorType: 'forager', zone: 'bottom',
    caption: '물을 걸러 작은 조류를 먹어요', description: '진흙 바닥에 몸을 반쯤 묻고 살아요. 물을 빨아들였다가 그 속의 작은 조류를 걸러 먹어서 물을 맑게 해요.', habitat: '강 하류와 저수지의 진흙 바닥',
    scientificName: 'Unio douglasiae', feeding: {initialHunger: .45, hungerPerSecond: .022, hungryAt: .6, mealRelief: .65, searchRadius: .3, speed: .006},
    motion: {speedX: .002, speedY: .001, walkSeconds: [2, 4], pauseSeconds: [3, 6]}, life: life(70, 100, '여러 해 사는 조개예요', '마리'), size: [52, 39], starvation: 540,
    card: card('두 장의 껍데기 사이로 물을 걸러 먹는 민물조개예요.', [['role', '역할', '작은 조류를 먹고 살아서 소비자예요.'], ['eats', '먹는 것', '물속의 작은 조류를 걸러 먹어요.'], ['eatenBy', '나를 먹는 것', '남생이, 수달이 먹어요.'], ['home', '사는 곳', '강 하류의 진흙 바닥']])},
  {id: 'common-carp', name: '잉어', role: 'consumer', behaviorType: 'forager', zone: 'water',
    caption: '물풀과 작은 동물을 먹어요', description: '입가에 수염이 두 쌍 있는 큰 물고기예요. 바닥을 뒤지며 물풀과 작은 동물을 먹어요.', habitat: '강 하류와 저수지',
    scientificName: 'Cyprinus carpio', feeding: {initialHunger: .45, hungerPerSecond: .018, hungryAt: .6, mealRelief: .7, searchRadius: .32, speed: .04},
    motion: {speedX: .025, speedY: .006, walkSeconds: [1.2, 2.4], pauseSeconds: [.8, 1.6]}, life: life(90, 120, '오래 사는 큰 물고기예요', '마리'), size: [80, 60],
    starvation: 540, satiety: 330, predatorSatiety: .4,
    card: card('붕어와 닮았지만 훨씬 크고 입가에 수염이 있는 물고기예요.', [['role', '역할', '물풀과 작은 동물을 먹고 살아서 소비자예요.'], ['eats', '먹는 것', '붕어마름 같은 물풀과 바닥의 작은 동물을 먹어요.'], ['eatenBy', '나를 먹는 것', '다 자라면 수달 말고는 먹는 동물이 거의 없어요.'], ['home', '사는 곳', '강 하류와 저수지']])},
  // A turtle swims under the water and rests on its surface: one space for both.
  {id: 'reeves-turtle', name: '남생이', role: 'consumer', behaviorType: 'forager', zone: 'turtle',
    caption: '물풀과 조개를 먹어요', description: '우리나라 토종 거북이에요. 물속을 헤엄치며 마름 같은 물풀과 조개를 먹어요. 천연기념물이에요.', habitat: '강 하류와 저수지',
    scientificName: 'Mauremys reevesii', feeding: {initialHunger: .45, hungerPerSecond: .016, hungryAt: .6, mealRelief: .7, searchRadius: .34, speed: .025},
    motion: {speedX: .012, speedY: .006, walkSeconds: [1.2, 2.4], pauseSeconds: [1.5, 3]}, life: life(120, 160, '아주 오래 사는 거북이에요', '마리'), size: [72, 54],
    starvation: 660, satiety: 360, predatorSatiety: .4,
    card: card('등딱지에 세 줄의 솟은 줄이 있는 우리나라 토종 거북이에요.', [['role', '역할', '여러 생물을 먹고 살아서 소비자예요.'], ['eats', '먹는 것', '마름 같은 물풀, 조개, 작은 물고기를 먹어요.'], ['eatenBy', '나를 먹는 것', '다 자라면 단단한 등딱지 덕분에 먹는 동물이 거의 없어요.'], ['wow', '알아 두기', '천연기념물이자 멸종위기 야생생물이에요.']])},
  // A heron wades in the shallow water by the bank and spears fish there.
  {id: 'grey-heron', name: '왜가리', role: 'consumer', behaviorType: 'forager', zone: 'shallows',
    caption: '얕은 물에서 물고기를 잡아요', description: '긴 다리로 얕은 물에 서서 기다리다가 긴 부리로 물고기를 재빨리 잡아요.', habitat: '강과 논의 얕은 물가',
    scientificName: 'Ardea cinerea', feeding: {initialHunger: .45, hungerPerSecond: .014, hungryAt: .6, mealRelief: .75, searchRadius: .4, speed: .07},
    motion: {speedX: .008, speedY: .004, walkSeconds: [1, 2], pauseSeconds: [2, 4]}, life: life(90, 120, '여러 해 사는 새예요', '마리'), size: [96, 72],
    starvation: 600, satiety: 360, predatorSatiety: .5,
    card: card('목과 다리가 긴 회색 물새예요. 얕은 물에 가만히 서서 물고기를 기다려요.', [['role', '역할', '다른 동물을 잡아먹고 살아서 소비자예요.'], ['eats', '먹는 것', '붕어 같은 물고기와 개구리를 먹어요.'], ['eatenBy', '나를 먹는 것', '다 자라면 먹는 동물이 거의 없어요.'], ['home', '사는 곳', '강과 논의 얕은 물가']])},
  {id: 'nutria', name: '뉴트리아', role: 'consumer', behaviorType: 'forager', zone: 'bank', invader: true,
    caption: '외래종: 물가 식물을 갉아 먹어요', description: '남아메리카에서 털가죽을 얻으려고 들여온 큰 쥐 무리의 동물이에요. 갈대와 부들의 뿌리까지 갉아 먹어 생태계 교란 생물로 지정되었어요.', habitat: '강 하류와 저수지의 물가',
    scientificName: 'Myocastor coypus', motion: {speedX: .01, speedY: .003, walkSeconds: [1, 2], pauseSeconds: [1, 2]}, life: life(300, 400, '외래종이에요', '마리'), size: [104, 78],
    card: card('주황색 앞니가 큰 외래종 동물이에요.', [['role', '역할', '식물을 먹고 살아서 소비자예요.'], ['eats', '먹는 것', '갈대, 부들, 마름의 줄기와 뿌리를 갉아 먹어요.'], ['eatenBy', '나를 먹는 것', '천적이 적어서 빨리 늘어나요.'], ['wow', '알아 두기', '2009년에 생태계 교란 생물로 지정되었어요.']])},
  {id: 'snapping-turtle', name: '늑대거북', role: 'consumer', behaviorType: 'forager', zone: 'bottom', invader: true,
    caption: '외래종: 물고기와 조개를 먹어요', description: '북아메리카에서 애완용으로 들여온 큰 거북이에요. 물고기와 조개를 잡아먹고 토종 남생이의 먹이를 빼앗아 생태계 교란 생물로 지정되었어요.', habitat: '저수지, 느린 강',
    scientificName: 'Chelydra serpentina', motion: {speedX: .008, speedY: .002, walkSeconds: [1, 2], pauseSeconds: [1.5, 3]}, life: life(300, 400, '외래종이에요', '마리'), size: [110, 82],
    card: card('턱이 강하고 꼬리가 긴 외래종 거북이에요.', [['role', '역할', '다른 동물을 잡아먹고 살아서 소비자예요.'], ['eats', '먹는 것', '물고기, 조개, 개구리를 먹어요.'], ['eatenBy', '나를 먹는 것', '천적이 거의 없어요.'], ['wow', '알아 두기', '2022년에 생태계 교란 생물로 지정되었어요. 남생이와 비교해 봐요.']])},
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
  // 상류
  edge('stone-diatom', 'caddisfly-larva', 'whole', 'R10', 'B', true),
  edge('stone-diatom', 'melania-snail', 'whole', 'R10', 'B', true),
  edge('stone-diatom', 'amphipod', 'whole', 'R10'),
  edge('caddisfly-larva', 'minnow', 'animal', 'R11', 'B', true),
  edge('amphipod', 'minnow', 'animal', 'R11'),
  edge('caddisfly-larva', 'native-crayfish', 'animal', 'R12'),
  edge('amphipod', 'native-crayfish', 'animal', 'R12'),
  edge('minnow', 'korean-catfish', 'animal', 'R13'),
  edge('caddisfly-larva', 'korean-catfish', 'animal', 'R13'),
  edge('minnow', 'aucha-perch', 'animal', 'R13', 'B', true),
  edge('native-crayfish', 'aucha-perch', 'animal', 'R13'),
  // 중류
  edge('hornwort', 'crucian-carp', 'whole', 'R20', 'B', true),
  edge('tape-grass', 'crucian-carp', 'whole', 'R20'),
  edge('stone-diatom', 'pale-chub', 'whole', 'R21', 'B', true),
  edge('stone-diatom', 'sand-gudgeon', 'whole', 'R22'),
  edge('pale-chub', 'dark-sleeper', 'animal', 'R23'),
  edge('sand-gudgeon', 'dark-sleeper', 'animal', 'R23', 'B', true),
  edge('pale-chub', 'mandarin-fish', 'animal', 'R24', 'B', true),
  edge('crucian-carp', 'mandarin-fish', 'animal', 'R24'),
  edge('crucian-carp', 'otter', 'animal', 'R25', 'B', true),
  edge('mandarin-fish', 'otter', 'animal', 'R25'),
  edge('dark-sleeper', 'otter', 'animal', 'R25'),
  // 하류
  edge('hornwort', 'common-carp', 'whole', 'R26', 'B', true),
  edge('tape-grass', 'common-carp', 'whole', 'R26'),
  edge('algae', 'freshwater-clam', 'whole', 'R27', 'B', true),
  edge('water-chestnut', 'reeves-turtle', 'whole', 'R28', 'B', true),
  edge('freshwater-clam', 'reeves-turtle', 'animal', 'R28'),
  edge('crucian-carp', 'grey-heron', 'animal', 'R29', 'B', true),
  edge('common-carp', 'otter', 'animal', 'R25'),
  edge('freshwater-clam', 'otter', 'animal', 'R25'),
];
// What an invader eats while it stays (the boss rule, not the feeding system).
export const riverInvaderPrey = {
  bullfrog: ['frog-tadpole', 'medaka', 'frog', 'diving-beetle'],
  'red-swamp-crayfish': ['frog-tadpole', 'pond-snail', 'medaka', 'daphnia'],
  'largemouth-bass': ['pale-chub', 'crucian-carp', 'sand-gudgeon', 'dark-sleeper'],
  bluegill: ['pale-chub', 'melania-snail', 'crucian-carp', 'sand-gudgeon'],
  nutria: ['reed', 'cattail', 'water-chestnut'],
  'snapping-turtle': ['crucian-carp', 'freshwater-clam', 'common-carp'],
};
const riverEvidence = {
  R1: {url: 'https://species.nibr.go.kr/', location: '물벼룩류 > 먹이', note: '물벼룩은 물속의 작은 조류를 걸러 먹어요. 특정 조류 종과의 쌍은 단순화했어요.'},
  R2: {url: 'https://species.nibr.go.kr/', location: '송사리 > 먹이', note: '송사리는 물벼룩 같은 작은 동물성 플랑크톤을 먹어요.'},
  R3: {url: 'https://species.nibr.go.kr/', location: '논우렁이 > 먹이', note: '우렁이는 바닥과 물풀에 붙은 조류를 갉아 먹어요.'},
  R4: {url: 'https://species.nibr.go.kr/', location: '참개구리 올챙이 > 먹이', note: '올챙이는 물속의 조류와 물풀을 갉아 먹어요.'},
  R5: {url: 'https://genebank.rda.go.kr/PB/jw/insectView.bo?page=1&species_id=ZO1CR0046&use_kind=03', location: '물방개 > 먹이', note: '물방개는 올챙이와 작은 물고기 같은 물속 동물을 잡아먹어요.'},
  R7: {url: 'https://www.gb.go.kr/Main/marinefishery/page.do?mnu_uid=15943', location: '메기 > 먹이', note: '메기는 밤에 바닥 근처에서 작은 물고기와 개구리, 물속 곤충을 잡아먹어요.'},
  R10: {url: 'https://species.nibr.go.kr/', location: '다슬기·날도래류·옆새우류 > 먹이', note: '다슬기와 날도래 애벌레, 엽새우는 돌에 붙은 부착 조류(돌말)를 갉아 먹어요.'},
  R11: {url: 'https://species.nibr.go.kr/', location: '버들치 > 먹이', note: '버들치는 물속 곤충의 애벌레와 작은 갑각류를 먹어요.'},
  R12: {url: 'https://species.nibr.go.kr/', location: '가재 > 먹이', note: '가재는 물속 곤충 애벌레, 작은 갑각류와 가라앉은 낙엽을 먹는 잡식성이에요.'},
  R13: {url: 'https://www.gb.go.kr/Main/marinefishery/page.do?mnu_uid=15943', location: '미유기·꺽지 > 먹이', note: '미유기와 꺽지는 작은 물고기와 물속 곤충, 갑각류를 잡아먹어요.'},
  R20: {url: 'https://species.nibr.go.kr/', location: '붕어 > 먹이', note: '붕어는 물풀과 작은 동물을 함께 먹는 잡식성이에요. 물풀 쪽만 보여 주도록 단순화했어요.'},
  R21: {url: 'https://species.nibr.go.kr/', location: '피라미 > 먹이', note: '피라미는 돌에 붙은 부착 조류와 물속 곤충을 먹어요.'},
  R22: {url: 'https://species.nibr.go.kr/', location: '모래무지 > 먹이', note: '모래무지는 모래를 빨아들여 그 속의 작은 동물과 부착 조류를 걸러 먹어요.'},
  R23: {url: 'https://species.nibr.go.kr/', location: '동사리 > 먹이', note: '동사리는 바닥에 숨어 있다가 작은 물고기와 물속 곤충을 잡아먹어요.'},
  R24: {url: 'https://species.nibr.go.kr/', location: '쏘가리 > 먹이', note: '쏘가리는 피라미, 붕어 같은 물고기를 잡아먹는 육식성 물고기예요.'},
  R25: {url: 'https://www.heritage.go.kr/', location: '수달(천연기념물) > 먹이', note: '수달은 주로 물고기를 먹고 개구리, 가재도 먹어요.'},
  R26: {url: 'https://species.nibr.go.kr/', location: '잉어 > 먹이', note: '잉어는 물풀과 바닥의 작은 동물을 먹는 잡식성이에요. 물풀 쪽만 보여 주도록 단순화했어요.'},
  R27: {url: 'https://species.nibr.go.kr/', location: '말조개 > 먹이', note: '민물조개는 물을 걸러 그 속의 식물성 플랑크톤(작은 조류)을 먹어요.'},
  R28: {url: 'https://www.heritage.go.kr/', location: '남생이(천연기념물) > 먹이', note: '남생이는 물풀과 열매, 조개, 작은 물고기를 먹는 잡식성이에요.'},
  R29: {url: 'https://species.nibr.go.kr/', location: '왜가리 > 먹이', note: '왜가리는 얕은 물에서 물고기와 개구리를 잡아먹어요.'},
  R6: {url: 'https://www.honda.co.jp/outdoor/adventure/tonosamagaeru.html', location: '참개구리 > 먹이', note: '참개구리는 물가와 물 위의 곤충을 잡아먹어요. 소금쟁이 특정 쌍은 단순화했어요.'},
};

export const riverPrices = {algae: 3, duckweed: 3, 'water-lily': 5, cattail: 3, daphnia: 3, medaka: 6, 'pond-snail': 5, 'water-strider': 5, 'frog-tadpole': 4, 'diving-beetle': 7, catfish: 9, 'water-decomposer': 5,
  'stone-diatom': 3, 'water-dropwort': 3, 'pussy-willow': 6, 'caddisfly-larva': 4, 'melania-snail': 4, amphipod: 4, minnow: 6, 'native-crayfish': 8, 'korean-catfish': 9, 'aucha-perch': 10,
  hornwort: 3, 'tape-grass': 3, 'pale-chub': 5, 'crucian-carp': 6, 'sand-gudgeon': 5, 'dark-sleeper': 8, 'mandarin-fish': 10, otter: 12,
  reed: 3, 'water-chestnut': 3, 'freshwater-clam': 5, 'common-carp': 7, 'reeves-turtle': 9, 'grey-heron': 10};
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
  {chapterId: 'river-upstream', number: 2, title: '상류', events: ['flood', 'valley-trash'], seedSeconds: 55,
    newSpecies: ['stone-diatom', 'melania-snail', 'caddisfly-larva', 'pussy-willow', 'amphipod', 'minnow', 'water-dropwort', 'native-crayfish', 'korean-catfish', 'aucha-perch'],
    intro: '차갑고 맑은 물이 빠르게 흐르는 계곡이에요. 돌에 붙은 돌말부터 꺽지까지 먹이 관계를 이어요.',
    art: {src: './assets/images/backgrounds/river-upstream.webp', alt: '맑고 빠른 계곡물의 수면과 물속 단면, 자갈과 큰 돌이 있는 바닥, 오른쪽의 자갈 물가와 흙 단면.'}, stages: [
    {stageId: '2-1', title: '돌 위의 조류', points: 12, events: [],
      goal: '상류에는 물풀 대신 돌에 붙은 돌말이 생산자예요. 다슬기와 날도래 애벌레가 돌말을 먹어요. 다슬기를 길러 강 별 3개를 모아요.',
      tasks: [{text: '다슬기 기르기', have: 'melania-snail'}, {text: '생산자·소비자 균형 잡기', balance: true}],
      inventory: ['stone-diatom', 'melania-snail', 'caddisfly-larva'], requiredSpecies: {'caddisfly-larva': 1, 'melania-snail': 1},
      organisms: [['stone-diatom', .12, .85], ['stone-diatom', .28, .86], ['stone-diatom', .44, .85], ['stone-diatom', .56, .86], ['caddisfly-larva', .2, .9], ['caddisfly-larva', .48, .91]]},
    {stageId: '2-2', title: '낙엽을 먹는 엽새우', points: 14, events: [],
      goal: '물가의 갯버들 잎이 물에 떨어지면 분해자가 분해해요. 엽새우는 돌말을 먹고, 버들치는 엽새우와 날도래 애벌레를 먹어요. 버들치를 놓아 강 별 3개를 모아요.',
      tasks: [{text: '버들치 놓기', have: 'minnow'}, {text: '낙엽 분해하기', decomposed: true}],
      inventory: ['stone-diatom', 'pussy-willow', 'melania-snail', 'caddisfly-larva', 'amphipod', 'minnow', 'water-decomposer'], requiredSpecies: {'caddisfly-larva': 1, amphipod: 1, minnow: 1}, needsDecomposition: true,
      organisms: [['stone-diatom', .12, .85], ['stone-diatom', .26, .86], ['stone-diatom', .4, .85], ['stone-diatom', .54, .86], ['pussy-willow', .86, .4], ['melania-snail', .1, .92],
        ['caddisfly-larva', .22, .9], ['caddisfly-larva', .44, .91], ['amphipod', .32, .88], ['amphipod', .5, .9]]},
    {stageId: '2-3', title: '돌 밑의 가재', points: 16, events: ['flood'],
      goal: '토종 가재는 돌 밑에 숨어 날도래 애벌레와 엽새우를 먹어요. 큰비로 홍수가 오기 전에 생산자를 넉넉히 길러 두고, 가재를 길러 강 별 3개를 모아요.',
      tasks: [{text: '가재 기르기', have: 'native-crayfish'}, {text: '홍수 견디기', crisis: 'flood'}],
      inventory: ['stone-diatom', 'water-dropwort', 'pussy-willow', 'caddisfly-larva', 'amphipod', 'minnow', 'native-crayfish', 'water-decomposer'], requiredSpecies: {'caddisfly-larva': 1, amphipod: 1, 'native-crayfish': 1},
      organisms: [['stone-diatom', .1, .85], ['stone-diatom', .22, .86], ['stone-diatom', .34, .85], ['stone-diatom', .46, .86], ['stone-diatom', .56, .85], ['pussy-willow', .86, .4], ['water-dropwort', .8, .42],
        ['caddisfly-larva', .16, .9], ['caddisfly-larva', .4, .91], ['amphipod', .28, .88], ['amphipod', .52, .9], ['minnow', .36, .64], ['water-decomposer', .58, .93]]},
    {stageId: '2-4', title: '상류의 사냥꾼', points: 18, events: ['valley-trash'],
      goal: '꺽지는 버들치와 가재를, 미유기는 버들치와 애벌레를 잡아먹는 상류의 사냥꾼이에요. 사람들이 계곡에 버린 쓰레기도 막아야 해요. 꺽지를 길러 강 별 3개를 모아요.',
      tasks: [{text: '꺽지 기르기', have: 'aucha-perch'}, {text: '쓰레기 치우기', crisis: 'valley-trash'}],
      inventory: ['stone-diatom', 'water-dropwort', 'pussy-willow', 'caddisfly-larva', 'amphipod', 'minnow', 'native-crayfish', 'korean-catfish', 'aucha-perch', 'water-decomposer'], requiredSpecies: {'caddisfly-larva': 2, amphipod: 1, minnow: 2, 'aucha-perch': 1},
      organisms: [['stone-diatom', .1, .85], ['stone-diatom', .22, .86], ['stone-diatom', .34, .85], ['stone-diatom', .46, .86], ['stone-diatom', .56, .85], ['pussy-willow', .86, .4], ['water-dropwort', .8, .42],
        ['caddisfly-larva', .14, .9], ['caddisfly-larva', .3, .91], ['caddisfly-larva', .5, .9], ['amphipod', .24, .88], ['amphipod', .42, .9], ['minnow', .2, .62], ['minnow', .46, .66], ['native-crayfish', .38, .92], ['water-decomposer', .58, .93]]},
  ]},
  {chapterId: 'river-midstream', number: 3, title: '중류', events: ['drought', 'sewage'], seedSeconds: 60,
    newSpecies: ['hornwort', 'tape-grass', 'crucian-carp', 'pale-chub', 'sand-gudgeon', 'dark-sleeper', 'mandarin-fish', 'otter'],
    intro: '물살이 느려지고 바닥에 모래가 쌓이는 강이에요. 물풀이 자라고 큰 물고기와 수달이 살아요.',
    art: {src: './assets/images/backgrounds/river-midstream.webp', alt: '물살이 느린 강의 수면과 물속 단면, 모래 바닥, 오른쪽의 모래 물가와 수달 굴이 있는 흙 단면.'}, stages: [
    {stageId: '3-1', title: '물풀 숲', points: 12, events: [],
      goal: '중류에는 붕어마름과 나사말 같은 물풀이 바닥에 뿌리를 내리고 자라요. 붕어는 물풀을 뜯어 먹어요. 붕어를 길러 강 별 3개를 모아요.',
      tasks: [{text: '붕어 기르기', have: 'crucian-carp'}, {text: '생산자·소비자 균형 잡기', balance: true}],
      inventory: ['stone-diatom', 'hornwort', 'tape-grass', 'melania-snail', 'crucian-carp'], requiredSpecies: {'melania-snail': 1, 'crucian-carp': 1},
      organisms: [['stone-diatom', .14, .85], ['stone-diatom', .4, .86], ['hornwort', .24, .86], ['hornwort', .5, .85], ['tape-grass', .32, .85], ['tape-grass', .58, .86], ['melania-snail', .2, .92], ['melania-snail', .46, .91]]},
    {stageId: '3-2', title: '모래 바닥', points: 14, events: ['drought'],
      goal: '피라미는 물속에서, 모래무지는 모래 바닥에서 돌말을 먹어요. 가뭄으로 물이 줄기 전에 생산자를 넉넉히 길러 두고, 모래무지를 놓아 강 별 3개를 모아요.',
      tasks: [{text: '모래무지 놓기', have: 'sand-gudgeon'}, {text: '가뭄 견디기', crisis: 'drought'}],
      inventory: ['stone-diatom', 'hornwort', 'tape-grass', 'melania-snail', 'crucian-carp', 'pale-chub', 'sand-gudgeon'], requiredSpecies: {'crucian-carp': 1, 'pale-chub': 1, 'sand-gudgeon': 1},
      organisms: [['stone-diatom', .1, .85], ['stone-diatom', .26, .86], ['stone-diatom', .44, .85], ['stone-diatom', .56, .86], ['hornwort', .18, .86], ['tape-grass', .36, .85], ['hornwort', .5, .86],
        ['melania-snail', .3, .92], ['crucian-carp', .3, .66]]},
    {stageId: '3-3', title: '바닥의 사냥꾼', points: 16, events: ['sewage'],
      goal: '동사리는 바닥에 숨어 모래무지를, 쏘가리는 피라미와 붕어를 잡아먹어요. 마을의 생활 하수가 강으로 흘러드는 것도 막아야 해요. 쏘가리를 길러 강 별 3개를 모아요.',
      tasks: [{text: '쏘가리 기르기', have: 'mandarin-fish'}, {text: '생활 하수 막기', crisis: 'sewage'}],
      inventory: ['stone-diatom', 'hornwort', 'tape-grass', 'melania-snail', 'crucian-carp', 'pale-chub', 'sand-gudgeon', 'dark-sleeper', 'mandarin-fish', 'water-decomposer'], requiredSpecies: {'crucian-carp': 1, 'pale-chub': 2, 'sand-gudgeon': 1, 'mandarin-fish': 1},
      organisms: [['stone-diatom', .1, .85], ['stone-diatom', .22, .86], ['stone-diatom', .34, .85], ['stone-diatom', .46, .86], ['stone-diatom', .56, .85], ['hornwort', .16, .86], ['tape-grass', .4, .85], ['hornwort', .52, .86],
        ['melania-snail', .2, .92], ['crucian-carp', .26, .66], ['pale-chub', .4, .62], ['pale-chub', .5, .7], ['sand-gudgeon', .14, .91], ['sand-gudgeon', .44, .92], ['dark-sleeper', .3, .92], ['water-decomposer', .58, .93]]},
    // The invaders come here instead of the chapter's crises (one event at a time).
    {stageId: '3-4', title: '수달의 굴과 침입자', points: 18, events: [],
      goal: '수달은 강둑의 굴에서 쉬고 물속에서 붕어와 쏘가리를 잡아먹는 중류의 최상위 소비자예요. 그런데 외래종 물고기가 들어와 토종 물고기를 먹어요. 외래종을 빨리 내보내고 수달을 길러 강 별 3개를 모아요.',
      tasks: [{text: '수달 기르기', have: 'otter'}, {text: '외래종 내보내기', invader: true, icon: 'largemouth-bass'}],
      inventory: ['stone-diatom', 'hornwort', 'tape-grass', 'melania-snail', 'crucian-carp', 'pale-chub', 'sand-gudgeon', 'dark-sleeper', 'mandarin-fish', 'otter', 'water-decomposer'], requiredSpecies: {'crucian-carp': 2, 'pale-chub': 2, otter: 1},
      boss: {species: ['largemouth-bass', 'bluegill'], taps: 20},
      organisms: [['stone-diatom', .1, .85], ['stone-diatom', .22, .86], ['stone-diatom', .34, .85], ['stone-diatom', .46, .86], ['stone-diatom', .56, .85], ['hornwort', .16, .86], ['tape-grass', .28, .85], ['hornwort', .4, .86], ['tape-grass', .52, .85],
        ['melania-snail', .2, .92], ['crucian-carp', .24, .66], ['crucian-carp', .46, .72], ['pale-chub', .34, .62], ['pale-chub', .54, .68], ['sand-gudgeon', .12, .91], ['dark-sleeper', .38, .92], ['mandarin-fish', .3, .76], ['water-decomposer', .58, .93]]},
  ]},
  {chapterId: 'river-downstream', number: 4, title: '하류', events: ['factory-waste', 'oil-spill'], seedSeconds: 65,
    newSpecies: ['reed', 'water-chestnut', 'common-carp', 'freshwater-clam', 'reeves-turtle', 'grey-heron'],
    intro: '강폭이 넓어지고 물이 느리게 흐르는 곳이에요. 진흙 바닥에 조개가 살고, 물가에는 갈대밭이 펼쳐져요.',
    art: {src: './assets/images/backgrounds/river-downstream.webp', alt: '넓고 느린 강의 수면과 물속 단면, 진흙 바닥, 오른쪽의 넓은 물가와 흙 단면.'}, stages: [
    {stageId: '4-1', title: '갈대밭', points: 14, events: [],
      goal: '하류의 물가에는 갈대와 부들이, 물 위에는 마름이 자라요. 잉어는 붕어처럼 물풀을 먹는 큰 물고기예요. 잉어를 길러 강 별 3개를 모아요.',
      tasks: [{text: '잉어 기르기', have: 'common-carp'}, {text: '생산자·소비자 균형 잡기', balance: true}],
      inventory: ['reed', 'cattail', 'water-chestnut', 'hornwort', 'tape-grass', 'crucian-carp', 'common-carp'], requiredSpecies: {'crucian-carp': 1, 'common-carp': 1},
      organisms: [['reed', .86, .4], ['cattail', .8, .42], ['water-chestnut', .34, .32], ['water-chestnut', .52, .38], ['hornwort', .14, .86], ['tape-grass', .28, .85], ['hornwort', .42, .86], ['tape-grass', .56, .85], ['crucian-carp', .3, .66]]},
    {stageId: '4-2', title: '진흙 속 조개', points: 14, events: ['factory-waste'],
      goal: '말조개는 진흙 바닥에서 물을 걸러 작은 조류를 먹고, 물을 맑게 해요. 공장 폐수가 강으로 흘러드는 것도 막아야 해요. 말조개를 길러 강 별 3개를 모아요.',
      tasks: [{text: '말조개 기르기', have: 'freshwater-clam'}, {text: '공장 폐수 막기', crisis: 'factory-waste'}],
      inventory: ['reed', 'water-chestnut', 'algae', 'hornwort', 'tape-grass', 'freshwater-clam', 'crucian-carp', 'common-carp', 'water-decomposer'], requiredSpecies: {'freshwater-clam': 1, 'crucian-carp': 1, 'common-carp': 1},
      organisms: [['reed', .86, .4], ['water-chestnut', .4, .34], ['algae', .1, .85], ['algae', .26, .86], ['algae', .44, .85], ['algae', .56, .86], ['hornwort', .18, .86], ['tape-grass', .36, .85], ['hornwort', .5, .86],
        ['crucian-carp', .3, .66], ['common-carp', .46, .72], ['water-decomposer', .58, .93]]},
    {stageId: '4-3', title: '남생이의 강', points: 18, events: ['oil-spill'],
      goal: '토종 거북 남생이는 마름과 조개를 먹고, 왜가리는 얕은 물가에서 붕어를 잡아요. 배에서 기름이 새어 나와 물 위를 덮으면 햇빛이 물속에 잘 들지 않아요. 남생이를 길러 강 별 3개를 모아요.',
      tasks: [{text: '남생이 기르기', have: 'reeves-turtle'}, {text: '기름 걷어 내기', crisis: 'oil-spill'}],
      inventory: ['reed', 'water-chestnut', 'algae', 'hornwort', 'freshwater-clam', 'crucian-carp', 'reeves-turtle', 'grey-heron', 'water-decomposer'], requiredSpecies: {'freshwater-clam': 1, 'crucian-carp': 1, 'reeves-turtle': 1},
      organisms: [['reed', .86, .4], ['water-chestnut', .3, .32], ['water-chestnut', .46, .36], ['water-chestnut', .58, .4], ['algae', .1, .85], ['algae', .26, .86], ['algae', .44, .85], ['algae', .56, .86], ['hornwort', .18, .86], ['hornwort', .36, .86], ['tape-grass', .5, .85],
        ['freshwater-clam', .2, .92], ['freshwater-clam', .48, .91], ['crucian-carp', .26, .66], ['crucian-carp', .44, .72], ['water-decomposer', .58, .93]]},
    // The invaders come here instead of the chapter's crises (one event at a time).
    {stageId: '4-4', title: '강의 주인과 침입자', points: 20, events: [],
      goal: '하류의 먹이그물에는 조개, 붕어, 잉어, 남생이, 왜가리, 수달이 이어져 있어요. 그런데 외래종이 들어와 갈대를 갉아 먹고 물고기와 조개를 먹어요. 외래종을 빨리 내보내고 왜가리를 길러 강 별 3개를 모아요.',
      tasks: [{text: '왜가리 기르기', have: 'grey-heron'}, {text: '외래종 내보내기', invader: true, icon: 'nutria'}],
      inventory: ['reed', 'cattail', 'water-chestnut', 'algae', 'hornwort', 'freshwater-clam', 'crucian-carp', 'common-carp', 'reeves-turtle', 'grey-heron', 'otter', 'water-decomposer'], requiredSpecies: {'freshwater-clam': 1, 'crucian-carp': 2, 'grey-heron': 1},
      boss: {species: ['nutria', 'snapping-turtle'], taps: 25},
      organisms: [['reed', .88, .4], ['reed', .8, .36], ['cattail', .92, .42], ['water-chestnut', .3, .32], ['water-chestnut', .46, .36], ['algae', .1, .85], ['algae', .26, .86], ['algae', .44, .85], ['algae', .56, .86], ['hornwort', .18, .86], ['hornwort', .36, .86], ['tape-grass', .5, .85],
        ['freshwater-clam', .2, .92], ['freshwater-clam', .48, .91], ['crucian-carp', .14, .7], ['crucian-carp', .24, .66], ['crucian-carp', .4, .72], ['crucian-carp', .54, .64], ['common-carp', .32, .76], ['reeves-turtle', .4, .5], ['water-decomposer', .58, .93]]},
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
  flood: [
    {question: '홍수가 나면 왜 다슬기와 날도래 애벌레 같은 소비자도 힘들어질까요?',
      choices: ['물이 불어나 몸 색깔이 바뀌어서', '흙탕물에 햇빛이 잘 들지 않고 돌말이 쓸려 가서 먹이가 줄어서', '홍수가 나면 물이 깨끗해져서'], answer: 1,
      explanation: '큰비로 물이 불어나면 돌에 붙은 돌말이 쓸려 가고, 흙탕물 때문에 햇빛이 물속에 잘 들지 않아요. 생산자가 줄면 그것을 먹는 소비자도 먹이가 모자라요.'},
    {question: '홍수가 지나간 뒤 계곡 생태계가 다시 회복되려면 무엇이 필요할까요?',
      choices: ['돌말 같은 생산자가 다시 자랄 시간', '소비자를 모두 없애는 것', '물을 모두 퍼내는 것'], answer: 0,
      explanation: '물이 맑아지고 햇빛이 들면 생산자가 다시 자라요. 생산자가 늘어나면 먹이 관계를 따라 소비자도 차례로 회복해요.'},
  ],
  'valley-trash': [
    {question: '계곡에 버린 쓰레기는 강 생물에게 어떤 영향을 줄까요?',
      choices: ['물과 물가를 더럽혀 생물이 살기 어려워져요', '물고기의 먹이가 되어 좋아요', '아무 영향이 없어요'], answer: 0,
      explanation: '쓰레기는 물과 물가의 흙을 더럽히고, 작은 동물이 삼키거나 걸려 다칠 수 있어요. 깨끗한 물에서만 사는 가재와 다슬기가 먼저 사라져요.'},
    {question: '계곡에 놀러 갔을 때 우리가 할 수 있는 일은 무엇일까요?',
      choices: ['내가 만든 쓰레기를 되가져와요', '쓰레기를 돌 밑에 숨겨요', '쓰레기를 물에 흘려보내요'], answer: 0,
      explanation: '쓰레기를 되가져오면 계곡에 쓰레기가 남지 않아요. 버려진 쓰레기를 주우면 더 좋아요.'},
  ],
  sewage: [
    {question: '생활 하수가 강으로 흘러들면 강 생물에게 어떤 일이 생길까요?',
      choices: ['물이 더러워지고 물속 산소가 줄어 물고기와 다슬기가 살기 어려워져요', '물고기가 먹을 양분이 많아져서 모두 잘 자라요', '아무 변화가 없어요'], answer: 0,
      explanation: '하수 속 세제와 음식물 찌꺼기가 물을 더럽혀요. 조류가 지나치게 불어나 녹조가 생기면 물속 산소가 모자라 물고기와 다슬기가 살기 어려워요.'},
    {question: '집에서 강을 지키기 위해 할 수 있는 일은 무엇일까요?',
      choices: ['설거지할 때 세제를 많이 써요', '세제를 알맞게 쓰고 음식물 찌꺼기를 하수구에 버리지 않아요', '쓰고 남은 기름을 하수구에 부어요'], answer: 1,
      explanation: '집에서 버리는 물이 깨끗할수록 강으로 가는 오염 물질이 줄어요. 물을 아껴 쓰는 것도 강을 지키는 일이에요.'},
  ],
  'factory-waste': [
    {question: '공장 폐수가 강으로 흘러들면 강 생태계에 어떤 일이 생길까요?',
      choices: ['물고기가 병들거나 죽고, 조개와 물풀이 사는 곳이 망가져요', '강물이 더 맑아져요', '물고기만 영향을 받고 다른 생물은 괜찮아요'], answer: 0,
      explanation: '폐수 속 해로운 물질은 물과 바닥 진흙을 더럽혀요. 조개와 물풀이 먼저 해를 입고, 먹이 관계를 따라 물고기와 왜가리, 수달까지 영향을 받아요.'},
    {question: '폐수 속 해로운 물질이 먹이 관계를 따라 쌓이면 어떤 생물의 몸에 가장 많이 쌓일까요?',
      choices: ['작은 조류', '말조개', '수달이나 왜가리 같은 최상위 소비자'], answer: 2,
      explanation: '해로운 물질은 몸 밖으로 잘 나가지 않아서, 작은 생물을 먹는 생물, 그 생물을 먹는 생물로 갈수록 더 많이 쌓여요.'},
  ],
  'oil-spill': [
    {question: '강물 위에 기름이 덮이면 왜 물풀이 잘 자라지 못할까요?',
      choices: ['기름 막이 햇빛을 막아서', '기름이 물풀의 먹이라서', '기름 때문에 물이 따뜻해져서'], answer: 0,
      explanation: '물풀은 햇빛을 받아 스스로 양분을 만드는 생산자예요. 기름 막이 햇빛을 막으면 양분을 만들지 못해요.'},
    {question: '물풀이 줄어들면 남생이와 붕어에게 어떤 일이 생길까요?',
      choices: ['먹이가 모자라 살기 어려워져요', '먹이가 늘어 잘 자라요', '아무 일도 없어요'], answer: 0,
      explanation: '물풀을 먹는 붕어와 남생이는 먹이가 줄어요. 생산자가 줄면 먹이 관계를 따라 소비자도 차례로 영향을 받아요.'},
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
  'invader:largemouth-bass': [
    {question: '배스가 강에 많아지면 왜 피라미와 붕어 같은 토종 물고기가 줄어들까요?',
      choices: ['배스가 토종 물고기를 많이 잡아먹고, 배스를 먹는 천적은 적어서', '배스가 물풀만 먹어서', '배스가 물을 깨끗하게 해서'], answer: 0,
      explanation: '배스는 입이 큰 외래종 물고기예요. 토종 물고기와 새우, 올챙이를 잡아먹고, 우리 강에는 천적이 적어서 빨리 늘어나요.'},
    {question: '낚시로 잡은 배스를 어떻게 하는 것이 좋을까요?',
      choices: ['다른 강에 옮겨 놓아줘요', '다시 강에 풀어 주지 않아요', '집 근처 연못에 넣어 줘요'], answer: 1,
      explanation: '외래종을 다른 곳에 옮겨 풀어 주면 그곳의 토종 생물까지 위험해져요. 생태계 교란 생물은 다시 풀어 주지 않아요.'},
  ],
  'invader:bluegill': [
    {question: '블루길이 토종 물고기에게 해로운 까닭은 무엇일까요?',
      choices: ['토종 물고기의 알과 새끼를 먹어서', '물풀을 많이 길러서', '수달의 먹이가 되어서'], answer: 0,
      explanation: '블루길은 외래종이에요. 토종 물고기의 알과 새끼, 다슬기 같은 작은 동물을 먹어서 다음 세대의 토종 물고기가 줄어요.'},
    {question: '외래종이 강에 퍼지지 않게 하려면 어떻게 해야 할까요?',
      choices: ['기르던 물고기를 강에 함부로 놓아주지 않아요', '외래종을 더 많이 데려와요', '토종 물고기를 모두 잡아요'], answer: 0,
      explanation: '집에서 기르던 물고기를 강에 놓아주면 생태계 교란 생물이 될 수 있어요. 함부로 놓아주지 않는 것이 가장 중요해요.'},
  ],
  'invader:nutria': [
    {question: '뉴트리아가 갈대와 부들의 뿌리를 갉아 먹으면 어떤 일이 생길까요?',
      choices: ['물가의 생산자가 줄고, 갈대밭에 숨어 살던 동물이 살 곳을 잃어요', '갈대가 더 잘 자라요', '물고기가 많아져요'], answer: 0,
      explanation: '뉴트리아는 뿌리까지 갉아 먹어 갈대와 부들이 다시 자라기 어려워요. 생산자가 사라지면 그곳에 기대어 살던 동물도 함께 줄어요.'},
    {question: '뉴트리아처럼 사람이 들여온 동물이 생태계를 해치지 않게 하려면 어떻게 해야 할까요?',
      choices: ['기르던 동물을 자연에 함부로 풀어 주지 않아요', '더 많이 데려와 길러요', '갈대밭을 모두 없애요'], answer: 0,
      explanation: '뉴트리아는 털가죽을 얻으려고 들여왔다가 버려지거나 빠져나가 퍼졌어요. 들여온 생물을 자연에 풀어 주지 않는 것이 중요해요.'},
  ],
  'invader:snapping-turtle': [
    {question: '늑대거북이 강에 살면 토종 남생이에게 어떤 일이 생길까요?',
      choices: ['물고기와 조개를 먼저 먹어 남생이의 먹이가 줄어요', '남생이의 먹이가 많아져요', '아무 영향이 없어요'], answer: 0,
      explanation: '늑대거북은 몸집이 크고 턱이 강한 외래종이에요. 남생이와 같은 먹이를 먹어서 남생이가 먹을 것이 줄어요.'},
    {question: '기르던 거북을 더 기를 수 없게 되면 어떻게 해야 할까요?',
      choices: ['가까운 강에 놓아줘요', '자연에 풀어 주지 않고 어른이나 관련 기관에 물어봐요', '공원 연못에 넣어 줘요'], answer: 1,
      explanation: '애완 거북을 자연에 풀어 주면 생태계 교란 생물이 될 수 있어요. 버리지 말고 도움을 청해요.'},
  ],
};

// The river's crises: natural ones are prepared for, people-made ones are
// stopped by choosing the right action first, then cleaned up (pieces).
export const riverCrises = {
  flood: {human: false, factor: 'water', notice: '곧 큰비가 와서 강물이 불어나요!',
    effect: '큰비로 물이 불어나고 흙탕물이 되면 돌에 붙은 돌말이 쓸려 가고, 물속에 햇빛이 잘 들지 않아 생산자가 잘 자라지 못해요. 먹이가 모자라면 강 별이 멈춰요.'},
  'valley-trash': {human: true, factor: 'soil', notice: '사람들이 계곡에 쓰레기를 버리고 가요!', item: '쓰레기', icon: '🥤', pieces: ['bag', 'bottle', 'peel'],
    area: {left: .08, right: .58, y: .93}, pieceAreas: {bottle: {left: .25, right: .66, y: .38}},
    status: '계곡에 버린 쓰레기가 물가와 물을 더럽히고 있어요. 쓰레기를 눌러 치워요.', gone: '쓰레기는 다 치웠어요.', care: '계곡 물가 되살리기',
    collected: '쓰레기를 치웠어요. 계곡에 쓰레기가 남지 않게 되가져가는 것이 가장 좋아요.',
    question: '계곡에 쓰레기가 쌓이지 않게 하려면 어떻게 해야 할까요?',
    choices: [
      {text: '쓰레기를 물에 흘려보내요', why: '물에 흘려보낸 쓰레기는 하류와 바다까지 떠내려가 더 많은 생물을 해쳐요.'},
      {text: '내가 만든 쓰레기는 되가져가고, 버려진 쓰레기는 주워요', right: true, why: '쓰레기를 남기지 않으면 계곡이 깨끗하게 유지돼요. 이제 계곡에 버려진 쓰레기를 눌러 치워요.'},
      {text: '쓰레기를 돌 밑에 숨겨요', why: '돌 밑에 숨긴 쓰레기도 그대로 남아 물과 흙을 더럽히고, 돌 밑에 사는 가재와 애벌레가 살 곳을 잃어요.'}]},
  // The drain pipe pours from the bank's edge; the dirty water spreads in the water.
  sewage: {human: true, factor: 'water', notice: '마을의 생활 하수가 강으로 흘러들어요!', item: '하수', icon: '🚰', pieces: ['drain-pipe', 'sewage-cloud', 'sewage-cloud'],
    pieceImages: {'drain-pipe': './assets/images/pollution/drain-pipe.webp', 'sewage-cloud': './assets/images/pollution/sewage-cloud.webp'},
    area: {left: .1, right: .56, y: .72}, pieceAreas: {'drain-pipe': {left: .64, right: .7, y: .52}},
    status: '생활 하수가 강물을 더럽혀 물속 생물이 살기 어려워요. 하수를 눌러 걷어 내요.', gone: '하수는 다 걷어 냈어요.', care: '강물 되살리기',
    collected: '하수를 걷어 냈어요. 하수가 강에 그대로 흘러들지 않게 막는 것이 가장 중요해요.',
    question: '생활 하수가 강을 더럽히지 않게 하려면 어떻게 해야 할까요?',
    choices: [
      {text: '세제를 많이 써서 깨끗하게 씻어요', why: '세제를 많이 쓰면 하수에 세제가 더 많이 섞여 강이 더 더러워져요.'},
      {text: '비 오는 날에 하수를 몰래 흘려보내요', why: '비 오는 날에도 하수는 그대로 강으로 흘러가 물고기와 다슬기를 해쳐요.'},
      {text: '하수는 하수 처리장에서 깨끗하게 한 뒤 내보내고, 집에서는 세제와 음식물 찌꺼기를 줄여요', right: true, why: '하수를 처리하고 오염 물질을 줄이면 강물이 덜 더러워져요. 이제 강에 흘러든 하수를 눌러 걷어 내요.'}]},
  // Waste water from a factory's pipe: find where it comes from and stop it there.
  'factory-waste': {human: true, factor: 'water', notice: '공장의 폐수가 강으로 흘러들어요!', item: '폐수', icon: '🏭', pieces: ['drain-pipe', 'sewage-cloud', 'sewage-cloud'],
    pieceImages: {'drain-pipe': './assets/images/pollution/drain-pipe.webp', 'sewage-cloud': './assets/images/pollution/sewage-cloud.webp'},
    area: {left: .1, right: .56, y: .74}, pieceAreas: {'drain-pipe': {left: .64, right: .7, y: .52}},
    status: '공장 폐수가 강물을 더럽혀 물고기와 조개가 살기 어려워요. 폐수를 눌러 걷어 내요.', gone: '폐수는 다 걷어 냈어요.', care: '강물 되살리기',
    collected: '폐수를 걷어 냈어요. 폐수가 나오는 곳을 찾아 막아야 다시 흘러들지 않아요.',
    question: '공장 폐수가 강을 더럽히지 않게 하려면 어떻게 해야 할까요?',
    choices: [
      {text: '폐수가 나오는 곳을 찾아, 공장이 폐수를 깨끗하게 처리한 뒤 내보내게 해요', right: true, why: '오염이 시작되는 곳을 막아야 강물이 다시 더러워지지 않아요. 이제 강에 흘러든 폐수를 눌러 걷어 내요.'},
      {text: '강물이 많으니 폐수가 저절로 묽어질 때까지 기다려요', why: '폐수 속 해로운 물질은 묽어져도 사라지지 않아요. 바닥에 쌓이고 먹이 관계를 따라 다른 생물의 몸에도 쌓여요.'},
      {text: '물고기만 다른 강으로 옮겨요', why: '물고기를 옮겨도 폐수는 계속 흘러들어 조개와 물풀, 남은 생물이 모두 해를 입어요.'}]},
  // Oil from a boat floats on the surface and keeps sunlight out of the water.
  'oil-spill': {human: true, factor: 'sunlight', notice: '배에서 기름이 새어 나와 강물 위로 퍼져요!', item: '기름', icon: '🛢️', pieces: ['oil-slick'],
    pieceImages: {'oil-slick': './assets/images/pollution/oil-slick.webp'},
    area: {left: .24, right: .64, y: .38},
    status: '물 위의 기름이 햇빛을 막아 물풀이 잘 자라지 못해요. 기름을 눌러 걷어 내요.', gone: '기름은 다 걷어 냈어요.', care: '물풀 되살리기',
    collected: '기름을 걷어 냈어요. 기름이 더 퍼지지 않게 막고 빨리 걷어 내는 것이 중요해요.',
    question: '강물 위로 기름이 퍼지면 가장 먼저 어떻게 해야 할까요?',
    choices: [
      {text: '세제를 뿌려 기름을 녹여요', why: '세제도 물을 더럽히는 오염 물질이에요. 기름이 사라지는 것처럼 보여도 물속으로 퍼져 생물을 해쳐요.'},
      {text: '기름이 더 퍼지지 않게 둘러막고, 물 위의 기름을 걷어 내요', right: true, why: '기름은 물 위에 떠서 넓게 퍼지므로 먼저 둘러막고 걷어 내야 해요. 이제 기름을 눌러 걷어 내요.'},
      {text: '기름이 저절로 사라질 때까지 기다려요', why: '기다리는 동안 기름이 넓게 퍼져 햇빛을 막고, 물새와 물고기의 몸에 묻어 해를 입혀요.'}]},
};
const riverEvents = {
  flood: {name: '홍수', factor: 'water', duration: 180, recoverySeconds: 240, magnitude: -.65,
    cause: '큰비가 내려 강물이 갑자기 불어나고 흙탕물이 되었어요.',
    expected: '돌말이 쓸려 가고 물속에 햇빛이 덜 들어 생산자가 잘 자라지 못해요. 물이 맑아지면 다시 회복돼요.'},
  'valley-trash': {name: '계곡 쓰레기', factor: 'soil', duration: 180, recoverySeconds: 240, magnitude: -.65,
    cause: '사람들이 계곡에 놀러 왔다가 쓰레기를 버리고 갔어요.',
    expected: '쓰레기가 물가와 물을 더럽혀요. 쓰레기를 치우고 물가를 되살려요.'},
  sewage: {name: '생활 하수', factor: 'water', duration: 180, recoverySeconds: 240, magnitude: -.65,
    cause: '마을에서 쓰고 버린 물이 깨끗하게 처리되지 않고 강으로 흘러들었어요.',
    expected: '물이 더러워져 물속 생물이 살기 어려워져요. 하수를 걷어 내고 강물을 되살려요.'},
  'factory-waste': {name: '공장 폐수', factor: 'water', duration: 180, recoverySeconds: 240, magnitude: -.65,
    cause: '공장에서 처리하지 않은 폐수를 강으로 흘려보냈어요.',
    expected: '물이 더러워져 물고기와 조개가 살기 어려워져요. 폐수를 걷어 내고 강물을 되살려요.'},
  'oil-spill': {name: '기름 유출', factor: 'sunlight', duration: 180, recoverySeconds: 240, magnitude: -.65,
    cause: '배에서 기름이 새어 나와 강물 위를 덮었어요.',
    expected: '기름 막이 햇빛을 막아 물풀이 잘 자라지 못해요. 기름을 걷어 내면 다시 회복돼요.'},
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
  Object.assign(crises, riverCrises);
  for (const [kind, event] of Object.entries(riverEvents)) { environmentEventDefinitions[kind] = {...event}; scaleFields(environmentEventDefinitions[kind], ['duration', 'recoverySeconds']); }
  // The water decomposer breaks down plant and animal remains.
  decompositionConfig.rates['water-decomposer'] = {litter: ecologyRate(.006), remains: ecologyRate(.006)};
  organicWorkers.litter.push('water-decomposer'); organicWorkers.remains.push('water-decomposer');
  decomposerIds.push('water-decomposer');
  // The river's cards only (the forest's stay known by id); invaders are no card.
  organisms.splice(0, organisms.length, ...riverSpecies.filter(s => !s.invader).map(s => organismById[s.id]));
  const riverStages = riverChapters.flatMap(chapter => chapter.stages.map(stage => ({...stage, chapter, events: stage.events ?? chapter.events, seedSeconds: chapter.seedSeconds})));
  chapters.splice(0, chapters.length, ...riverChapters);
  stages.splice(0, stages.length, ...riverStages);
  for (const id of Object.keys(stageById)) delete stageById[id];
  Object.assign(stageById, Object.fromEntries(riverStages.map(stage => [stage.stageId, stage])));
}
