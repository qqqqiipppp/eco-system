import {placementConfig,speciesProfiles} from '../../data/interaction-config.js';
const inUnitRange=v=>Number.isFinite(v)&&v>=0&&v<=1;
const overlaps=(a,b)=>a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;
export function isPositionAllowed(speciesId,position,layout){
 const profile=speciesProfiles[speciesId],footprint=layout?.footprints?.[speciesId];
 if(!profile||!footprint||!position||!inUnitRange(position.x)||!inUnitRange(position.y))return false;
 const zone=placementConfig.zones[profile.zone];
 if(position.x<zone.left||position.x>zone.right||position.y<zone.top||position.y>zone.bottom)return false;
 const bounds={left:position.x-footprint.halfWidth,right:position.x+footprint.halfWidth,top:position.y-footprint.above,bottom:position.y+footprint.below};
 if(bounds.left<0||bounds.right>1||bounds.top<0||bounds.bottom>1)return false;
 return !layout.blockedRects.some(r=>overlaps(bounds,r));
}
export function hasSpace(state,speciesId,position,layout){
 return isPositionAllowed(speciesId,position,layout)&&!state.organisms.some(o=>
  speciesProfiles[speciesId].largePlant&&speciesProfiles[o.speciesId]?.largePlant&&Math.abs(o.position.x-position.x)<placementConfig.largePlantSpacing.x&&Math.abs(o.position.y-position.y)<placementConfig.largePlantSpacing.y);
}
