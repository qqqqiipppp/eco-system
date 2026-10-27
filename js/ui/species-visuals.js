import {organismById} from '../../data/organisms.js';
import {earthwormAtSurface} from '../systems/prey-access.js';
import {colonyActivity} from '../systems/lifespan.js';
import {rasterSpecies,rasterAsset} from './species-raster.js';

// Presentation contract: two authored SVG views for every explicit state.
// These paths do not participate in organism creation, physics or persistence.
export const visualStates=Object.freeze(Object.fromEntries(Object.values(organismById).map(s=>[s.id,
 s.role==='producer'?['idle','growth','leaf-turn']:s.role==='decomposer'?['idle','active']:s.id==='earthworm'?['covered','surface','covered-eat','eat']:['idle','move','eat']])));
const variantOf=(id,stage)=>id==='grass'&&stage==='sprout'?'sprout-':id==='grasshopper'&&stage==='nymph'?'nymph-':id==='mushroom'&&stage==='mycelium'?'mycelium-':'';
export const svgAsset=(id,state=id==='earthworm'?'surface':visualStates[id][0],frame=0,stage)=>`./assets/images/species/${id}.svg#${variantOf(id,stage)}${state}-${frame}`;
// The painted sprite when there is one for this species and growth variant;
// otherwise, or once it failed to load in this browser, the SVG view.
const rasterFailed=new Set();
export const visualAsset=(id,state,frame,stage)=>rasterSpecies.has(id)&&!variantOf(id,stage)&&!rasterFailed.has(id)?rasterAsset(id):svgAsset(id,state,frame,stage);
if(typeof document!=='undefined')document.addEventListener('error',event=>{
 const img=event.target,match=img?.tagName==='IMG'&&/\/species-raster\/([\w-]+)\.webp/.exec(img.getAttribute('src')||'');
 if(match){rasterFailed.add(match[1]);img.src=svgAsset(match[1]);}
},true);

// No idle sway or flicker for these: a tree or a mushroom shows it is alive by
// its state (growing, decomposing), drawn as one still pose, not by shaking.
export const stillSpecies=new Set(['oak','pine','hazel','raspberry','mushroom','litter-mold','soil-bacteria']);

/** Reads actual work deltas and actual model movement. All memory is temporary;
 * loading a cumulative work total never pretends decomposition just occurred.
 * Shared decomposition work can only identify a species, not a spatial patch.
 */
export function createVisualTracker(){
 const previous=new Map(),activeUntil=new Map();let lastTime=null,visualTime=0;
 return {
  reset(){previous.clear();activeUntil.clear();lastTime=null;visualTime=0;},
  sample(state,delta,visualWork={}){
   const time=state.simulationTime;
   if(lastTime!==null&&time<lastTime)this.reset();lastTime=time;
   visualTime=Number.isFinite(delta)?visualTime+Math.max(0,Math.min(.1,delta)):time;
   const live=new Set(state.organisms.map(o=>o.instanceId));
   for(const id of previous.keys())if(!live.has(id)){previous.delete(id);activeUntil.delete(id);}
   const eligible=state.organisms.filter(o=>organismById[o.speciesId].role==='decomposer').filter((o,i,all)=>all.filter(n=>n.speciesId===o.speciesId).indexOf(o)<3);
   return state.organisms.map(o=>{
    const p=previous.get(o.instanceId),species=organismById[o.speciesId],work=state.learningGoalProgress?.work?.[o.speciesId]||0;
    const moved=Boolean(p&&Math.hypot(o.position.x-p.x,o.position.y-p.y)>1e-8);
    const growing=Boolean(p&&o.growth>p.growth+1e-9);
    const processing=Boolean((visualWork[o.speciesId]>0||p&&work>p.work)&&eligible.includes(o)&&colonyActivity(o,state.environment)>0);
    const feeding=Boolean(p&&o.litterConsumed>p.litter);
    if(growing||processing||feeding)activeUntil.set(o.instanceId,time+1);
    const active=(activeUntil.get(o.instanceId)||-1)>=time;
    let motion;
    if(o.speciesId==='earthworm'){const surface=earthwormAtSurface(o,time);motion=active?(surface?'eat':'covered-eat'):(surface?'surface':'covered');}
    // Grass also has a second visible leaf-turn pose. It is an idle variation
    // of this drawing, never a claim of measured growth or wind. Trees, shrubs
    // and fungi stand still: they do not move like animals.
    else if(species.role==='producer')motion=active?'growth':!stillSpecies.has(o.speciesId)&&Math.floor(time/9)%2?'leaf-turn':'idle';
    else if(species.role==='decomposer')motion=active?'active':'idle';
    else motion=o.behaviorState==='eat'?'eat':moved||(o.speciesId==='spider'&&o.behaviorState==='moveToFood')?'move':'idle';
    const started=p?.motion===motion?p.started:visualTime;
    const period=motion==='idle'&&species.role==='consumer'?.32:['idle','covered','leaf-turn','surface'].includes(motion)?1.2:.22;
    const frame=stillSpecies.has(o.speciesId)?0:Math.floor((visualTime-started)/period)%2;
    previous.set(o.instanceId,{x:o.position.x,y:o.position.y,growth:o.growth,work,litter:o.litterConsumed,motion,started});
    const target=state.organisms.find(n=>n.instanceId===o.targetInstanceId),dx=target?target.position.x-o.position.x:0;
    const facing=Math.abs(dx)>1e-7?Math.sign(dx):o.direction||1;
    return {instanceId:o.instanceId,motion,frame,facing,src:visualAsset(o.speciesId,motion,frame,o.development?.stage)};
   });
  },
 };
}
