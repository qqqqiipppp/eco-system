import {organismById} from '../../data/organisms.js';
import {forestArtwork,backgroundHabitatSpaces} from '../../data/forest-spaces.js';
// Provider boundary for stage16: only explicit objects/regions may supply real
// branches, wood or web anchors. Current background is one unsegmented SVG.
export function provideHabitatAnchors(organisms,layout,producerPositions=new Map()){
 const anchors=[];
 for(const o of organisms){
  if(organismById[o.speciesId].role!=='producer')continue;
  const size=layout.sizes[o.speciesId],tree=['oak','pine','hazel'].includes(o.speciesId);
  const base=producerPositions.get(o.instanceId)||o.position;
  const art=organismById[o.speciesId].image?size:{width:Math.min(32,size.width),height:Math.min(30,size.height)},centerY=base.y-size.height*.5/layout.height;
  const support={left:base.x-art.width/2/layout.width,right:base.x+art.width/2/layout.width,top:centerY-art.height/2/layout.height,bottom:centerY+art.height/2/layout.height};
  anchors.push({id:`producer:${o.instanceId}:surface`,zone:tree?'trunk':'understory',kind:'producer-area',sourceInstanceId:o.instanceId,sourceSpeciesId:o.speciesId,position:{x:base.x,y:centerY+art.height*.2/layout.height},range:{x:(art.width+40)/2/layout.width,y:(art.height+28)/2/layout.height},support,capacity:2,priority:3,temporary:true,precise:false});
 }
 // Explicitly mapped visible crowns/trunks and the existing soil cutaway.
 // Background objects are visual support only; they never create food stock.
 for(const s of backgroundHabitatSpaces)anchors.push({id:'background:'+s.id,zone:s.zone,kind:['canopy','trunk'].includes(s.zone)?'attachment':'activity-area',sourceInstanceId:null,sourceObjectId:s.object,position:{x:s.x/forestArtwork.width,y:s.y/forestArtwork.height},range:{x:s.rx/forestArtwork.width,y:s.ry/forestArtwork.height},capacity:s.capacity,priority:s.priority,temporary:true,precise:false});
 return anchors;
}
