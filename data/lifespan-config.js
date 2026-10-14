import {ecologySeconds,ecologyRate,scaleFields} from './pacing-config.js';
// Active GAME seconds, not biological measurements. Evidence and compression
// choices for the representative groups are in FOREST_LIFESPANS.md.
const individual=(min,max,initialAge,label,unit,extra={})=>({model:'individual',min:min*60,max:max*60,initialAge,label,unit,...extra});
const colony=(min,max,resource,stressMinutes,label)=>({model:'colony',min:min*60,max:max*60,resource,stressSeconds:stressMinutes*60,label,unit:'군집'});
export const lifespanRules={
 earthworm:individual(45,65,.1,'낙엽을 이용하는 토양동물이에요. 게임 생애는 실제 참지렁이 수명 측정값이 아니에요','마리'),
 oak:individual(180,240,.12,'여러 해 동안 자라는 나무','그루',{matter:'wood',matterAmount:3}),
 grass:individual(24,32,.05,'한해살이 강아지풀이에요. 씨앗으로 다음 세대를 이어가요','포기',{matter:'litter',matterAmount:1}),
 grasshopper:individual(14,20,.08,'비교적 짧은 생애를 가지며 세대가 바뀌어요','마리'),
 frog:individual(55,75,.12,'여러 해 살아가는 성체 개구리를 대표해요','마리'),
 rabbit:individual(55,80,.15,'여러 해 살아가며 새끼를 낳아요','마리'),
 mushroom:colony(12,18,'wood',30,'보이는 버섯과 균사체를 포함한 균류 군집이에요'),
 pine:individual(150,210,.15,'여러 해 동안 자라는 나무','그루',{matter:'wood',matterAmount:3}),
 raspberry:individual(70,100,.1,'뿌리는 여러 해 유지돼요. 가지의 생애와 달라요','포기',{matter:'litter',matterAmount:2}),
 hazel:individual(180,240,.12,'여러 해 자라는 큰 팽나무예요','그루',{matter:'wood',matterAmount:2}),
 chipmunk:individual(50,70,.15,'여러 해 살아가는 작은 포유류예요','마리'),
 'field-mouse':individual(55,80,.12,'여러 해 살아가는 고슴도치예요','마리'),
 caterpillar:individual(18,26,.1,'겨울을 유충으로 보내는 솔나방의 애벌레 시기예요. 나방 전체의 수명이 아니에요','마리',{endCause:'life_stage_exit'}),
 aphid:individual(22,32,.08,'청동풍뎅이의 성충 시기예요. 뿌리를 먹는 유충과 달라요','마리'),
 snail:individual(45,65,.15,'명주달팽이의 생애를 나타내요. 정확한 야생 수명은 더 확인하고 있어요','마리'),
 spider:individual(24,36,.1,'한 계절에 활동하고 알로 다음 세대를 이어가는 무당거미예요','마리'),
 ladybird:individual(35,50,.1,'홍단딱정벌레 성충의 생애예요. 땅에서 먹이를 찾아요','마리'),
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
};
export const colonyConfig={minimumEnvironment:.4,resourceThreshold:.02,dormantVigor:.2,recoverySeconds:240};

export const originalLifespanRules=structuredClone(lifespanRules);
for(const rule of Object.values(lifespanRules))scaleFields(rule,['min','max','stressSeconds']);
for(const rule of Object.values(replenishmentRules))scaleFields(rule,['healthySeconds','cooldown']);
scaleFields(colonyConfig,['recoverySeconds']);
