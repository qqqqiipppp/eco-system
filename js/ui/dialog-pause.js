// A reading dialog suspends the existing scheduler. No timer, saved clock,
// replacement RAF or wall-clock catch-up. A compact memo is not a dialog.
export function bindDialogPause(refresh){
 let paused=Boolean(document.querySelector('dialog[open]'));
 const update=()=>{const next=Boolean(document.querySelector('dialog[open]'));if(next!==paused){paused=next;document.body.classList.toggle('reading-paused',paused);refresh();}};
 const observer=new MutationObserver(update);
 for(const dialog of document.querySelectorAll('dialog'))observer.observe(dialog,{attributes:true,attributeFilter:['open']});
 document.body.classList.toggle('reading-paused',paused);
 return {isPaused:()=>paused,dispose:()=>observer.disconnect()};
}
