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
