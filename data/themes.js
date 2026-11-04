// 생태계 연구소: the ecosystems a student can explore. Each keeps its own
// stages and progress. ready: false shows the theme as coming soon.
export const themes = [
  {id: 'forest', name: '숲', ready: true, icon: '🌳', description: '풀밭에서 큰 숲까지, 숲의 먹이그물을 지켜요.'},
  {id: 'river', name: '강', ready: false, icon: '🏞️', description: '연못에서 상류·중류·하류까지, 강의 먹이그물을 지켜요.'},
];
export const themeById = Object.fromEntries(themes.map(theme => [theme.id, theme]));
