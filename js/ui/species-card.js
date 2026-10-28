import {organismById,roleLabels} from '../../data/organisms.js';
import {speciesCards} from '../../data/species-cards.js';
import {visualAsset} from './species-visuals.js';

const icons={role:'🔎',needs:'☀️',eats:'🍃',job:'🍂',eatenBy:'⚠️',home:'🏠',life:'🔄',wow:'✨'};
const el=(tag,className,text)=>{const e=document.createElement(tag);if(className)e.className=className;if(text)e.textContent=text;return e;};

// Real-world species card for 4th graders: photos, role and a few short facts.
export function speciesCardElement(id){
 const species=organismById[id],card=speciesCards[id],root=el('section','species-card');
 root.dataset.speciesCard=id;root.setAttribute('aria-label',species.name+' 생물 카드');
 const photos=card.photos.length?card.photos:[{src:visualAsset(id),caption:'게임 그림',credit:''}];
 const strip=el('div','species-card-photos'),dots=el('div','species-card-dots'),credit=el('p','species-card-credit');
 photos.forEach((p,i)=>{
  const figure=el('figure'),img=el('img');img.src=p.src;img.alt=species.name+' 사진 '+(i+1);img.loading=i?'lazy':'eager';img.decoding='async';
  figure.append(img);if(p.caption)figure.append(el('figcaption','',p.caption));strip.append(figure);
  const dot=el('button');dot.type='button';dot.setAttribute('aria-label',(i+1)+'번 사진');dot.addEventListener('click',()=>strip.scrollTo({left:strip.clientWidth*i,behavior:'smooth'}));dots.append(dot);
 });
 function show(i){
  [...dots.children].forEach((d,k)=>d.setAttribute('aria-current',String(k===i)));
  const p=photos[i];credit.replaceChildren();if(!p.credit)return;
  credit.append('사진: '+p.credit+' ');
  if(p.source){const a=el('a','','출처');a.href=p.source;a.target='_blank';a.rel='noopener';credit.append(a);}
 }
 strip.addEventListener('scroll',()=>show(Math.round(strip.scrollLeft/Math.max(1,strip.clientWidth))),{passive:true});
 show(0);
 const head=el('div','species-card-head');
 head.append(el('h3','',species.name),el('span','species-card-role role-'+species.role,roleLabels[species.role]));
 const facts=el('dl','species-card-facts');
 for(const row of card.rows){const item=el('div');item.dataset.fact=row.key;item.append(el('dt','',icons[row.key]+' '+row.label),el('dd','',row.text));facts.append(item);}
 const media=el('div','species-card-media'),text=el('div','species-card-text');
 media.append(strip);if(photos.length>1)media.append(dots);media.append(credit);
 text.append(head,el('p','species-card-intro',card.intro),facts);root.append(media,text);
 return root;
}
