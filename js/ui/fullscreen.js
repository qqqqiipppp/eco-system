// "전체 화면" for a tablet that opens the game in a Chrome tab: hides the
// address bar. Not shown when the game already runs full screen from the home
// screen (manifest.webmanifest) or when the browser cannot do it.
export function fullscreenButton(){
 const root=document.documentElement;
 if(!document.fullscreenEnabled||!root.requestFullscreen||matchMedia('(display-mode: fullscreen)').matches)return null;
 const button=document.createElement('button');button.type='button';
 const label=()=>{button.textContent=document.fullscreenElement?'전체 화면 끝내기':'전체 화면';};
 button.addEventListener('click',()=>{(document.fullscreenElement?document.exitFullscreen():root.requestFullscreen({navigationUI:'hide'})).catch(()=>{});});
 document.addEventListener('fullscreenchange',label);label();
 return button;
}
