// Original vector artwork for this project. No remote source or third-party art.
// Rebuild: node tools/build-species-art.mjs. Geometry/biology are not inputs.
import {mkdirSync,writeFileSync,readFileSync} from 'node:fs';
const out=new URL('../assets/images/species/',import.meta.url);mkdirSync(out,{recursive:true});
import {accuratePacks as packs,path,ellipse,line} from './species-art-shapes.mjs';
export const motionStates=id=>packs[id].plant?['idle','growth','leaf-turn']:packs[id].colony?['idle','active']:id==='earthworm'?['covered','surface','covered-eat','eat']:['idle','move','eat'];
for(const [id,p]of Object.entries(packs)){
 if(process.argv.some(a=>a.startsWith('--species='))&&!process.argv.includes('--species='+id))continue;
 const states=motionStates(id),views=[],frames=[];
 const parts={body:p.body,head:p.head,legs0:p.legs(0),legs1:p.legs(1),shell:p.shell||'',wing0:p.wing?.(0)||'',wing1:p.wing?.(1)||''};
 const use=key=>`<use href="#${key}"/>`;
 const variants=['default',...(id==='grass'?['sprout']:id==='grasshopper'?['nymph']:id==='mushroom'?['mycelium']:[])];
 for(const [v,variant]of variants.entries())for(const [s,state]of states.entries())for(let f=0;f<2;f++){
  const y=(v*states.length*2+s*2+f)*96;views.push(`<view id="${variant==='default'?'':variant+'-'}${state}-${f}" viewBox="0 ${y} 128 96"/>`);
  const eating=state==='eat'||state==='covered-eat',active=state==='active',growing=state==='growth',moving=state==='move';
  const angle=p.plant?(state==='leaf-turn'?(f?5:-5):(f?2:-2)):eating?(f?19:10):active?(f?3:-3):moving?(f?4:-3):f?-1:1;
  const head=`<g transform="rotate(${angle} ${p.pivot})">${variant==='sprout'||variant==='mycelium'?'':use('head')}</g>`;
  const body=variant==='sprout'?`<g transform="rotate(${f?1.5:-1.5} 61 82)">${line('M61 86V56','#638b43',2)}${path('M61 72Q39 58 35 43Q58 51 61 72m1-10q13-22 29-24-9 19-29 24','#79a35c')}</g>`:variant==='mycelium'?use('body')+line(f?'M23 75 40 65 64 76 85 63 105 76m-65-11-3-10m48 8 8-13':'M23 76 40 70 64 77 85 69 105 77m-65-7-3-7m48 6 8-8','#e8dfbc',2):variant==='nymph'?p.youngBody:use('body');
  const shell=use('shell'),wing=use('wing'+(moving?f:0));
  const covered=id==='earthworm'&&['covered','covered-eat'].includes(state);
  const overlay=covered?path('M7 64q24-9 49 6t65-6v23H7Z','#9c815c')+line(`M18 73l14 ${f?2:-2}m22 3 19-2m11-3 17 2`,'#c4a778',3):'';
  const action=eating?line(`M109 64l${f?6:3} ${f?3:6}m-6-3 3 4`,'#60834e',3):active?line(id==='soil-bacteria'?(f?'M27 84h18m21 0h22':'M39 84h18m24 0h20'):f?'M18 81q42-13 91-1M40 81l-4-8m46 7 3-9':'M18 82q42-5 91-1M44 80l-2-4m35 6 2-4','#ddd7a1',2):'';
  frames.push(`<g transform="translate(0 ${y})"><ellipse cx="63" cy="87" rx="45" ry="4" fill="#647849" opacity=".12" stroke="none"/><g stroke="#574735" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"><g transform="${growing?'translate(0 -2) scale(1 .99)':moving&&f?'translate(0 -2)':id==='earthworm'&&f?'translate(0 8) scale(1 .88)':'translate(0 0)'}">${body}${use('legs'+(moving?f:f&&eating?1:0))}${shell}${wing}${head}${action}</g>${overlay}</g></g>`);
 }
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 96" width="128" height="96"><title>${id} — original referenced forest illustration</title><defs>${Object.entries(parts).map(([key,value])=>`<g id="${key}">${value}</g>`).join('')}</defs>${views.join('')}${frames.join('')}</svg>\n`;
 if(process.argv.includes('--check')){if(readFileSync(new URL(id+'.svg',out),'utf8').replaceAll('\r\n','\n')!==svg)throw Error('Generated art differs: '+id);}
 else writeFileSync(new URL(id+'.svg',out),svg);
}
console.log('Built original referenced SVG state sheets; two articulated frames per state.');
