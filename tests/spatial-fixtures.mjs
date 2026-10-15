import {createHabitatPresentation} from '../js/systems/habitat-presentation.js';
import {speciesProfiles} from '../data/interaction-config.js';
import {measure} from './pacing-fixtures.mjs';
export const geometry=(width=1200,height=340)=>({width,height,sizes:Object.fromEntries(Object.entries(speciesProfiles).map(([id,p])=>[id,{width:p.width*Math.min(1,width/560),height:p.height*Math.min(1,width/560)}])),footprints:Object.fromEntries(Object.entries(speciesProfiles).map(([id,p])=>[id,{halfWidth:p.width/2/width,above:p.height/height,below:20/height}])),blockedRects:[]});
export function withPresentation(s,minutes=20,options={}){
 const p=createHabitatPresentation();let signature='';
 const m=measure(s,minutes,{...options,onTick:(state,e)=>{const next=state.organisms.map(o=>o.instanceId).join('|');if(next!==signature){signature=next;p.rebuild(state.organisms,geometry());}for(const o of state.organisms)p.position(o);options.onTick?.(state,e);}});
 return {...m,diagnostics:p.diagnostics()};
}
export const persisted=r=>JSON.parse(JSON.stringify(r.snapshot||r.result.snapshot));
