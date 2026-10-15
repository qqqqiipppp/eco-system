// Representative living spaces for presentation, never new feeding/health rules.
export const habitatZones={
 canopy:'수관',branch:'가지 주변',trunk:'나무줄기 주변',understory:'풀숲·관목',ground:'숲 바닥',
 moist_ground:'습한 지상',leaf_litter:'낙엽층·토양',dead_wood:'죽은 목재',organic_matter:'유기물 주변',web_space:'가지 사이 정착 공간',
};
const rule=(primary,additional,movement,preferredPlants=[],stationary=false)=>({primary,additional,movement,preferredPlants,stationary,fallback:'nearby-ground'});
export const speciesHabitats={
 oak:rule('canopy',['trunk'],'stationary',[],true),
 grass:rule('understory',['ground'],'stationary',[],true),
 pine:rule('canopy',['trunk'],'stationary',[],true),
 raspberry:rule('understory',['ground'],'stationary',[],true),
 hazel:rule('canopy',['trunk'],'stationary',[],true),
 grasshopper:rule('understory',['ground'],'short-hop',['grass']),
 frog:rule('moist_ground',['understory','ground'],'short-hop'),
 rabbit:rule('ground',['understory'],'ground'),
 chipmunk:rule('trunk',['branch','ground'],'tree-affinity',['oak','pine','hazel']),
 'field-mouse':rule('ground',['leaf_litter'],'ground'),
 caterpillar:rule('branch',['canopy'],'plant-surface',['pine']),
 aphid:rule('understory',['branch'],'plant-surface',['hazel']),
 snail:rule('moist_ground',['understory','leaf_litter'],'slow-litter'),
 spider:rule('web_space',['branch'],'stationary',[],true),
 ladybird:rule('leaf_litter',['ground'],'ground'),
 tit:rule('branch',['canopy'],'perching'),
 bulbul:rule('branch',['canopy','understory'],'perching'),
 snake:rule('ground',['understory'],'ground'),
 weasel:rule('ground',['trunk'],'ground'),
 goshawk:rule('canopy',['branch'],'perching'),
 earthworm:rule('leaf_litter',['ground'],'slow-litter'),
 mushroom:rule('dead_wood',['ground'],'stationary',[],true),
 'litter-mold':rule('leaf_litter',['ground'],'stationary',[],true),
 'soil-bacteria':rule('organic_matter',['ground'],'stationary',[],true),
};
export const movementLabels={'stationary':'자리를 지켜요',ground:'지상에서 이동해요','short-hop':'낮게 이동하고 짧게 뛰어요','tree-affinity':'나무 주변과 지상을 이용해요','plant-surface':'식물 주변에서 천천히 움직여요',perching:'가지에 머무르며 제한적으로 이동해요','slow-litter':'낮은 곳에서 느리게 움직여요'};
export const habitatPresentationConfig={maxOffsetPixels:72,maxOffsetNormalized:.16,attachmentOffsetPixels:1200,attachmentOffsetNormalized:.95,minTouch:48,groundTop:.62,groundBottom:.88,markerHeadroom:14};
