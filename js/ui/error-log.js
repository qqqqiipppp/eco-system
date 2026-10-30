// Keeps the last few errors on this device so a classroom freeze can be traced
// later: open the game with #errors at the end of the address to see them.
const key='eco-system:errors',limit=20;
const read=()=>{try{return JSON.parse(localStorage.getItem(key)||'[]');}catch{return [];}};
export function recordError(error,where='frame'){
 const entry={at:new Date().toISOString(),where,message:String(error?.message||error),stack:String(error?.stack||'').split('\n').slice(0,6).join('\n'),agent:navigator.userAgent};
 if(where==='frame'||where==='start')console.error(error);
 try{const list=read();const last=list.at(-1);
  if(last&&last.message===entry.message&&last.where===where){last.count=(last.count||1)+1;last.at=entry.at;}else list.push(entry);
  localStorage.setItem(key,JSON.stringify(list.slice(-limit)));}catch{}
}
export function watchErrors(){
 // ResizeObserver's loop notice is harmless and frequent; it is not kept.
 addEventListener('error',event=>{if(!/ResizeObserver/.test(event.message))recordError(event.error||event.message,'event');});
 addEventListener('unhandledrejection',event=>recordError(event.reason,'promise'));
 if(location.hash!=='#errors')return;
 const list=read(),box=document.createElement('dialog');
 box.className='chapter-dialog error-log';
 const pre=document.createElement('pre');pre.textContent=list.length?list.map(e=>`${e.at} (${e.where}${e.count?' ×'+e.count:''})\n${e.message}\n${e.stack}\n${e.agent}`).join('\n\n'):'기록된 오류가 없어요.';
 const close=document.createElement('button');close.type='button';close.textContent='닫기';close.onclick=()=>box.close();
 box.append(pre,close);document.body.append(box);box.showModal();
}
