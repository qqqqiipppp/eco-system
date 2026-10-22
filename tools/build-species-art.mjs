// Original vector artwork for this project. No remote source or third-party art.
// Rebuild: node tools/build-species-art.mjs. Geometry/biology are not inputs.
import {mkdirSync,writeFileSync} from 'node:fs';
const out=new URL('../assets/images/species/',import.meta.url);mkdirSync(out,{recursive:true});
const path=(d,fill,extra='')=>`<path d="${d}" fill="${fill}" ${extra}/>`;
const ellipse=(x,y,rx,ry,fill,extra='')=>`<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${fill}" ${extra}/>`;
const eye=(x,y,blink=false)=>blink?path(`M${x-2} ${y}h4`,'none','stroke="#283c2d"'):ellipse(x,y,2.1,2.7,'#23352d','stroke="none"')+ellipse(x+.6,y-.9,.7,.9,'#fff','stroke="none"');
const line=(d,color='#574735',width=2)=>path(d,'none',`stroke="${color}" stroke-width="${width}"`);
const leaf=(x,y,angle=0,color='#69a450')=>`<g transform="translate(${x} ${y}) rotate(${angle})">${path('M0 0Q-17-20 0-28Q16-18 0 0',color)}${line('M0-2v-21','#44773c',1)}</g>`;
const packs={};
// Each illustration is split into a fixed body and articulated features.
function mammal(id,color,kind){
 let body=ellipse(56,61,34,21,color)+ellipse(56,69,26,11,'#e5cd98');
 if(kind==='hare')body+=ellipse(25,61,10,10,'#c1a47d');
 if(kind==='chip')body=path('M39 68C-8 46 22 6 35 25Q50 52 50 66',color)+line('M30 30Q16 47 37 61','#ecd8a8',7)+body+line('M35 49h38m-39 8h39','#44372c',4)+line('M36 53h37','#f7e1a9',3);
 if(kind==='weasel')body=path('M33 63Q6 37 16 31Q27 29 42 52',color)+ellipse(57,63,35,16,color)+ellipse(69,70,23,7,'#f0dbac');
 if(kind==='hedge')body=path('M18 64l-4-11 9-1-2-10 10 1 2-11 10 5 6-10 9 7 8-6 5 10 11-1 2 11 10 6-7 19Z','#6d5841')+ellipse(57,65,32,15,'#a38b65');
 const head=ellipse(89,52,16,15,color)+ellipse(100,58,10,7,'#ead6b1')+ellipse(108,55,3,2.5,'#403b32')+eye(94,48);
 let ears=kind==='hare'?ellipse(80,26,6,23,color,'transform="rotate(-13 80 26)"')+ellipse(94,26,5,22,color)+line('M80 13l3 22','#d6a693',3)+line('M94 12v22','#d6a693',2):ellipse(81,39,6,7,color)+ellipse(96,39,5,6,color);
 if(kind==='hedge')ears=ellipse(85,45,5,5,'#b29672');
 packs[id]={body,head:ears+head,legs:f=>line(`M37 74l${f?'-7 9':'-1 9'}h11m26-9l${f?'7 9':'1 9'}h9`,color,6),pivot:'88 55'};
}
mammal('rabbit','#a98760','hare');mammal('chipmunk','#a57540','chip');mammal('field-mouse','#b69b73','hedge');mammal('weasel','#ac6a34','weasel');
packs.frog={body:ellipse(56,63,29,19,'#679543')+ellipse(69,69,22,10,'#dce2a1')+line('M30 53l14 5m-18 3 13 4m-8 4 11 3','#345c36',3),head:ellipse(86,52,19,15,'#709f4c')+ellipse(92,42,7,7,'#9cba69')+eye(94,41)+line('M90 58h15'),legs:f=>path(`M43 64q-31-15-27 11l${f?'20 9':'13 2'}h15m30-10 6 13h16`,'#709d49'),pivot:'86 55'};
packs.grasshopper={body:ellipse(58,59,28,9,'#87ac4e','transform="rotate(-12 58 59)"')+path('M32 56l35-16 17 16-47 7Z','#a5bf65')+line('M35 57l38-6','#567f3b'),head:ellipse(91,49,10,13,'#9bbb5c','transform="rotate(-20 91 49)"')+eye(95,45)+line('M93 39l7-18m-11 18 2-20','#647f3e',1.6),legs:f=>line(`M57 61l-15-19-17 35h18m26-15 7 ${f?15:18}h12m1-22 12 ${f?16:12}h12`,'#56773b',3),pivot:'89 53'};
packs.caterpillar={body:[24,37,50,63,76,88].map((x,i)=>ellipse(x,65-(i%2)*2,10,13,i%2?'#a59768':'#d2c390')).join('')+Array.from({length:19},(_,i)=>line(`M${18+i*4} 52l-2-6`,'#665748',1)).join(''),head:ellipse(99,62,11,12,'#8e6c43')+eye(102,58),legs:f=>[27,42,57,72,87].map(x=>line(`M${x} 76l${f?3:-2} 6`,'#65503b',2)).join(''),pivot:'99 65'};
function beetle(id,bronze){const col=bronze?'#4c8b73':'#a84f35';packs[id]={body:ellipse(57,60,29,19,col)+path('M31 55q28-24 55 0l-7 18q-22 15-43-2Z',col)+line('M59 44v34',bronze?'#c2c790':'#552e2d')+[41,49,68,76].map(x=>line(`M${x} 50v20`,bronze?'#75ab8f':'#cf7c51',1)).join(''),head:ellipse(88,56,12,12,bronze?'#336c59':'#343f36')+eye(93,53)+line('M91 45l8-12m-5 15 15-9'),legs:f=>line(`M38 46l-12-9-10 5m22 23-15 ${f?12:6}-12-1m44-31 2-11 11-1m-13 38 5 ${f?12:8} 14 1m-12-30 8-5 12 2`,'#4a4e39',2.3),pivot:'88 58'};}
beetle('aphid',true);beetle('ladybird',false);
packs.snail={body:path('M16 77q23-14 49-8l34-11q12 2 12 16-27 14-95 7Z','#b9b080'),head:line('M102 63l8-21m-14 22 3-18','#827e55',3)+eye(110,42)+eye(99,46),legs:f=>ellipse(53,78,f?34:39,4,'#a6a06e','stroke="none"'),shell:ellipse(54,53,26,25,'#bc8e54')+path('M66 63C34 81 19 41 47 32c27-8 41 29 17 29-18 0-16-22-3-16q9 4 2 10','none','stroke="#785a3a" stroke-width="3"'),pivot:'102 65'};
packs.spider={body:ellipse(51,47,19,25,'#dbc66a')+path('M35 36q16-10 33 0v8H34Zm0 17h34v8H37Z','#39453d')+ellipse(76,65,11,10,'#4a4b3a'),head:eye(84,62)+eye(78,61),legs:f=>line(`M48 32 28 ${f?18:22} 10 45m34-3-23-9L7 61m33-5L20 54 7 77m45-13-18 9-11 13m40-51 19-15 22 14m-21 11 19-7 17 23m-32-4 22-2 15 20m-37-9 17 12 11 1`,'#4c513b',2.3),pivot:'78 65'};
function bird(id,kind){const tit=kind==='tit',hawk=kind==='hawk',bodyColor=tit?'#a9ae72':hawk?'#8a8474':'#89918c';packs[id]={body:path('M39 60 13 76l5-20 33-13Z',hawk?'#6b685c':'#666d61')+ellipse(62,60,29,20,bodyColor)+ellipse(72,68,18,11,tit?'#eee8bb':'#d3cbb8')+(tit?path('M71 47h6v33h-6Z','#344239'):line('M60 65h21m-21 5h19m-19 5h16','#9a9380',1.5)),head:ellipse(89,42,15,16,tit?'#35433a':hawk?'#797867':'#7d8580')+(tit?ellipse(94,48,8,6,'#fff6d7'):ellipse(91,50,7,5,hawk?'#d5cfb7':'#a97957'))+path(hawk?'M101 39l14 5-5 9-2-6-8-1Z':'M101 40l13 6-13 3Z','#665d3e')+eye(94,39)+(kind==='bulbul'?path('M78 33l2-13 6 8 1-12 7 12','#7d8580'):hawk?line('M88 34l10 1','#ddd8bb',3):''),legs:f=>line(`M58 75l${f?-5:0} 10h-9m23-9 3 9h9`,'#6c6248',2.5),wing:f=>path(f?'M35 52Q47 9 73 35L83 60Q54 65 35 52':'M38 53Q51 76 78 62L64 50Z',hawk?'#747668':tit?'#64765d':'#727e78')+line(f?'M46 39l14 15m-6-22 12 18':'M49 59l17 1','#c6c9b1',2),pivot:'90 47'};}
bird('tit','tit');bird('bulbul','bulbul');bird('goshawk','hawk');
packs.snake={body:path('M16 74C-2 40 68 34 66 57c-2 15-35 4-27 17 9 13 43 0 50-14','none','stroke="#477849" stroke-width="16"')+path('M18 73C6 45 61 43 61 55c0 10-29 6-29 17','none','stroke="#92a15e" stroke-width="3"')+[23,34,46,58,76].map(x=>line(`M${x} 49l4 7`,'#293f35',3)).join(''),head:path('M79 67l5-22 12 4-5 21Z','#c47c46')+ellipse(97,46,15,9,'#689456')+eye(104,43)+line('M105 50h9','#2d4b36',1),legs:()=>'',pivot:'94 53'};
packs.earthworm={body:path('M15 70Q30 42 53 61T106 57','none','stroke="#b67867" stroke-width="14"')+path('M15 67Q32 43 53 58T104 54','none','stroke="#d6a18b" stroke-width="3"')+path('M61 64l7 3','none','stroke="#975f51" stroke-width="16"')+[19,27,35,43,51,76,84,92,100].map((x,i)=>line(`M${x} ${57+(i%3)*3}l-3 9`,'#915f55',1)).join(''),head:'',legs:()=>'',pivot:'93 60'};
for(const id of ['oak','pine','hazel','raspberry','grass']){
 let body='',head='';
 if(id==='grass'){body=line('M60 85Q54 49 36 23M62 85Q74 48 89 18M60 85 61 12','#698b3e',3)+path('M59 81Q16 38 25 30Q52 42 59 81m5 0q34-42 41-38-10 27-41 38','#73a147');head=[ [35,23,-30],[61,13,0],[89,19,30] ].map(([x,y,r])=>`<g transform="translate(${x} ${y}) rotate(${r})">${ellipse(0,0,6,14,'#b4b265')}${line('M-3-10 4 9','#7f914c',1)}</g>`).join('');}
 else if(id==='raspberry'){body=line('M60 86V45m0 18-30-23m30 13 28-24','#8d7950',4);head=[[30,41,-45],[46,50,-15],[62,41,5],[88,30,35],[81,58,55]].map(a=>leaf(...a)).join('')+[[32,57],[68,63],[91,48]].map(([x,y])=>[[-3,0],[3,0],[0,5]].map(([dx,dy])=>ellipse(x+dx,y+dy,4,4,'#bf5c60')).join('')).join('');}
 else{body=path('M52 87l4-51h14l7 51-12-3Z','#99704b')+line('M62 68 43 46m23 10 22-19','#795b40',4)+line('M63 57v22','#c29765',2);
 if(id==='pine')head=path('M63 6 39 33h12L28 54h15L19 75h88L84 54h14L75 33h12Z','#50824d')+line('M45 37h29M32 59h56','#80a568',3)+ellipse(81,69,4,6,'#a5814e');
 else{const oak=id==='oak';head=[[43,36,23,21],[65,24,24,20],[87,39,23,22],[63,50,31,17]].map(([x,y,rx,ry],i)=>ellipse(x,y,rx,ry,[oak?'#56834a':'#72a14d','#79a357','#638f4c','#86ae5c'][i])).join('')+line('M29 38l9 1m25-24 9 2m9 29 9-1','#b0c77a',2);head+=oak?path('M38 59q-8-2-6 7 7 8 12-2Z','#bba06a')+path('M31 61q6-8 13 0','#6d7245'):ellipse(88,59,3,3,'#aa7944')+ellipse(92,54,3,3,'#d4984b');}}
 if(id==='hazel')head=[[32,43,-50],[44,30,-25],[60,21,-5],[77,31,20],[94,43,48],[62,48,5]].map(a=>leaf(...a,'#78a056')).join('')+line('M31 42 62 55l33-13m-33 13V29','#5d773e',2)+ellipse(88,57,3,3,'#b6783f')+ellipse(94,53,3,3,'#d09444');
 packs[id]={body,head,legs:()=>'',pivot:'62 81',plant:true};
}
packs.mushroom={body:path('M15 72q30-7 94 0v14H15Z','#997853')+line('M21 78h78','#c3a078',3),head:[[40,67,1],[72,56,.9],[85,72,.75]].map(([x,y,s])=>`<g transform="translate(${x} ${y}) scale(${s})">${path('M-24 6Q-22-21 0-21T25 6Q1 18-24 6','#b28c66')}${path('M-21 4Q-18-14 0-14T22 4Q2 13-21 4','#e4c59a')}${path('M-15 3Q-10-8 0-8T15 3Q1 8-15 3','#8b7562')}${path('M-8 2Q0-5 8 2Q0 8-8 2','#d8b185')}</g>`).join(''),legs:()=>'',pivot:'63 75',colony:true};
packs['litter-mold']={body:path('M13 75q6-33 53-16 36-21 49 15L65 88Z','#ac8b57')+line('M19 74 65 64l38 10','#dbb37c',2),head:[24,39,54,68,82,96].map((x,i)=>line(`M${x} 77l${i%2?5:-4}-23m0 10 6-5`,'#e7e5bc',2)+ellipse(x+(i%2?5:-4),54,4,3,'#aab8a2')).join(''),legs:()=>'',pivot:'63 75',colony:true};
packs['soil-bacteria']={body:ellipse(64,61,48,24,'#e4dcc0','stroke="#b2a681" stroke-dasharray="3 4"'),head:[[35,57,-20],[61,69,20],[81,49,-25],[94,66,35],[58,45,5]].map(([x,y,r])=>`<g transform="translate(${x} ${y}) rotate(${r})">${path('M-9-5H8a5 5 0 0 1 0 10H-9a5 5 0 0 1 0-10','#91aa83','stroke="#527b5d"')}${ellipse(0,0,2,1.5,'#d1d4a0','stroke="none"')}${line('M-11 2q-8 9-13 2','#849e75',1)}</g>`).join(''),legs:()=>'',pivot:'64 62',colony:true};
export const motionStates=id=>packs[id].plant?['idle','growth','leaf-turn']:packs[id].colony?['idle','active']:id==='earthworm'?['covered','surface','covered-eat','eat']:['idle','move','eat'];
for(const [id,p]of Object.entries(packs)){
 const states=motionStates(id),views=[],frames=[];
 const variants=['default',...(id==='grass'?['sprout']:id==='grasshopper'?['nymph']:id==='mushroom'?['mycelium']:[])];
 for(const [v,variant]of variants.entries())for(const [s,state]of states.entries())for(let f=0;f<2;f++){
  const y=(v*states.length*2+s*2+f)*96;views.push(`<view id="${variant==='default'?'':variant+'-'}${state}-${f}" viewBox="0 ${y} 128 96"/>`);
  const eating=state==='eat'||state==='covered-eat',active=state==='active',growing=state==='growth',moving=state==='move';
  const angle=p.plant?(state==='leaf-turn'?(f?5:-5):(f?2:-2)):eating?(f?19:10):active?(f?3:-3):moving?(f?4:-3):f?-1:1;
  const head=`<g transform="rotate(${angle} ${p.pivot})">${variant==='sprout'||variant==='mycelium'?'':p.head}</g>`;
  const body=variant==='sprout'?line('M61 86V56','#638b43',3)+leaf(60,67,-40)+leaf(63,61,40):variant==='mycelium'?p.body+line(f?'M23 75 40 65 64 76 85 63 105 76m-65-11-3-10m48 8 8-13':'M23 76 40 70 64 77 85 69 105 77m-65-7-3-7m48 6 8-8','#e8dfbc',2):variant==='nymph'?ellipse(58,59,25,9,'#91b65b')+path('M51 53l12-6 9 9Z','#abc878'):p.body;
  const shell=p.shell||'',wing=p.wing?.(moving?f:0)||'';
  const covered=id==='earthworm'&&['covered','covered-eat'].includes(state);
  const overlay=covered?path('M7 64q24-9 49 6t65-6v23H7Z','#9c815c')+line(`M18 73l14 ${f?2:-2}m22 3 19-2m11-3 17 2`,'#c4a778',3):'';
  const action=eating?line(`M109 64l${f?6:3} ${f?3:6}m-6-3 3 4`,'#60834e',3):active?line(f?'M18 81q42-13 91-1M40 81l-4-8m46 7 3-9':'M18 82q42-5 91-1M44 80l-2-4m35 6 2-4','#ddd7a1',2):'';
  frames.push(`<g transform="translate(0 ${y})"><ellipse cx="63" cy="87" rx="45" ry="4" fill="#647849" opacity=".12" stroke="none"/><g stroke="#574735" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"><g transform="${growing?'translate(0 -2) scale(1 .99)':moving&&f?'translate(0 -2)':id==='earthworm'&&f?'translate(0 8) scale(1 .88)':'translate(0 0)'}">${body}${p.legs(moving?f:f&&eating)}${shell}${wing}${head}${action}</g>${growing?leaf(f?22:101,f?55:42,f?-38:38,'#91b568'):''}${overlay}</g></g>`);
 }
 writeFileSync(new URL(id+'.svg',out),`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 96" width="128" height="96"><title>${id} — original forest study illustration</title>${views.join('')}${frames.join('')}</svg>\n`);
}
console.log('Built24 original SVG state sheets; 2 distinct articulated frames per state.');
