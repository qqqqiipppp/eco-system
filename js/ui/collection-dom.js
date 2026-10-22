import {visualAsset} from './species-visuals.js';
export const node=(tag,text)=>{const element=document.createElement(tag);if(text)element.textContent=text;return element;};
export function speciesVisual(species){
 const img=node('img');img.src=visualAsset(species.id);img.alt='';img.loading='lazy';return img;
}
export function button(text,action){const b=node('button',text);b.type='button';b.addEventListener('click',action);return b;}
