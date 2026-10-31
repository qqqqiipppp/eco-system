export const SAVE_KEY='eco-system:forest-save';
// Storage access exists only here. Injection supports tests and a future adapter.
export function createLocalAdapter(getStorage=()=>globalThis.localStorage) {
 return {read:()=>getStorage().getItem(SAVE_KEY),write:text=>getStorage().setItem(SAVE_KEY,text),remove:()=>getStorage().removeItem(SAVE_KEY)};
}
// Chapter mode never writes the forest save: a stage is short and restarts.
export const createNoSaveAdapter=()=>({read:()=>null,write(){},remove(){}});
// Cleared stages and "나의 먹이그물": observed and drawn relations, roles and
// answered system questions. Unreadable storage simply means none yet.
export const CHAPTER_KEY='eco-system:chapter-progress';
export function createChapterProgressAdapter(getStorage=()=>globalThis.localStorage){
 const strings=value=>Array.isArray(value)?value.filter(v=>typeof v==='string'):[];
 const read=()=>{try{const v=JSON.parse(getStorage().getItem(CHAPTER_KEY))||{};
  return {cleared:strings(v.cleared),observed:strings(v.observed),drawn:strings(v.drawn),
   roles:v.roles&&typeof v.roles==='object'?Object.fromEntries(Object.entries(v.roles).filter(([,r])=>typeof r==='string')):{},
   system:Array.isArray(v.system)?v.system.filter(Number.isInteger):[]};}catch{return {cleared:[],observed:[],drawn:[],roles:{},system:[]};}};
 const update=change=>{try{const v=read();change(v);getStorage().setItem(CHAPTER_KEY,JSON.stringify(v));}catch{}};
 const add=(key,item)=>update(v=>{if(!v[key].includes(item))v[key].push(item);});
 return {read,cleared:()=>read().cleared,markCleared:id=>add('cleared',id),markObserved:id=>add('observed',id),
  markDrawn:id=>add('drawn',id),markSystem:n=>add('system',n),setRole:(id,role)=>update(v=>{v.roles[id]=role;})};
}
// The stage being played, so a reload, a closed tab or a sleeping tablet does
// not throw away the forest. Only one stage at a time; unreadable or foreign
// data is ignored (the stage then simply starts fresh).
export const STAGE_KEY='eco-system:chapter-stage';
export function createChapterStageAdapter(getStorage=()=>globalThis.localStorage){
 return {
  read(isValidStage=()=>true){try{const v=JSON.parse(getStorage().getItem(STAGE_KEY));
   return v&&v.version===1&&typeof v.stageId==='string'&&isValidStage(v.stageId)&&v.state?.chapter?.stageId===v.stageId&&Array.isArray(v.state.organisms)&&Number.isFinite(v.state.simulationTime)&&Number.isFinite(v.savedAt)?v:null;}catch{return null;}},
  write(state,eventMemory,now=Date.now()){try{getStorage().setItem(STAGE_KEY,JSON.stringify({version:1,stageId:state.chapter.stageId,savedAt:now,state,eventMemory}));return true;}catch{return false;}},
  remove(){try{getStorage().removeItem(STAGE_KEY);}catch{}},
 };
}
