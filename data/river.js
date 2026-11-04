// The river theme (강): its own organisms, living spaces and chapters, put in
// place of the forest's when the student explores the river (main.js, chapter
// mode only). The forest's tables are only added to, so nothing of the forest
// changes; its chapter list is swapped for the river's.
// Teaching-game values, not measurements, like the forest's.
import {organisms,organismById} from './organisms.js';
import {foodResourceConfig,feedingConfig} from './ecology-config.js';
import {producerGrowth} from './environment-config.js';
import {lifespanRules} from './lifespan-config.js';
import {starvationLimits,satietySeconds} from './population-config.js';
import {placementConfig,speciesProfiles} from './interaction-config.js';
import {speciesHabitats,habitatZones} from './habitats.js';
import {speciesCards} from './species-cards.js';
import {foodEvidence} from './food-evidence.js';
import {edge,addFoodRelations,foodPartLabels} from './food-relations.js';
import {addDiscoveryEvent,addShortageEvent} from './event-config.js';
import {chapters,stages,stageById,stageConfig,breeding} from './chapters.js';
import {ecologySeconds,ecologyRate,scaleFields} from './pacing-config.js';
import {survivalConfig} from './survival-config.js';

// Living spaces on the river picture (2400 x 940, assets/images/backgrounds):
// the waterline at y 423 (.45), the riverbed band from y 799 (.85), the bank
// slope from x 1776 (.74). A position is where the organism's feet or base is.
// Spaces overlap where an animal meets its food: small algae grow low in the
// water just above the bed, where both water animals and bed animals reach them.
export const riverZones = {
  surface: {left: .2, right: .72, top: .22, bottom: .43},
  water: {left: .04, right: .72, top: .56, bottom: .88},
  algae: {left: .04, right: .72, top: .83, bottom: .88},
  bottom: {left: .04, right: .72, top: .83, bottom: .95},
  shore: {left: .74, right: .96, top: .3, bottom: .6},
};
const riverHabitatZones = {surface: '수면', water: '물속', algae: '물 바닥 가까운 물속', bottom: '물 바닥', shore: '물가'};

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
];

// Eaten -> eater, like the forest's food relations. R: river sources.
export const riverFoodRelations = [
  edge('algae', 'daphnia', 'whole', 'R1', 'B', true),
  edge('daphnia', 'medaka', 'animal', 'R2', 'B', true),
  edge('algae', 'pond-snail', 'whole', 'R3'),
];
const riverEvidence = {
  R1: {url: 'https://species.nibr.go.kr/', location: '물벼룩류 > 먹이', note: '물벼룩은 물속의 작은 조류를 걸러 먹어요. 특정 조류 종과의 쌍은 단순화했어요.'},
  R2: {url: 'https://species.nibr.go.kr/', location: '송사리 > 먹이', note: '송사리는 물벼룩 같은 작은 동물성 플랑크톤을 먹어요.'},
  R3: {url: 'https://species.nibr.go.kr/', location: '논우렁이 > 먹이', note: '우렁이는 바닥과 물풀에 붙은 조류를 갉아 먹어요.'},
};

export const riverPrices = {algae: 3, duckweed: 3, 'water-lily': 5, daphnia: 3, medaka: 6, 'pond-snail': 5, 'water-strider': 5};
const relation = (food, eater) => riverFoodRelations.find(r => r.sourceSpeciesId === food && r.targetSpeciesId === eater).relationId;

// Organisms: [species, x, y], y on the species' living space.
export const riverChapters = [
  {chapterId: 'river-pond', number: 1, title: '연못·습지', events: ['drought'], seedSeconds: 50,
    newSpecies: ['algae', 'daphnia', 'medaka', 'duckweed', 'water-lily', 'pond-snail', 'water-strider'],
    intro: '고인 물에 사는 생산자와 소비자를 만나요.',
    art: {src: './assets/images/backgrounds/river-pond.svg', alt: '연못을 비스듬히 내려다본 수면과 물속 단면, 진흙 바닥, 오른쪽의 물가 비탈과 흙 단면.'}, stages: [
    {stageId: '1-1', title: '연못의 시작', points: 12,
      goal: '생산자인 작은 조류를 물벼룩이 먹고, 물벼룩을 송사리가 먹어요. 송사리를 놓아 먹이사슬을 이어 강 별 3개를 모아요.',
      tasks: [{text: '송사리 놓기', have: 'medaka'}, {text: '먹이사슬 3단계 잇기', observe: relation('daphnia', 'medaka'), icon: 'medaka'}],
      inventory: ['algae', 'daphnia', 'medaka'], requiredSpecies: {daphnia: 2, medaka: 1}, observeRequired: relation('daphnia', 'medaka'),
      organisms: [['algae', .18, .85], ['algae', .36, .86], ['algae', .54, .85], ['daphnia', .24, .66], ['daphnia', .34, .72], ['daphnia', .46, .68], ['daphnia', .58, .74]]},
    {stageId: '1-2', title: '수면의 이웃', points: 12,
      goal: '물 위에는 개구리밥과 수련, 소금쟁이가 살고 물 바닥에는 논우렁이가 살아요. 논우렁이를 길러 강 별 3개를 모아요.',
      tasks: [{text: '논우렁이 기르기', have: 'pond-snail'}, {text: '소금쟁이 놓기', have: 'water-strider'}],
      inventory: ['algae', 'duckweed', 'water-lily', 'daphnia', 'medaka', 'pond-snail', 'water-strider'], requiredSpecies: {daphnia: 2, medaka: 1, 'pond-snail': 1},
      organisms: [['algae', .14, .85], ['algae', .3, .86], ['algae', .5, .85], ['algae', .64, .86], ['duckweed', .3, .3], ['water-lily', .5, .36],
        ['daphnia', .24, .66], ['daphnia', .36, .74], ['daphnia', .48, .7], ['medaka', .6, .64]]},
  ]},
];

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
  // The river's cards only (the forest's stay known by id).
  organisms.splice(0, organisms.length, ...riverSpecies.map(s => organismById[s.id]));
  const riverStages = riverChapters.flatMap(chapter => chapter.stages.map(stage => ({...stage, chapter, events: chapter.events, seedSeconds: chapter.seedSeconds})));
  chapters.splice(0, chapters.length, ...riverChapters);
  stages.splice(0, stages.length, ...riverStages);
  for (const id of Object.keys(stageById)) delete stageById[id];
  Object.assign(stageById, Object.fromEntries(riverStages.map(stage => [stage.stageId, stage])));
}
