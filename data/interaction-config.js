// Temporary screen rules, not habitat conditions or ecological relationships.
export const placementConfig = {
  maxOrganisms: 30,
  zones: {
    ground: { left: 0.08, right: 0.69, top: 0.68, bottom: 0.78 },
    activity: { left: 0.08, right: 0.69, top: 0.58, bottom: 0.78 },
  },
  largePlantSpacing: { x: 0.09, y: 0.07 },
};

// Presentation/movement configuration is separate from species definitions.
// position denotes the feet/base of the image; name labels extend below it.
export const speciesProfiles = {
  oak: { zone: 'ground', width: 80, height: 76, labelHeight: 20, largePlant: true },
  grass: { zone: 'ground', width: 52, height: 43, labelHeight: 20 },
  rabbit: { zone: 'activity', width: 56, height: 49, labelHeight: 20, wanders: true },
  grasshopper: { zone: 'activity', width: 52, height: 40, labelHeight: 20, wanders: true },
  frog: { zone: 'activity', width: 52, height: 40, labelHeight: 20, wanders: true },
  mushroom: { zone: 'ground', width: 52, height: 43, labelHeight: 20 },
  pine:{zone:'ground',width:66,height:70,labelHeight:20,largePlant:true},
  raspberry:{zone:'ground',width:52,height:43,labelHeight:20},
  hazel:{zone:'ground',width:60,height:60,labelHeight:20,largePlant:true},
  chipmunk:{zone:'activity',width:46,height:38,labelHeight:20,wanders:true,motion:{speedX:.04,speedY:.009,walkSeconds:[1.2,2.3],pauseSeconds:[.5,1.1]}},
  'field-mouse':{zone:'activity',width:42,height:34,labelHeight:20,wanders:true,motion:{speedX:.02,speedY:.005,walkSeconds:[1,2],pauseSeconds:[.7,1.4]}},
  caterpillar:{zone:'activity',width:36,height:28,labelHeight:20,wanders:true,motion:{speedX:.008,speedY:.003,walkSeconds:[1.5,2.5],pauseSeconds:[1,2]}},
  aphid:{zone:'activity',width:32,height:25,labelHeight:20,wanders:true,motion:{speedX:.016,speedY:.006,walkSeconds:[.5,1],pauseSeconds:[2,3]}},
  snail:{zone:'activity',width:40,height:32,labelHeight:20,wanders:true,motion:{speedX:.007,speedY:.002,walkSeconds:[2,4],pauseSeconds:[1,2]}},
  spider:{zone:'activity',width:40,height:32,labelHeight:20,wanders:false,motion:{speedX:.027,speedY:.009,walkSeconds:[.6,1.4],pauseSeconds:[1,2]}},
  ladybird:{zone:'activity',width:36,height:28,labelHeight:20,wanders:true,motion:{speedX:.023,speedY:.006,walkSeconds:[.8,1.7],pauseSeconds:[.8,1.5]}},
  tit:{zone:'activity',width:44,height:36,labelHeight:20,wanders:true,motion:{speedX:.055,speedY:.023,walkSeconds:[1,2],pauseSeconds:[.6,1.2]}},
  bulbul:{zone:'activity',width:48,height:40,labelHeight:20,wanders:true,motion:{speedX:.045,speedY:.018,walkSeconds:[1.3,2.3],pauseSeconds:[.7,1.4]}},
  snake:{zone:'activity',width:48,height:34,labelHeight:20,wanders:true,motion:{speedX:.021,speedY:.006,walkSeconds:[2,3],pauseSeconds:[1,2]}},
  weasel:{zone:'activity',width:48,height:38,labelHeight:20,wanders:true,motion:{speedX:.044,speedY:.009,walkSeconds:[1.5,2.5],pauseSeconds:[.6,1.3]}},
  goshawk:{zone:'activity',width:54,height:43,labelHeight:20,wanders:true,motion:{speedX:.06,speedY:.025,walkSeconds:[1.2,2.2],pauseSeconds:[1,2]}},
  'litter-mold':{zone:'ground',width:48,height:32,labelHeight:20},
  'soil-bacteria':{zone:'ground',width:48,height:32,labelHeight:20},
};

export const wanderConfig = {
  framesPerSecond: 30,
  speedX: 0.028, speedY: 0.009,
  walkSeconds: [1.8, 3.2], pauseSeconds: [0.7, 1.5],
};
