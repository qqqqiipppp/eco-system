// "나의 먹이그물": rules for the web a student draws at the end of each chapter.
// The web grows chapter by chapter, so a food chain visibly becomes a food web.
import {chapters} from '../../data/chapters.js';
import {foodRelations} from '../../data/food-relations.js';
import {organismById} from '../../data/organisms.js';
import {environmentEventDefinitions} from '../../data/environment-events.js';
import {particle} from '../../data/student-text.js';

const name = id => organismById[id].name;
export const roleNames = {producer: '생산자', consumer: '소비자', decomposer: '분해자'};
export const roleMeaning = {
  producer: '햇빛을 이용해 스스로 양분을 만들어요.',
  consumer: '다른 생물을 먹어 양분을 얻어요.',
  decomposer: '죽은 생물과 낙엽을 분해해 양분을 흙으로 돌려보내요.',
};

// Every creature met up to and including this chapter.
export const webNodes = chapterNumber => [...new Set(chapters.filter(c => c.number <= chapterNumber).flatMap(c => c.newSpecies))];
export const webRelations = nodes => foodRelations.filter(r => nodes.includes(r.sourceSpeciesId) && nodes.includes(r.targetSpeciesId));
export const newNodes = chapterNumber => chapters.find(c => c.number === chapterNumber).newSpecies;

// Rows for drawing: producers at the bottom, each consumer one row above its
// highest food. Decomposers sit in their own column.
export function webLevels(nodes) {
  const relations = webRelations(nodes), levels = {};
  const level = id => {
    if (id in levels) return levels[id];
    const role = organismById[id].role;
    if (role !== 'consumer') return (levels[id] = 0);
    levels[id] = 1;
    const foods = relations.filter(r => r.targetSpeciesId === id).map(r => r.sourceSpeciesId);
    return (levels[id] = foods.length ? 1 + Math.max(...foods.map(level)) : 1);
  };
  nodes.forEach(level);
  return levels;
}

export function checkRole(id, role) {
  const actual = organismById[id].role;
  // The game models the earthworm as a litter-eating consumer that helps
  // decomposition; many books group it with decomposers. Accept both.
  if (id === 'earthworm' && (role === 'consumer' || role === 'decomposer'))
    return {ok: true, role: actual, message: '참지렁이는 낙엽을 먹는 소비자로 나타냈어요. 낙엽을 잘게 부수어 분해를 도와서 분해를 돕는 생물로 소개하기도 해요.'};
  if (role === actual) return {ok: true, role: actual, message: `${particle(name(id), '은', '는')} ${roleNames[actual]}예요. ${roleMeaning[actual]}`};
  const hint = {
    producer: `${particle(name(id), '이', '가')} 햇빛으로 스스로 양분을 만드는지 생각해 봐요.`,
    consumer: `${particle(name(id), '이', '가')} 다른 생물을 먹는지 생각해 봐요.`,
    decomposer: `${particle(name(id), '이', '가')} 죽은 생물이나 낙엽을 분해하는지 생각해 봐요.`,
  };
  return {ok: false, message: hint[actual]};
}

// A tap on the food, then a tap on the eater: food → eater.
export function checkArrow(food, eater, observed = []) {
  const rel = foodRelations.find(r => r.sourceSpeciesId === food && r.targetSpeciesId === eater);
  if (rel) return {ok: true, relationId: rel.relationId, observed: observed.includes(rel.relationId),
    message: `${particle(name(eater), '이', '가')} ${particle(name(food), '을', '를')} 먹어요.` + (observed.includes(rel.relationId) ? ' 숲에서 관찰한 관계예요.' : ' 아직 숲에서 💡로 관찰하지 못한 관계예요.')};
  if (food === eater) return {ok: false, message: '서로 다른 두 생물을 골라요.'};
  if (foodRelations.some(r => r.sourceSpeciesId === eater && r.targetSpeciesId === food))
    return {ok: false, reversed: true, message: `거꾸로예요. ${particle(name(food), '이', '가')} ${particle(name(eater), '을', '를')} 먹어요. 화살표는 먹히는 생물에서 먹는 생물 쪽으로 그려요. 먹히는 ${particle(name(eater), '을', '를')} 먼저 눌러요.`};
  if (organismById[eater].role === 'producer') return {ok: false, message: `${particle(name(eater), '은', '는')} 생산자예요. 다른 생물을 먹지 않고 햇빛으로 양분을 만들어요.`};
  if (organismById[eater].role === 'decomposer' || organismById[food].role === 'decomposer') return {ok: false, message: '분해자는 살아 있는 생물을 먹는 대신 죽은 생물과 낙엽을 분해해요. 분해자와 이어지는 선은 저절로 그려져요.'};
  return {ok: false, message: `${particle(name(eater), '은', '는')} ${particle(name(food), '을', '를')} 먹지 않아요. 숲에서 관찰한 먹는 모습을 떠올려 봐요.`};
}

// Food chains in the web: paths from a producer to an animal nothing here eats.
export function foodChains(nodes) {
  const relations = webRelations(nodes), chains = [];
  const walk = path => {
    const next = relations.filter(r => r.sourceSpeciesId === path.at(-1)).map(r => r.targetSpeciesId).filter(id => !path.includes(id));
    if (!next.length) { if (path.length > 1) chains.push(path); return; }
    next.forEach(id => walk([...path, id]));
  };
  nodes.filter(id => organismById[id].role === 'producer').forEach(id => walk([id]));
  return chains;
}

// How a bad abiotic factor reaches every creature: plants first, then along the
// web, and decomposers through the dead matter they rely on. Each step has a reason.
export function spreadOfChange(nodes, factor) {
  const relations = webRelations(nodes), steps = new Map();
  for (const id of nodes.filter(id => organismById[id].role === 'producer')) steps.set(id, `${particle(factor, '이', '가')} 나빠지면 ${particle(name(id), '이', '가')} 잘 자라지 못해요.`);
  for (let changed = true; changed;) {
    changed = false;
    for (const r of relations) if (steps.has(r.sourceSpeciesId) && !steps.has(r.targetSpeciesId)) {
      steps.set(r.targetSpeciesId, `먹이인 ${particle(name(r.sourceSpeciesId), '이', '가')} 줄면 ${particle(name(r.targetSpeciesId), '이', '가')} 먹이를 구하기 어려워요.`);
      changed = true;
    }
  }
  for (const id of nodes.filter(id => !steps.has(id))) steps.set(id, id === 'earthworm' || organismById[id].role === 'decomposer'
    ? `생물이 줄면 낙엽과 죽은 생물도 달라져 ${particle(name(id), '이', '가')} 하는 일도 영향을 받아요.`
    : `먹이그물로 이어진 ${particle(name(id), '도', '도')} 영향을 받아요.`);
  return steps;
}
export const chapterFactor = chapterNumber => {
  const event = environmentEventDefinitions[chapters.find(c => c.number === chapterNumber).events[0]];
  return {kind: chapters.find(c => c.number === chapterNumber).events[0], name: event.name, factor: event.factor};
};

// What is left before the chapter's web is complete.
export function webStatus(progress, chapterNumber) {
  const nodes = webNodes(chapterNumber), roles = progress.roles || {}, drawn = progress.drawn || [];
  const missingRoles = nodes.filter(id => !roles[id]);
  const missingArrows = webRelations(nodes).filter(r => !drawn.includes(r.relationId)).map(r => r.relationId);
  const systemDone = (progress.system || []).includes(chapterNumber);
  return {nodes, missingRoles, missingArrows, systemDone, complete: !missingRoles.length && !missingArrows.length && systemDone};
}
