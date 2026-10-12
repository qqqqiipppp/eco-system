// Active GAME seconds, not biological measurements. Evidence and compression
// choices for the representative groups are in FOREST_LIFESPANS.md.
const individual=(min,max,initialAge,label,unit,extra={})=>({model:'individual',min:min*60,max:max*60,initialAge,label,unit,...extra});
const colony=(min,max,resource,stressMinutes,label)=>({model:'colony',min:min*60,max:max*60,resource,stressSeconds:stressMinutes*60,label,unit:'군집'});
export const lifespanRules={
 oak:individual(180,240,.12,'여러 해 동안 자라는 나무','그루',{matter:'wood',matterAmount:3}),
 grass:individual(24,32,.05,'여러해살이 풀을 대표해요. 새 포기가 자라며 이어져요','포기',{matter:'litter',matterAmount:1}),
 grasshopper:individual(14,20,.08,'비교적 짧은 생애를 가지며 세대가 바뀌어요','마리'),
 frog:individual(55,75,.12,'여러 해 살아가는 성체 개구리를 대표해요','마리'),
 rabbit:individual(55,80,.15,'여러 해 살아가며 새끼를 낳아요','마리'),
 mushroom:colony(12,18,'wood',30,'보이는 버섯과 균사체를 포함한 균류 군집이에요'),
 pine:individual(150,210,.15,'여러 해 동안 자라는 나무','그루',{matter:'wood',matterAmount:3}),
 raspberry:individual(70,100,.1,'뿌리는 여러 해 유지돼요. 가지의 생애와 달라요','포기',{matter:'litter',matterAmount:2}),
 hazel:individual(90,120,.15,'여러 해 자라는 관목이에요','그루',{matter:'wood',matterAmount:2}),
 chipmunk:individual(50,70,.15,'여러 해 살아가는 작은 포유류예요','마리'),
 'field-mouse':individual(32,46,.12,'작은 포유류의 세대가 이어져요','마리'),
 caterpillar:individual(12,18,.1,'나방의 애벌레 시기예요. 나방 전체의 수명이 아니에요','마리',{endCause:'life_stage_exit'}),
 aphid:individual(12,16,.1,'짧은 생애와 빠른 세대교체를 대표해요','마리'),
 snail:individual(45,65,.15,'여러 해 사는 육상 달팽이 유형을 대표해요','마리'),
 spider:individual(24,36,.1,'비교적 짧은 생애의 작은 사냥 거미를 대표해요','마리'),
 ladybird:individual(28,42,.1,'성체로 겨울을 날 수 있는 무당벌레 유형이에요','마리'),
 tit:individual(65,90,.12,'여러 해 살아가는 숲의 새예요','마리'),
 bulbul:individual(65,95,.12,'여러 해 살아가는 숲의 새예요','마리'),
 snake:individual(75,100,.15,'여러 해 살아가는 뱀이에요','마리'),
 weasel:individual(50,75,.12,'여러 해 살아가는 작은 포식자예요','마리'),
 goshawk:individual(90,120,.18,'비교적 긴 생애의 숲 맹금류예요','마리'),
 'litter-mold':colony(8,12,'litter',20,'낙엽을 이용하며 새 균사가 자라는 군집이에요'),
 'soil-bacteria':colony(5,9,'remains',25,'세균이 세대를 바꾸어도 군집은 이어질 수 있어요'),
};
// Previously introduced, acquired species only. No new unlock or adult tree spawn.
export const replenishmentRules={
 grasshopper:{mode:'egg-hatch',target:2,healthySeconds:300,cooldown:180,seedBank:true,reserveMaximum:6},
 caterpillar:{mode:'larval-recruitment',target:2,healthySeconds:420,cooldown:600},
 spider:{mode:'immigration',target:2,healthySeconds:480,cooldown:720},
 ladybird:{mode:'immigration',target:2,healthySeconds:480,cooldown:720},
 'field-mouse':{mode:'immigration',target:2,healthySeconds:600,cooldown:900},
};
export const colonyConfig={minimumEnvironment:.4,resourceThreshold:.02,dormantVigor:.2,recoverySeconds:240};
