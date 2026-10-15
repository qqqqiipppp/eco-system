import {organismById} from '../../data/organisms.js';
// Provider boundary for stage16: only explicit objects/regions may supply real
// branches, wood or web anchors. Current background is one unsegmented SVG.
export function provideHabitatAnchors(organisms,layout){
 const anchors=[];
 for(const o of organisms){
  if(organismById[o.speciesId].role!=='producer')continue;
  const size=layout.sizes[o.speciesId],tree=['oak','pine','hazel'].includes(o.speciesId);
  anchors.push({id:`producer:${o.instanceId}:surface`,zone:tree?'trunk':'understory',kind:'producer-area',sourceInstanceId:o.instanceId,sourceSpeciesId:o.speciesId,position:{x:o.position.x,y:o.position.y-size.height*.4/layout.height},range:{x:size.width*.5/layout.width,y:size.height*.3/layout.height},capacity:2,priority:3,temporary:true,precise:false});
 }
 // The ground band is identifiable in forest.svg. These are safe activity
 // regions, not claims that a branch, log, pond or food exists there.
 anchors.push({id:'temporary-ground',zone:'ground',kind:'activity-area',sourceInstanceId:null,position:{x:.4,y:.72},range:{x:.32,y:.10},capacity:30,priority:0,temporary:true,precise:false});
 return anchors;
}
