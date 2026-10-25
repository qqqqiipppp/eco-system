export const SAVE_KEY='eco-system:forest-save';
// Storage access exists only here. Injection supports tests and a future adapter.
export function createLocalAdapter(getStorage=()=>globalThis.localStorage) {
 return {read:()=>getStorage().getItem(SAVE_KEY),write:text=>getStorage().setItem(SAVE_KEY,text),remove:()=>getStorage().removeItem(SAVE_KEY)};
}
// Chapter mode never writes the forest save: a stage is short and restarts.
export const createNoSaveAdapter=()=>({read:()=>null,write(){},remove(){}});
// Only which stages were cleared. Unreadable storage simply means none yet.
export const CHAPTER_KEY='eco-system:chapter-progress';
export function createChapterProgressAdapter(getStorage=()=>globalThis.localStorage){
 const read=()=>{try{const value=JSON.parse(getStorage().getItem(CHAPTER_KEY));return Array.isArray(value?.cleared)?value.cleared.filter(id=>typeof id==='string'):[];}catch{return [];}};
 return {cleared:read,markCleared(id){try{const list=read();if(!list.includes(id))getStorage().setItem(CHAPTER_KEY,JSON.stringify({cleared:[...list,id]}));}catch{}}};
}
