import {speciesHabitats,habitatZones,habitatPresentationConfig as config} from '../../data/habitats.js';
import {organismById} from '../../data/organisms.js';
import {provideHabitatAnchors} from './habitat-anchors.js';
import {placementConfig,speciesProfiles} from '../../data/interaction-config.js';
import {isPositionAllowed} from './placement-rules.js';
import {forestGroundHeight} from '../../data/forest-spaces.js';
import {feedingConfig} from '../../data/ecology-config.js';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const hash=s=>{let h=2166136261;for(const c of s)h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0;};
const area=b=>(b.right-b.left)*(b.bottom-b.top);
const overlap=(a,b)=>Math.max(0,Math.min(a.right,b.right)-Math.max(a.left,b.left))*Math.max(0,Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top));
export function validHabitatAnchor(a,byId){
 return a&&typeof a.id==='string'&&a.id.length>0&&a.id.length<=120&&Object.hasOwn(habitatZones,a.zone)&&['producer-area','activity-area','attachment'].includes(a.kind)&&typeof a.temporary==='boolean'&&typeof a.precise==='boolean'&&
  [a.position?.x,a.position?.y,a.range?.x,a.range?.y].every(v=>Number.isFinite(v)&&v>=0&&v<=1)&&
  Number.isInteger(a.capacity)&&a.capacity>0&&a.capacity<=30&&Number.isFinite(a.priority)&&
  (a.sourceInstanceId===null||byId.has(a.sourceInstanceId))&&
  !(a.zone==='branch'&&a.precise===true&&!a.sourceInstanceId&&!a.sourceObjectId);
}
// View-only cache. Never writes an organism, ecology RNG, food or stored field.
export function createHabitatPresentation({provider=provideHabitatAnchors}={}){
 let layout,organisms=[],byId=new Map(),offsets=new Map(),anchors=[],blocked=[],ambushers=[],rebuilds=0,anchorChecks=0;
 function bounds(o,p){const size=layout.sizes[o.speciesId],width=Math.max(config.minTouch,size.width);return {left:p.x-width/2,right:p.x+width/2,top:p.y-size.height,bottom:p.y+Math.max(20,config.minTouch-size.height)};}
 function safe(o,p,attached=false){
  const size=layout.sizes[o.speciesId],half=Math.max(config.minTouch,size.width)/2;
  const origin={x:o.position.x*layout.width,y:o.position.y*layout.height};
  const limit=attached?config.attachmentOffsetPixels:config.maxOffsetPixels,normalized=attached?config.attachmentOffsetNormalized:config.maxOffsetNormalized;
  const dx=Math.min(limit,normalized*layout.width),dy=Math.min(limit,normalized*layout.height);
  const lowX=Math.max(half+2,origin.x-dx),highX=Math.min(layout.width-half-2,origin.x+dx),lowY=Math.max(size.height+config.markerHeadroom,origin.y-dy),highY=Math.min(layout.height-Math.max(20,config.minTouch-size.height)-2,origin.y+dy);
  p={x:lowX<=highX?clamp(p.x,lowX,highX):clamp(origin.x,half+2,layout.width-half-2),y:lowY<=highY?clamp(p.y,lowY,highY):clamp(origin.y,size.height+config.markerHeadroom,layout.height-Math.max(20,config.minTouch-size.height)-2)};
  const clear=c=>blocked.every(r=>overlap(bounds(o,c),r)===0);
  if(!clear(p)){
   const alternatives=[origin,...blocked.flatMap(r=>[{x:r.left-half-2,y:p.y},{x:r.right+half+2,y:p.y},{x:p.x,y:r.top-Math.max(20,config.minTouch-size.height)-2},{x:p.x,y:r.bottom+size.height+config.markerHeadroom}])].filter(c=>c.x>=half+2&&c.x<=layout.width-half-2&&c.y>=size.height+config.markerHeadroom&&c.y<=layout.height-Math.max(20,config.minTouch-size.height)-2&&clear(c));
   alternatives.sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y));
   if(alternatives.length)p=alternatives[0];
  }
  return p;
 }
 function eligible(o,a){
  const rule=speciesHabitats[o.speciesId];
  if(a.kind==='activity-area'){
   if(a.sourceObjectId==='soil-cutaway'&&o.speciesId!=='earthworm')return false;
   if(a.id==='background:surface-litter'&&o.speciesId==='earthworm')return false;
   return a.zone==='ground'||[rule.primary,...rule.additional].includes(a.zone);
  }
  if(rule.movement==='perching')return a.zone==='branch'&&a.precise===true||a.zone==='canopy'&&Boolean(a.sourceObjectId);
  if(rule.movement==='tree-affinity')return a.zone==='trunk'&&(Boolean(a.sourceObjectId)||rule.preferredPlants.includes(a.sourceSpeciesId));
  if(rule.movement==='plant-surface'||o.speciesId==='grasshopper')return rule.preferredPlants.includes(a.sourceSpeciesId);
  if(o.speciesId==='spider')return a.zone==='trunk'&&Boolean(a.sourceObjectId);
  return false;
 }
 function rebuild(items,geometry){
  rebuilds++;organisms=items;layout=geometry;byId=new Map(items.map(o=>[o.instanceId,o]));offsets=new Map();
  ambushers=items.filter(o=>feedingConfig[o.speciesId]?.huntMode==='ambush');
  blocked=(geometry.visualBlockedRects||geometry.blockedRects).map(r=>({left:r.left*layout.width,right:r.right*layout.width,top:r.top*layout.height,bottom:r.bottom*layout.height}));
  const occupied=[],usage=new Map();
  const ordered=[...items].sort((a,b)=>(organismById[a.speciesId].role==='producer'?0:1)-(organismById[b.speciesId].role==='producer'?0:1)||a.instanceId.localeCompare(b.instanceId,'en'));
  const producerPositions=new Map();
  for(const o of ordered.filter(o=>organismById[o.speciesId].role==='producer')){
   const origin={x:o.position.x*layout.width,y:o.position.y*layout.height},candidates=[];
   for(const dx of [0,-24,24,-48,48,-68,68]){
    const x=clamp(origin.x+dx,0,layout.width),p=safe(o,{x,y:forestGroundHeight(x/layout.width)*layout.height}),box=bounds(o,p);
    if(blocked.some(r=>overlap(box,r)>0))continue;
    const collision=occupied.reduce((sum,b)=>sum+overlap(box,b)/Math.min(area(box),area(b)),0);
    candidates.push({p,score:collision*1000+Math.abs(p.x-origin.x)});
   }
   candidates.sort((a,b)=>a.score-b.score);const p=candidates[0]?.p||safe(o,origin);
   offsets.set(o.instanceId,{x:p.x-origin.x,y:p.y-origin.y,anchorId:'background:ground-band',zone:'ground',fallback:false,attached:false});
   producerPositions.set(o.instanceId,{x:p.x/layout.width,y:p.y/layout.height});occupied.push(bounds(o,p));
  }
  anchors=(provider(items,geometry,producerPositions)||[]).filter(a=>validHabitatAnchor(a,byId));
  for(const o of ordered.filter(o=>organismById[o.speciesId].role!=='producer')){
   const origin={x:o.position.x*layout.width,y:o.position.y*layout.height},rule=speciesHabitats[o.speciesId];
   const possible=anchors.filter(a=>{anchorChecks++;return eligible(o,a)&&(usage.get(a.id)||0)<a.capacity;}).sort((a,b)=>b.priority-a.priority||Math.hypot(a.position.x-o.position.x,a.position.y-o.position.y)-Math.hypot(b.position.x-o.position.x,b.position.y-o.position.y)||a.id.localeCompare(b.id,'en'));
   const anchor=possible[0],fallback=!anchor||anchor.kind==='activity-area',attached=Boolean(anchor&&anchor.kind!=='activity-area'&&(anchor.sourceObjectId||anchor.sourceInstanceId));
   const bias=rule.movement==='slow-litter'||rule.stationary?12:rule.movement==='perching'?-12:rule.movement==='short-hop'?-6:0;
   let preferred=fallback?{x:origin.x,y:anchor?clamp(origin.y+bias,(anchor.position.y-anchor.range.y)*layout.height,(anchor.position.y+anchor.range.y)*layout.height):origin.y+bias}:{x:anchor.position.x*layout.width,y:anchor.position.y*layout.height};
   const candidates=[],phase=hash(o.instanceId)%3;
   for(const dy of [0,-22,22,-44,44,-64,64])for(const dx of [0,-24,24,-48,48,-68,68]){
    let p=safe(o,{x:preferred.x+dx,y:preferred.y+dy},attached);
    if(fallback){const low=anchor?Math.max(config.groundTop,anchor.position.y-anchor.range.y):config.groundTop,high=anchor?Math.min(config.groundBottom,anchor.position.y+anchor.range.y):.77;p.y=clamp(p.y,low*layout.height,high*layout.height);p=safe(o,p);}
    else if(Math.abs(p.x-anchor.position.x*layout.width)>anchor.range.x*layout.width+12||Math.abs(p.y-anchor.position.y*layout.height)>anchor.range.y*layout.height+12)continue;
    if(anchor?.support){
     const size=layout.sizes[o.speciesId],image={left:p.x-size.width/2,right:p.x+size.width/2,top:p.y-size.height,bottom:p.y},s=anchor.support;
     if(p.y>s.bottom*layout.height+size.height*.25)continue;
     const contact=overlap(image,{left:s.left*layout.width,right:s.right*layout.width,top:s.top*layout.height,bottom:s.bottom*layout.height})/(size.width*size.height);
     if(contact<.08||contact>.6)continue;
    }
    const box=bounds(o,p);
    if(blocked.some(r=>overlap(box,r)>0))continue;
    const collision=occupied.reduce((sum,b)=>sum+overlap(box,b)/Math.min(area(box),area(b)),0);
    candidates.push({p,score:collision*1000+Math.hypot(p.x-preferred.x,p.y-preferred.y)+(phase===1?dx*.001:-dx*.001)});
   }
   candidates.sort((a,b)=>a.score-b.score);const p=candidates[0]?.p||safe(o,origin,attached);
   offsets.set(o.instanceId,{x:p.x-origin.x,y:p.y-origin.y,restX:p.x,restY:p.y,originX:origin.x,originY:origin.y,anchorId:anchor?.id||null,sourceInstanceId:anchor?.sourceInstanceId||null,sourceObjectId:anchor?.sourceObjectId||null,zone:anchor?.zone||'ground',fallback,attached});
   if(anchor)usage.set(anchor.id,(usage.get(anchor.id)||0)+1);occupied.push(bounds(o,p));
  }
 }
 function base(o){
  const offset=offsets.get(o.instanceId)||{x:0,y:0};
  if(offset.attached){
   // A resting bird/leaf user stays on its cached support as the independent
   // ecological coordinates move. Actual pursuit/contact is connected below.
   const leaf=speciesHabitats[o.speciesId].movement==='plant-surface'||o.speciesId==='grasshopper',dx=leaf?4:10,dy=leaf?3:6;
   return safe(o,{x:offset.restX+clamp(o.position.x*layout.width-offset.originX,-dx,dx),y:offset.restY+clamp(o.position.y*layout.height-offset.originY,-dy,dy)},true);
  }
  return safe(o,{x:o.position.x*layout.width+offset.x,y:o.position.y*layout.height+offset.y});
 }
 function position(o,depth=0){
  let p=base(o);const target=byId.get(o.targetInstanceId);
  // An actual ambush stays at its resting support. Project only its live,
  // in-range target to that contact point; never move either ecological point.
  // The small cached list follows the existing tick order, not a new food preference.
  const ambusher=ambushers.find(a=>a.targetInstanceId===o.instanceId&&['moveToFood','eat'].includes(a.behaviorState)&&Math.hypot(a.position.x-o.position.x,a.position.y-o.position.y)<=feedingConfig[a.speciesId].searchRadius);
  if(ambusher){const a=base(ambusher);return safe(o,{x:a.x+(o.position.x-ambusher.position.x)*layout.width,y:a.y+(o.position.y-ambusher.position.y)*layout.height},true);}
  if(feedingConfig[o.speciesId]?.huntMode==='ambush')return p;
  if(depth<4&&target&&['moveToFood','eat'].includes(o.behaviorState)){
   const d=Math.hypot(o.position.x-target.position.x,o.position.y-target.position.y),mix=clamp((.1-d)/.075,0,1);
   if(mix>0){const t=position(target,depth+1);p=safe(o,{x:p.x*(1-mix)+(t.x+(o.position.x-target.position.x)*layout.width)*mix,y:p.y*(1-mix)+(t.y+(o.position.y-target.position.y)*layout.height)*mix},true);}
  }else if(speciesHabitats[o.speciesId].movement==='short-hop'&&o.behaviorState==='wander')p.y-=Math.abs(Math.sin(o.position.x*120+o.position.y*90))*3;
  return p;
 }
 function placementPosition(speciesId,point){
  if(!layout||!speciesHabitats[speciesId]||isPositionAllowed(speciesId,point,layout))return point;
  if(organismById[speciesId].role==='producer')return point;
  const near=anchors.some(a=>eligible({speciesId},a)&&Math.abs(a.position.x-point.x)<=a.range.x+.025&&Math.abs(a.position.y-point.y)<=a.range.y+.025);
  if(!near)return point;
  const zone=placementConfig.zones[speciesProfiles[speciesId].zone],candidate={x:clamp(point.x,zone.left+.02,zone.right-.02),y:.72};
  return isPositionAllowed(speciesId,candidate,layout)?candidate:point;
 }
 return {rebuild,position,placementPosition,descriptor:id=>offsets.get(id),diagnostics:()=>({rebuilds,anchorChecks,anchors:anchors.length,assigned:offsets.size}),setProvider(next){provider=next;rebuild(organisms,layout);}};
}
