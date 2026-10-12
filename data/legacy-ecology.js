// Frozen v7–9 meanings for migration/history only. Never used for current feeding.
export const legacyEcology = {
  "names": {
    "oak": "상수리나무",
    "grass": "풀",
    "grasshopper": "메뚜기",
    "frog": "개구리",
    "rabbit": "토끼",
    "mushroom": "버섯",
    "pine": "소나무",
    "raspberry": "산딸기",
    "hazel": "개암나무",
    "chipmunk": "다람쥐",
    "field-mouse": "등줄쥐",
    "caterpillar": "나방 애벌레",
    "aphid": "진딧물",
    "snail": "달팽이",
    "spider": "거미",
    "ladybird": "무당벌레",
    "tit": "박새",
    "bulbul": "직박구리",
    "snake": "유혈목이",
    "weasel": "족제비",
    "goshawk": "참매",
    "litter-mold": "낙엽 분해 곰팡이",
    "soil-bacteria": "토양 분해 세균"
  },
  "relations": [
    {
      "relationId": "grass_to_grasshopper",
      "sourceSpeciesId": "grass",
      "targetSpeciesId": "grasshopper"
    },
    {
      "relationId": "grasshopper_to_frog",
      "sourceSpeciesId": "grasshopper",
      "targetSpeciesId": "frog"
    },
    {
      "relationId": "grass_to_rabbit",
      "sourceSpeciesId": "grass",
      "targetSpeciesId": "rabbit"
    },
    {
      "relationId": "oak_to_chipmunk",
      "sourceSpeciesId": "oak",
      "targetSpeciesId": "chipmunk"
    },
    {
      "relationId": "pine_to_chipmunk",
      "sourceSpeciesId": "pine",
      "targetSpeciesId": "chipmunk"
    },
    {
      "relationId": "hazel_to_chipmunk",
      "sourceSpeciesId": "hazel",
      "targetSpeciesId": "chipmunk"
    },
    {
      "relationId": "oak_to_field_mouse",
      "sourceSpeciesId": "oak",
      "targetSpeciesId": "field-mouse"
    },
    {
      "relationId": "grass_to_field_mouse",
      "sourceSpeciesId": "grass",
      "targetSpeciesId": "field-mouse"
    },
    {
      "relationId": "caterpillar_to_field_mouse",
      "sourceSpeciesId": "caterpillar",
      "targetSpeciesId": "field-mouse"
    },
    {
      "relationId": "oak_to_caterpillar",
      "sourceSpeciesId": "oak",
      "targetSpeciesId": "caterpillar"
    },
    {
      "relationId": "hazel_to_aphid",
      "sourceSpeciesId": "hazel",
      "targetSpeciesId": "aphid"
    },
    {
      "relationId": "grass_to_snail",
      "sourceSpeciesId": "grass",
      "targetSpeciesId": "snail"
    },
    {
      "relationId": "aphid_to_ladybird",
      "sourceSpeciesId": "aphid",
      "targetSpeciesId": "ladybird"
    },
    {
      "relationId": "aphid_to_spider",
      "sourceSpeciesId": "aphid",
      "targetSpeciesId": "spider"
    },
    {
      "relationId": "caterpillar_to_spider",
      "sourceSpeciesId": "caterpillar",
      "targetSpeciesId": "spider"
    },
    {
      "relationId": "spider_to_frog",
      "sourceSpeciesId": "spider",
      "targetSpeciesId": "frog"
    },
    {
      "relationId": "caterpillar_to_tit",
      "sourceSpeciesId": "caterpillar",
      "targetSpeciesId": "tit"
    },
    {
      "relationId": "spider_to_tit",
      "sourceSpeciesId": "spider",
      "targetSpeciesId": "tit"
    },
    {
      "relationId": "raspberry_to_bulbul",
      "sourceSpeciesId": "raspberry",
      "targetSpeciesId": "bulbul"
    },
    {
      "relationId": "frog_to_snake",
      "sourceSpeciesId": "frog",
      "targetSpeciesId": "snake"
    },
    {
      "relationId": "field_mouse_to_weasel",
      "sourceSpeciesId": "field-mouse",
      "targetSpeciesId": "weasel"
    },
    {
      "relationId": "grasshopper_to_weasel",
      "sourceSpeciesId": "grasshopper",
      "targetSpeciesId": "weasel"
    },
    {
      "relationId": "chipmunk_to_weasel",
      "sourceSpeciesId": "chipmunk",
      "targetSpeciesId": "weasel"
    },
    {
      "relationId": "frog_to_weasel",
      "sourceSpeciesId": "frog",
      "targetSpeciesId": "weasel"
    },
    {
      "relationId": "rabbit_to_goshawk",
      "sourceSpeciesId": "rabbit",
      "targetSpeciesId": "goshawk"
    },
    {
      "relationId": "chipmunk_to_goshawk",
      "sourceSpeciesId": "chipmunk",
      "targetSpeciesId": "goshawk"
    },
    {
      "relationId": "bulbul_to_goshawk",
      "sourceSpeciesId": "bulbul",
      "targetSpeciesId": "goshawk"
    }
  ],
  "lifespan": {
    "oak": {
      "model": "individual",
      "min": 10800,
      "max": 14400,
      "initialAge": 0.12,
      "label": "여러 해 동안 자라는 나무",
      "unit": "그루",
      "matter": "wood",
      "matterAmount": 3
    },
    "grass": {
      "model": "individual",
      "min": 1440,
      "max": 1920,
      "initialAge": 0.05,
      "label": "여러해살이 풀을 대표해요. 새 포기가 자라며 이어져요",
      "unit": "포기",
      "matter": "litter",
      "matterAmount": 1
    },
    "grasshopper": {
      "model": "individual",
      "min": 840,
      "max": 1200,
      "initialAge": 0.08,
      "label": "비교적 짧은 생애를 가지며 세대가 바뀌어요",
      "unit": "마리"
    },
    "frog": {
      "model": "individual",
      "min": 3300,
      "max": 4500,
      "initialAge": 0.12,
      "label": "여러 해 살아가는 성체 개구리를 대표해요",
      "unit": "마리"
    },
    "rabbit": {
      "model": "individual",
      "min": 3300,
      "max": 4800,
      "initialAge": 0.15,
      "label": "여러 해 살아가며 새끼를 낳아요",
      "unit": "마리"
    },
    "mushroom": {
      "model": "colony",
      "min": 720,
      "max": 1080,
      "resource": "wood",
      "stressSeconds": 1800,
      "label": "보이는 버섯과 균사체를 포함한 균류 군집이에요",
      "unit": "군집"
    },
    "pine": {
      "model": "individual",
      "min": 9000,
      "max": 12600,
      "initialAge": 0.15,
      "label": "여러 해 동안 자라는 나무",
      "unit": "그루",
      "matter": "wood",
      "matterAmount": 3
    },
    "raspberry": {
      "model": "individual",
      "min": 4200,
      "max": 6000,
      "initialAge": 0.1,
      "label": "뿌리는 여러 해 유지돼요. 가지의 생애와 달라요",
      "unit": "포기",
      "matter": "litter",
      "matterAmount": 2
    },
    "hazel": {
      "model": "individual",
      "min": 5400,
      "max": 7200,
      "initialAge": 0.15,
      "label": "여러 해 자라는 관목이에요",
      "unit": "그루",
      "matter": "wood",
      "matterAmount": 2
    },
    "chipmunk": {
      "model": "individual",
      "min": 3000,
      "max": 4200,
      "initialAge": 0.15,
      "label": "여러 해 살아가는 작은 포유류예요",
      "unit": "마리"
    },
    "field-mouse": {
      "model": "individual",
      "min": 1920,
      "max": 2760,
      "initialAge": 0.12,
      "label": "작은 포유류의 세대가 이어져요",
      "unit": "마리"
    },
    "caterpillar": {
      "model": "individual",
      "min": 720,
      "max": 1080,
      "initialAge": 0.1,
      "label": "나방의 애벌레 시기예요. 나방 전체의 수명이 아니에요",
      "unit": "마리",
      "endCause": "life_stage_exit"
    },
    "aphid": {
      "model": "individual",
      "min": 720,
      "max": 960,
      "initialAge": 0.1,
      "label": "짧은 생애와 빠른 세대교체를 대표해요",
      "unit": "마리"
    },
    "snail": {
      "model": "individual",
      "min": 2700,
      "max": 3900,
      "initialAge": 0.15,
      "label": "여러 해 사는 육상 달팽이 유형을 대표해요",
      "unit": "마리"
    },
    "spider": {
      "model": "individual",
      "min": 1440,
      "max": 2160,
      "initialAge": 0.1,
      "label": "비교적 짧은 생애의 작은 사냥 거미를 대표해요",
      "unit": "마리"
    },
    "ladybird": {
      "model": "individual",
      "min": 1680,
      "max": 2520,
      "initialAge": 0.1,
      "label": "성체로 겨울을 날 수 있는 무당벌레 유형이에요",
      "unit": "마리"
    },
    "tit": {
      "model": "individual",
      "min": 3900,
      "max": 5400,
      "initialAge": 0.12,
      "label": "여러 해 살아가는 숲의 새예요",
      "unit": "마리"
    },
    "bulbul": {
      "model": "individual",
      "min": 3900,
      "max": 5700,
      "initialAge": 0.12,
      "label": "여러 해 살아가는 숲의 새예요",
      "unit": "마리"
    },
    "snake": {
      "model": "individual",
      "min": 4500,
      "max": 6000,
      "initialAge": 0.15,
      "label": "여러 해 살아가는 뱀이에요",
      "unit": "마리"
    },
    "weasel": {
      "model": "individual",
      "min": 3000,
      "max": 4500,
      "initialAge": 0.12,
      "label": "여러 해 살아가는 작은 포식자예요",
      "unit": "마리"
    },
    "goshawk": {
      "model": "individual",
      "min": 5400,
      "max": 7200,
      "initialAge": 0.18,
      "label": "비교적 긴 생애의 숲 맹금류예요",
      "unit": "마리"
    },
    "litter-mold": {
      "model": "colony",
      "min": 480,
      "max": 720,
      "resource": "litter",
      "stressSeconds": 1200,
      "label": "낙엽을 이용하며 새 균사가 자라는 군집이에요",
      "unit": "군집"
    },
    "soil-bacteria": {
      "model": "colony",
      "min": 300,
      "max": 540,
      "resource": "remains",
      "stressSeconds": 1500,
      "label": "세균이 세대를 바꾸어도 군집은 이어질 수 있어요",
      "unit": "군집"
    }
  },
  "reproduction": {
    "grass": {
      "mode": "seed-spread",
      "minimum": 1,
      "maximum": 8,
      "healthySeconds": 180,
      "cooldown": 240
    },
    "grasshopper": {
      "mode": "animal",
      "minimum": 2,
      "maximum": 8,
      "healthySeconds": 240,
      "cooldown": 360
    },
    "rabbit": {
      "mode": "animal",
      "minimum": 2,
      "maximum": 4,
      "healthySeconds": 360,
      "cooldown": 480
    },
    "aphid": {
      "mode": "animal",
      "minimum": 2,
      "maximum": 6,
      "healthySeconds": 240,
      "cooldown": 360
    }
  },
  "replenishment": {
    "grasshopper": {
      "mode": "egg-hatch",
      "target": 2,
      "healthySeconds": 300,
      "cooldown": 180,
      "seedBank": true,
      "reserveMaximum": 6
    },
    "caterpillar": {
      "mode": "larval-recruitment",
      "target": 2,
      "healthySeconds": 420,
      "cooldown": 600
    },
    "spider": {
      "mode": "immigration",
      "target": 2,
      "healthySeconds": 480,
      "cooldown": 720
    },
    "ladybird": {
      "mode": "immigration",
      "target": 2,
      "healthySeconds": 480,
      "cooldown": 720
    },
    "field-mouse": {
      "mode": "immigration",
      "target": 2,
      "healthySeconds": 600,
      "cooldown": 900
    }
  }
};
export const legacyRelationIds = new Set(legacyEcology.relations.map(r=>r.relationId));
