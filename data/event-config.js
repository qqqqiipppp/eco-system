export const eventConfig = {
  tickSeconds: 1, shortageSeconds: 8, slowGrowthSeconds: 3,
  growthThreshold: 0.8, cooldownSeconds: 30,
  maxVisible: 4, maxActive: 36, maxHistory: 60,
  priority: { insight: 3, alert: 2, question: 1 },
};
export const shortageEvents = {
  grasshopper: { title: '메뚜기가 먹이를 찾기 어려워해요', message: '한동안 먹을 수 있는 풀을 찾지 못했어요.', explanation: '풀의 양뿐 아니라 남은 먹이량과 거리도 살펴봐요. 환경이 나쁘면 풀의 먹이 회복도 느려져요.' },
  frog: { title: '개구리의 먹이가 부족한 것 같아요', message: '한동안 가까운 메뚜기를 찾지 못했어요.', explanation: '메뚜기가 없거나 멀리 있으면 먹이를 얻기 어려워요. 개구리가 많아지면 메뚜기가 빠르게 줄 수도 있어요.' },
};
export const discoveryEvents = {
  grass_to_grasshopper: { foodSpeciesId: 'grass', consumerSpeciesId: 'grasshopper', title: '메뚜기가 풀을 먹었어요', message: '방금 메뚜기가 풀에서 먹이를 얻었어요.', explanation: '풀은 메뚜기의 먹이가 돼요. 먹이 관계 화살표는 풀 → 메뚜기로 표시해요.' },
  grasshopper_to_frog: { foodSpeciesId: 'grasshopper', consumerSpeciesId: 'frog', title: '개구리가 메뚜기를 먹었어요', message: '방금 개구리가 메뚜기를 먹었어요.', explanation: '먹이 관계 화살표는 메뚜기 → 개구리예요. 먹힌 메뚜기는 이 숲에서 사라졌어요.' },
};
export const growthInvestigation = {
  title: '왜 식물이 천천히 자랄까요?',
  message: '환경과 식물의 회복 사이에는 어떤 관계가 있을까요?',
  choices: [
    { id: 'environment', label: '비생물 환경이 나빠져서', correct: true },
    { id: 'cards', label: '카드를 많이 모아서', correct: false },
  ],
  retry: '카드 수보다 지금 햇빛·물·공기·토양 상태를 다시 살펴봐요.',
};
