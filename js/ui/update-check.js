// A deployed page carries its version (tools/stamp_version.mjs). Every few
// minutes, and when the tablet wakes, it asks the server for the current one;
// if a new version is out, a bar offers to reload. Reloading keeps the forest:
// the page saves on pagehide and the stage comes back through "이어서 하기".
export function watchForUpdates({every=180000,fetchVersion=()=>fetch('./version.json',{cache:'no-store'}).then(r=>r.ok?r.json():null)}={}){
 const mine=document.querySelector('meta[name="app-version"]')?.content;
 if(!mine)return null;
 let bar=null,checking=false;
 async function check(){
  if(bar||checking)return;checking=true;
  try{const latest=(await fetchVersion())?.version;if(latest&&latest!==mine)show();}catch{}finally{checking=false;}
 }
 function show(){
  bar=document.createElement('div');bar.className='update-bar';bar.setAttribute('role','status');
  const text=document.createElement('span');text.textContent='게임이 새로 바뀌었어요. 지금 숲은 그대로 남아요.';
  const button=document.createElement('button');button.type='button';button.textContent='새로 고치기';button.onclick=()=>location.reload();
  bar.append(text,button);document.body.append(bar);
 }
 const timer=setInterval(check,every);
 document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')check();});
 check();
 return {check,stop:()=>clearInterval(timer)};
}
