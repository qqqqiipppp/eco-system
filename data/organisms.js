/** Species definitions are independent of inventory and placed instances.
 * @typedef {Object} OrganismDefinition
 * @property {string} id Stable key used by state, assets and future food relationships.
 * @property {string} name
 * @property {'producer'|'consumer'|'decomposer'} role
 * @property {string} description
 * @property {string} caption
 * @property {string} [image]
 * @property {string} [placeholder]
 * @property {'static'|'wander'|'forager'} behaviorType
 */
/** @type {ReadonlyArray<OrganismDefinition>} */
export const organisms = [
  { id: 'oak', name: '상수리나무', role: 'producer', behaviorType: 'static', caption: '햇빛으로 양분 만들기', description: '햇빛을 이용해 스스로 양분을 만들어요. 자라려면 물과 공기도 필요해요.', image: './assets/images/oak.svg' },
  { id: 'grass', name: '풀', role: 'producer', behaviorType: 'static', caption: '메뚜기의 먹이', description: '햇빛을 이용해 양분을 만들어요. 메뚜기가 먹은 뒤에도 남아 천천히 회복해요.', image: './assets/images/grass.svg' },
  { id: 'grasshopper', name: '메뚜기', role: 'consumer', behaviorType: 'forager', caption: '풀을 찾아 먹어요', description: '배가 고프면 가까운 풀을 찾아 먹어요. 개구리의 먹이가 되기도 해요.', placeholder: '🦗' },
  { id: 'frog', name: '개구리', role: 'consumer', behaviorType: 'forager', caption: '메뚜기를 찾아 먹어요', description: '배가 고프면 가까운 메뚜기를 찾아가요. 먹이가 없으면 돌아다니며 다시 찾아요.', placeholder: '🐸' },
  { id: 'rabbit', name: '토끼', role: 'consumer', behaviorType: 'wander', caption: '풀을 먹는 초식 동물', description: '풀 같은 식물을 먹고 살아가요. 지금 이 숲에서는 돌아다니는 모습만 살펴볼 수 있어요.', image: './assets/images/rabbit.svg' },
  { id: 'mushroom', name: '버섯', role: 'decomposer', behaviorType: 'static', caption: '숲의 양분을 돌려주기', description: '이 숲의 버섯은 죽은 나무를 분해해요. 분해된 물질은 생물이 다시 이용할 수 있어요.', image: './assets/images/mushroom.svg' },
];
export const roleLabels = { producer: '생산자', consumer: '소비자', decomposer: '분해자' };
export const organismById = Object.fromEntries(organisms.map(organism => [organism.id, organism]));
