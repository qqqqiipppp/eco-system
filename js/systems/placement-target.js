import {organismById} from '../../data/organisms.js';
import {placementConfig,speciesProfiles} from '../../data/interaction-config.js';
import {feedingConfig} from '../../data/ecology-config.js';
import {provideHabitatAnchors} from './habitat-anchors.js';
import {createHabitatPresentation,isHabitatAnchorEligible} from './habitat-presentation.js';
import {validatePlacement,placeOrganism} from './placement.js';

const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const box=(o,p,g)=>{const s=g.sizes[o.speciesId];return {left:p.x-s.width/2,right:p.x+s.width/2,top:p.y-s.height,bottom:p.y};};
const overlapRatio=(a,b)=>Math.max(0,Math.min(a.right,b.right)-Math.max(a.left,b.left))*Math.max(0,Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top))/Math.min((a.right-a.left)*(a.bottom-a.top),(b.right-b.left)*(b.bottom-b.top));
const validInput=input=>input?.isPlayArea&&!input.isUI&&[input.position?.x,input.position?.y].every(n=>Number.isFinite(n)&&n>=0&&n<=1);

/** One bounded search per placement gesture. Predictions use the same complete
 * presentation rebuild as creation/reload, including anchor capacity and order.
 * No saved/display coordinate, random choice, reward or ecology change here. */
export function findNearestPlacement(state,speciesId,input,layout){
 if(!organismById[speciesId])return {ok:false,reason:'selection'};
 if(!state.inventory.some(c=>c.speciesId===speciesId&&c.acquired))return {ok:false,reason:'inventory'};
 if(!validInput(input)||!layout?.sizes||!layout.width||!layout.height)return {ok:false,reason:'area'};
 if(state.organisms.length>=placementConfig.maxOrganisms)return {ok:false,reason:'limit'};
 const profile=speciesProfiles[speciesId],zone=placementConfig.zones[profile.zone],fp=layout.footprints[speciesId],requested=input.position;
 const low=Math.max(zone.left,fp.halfWidth),high=Math.min(zone.right,1-fp.halfWidth);
 if(low>high)return {ok:false,reason:'space',message:'이 화면에는 놓을 자리가 없어요. 다른 곳을 눌러 보세요.'};
 const xs=new Set(),ys=new Set([.72,clamp(requested.y,zone.top,zone.bottom)]);
 const x=n=>xs.add(+clamp(n,low,high).toFixed(8));
 x(requested.x);x(low);x(high);
 for(let i=0;i<=23;i++)x(low+(high-low)*i/23);
 for(const dx of [-.08,-.04,-.02,.02,.04,.08])x(requested.x+dx);
 for(const r of layout.blockedRects){x(r.left-fp.halfWidth-.001);x(r.right+fp.halfWidth+.001);ys.add(clamp(r.top-fp.below-.001,zone.top,zone.bottom));ys.add(clamp(r.bottom+fp.above+.001,zone.top,zone.bottom));}
 for(const o of state.organisms)if(profile.largePlant&&speciesProfiles[o.speciesId].largePlant){x(o.position.x-placementConfig.largePlantSpacing.x-.001);x(o.position.x+placementConfig.largePlantSpacing.x+.001);}
 const base=createHabitatPresentation();base.rebuild(state.organisms,layout);
 const anchors=provideHabitatAnchors(state.organisms,layout);
 for(const a of anchors.filter(a=>isHabitatAnchorEligible(speciesId,a))){x(a.position.x);x(clamp(requested.x,a.position.x-a.range.x,a.position.x+a.range.x));}
 const usage=new Map();for(const o of state.organisms){const id=base.descriptor(o.instanceId)?.anchorId;if(id)usage.set(id,(usage.get(id)||0)+1);}
 let sequence=state.nextInstanceSequence;while(state.organisms.some(o=>o.instanceId==='organism-'+sequence))sequence++;
 const id='organism-'+sequence,candidates=[];let refusal=null,checked=0;
 for(const px of xs)for(const py of ys){
  if(Math.abs(px-requested.x)>.22)continue;
  const position={x:px,y:py},validation=validatePlacement(state,speciesId,{...input,position},layout);
  if(!validation.ok){if(!['area','overlap'].includes(validation.reason))refusal=validation;continue;}
  const instance={instanceId:id,speciesId,position,behaviorState:feedingConfig[speciesId]?'wander':undefined},items=[...state.organisms,instance],view=createHabitatPresentation();view.rebuild(items,layout);checked++;
  const screen=view.position(instance),descriptor=view.descriptor(id),anchor=anchors.find(a=>a.id===descriptor.anchorId);
  if(anchor&&descriptor.attached&&(usage.get(anchor.id)||0)>=anchor.capacity)continue;
  if(!descriptor.attached&&anchors.some(a=>a.kind!=='activity-area'&&isHabitatAnchorEligible(speciesId,a)))continue;
  if(Math.abs(screen.x/layout.width-requested.x)>.22)continue;
  const visual=box(instance,screen,layout);
  if(state.organisms.some(o=>o.instanceId!==descriptor.sourceInstanceId&&overlapRatio(visual,box(o,view.position(o),layout))>.65))continue;
  const distance=Math.hypot(screen.x-requested.x*layout.width,screen.y-requested.y*layout.height);
  candidates.push({position,screenPosition:screen,distance,anchorId:descriptor.anchorId,fallback:descriptor.fallback});
 }
 if(!candidates.length)return checked===0&&refusal?refusal:{ok:false,reason:'space',message:'가까운 서식지에 빈자리가 없어요. 먹이 식물이나 다른 자리를 살펴보세요.'};
 const nearest=Math.min(...candidates.map(c=>c.distance));
 const close=candidates.filter(c=>c.distance<=nearest+.5).sort((a,b)=>Math.abs(a.position.x-requested.x)-Math.abs(b.position.x-requested.x)||Math.abs(a.position.y-.72)-Math.abs(b.position.y-.72)||a.distance-b.distance||a.position.x-b.position.x);
 return {ok:true,...close[0],requested:{...requested},checked};
}

export function placeNearestOrganism(state,speciesId,input,layout){
 const target=findNearestPlacement(state,speciesId,input,layout);if(!target.ok)return target;
 const result=placeOrganism(state,speciesId,{...input,position:target.position},layout);
 return result.ok?{...result,placement:target}:result;
}
