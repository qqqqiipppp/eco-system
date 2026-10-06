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
};

export const wanderConfig = {
  framesPerSecond: 30,
  speedX: 0.028, speedY: 0.009,
  walkSeconds: [1.8, 3.2], pauseSeconds: [0.7, 1.5],
};
