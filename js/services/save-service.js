import {createSaveSnapshot,decodeSave} from './save-format.js';

export function createSaveService({adapter,getState,getEventMemory,onStatus=()=>{},delayMs=1200,now=()=>Date.now()}) {
 let timer=null,blocked=false,savedAt=null,dirty=false;
 const cancel=()=>{if(timer!==null)clearTimeout(timer);timer=null;};
 function load(){
  try{const result=decodeSave(adapter.read());blocked=result.blocked;savedAt=result.savedAt;onStatus(result.status);return result;}
  catch{onStatus('unavailable');return decodeSave(null);}
 }
 function flush(force=false){
  cancel();if(blocked||(!dirty&&!force))return false;
  try{const date=new Date(now()).toISOString();const snapshot=createSaveSnapshot(getState(),getEventMemory(),date);adapter.write(JSON.stringify(snapshot));savedAt=date;dirty=false;onStatus('saved');return true;}
  catch{onStatus('failed');return false;}
 }
 function schedule(){
  if(blocked)return;dirty=true;onStatus('pending');
  // Trailing debounce with a bounded delay: repeated input cannot starve a save.
  if(timer===null)timer=setTimeout(()=>flush(),delayMs);
 }
 function reset(){cancel();try{adapter.remove();blocked=false;savedAt=null;dirty=false;onStatus('new');return true;}catch{onStatus('failed');return false;}}
 return {load,schedule,flush,reset,getSavedAt:()=>savedAt,dispose:cancel};
}
