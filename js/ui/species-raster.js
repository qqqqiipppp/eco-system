import {paintedFrames,paintedStages} from './species-frames.js';
// Approved painted sprites (WebP, built by tools/build_species_raster.py from
// the final PNGs; see assets/images/species-raster/manifest.json). One still
// picture per species for now: every state and frame uses it, and motion is a
// light CSS hint until motion sprites exist. Growth variants without a painted
// version (grass sprout, mushroom mycelium) keep the SVG.
export const rasterSpecies=new Set([
 'bulbul','tit','chipmunk','rabbit','frog','grasshopper','grass','mushroom',
 'field-mouse','caterpillar','aphid','snail','spider','ladybird','snake','weasel','goshawk','earthworm',
 'oak','pine','hazel','raspberry','litter-mold','soil-bacteria',
 // The river pond (data/river.js), 2026-11-04.
 'algae','duckweed','water-lily','cattail','daphnia','medaka','pond-snail','water-strider',
 'diving-beetle','catfish','frog-tadpole','bullfrog','red-swamp-crayfish',
]);
export const rasterAsset=id=>`./assets/images/species-raster/${id}.webp`;
// Painted motion frames and growth-stage pictures come from the generated
// species-frames.js (tools/build_species_raster.py --import). A key is a
// species id, or "id:stage" for a growth stage painted on its own (nymph,
// sprout, mycelium). A state without frames keeps the base picture and its CSS hint.
export const rasterFrames=paintedFrames;
export const rasterStages=new Set(paintedStages);
const file=key=>key.replace(':','-');
export const rasterFrameAsset=(key,state,frame)=>`./assets/images/species-raster/${file(key)}-${state}-${frame}.webp`;
export const rasterStageAsset=key=>`./assets/images/species-raster/${file(key)}.webp`;
