// 생태계 연구소: the ecosystems a student can explore. Each keeps its own
// stages and progress. ready: false shows the theme as coming soon.
export const themes = [
  {id: 'forest', name: '숲', ready: true, icon: '🌳', description: '풀밭에서 큰 숲까지, 숲의 먹이그물을 지켜요.'},
  {id: 'river', name: '강', ready: true, icon: '🏞️', description: '연못에서 상류·중류·하류까지, 강의 먹이그물을 지켜요.'},
];
export const themeById = Object.fromEntries(themes.map(theme => [theme.id, theme]));
// The words the screen says for the place being looked after (숲 별, 숲에 놓아요),
// set by a theme (data/river.js). 숲 and 강 take the same particles (숲에·강에).
export const themeWords = {place: '숲', icon: '🌳', cleared: '숲에 새싹이 돋았어요'};
