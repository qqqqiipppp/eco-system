export const node=(tag,text)=>{const element=document.createElement(tag);if(text)element.textContent=text;return element;};
export function speciesVisual(species){
 if(species.image){const img=node('img');img.src=species.image;img.alt='';img.loading='lazy';return img;}
 const icon=node('span',species.placeholder);icon.className='guide-placeholder';icon.setAttribute('aria-hidden','true');return icon;
}
export function button(text,action){const b=node('button',text);b.type='button';b.addEventListener('click',action);return b;}
