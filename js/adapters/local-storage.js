export const SAVE_KEY='eco-system:forest-save';
// Storage access exists only here. Injection supports tests and a future adapter.
export function createLocalAdapter(getStorage=()=>globalThis.localStorage) {
 return {read:()=>getStorage().getItem(SAVE_KEY),write:text=>getStorage().setItem(SAVE_KEY,text),remove:()=>getStorage().removeItem(SAVE_KEY)};
}
// Chapter mode never writes the forest save: a stage is short and restarts.
export const createNoSaveAdapter=()=>({read:()=>null,write(){},remove(){}});
// Cleared stages and "나의 먹이그물": observed and drawn relations, roles and
// answered system questions. "나의 기록" adds, per chapter, the mistakes made
// while drawing the web and when it was finished, and each crisis question's
// answer. Unreadable storage simply means none yet.
export const CHAPTER_KEY='eco-system:chapter-progress';
export function createChapterProgressAdapter(getStorage=()=>globalThis.localStorage){
 const strings=value=>Array.isArray(value)?value.filter(v=>typeof v==='string'):[];
 const count=value=>Number.isInteger(value)&&value>=0?value:0;
 const stats=value=>Object.fromEntries(Object.entries(value&&typeof value==='object'?value:{}).filter(([n,v])=>/^\d+$/.test(n)&&v&&typeof v==='object')
  .map(([n,v])=>[n,{role:count(v.role),arrow:count(v.arrow),system:count(v.system),completedAt:typeof v.completedAt==='string'?v.completedAt:null}]));
 const reflections=value=>Array.isArray(value)?value.filter(r=>r&&typeof r.stageId==='string'&&typeof r.kind==='string'&&Number.isInteger(r.question)&&typeof r.correct==='boolean'):[];
 const read=()=>{try{const v=JSON.parse(getStorage().getItem(CHAPTER_KEY))||{};
  return {cleared:strings(v.cleared),observed:strings(v.observed),drawn:strings(v.drawn),
   roles:v.roles&&typeof v.roles==='object'?Object.fromEntries(Object.entries(v.roles).filter(([,r])=>typeof r==='string')):{},
   system:Array.isArray(v.system)?v.system.filter(Number.isInteger):[],webStats:stats(v.webStats),reflections:reflections(v.reflections)};}
  catch{return {cleared:[],observed:[],drawn:[],roles:{},system:[],webStats:{},reflections:[]};}};
 const update=change=>{try{const v=read();change(v);getStorage().setItem(CHAPTER_KEY,JSON.stringify(v));}catch{}};
 const add=(key,item)=>update(v=>{if(!v[key].includes(item))v[key].push(item);});
 const stat=(v,n)=>v.webStats[n]??={role:0,arrow:0,system:0,completedAt:null};
 return {read,cleared:()=>read().cleared,markCleared:id=>add('cleared',id),markObserved:id=>add('observed',id),
  markDrawn:id=>add('drawn',id),markSystem:n=>add('system',n),setRole:(id,role)=>update(v=>{v.roles[id]=role;}),
  addMistake:(n,kind)=>update(v=>{stat(v,n)[kind]++;}),
  markWebDone:(n,at=new Date().toISOString())=>update(v=>{stat(v,n).completedAt??=at;}),
  addReflection:entry=>update(v=>{v.reflections.push(entry);})};
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
