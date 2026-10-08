export const GUIDE_KEY='eco-system:forest-guide-seen';
// Optional UI preference, independent of the versioned game save.
export function createGuideAdapter(getStorage=()=>globalThis.localStorage) {
 return {
  read(){try{return getStorage().getItem(GUIDE_KEY)==='yes';}catch{return false;}},
  markSeen(){try{getStorage().setItem(GUIDE_KEY,'yes');}catch{/* Help still closes if storage is unavailable. */}},
 };
}
