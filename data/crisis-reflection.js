// One question after each crisis: why it happened or what people can do,
// with a short explanation whatever the answer. Two per crisis so a repeat
// in the next stage asks the other one. answer is the index of the right choice.
export const crisisQuestions = {
  cloudy: [
    {question: '흐린 날씨에 숲 별이 멈춘 까닭은 무엇일까요?',
      choices: ['동물들이 추워서 잠을 잤기 때문', '햇빛이 줄어 식물이 잘 자라지 못하고, 먹이가 모자랐기 때문', '비가 많이 와서 흙이 씻겨 갔기 때문'], answer: 1,
      explanation: '식물은 햇빛을 받아 양분을 만들어요. 햇빛이 줄면 식물이 덜 자라고, 식물을 먹는 동물의 먹이도 줄어요.'},
    {question: '흐린 날씨가 오기 전에 숲을 튼튼하게 하려면 어떻게 하면 좋을까요?',
      choices: ['먹이 식물을 넉넉히 심어 둬요', '먹는 동물을 더 많이 놓아요', '분해자를 모두 없애요'], answer: 0,
      explanation: '먹이 식물이 넉넉하면 식물이 덜 자라는 동안에도 동물이 먹을 것이 남아요.'},
  ],
  drought: [
    {question: '가뭄이 오면 왜 방아깨비 같은 동물도 힘들어질까요?',
      choices: ['가뭄이 오면 동물의 몸 색깔이 바뀌어서', '가뭄이 오면 분해자가 많아져서', '물이 부족해 식물이 잘 자라지 못하고, 먹이가 줄어서'], answer: 2,
      explanation: '물이 줄면 먼저 식물이 힘들어지고, 그 변화가 먹이 관계를 따라 식물을 먹는 동물에게 퍼져요.'},
    {question: '물이 줄었을 때 가장 먼저 영향을 받는 생물은 무엇일까요?',
      choices: ['참매 같은 먹이사슬 꼭대기의 동물', '강아지풀 같은 식물', '아무 생물도 영향을 받지 않아요'], answer: 1,
      explanation: '식물은 뿌리로 물을 흡수해야 자라요. 식물이 줄면 그 식물을 먹는 동물부터 차례로 영향을 받아요.'},
  ],
  'soil-damage': [
    {question: '숲 바닥이 망가지는 일을 줄이려면 사람은 무엇을 할 수 있을까요?',
      choices: ['쓰레기를 버리지 않고 정해진 길로만 다녀요', '숲의 낙엽을 모두 치워요', '숲에 동물을 더 많이 풀어 줘요'], answer: 0,
      explanation: '쓰레기와 사람의 발길이 흙을 망가뜨려요. 낙엽은 분해자가 흙의 양분으로 바꾸니 치우지 않아도 돼요.'},
    {question: '흙이 망가지면 왜 숲 전체가 힘들어질까요?',
      choices: ['흙이 망가지면 햇빛이 약해져서', '식물이 뿌리를 내리고 양분을 얻는 곳이 망가져서', '흙은 동물과 관계가 없어서 숲은 괜찮아요'], answer: 1,
      explanation: '흙은 식물이 자라는 터전이에요. 식물이 힘들어지면 식물을 먹는 동물도 힘들어져요.'},
  ],
  'air-pollution': [
    {question: '공기 오염을 줄이려면 우리는 무엇을 할 수 있을까요?',
      choices: ['숲의 나무를 베어 길을 넓혀요', '가까운 곳은 걷거나 버스·지하철을 타요', '창문을 닫고 집에만 있어요'], answer: 1,
      explanation: '자동차와 공장의 매연이 공기를 더럽혀요. 자동차를 덜 타면 매연이 줄어요.'},
    {question: '오염된 공기는 숲의 생물에게 어떤 영향을 줄까요?',
      choices: ['식물과 동물 모두 건강하게 살기 어려워져요', '식물만 더 잘 자라요', '동물만 힘들고 식물은 괜찮아요'], answer: 0,
      explanation: '생물은 모두 공기가 있어야 살아요. 공기가 나빠지면 생산자, 소비자, 분해자가 모두 영향을 받아요.'},
  ],
};
