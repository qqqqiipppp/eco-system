export const SAVE_KEY='eco-system:forest-save';
// Storage access exists only here. Injection supports tests and a future adapter.
export function createLocalAdapter(getStorage=()=>globalThis.localStorage) {
 return {read:()=>getStorage().getItem(SAVE_KEY),write:text=>getStorage().setItem(SAVE_KEY,text),remove:()=>getStorage().removeItem(SAVE_KEY)};
}
