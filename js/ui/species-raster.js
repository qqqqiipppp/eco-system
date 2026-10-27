// Approved painted sprites (WebP, built by tools/build_species_raster.py from
// the final PNGs; see assets/images/species-raster/manifest.json). One still
// picture per species for now: every state and frame uses it, and motion is a
// light CSS hint until motion sprites exist. Growth variants without a painted
// version (grass sprout, mushroom mycelium) keep the SVG.
export const rasterSpecies=new Set([
 'bulbul','tit','chipmunk','rabbit','frog','grasshopper','grass','mushroom',
 'field-mouse','caterpillar','aphid','snail','spider','ladybird','snake','weasel','goshawk','earthworm',
 'oak','pine','hazel','raspberry','litter-mold','soil-bacteria',
]);
export const rasterAsset=id=>`./assets/images/species-raster/${id}.webp`;
// Stand-in until the nymph is painted: the adult picture (the newborn is
// already drawn smaller). Remove once grasshopper-nymph art exists.
export const rasterStandIns=new Set(['grasshopper:nymph']);
