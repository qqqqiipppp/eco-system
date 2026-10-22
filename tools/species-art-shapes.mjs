// Original drawings from the reviewed references in docs/species-art-references.json.
// These are educational silhouettes, never a taxonomic identification key.
export const path=(d,fill,extra='')=>`<path d="${d}" fill="${fill}" ${extra}/>`;
export const ellipse=(x,y,rx,ry,fill,extra='')=>`<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${fill}" ${extra}/>`;
export const line=(d,color='#594c3c',width=1.6)=>path(d,'none',`stroke="${color}" stroke-width="${width}"`);
const group=(part,body,extra='')=>`<g data-part="${part}" ${extra}>${body}</g>`;
const eye=(x,y,r=1.8)=>ellipse(x,y,r,r,'#222c25','stroke="none"')+ellipse(x+.4,y-.5,.5,.5,'#fcf8dc','stroke="none"');
const limbs=(paths,color='#4a4738',width=2)=>group('legs',paths.map(d=>line(d,color,width)).join(''),`data-count="${paths.length}"`);
export const leaf=(x,y,angle=0,color='#6b9651',kind='lance')=>{
 const shapes={lance:'M0 0-5-5-4-9-8-12-6-16-9-19-7-23-8-27-5-30-4-34 0-39 4-34 5-30 8-27 7-23 9-19 6-16 8-12 4-9 5-5Z',hack:'M0 0Q-14-5-13-17L-12-21-9-21-8-26-5-26-2-31 0-33 3-27 7-25 6-21 10-20 8-17 11-14Q9-3 0 0Z',palm:'M0 0-11-7-7-13-20-21-13-23-16-32-6-28 0-43 6-29 16-33 13-23 21-21 8-13 12-7Z'};
 return `<g transform="translate(${x} ${y}) rotate(${angle})">${path(shapes[kind],color)}${line(kind==='palm'?'M0-3v-31m0 21-12-10m12 10 12-10':'M0-3v-29m0 9-7-5m7 12 7-5','#426d3f',.85)}</g>`;
};
export const accuratePacks={};
// Pilot species: a long head and narrow pronotum precede broad, long elytra.
// Dorsal oblique view makes all three thoracic leg pairs explicit.
accuratePacks.ladybird={
 body:group('elytra',path('M9 44Q14 31 42 30Q65 29 76 43L73 60Q54 75 23 69Q6 64 9 44Z','#947344')+path('M12 44Q18 33 43 33T73 44L70 59Q52 71 25 67Q10 62 12 44Z','#b88a4f')+line('M18 36Q39 50 70 62','#42533c',1.5)+[0,1,2].flatMap(r=>Array.from({length:8},(_,i)=>ellipse(21+i*6,39+r*8+Math.sin(i)*2,1.6,2.1,'#4d4a37','stroke="none"'))).join('')+line('M10 45Q5 62 25 69m24-38q18 2 25 13','#567758',2))+
 group('pronotum',path('M72 42Q84 37 95 44L98 57Q89 67 74 61Q78 51 72 42Z','#a26a50')+line('M75 43q12-6 20 3m-18 14q12 3 19-3','#c7a56a',1.2)),
 head:group('head',path('M95 45Q103 41 112 45L116 50 111 58Q102 60 96 56Z','#485349')+path('M110 46q10-8 11-2l-6 7m-5 5q10 6 12 0l-7-4','#463c32')+eye(106,46,1.2))+
 group('antennae',line('M106 44 105 32 95 21 88 20m23 25 8-11-3-11','#393f34',1.2)),
 legs:f=>limbs([`M79 44 69 24 ${f?'43 20':'47 12'}`,`M82 46 88 24 ${f?'106 11':'111 19'}`,`M81 51 65 58 ${f?'40 64':'43 72'}`,`M88 51 102 62 ${f?'119 71':'121 61'}`,`M78 58 66 77 ${f?'43 83':'48 88'}`,`M90 57 99 78 ${f?'119 82':'116 90'}`]),pivot:'99 52',
};

accuratePacks.aphid={body:group('elytra',path('M21 41Q29 24 55 28Q77 29 84 45L81 66Q60 83 34 73Q18 67 21 41Z','#738943')+path('M26 42Q33 30 53 32T79 46L76 64Q57 76 36 69Z','#8fa34b')+line('M27 38Q48 52 78 65','#506b3f')+[0,1,2,3].map(i=>line(`M${31+i*8} 35Q${40+i*8} 49 ${60+i*5} 68`,'#afba63',.75)).join(''))+group('pronotum',path('M81 40Q88 32 99 39L103 51 94 61 81 60Q86 49 81 40Z','#698347')),
 head:group('head',path('M99 39Q110 40 111 50L104 55 99 51Z','#4e703e')+eye(106,43,1.1))+group('antennae',line('M108 43l5-8m-5 10 10-5','#766346',1.3)+line('M112 35l-3-5m4 5v-6m1 6 3-5','#9a874e',1.4)),
 legs:f=>limbs([`M86 42 86 25 ${f?'73 19':'78 16'}`,`M94 45 105 30 ${f?'120 31':'118 21'}`,`M85 50 66 55 ${f?'57 71':'51 68'}`,`M93 51 108 60 ${f?'119 57':'119 69'}`,`M85 58 75 77 ${f?'59 84':'62 88'}`,`M94 57 101 77 ${f?'117 87':'121 79'}`],'#6a6545',2),pivot:'103 49'};

accuratePacks.grasshopper={body:group('abdomen',path('M13 63 66 41 87 48 33 69Z','#8ba75a')+path('M14 62 78 42 88 47 31 65Z','#b2bf7b')+line('M29 61 77 46m-33 8 27 1','#6e8b49',1))+group('thorax',path('M76 43 89 38 100 46 87 53Z','#8fa95e')),
 head:group('head',path('M89 41 104 15 109 18 107 41 100 49Z','#9cb56b')+ellipse(103,31,2.1,5,'#6c793c','transform="rotate(18 103 31)"')+eye(103,30,1.2))+group('antennae',path('M105 18 104 6 107 15m1 6 8-12-3 14','#a6b875','stroke-width=".9"')),
 legs:f=>limbs([`M79 48 50 39 ${f?'35 77 23 81':'37 70 22 74'}`,`M83 45 58 34 ${f?'47 73 38 79':'42 69 28 73'}`,`M89 48 84 65 ${f?'69 77':'74 80'}`,`M92 45 101 57 ${f?'117 62':'116 57'}`,`M96 48 102 68 ${f?'118 74':'120 70'}`,`M87 48 70 63 ${f?'54 69':'61 75'}`],'#5c7940',1.8),
 youngBody:path('M37 63 73 45 88 49 64 65Z','#9bb96b')+path('M75 46 85 42 94 50 82 55Z','#88a85a'),pivot:'100 44'};

accuratePacks.frog={body:group('torso',path('M22 65Q27 43 57 43L85 52Q98 69 74 78L39 78Z','#889269')+path('M43 71Q66 58 85 64L85 76H40Z','#d7d5ab')+line('M32 49Q57 43 80 54','#c8cc8b',2.7)+line('M35 55 72 61','#bdc58b',1.4)+[[34,58],[46,51],[55,58],[65,52],[42,65],[70,67]].map(([x,y])=>ellipse(x,y,3.2,2.1,'#464d3a','stroke="none"')).join('')),
 head:group('head',path('M73 50Q78 35 93 37L115 57 96 63 76 59Z','#9caa79')+ellipse(93,42,6,6,'#a9b888')+ellipse(95,42,3.4,3.8,'#c8aa5c')+eye(95,42,2)+ellipse(82,53,3.6,4.2,'#736f4a')+line('M91 57 112 57','#595743',1)+line('M79 44 103 50','#d5d79e',1.6)),
 legs:f=>group('legs',path(`M51 64Q25 48 17 66L${f?'34 82 12 83':'31 77 9 81'} 47 81 62 72Z`,'#7e8d5c')+line('M24 66 40 75','#434d37',2)+path(`M82 64 88 ${f?82:78} 110 83 93 85 80 72Z`,'#a8b18b')+line('M88 79l7 4m-3-3 8 3m-4-3 10 3','#626b48',1.2),'data-count="4"'),pivot:'83 55'};

accuratePacks.rabbit={body:group('torso',path('M21 66Q20 39 47 36Q69 37 84 57L81 77 47 79Z','#9a9280')+ellipse(40,65,20,17,'#a19a87')+path('M48 69Q65 59 80 65l-1 12-34 2Z','#d9d5bb')+path('M21 65 12 59 8 65 16 74 24 73Z','#e9e6d2')+[0,1,2].map(i=>line(`M${30+i*13} 45l5 3m-2 5 7 3`,'#6f7161',1.1)).join('')),
 head:group('head',path('M75 57Q71 45 86 39L104 47 113 57 105 63 83 65Z','#999383')+path('M78 43Q65 13 71 7Q79 6 87 40M88 40Q85 5 93 6Q99 11 96 44Z','#a69d89')+path('M71 7q5-3 8 7l-4 4Zm21-1q6-1 6 9l-5 1Z','#4b4e43')+line('M74 19 81 36m11-17 1 18','#c3ac9c',2)+eye(98,48,2)+path('M110 55l5 2-4 3Z','#5c5046')+line('M105 59l10 3m-12-1 11 5','#d5d0b8',.8)),
 legs:f=>group('legs',path(`M43 67Q21 70 29 81L${f?'60 86 68 82':'58 84 66 79'} 45 76Z`,'#8c8877')+path(`M75 65 78 83h${f?19:14}l-3-4-11-1-2-13Z`,'#b3ae99')+line('M49 81h10m22-1 9 1','#d9d5bc',2),'data-count="4"'),pivot:'84 55'};

accuratePacks.chipmunk={body:group('tail',path('M31 67Q8 60 11 35Q15 20 22 29Q21 43 43 52Z','#9a7a4e')+line('M18 35q-2 19 15 25','#c0ad7e',3))+
 group('torso',path('M25 65Q27 44 52 42Q76 41 86 57L80 77 41 78Z','#b29461')+path('M40 68q21-11 39-6l-1 13H42Z','#e0d3ae')+line('M33 48Q55 42 80 54m-45 2q22-5 44 6','#383a2c',2.7)+line('M34 52Q57 47 80 58','#e9dfb9',2.3)),
 head:group('head',path('M75 55Q77 38 94 39l14 11 4 7-14 8-18-4Z','#a48a58')+ellipse(82,39,5.5,7,'#8a7551')+ellipse(83,39,3,4,'#c9b486')+path('M82 45 100 43 109 49 94 48Z','#e4d8b4')+line('M83 49 103 49','#343b2e',2.3)+path('M84 55 104 53 111 57 98 61Z','#e9ddba')+eye(99,48,1.7)+ellipse(111,54,2,1.4,'#3c3c31')),
 legs:f=>group('legs',path(`M42 68 36 81h${f?21:16}l-1-4-10-2 9-6m27-6 1 17h${f?17:12}l-2-4-8-1 1-13`,'#9a8051'),'data-count="4"'),pivot:'86 56'};

accuratePacks['field-mouse']={body:group('spines',path('M16 70 13 60 18 59 17 48 23 49 25 36 32 41 38 29 43 35 51 27 55 34 64 28 67 37 78 33 79 44 87 44 89 67 76 78 31 78Z','#85785d')+Array.from({length:29},(_,i)=>{const x=22+(i%10)*6,y=43+Math.floor(i/10)*10;return line(`M${x} ${y+10}l${i%2?3:-3}-12`,i%2?'#d6c9a8':'#c1b394',1.6);}).join('')),
 head:group('head',path('M79 51Q89 48 96 58L116 70 109 76 91 73 78 67Z','#a49a82')+ellipse(85,52,5,6,'#b7aa8c')+ellipse(86,52,3,4,'#8c8069')+eye(99,64,1.8)+ellipse(114,71,3,2.5,'#3e3e34')+line('M106 74h8','#d4c6aa',1)),
 legs:f=>group('legs',path(`M32 74l${f?-3:1} 10h9v-9m32-1 1 9h10v-9`,'#7c725e'),'data-count="4"'),pivot:'89 65'};

accuratePacks.weasel={body:group('tail',path('M34 62Q17 59 9 46Q6 39 9 36Q15 34 18 43L43 55Z','#a77c40'))+group('torso',path('M25 63Q27 51 48 51L86 49Q99 48 104 63L86 73 42 75 27 71Z','#bd914b')+path('M39 69 88 60l6 9-49 6Z','#d7bb7f')),
 head:group('head',path('M87 51Q88 38 99 37L109 43 120 50 116 57 106 60 93 60Z','#b08a4a')+ellipse(92,40,4.5,5.5,'#9e783d')+ellipse(93,40,2.5,3,'#d3b17a')+path('M103 42 110 44l5 8-8 1Z','#5e4b35')+path('M107 54l12-3-4 8-9 2Z','#e8d8aa')+eye(108,46,1.5)+ellipse(119,50,2,1.8,'#47392f')),
 legs:f=>group('legs',path(`M40 68 36 ${f?83:80}h13l-3-6 5-7m31-6-4 ${f?20:17}h13l-4-5 4-14`,'#9d773e')+path('M53 70v10h8v-10m32-7 2 15h8l-3-16','#b18c4a'),'data-count="4"'),pivot:'99 53'};

accuratePacks.caterpillar={body:group('segments',Array.from({length:11},(_,i)=>ellipse(17+i*7.5,66-Math.sin(i/3)*4,5.5,9,i%2?'#735b42':'#a17a49')).join('')+Array.from({length:10},(_,i)=>path(`M${14+i*7.5} 57l4-2 3 6-4 2Z`,'#bf8c49')).join('')+Array.from({length:31},(_,i)=>{const x=13+i*2.8;return line(`M${x} 62l-3-10m4 17 2 9`,'#4c4136',.9);}).join('')+line('M80 53l-2-9m4 10v-10m5 10 2-9m4 10 3-9','#e7dfbc',1.6)),
 head:group('head',ellipse(106,65,7.5,8,'#9b633f')+path('M101 59 105 64l-1 7m5-12-2 6 4 6','none','stroke="#5b4537"')+eye(110,63,1)),
 legs:f=>group('legs',group('thoracic-legs',[88,94,100].flatMap(x=>[line(`M${x} 70l2 ${f?6:4}`,'#554432',1.2),line(`M${x-2} 70l-1 4`,'#7c6747',1)]).join(''),'data-count="6"')+group('prolegs',[18,40,48,56,64].flatMap(x=>[path(`M${x} 71v${f?8:6}h4l1-5Z`,'#9a8058'),line(`M${x-2} 72v5`,'#796348',2)]).join(''),'data-count="10"')),
 pivot:'102 65'};

accuratePacks.snail={body:group('foot',path('M12 78Q29 67 63 70L98 55Q107 53 111 68L116 77Q73 88 12 82Z','#b9ad83')+line('M20 78Q60 79 106 75','#d8ccaa',2)),
 shell:group('shell',path('M26 66Q19 51 35 44Q30 35 43 32Q43 25 52 26Q63 24 69 39Q87 41 85 62Q75 80 48 76Z','#bb9d70')+path('M34 43Q49 34 68 40M27 53Q48 42 79 50M29 64Q48 53 82 60','none','stroke="#8e795b"')+ellipse(76,61,10,13,'#736951','transform="rotate(15 76 61)"')+ellipse(75,60,6,10,'#c4b493','stroke="none"')+line('M45 30l5 5m-9 10 4 5m-9 7 3 6m11-20 3 6m5-8 3 5m-9 13 2 9','#d9c39a',.85)),
 head:group('head',path('M91 61q8-11 16-3l4 14-13 4Z','#b5ac88')+group('tentacles',line('M101 60 102 38m5 23 10-19m-10 27 8-4m-13 5 7 1','#958e6b',2)+eye(102,38,1.5)+eye(117,42,1.5),'data-count="4"')),
 legs:f=>line(f?'M20 81q38 3 84-2':'M16 82q47-2 92-2','#a3956c',2),pivot:'103 66'};

accuratePacks.spider={body:group('abdomen',path('M48 14Q68 18 68 44L61 59 42 57Q31 45 34 30Z','#cfc571')+path('M36 27q17 9 29 0v6q-14 7-30 0m0 11q17 8 31-1v6q-17 7-29 0Z','#637c6d')+line('M39 20 52 19m-14 18 27 1m-22 14 16 1','#f0db69',2))+group('cephalothorax',ellipse(59,63,9,10,'#7c857c')+path('M56 59h6v11h-6Z','#303a31')),
 head:group('mouthparts',ellipse(63,74,4,4,'#3f4034')+eye(61,69,1)+eye(65,69,1)),
 legs:f=>limbs([`M55 58 31 31 ${f?'11 9':'9 13'}`,`M58 58 44 21 ${f?'39 5':'32 6'}`,`M64 59 83 28 ${f?'99 7':'105 10'}`,`M66 61 99 47 ${f?'120 21':'118 25'}`,`M53 64 23 54 ${f?'6 68':'7 73'}`,`M55 68 32 76 ${f?'19 90':'14 89'}`,`M65 68 88 77 ${f?'111 89':'116 86'}`,`M67 64 106 62 ${f?'121 75':'119 81'}`],'#3e4438',1.4)+group('leg-bands',line('M29 28l4 6m10-15 2 6m40 1-3 5m19 14-6 3m-74 7 7 2m6 18 6-3m48 1 7 3m17-14-8 1','#d8b85a',2.3)),pivot:'60 67'};

accuratePacks.snake={body:group('trunk',path('M11 76C-3 45 64 39 64 60c0 15-35 6-29 17 7 12 48 4 56-24','none','stroke="#586453" stroke-width="12"')+path('M12 79C3 51 58 46 59 59c0 9-32 7-31 17 2 11 26 14 45 3','none','stroke="#c3c09a" stroke-width="2"')+[0,1,2,3,4,5,6,7].map((_,i)=>{const x=18+i*5.5,y=57-Math.sin(i/3)*6;return line(`M${x} ${y}l2 6`,'#29372f',3);}).join('')+line('M80 68 85 59 88 50','#d99643',9)+line('M82 65l6 2m-2-10 5 1m-3-10 6 2','#28392f',3)),
 head:group('head',path('M86 50Q89 39 102 40L116 48 114 55 100 59 89 56Z','#82906c')+path('M98 53 115 52 110 58 99 59Z','#dbd4b1')+eye(107,46,2)+line('M104 49l2 6m-8-5 3 6','#303d34',2)+ellipse(114,47,.7,.7,'#384436','stroke="none"')),
 legs:()=>'',pivot:'95 52'};

accuratePacks.earthworm={body:group('segmented-body',path('M9 72Q22 52 42 63Q65 80 92 61L113 56Q119 59 113 64L93 69Q63 87 41 72Q25 60 11 77Z','#a17b6b')+path('M12 72Q24 55 42 66T91 64L113 59','none','stroke="#c3a08c" stroke-width="2"')+Array.from({length:38},(_,i)=>{const x=14+i*2.6,y=x<41?64-Math.sin((x-14)/27*Math.PI)*5:x<83?67+Math.sin((x-41)/42*Math.PI)*6:68-(x-83)*.29;return line(`M${x} ${y}l-1 7`,'#796157',.7);}).join('')+group('clitellum',path('M94 60l7-3 2 9-8 3Z','#cebba5')+line('M97 59l2 8','#aa9581',1))),head:'',legs:()=>'',pivot:'105 63'};

accuratePacks.tit={body:group('tail',path('M46 57 10 67 8 74 49 69Z','#69747a')+line('M13 68 43 63','#d7ddcc',1.1))+group('torso',path('M37 54Q52 41 76 47L94 60Q80 80 53 76L40 68Z','#87966b')+path('M51 60Q73 52 89 59L77 76Q60 82 49 70Z','#e7e7d0')+path('M76 55 82 55 72 77h-5Z','#303c37')),
 head:group('head',path('M75 50Q71 28 88 26Q106 26 107 43L116 45 106 51 94 59Z','#303e38')+path('M84 40q8-5 17 1l-1 9-9 3-7-5Z','#f3f0dc')+eye(99,35,1.5)+path('M106 40l12 4-11 3Z','#4c5445')),
 wing:f=>group('wing',path(f?'M41 54Q42 18 62 16L79 51 70 66Z':'M41 54Q53 52 77 58L68 72 43 64Z','#6a7880')+line(f?'M50 28 64 54m-5-28 10 28':'M45 57 69 63m-24-1 22 5','#e8e6cb',2)),
 legs:f=>limbs([`M61 75 59 84 ${f?'47 85':'50 85'}`,`M76 74 80 83 ${f?'92 84':'91 80'}`],'#696957',1.7),pivot:'90 49'};

accuratePacks.bulbul={body:group('tail',path('M48 58 8 72 7 81 53 73Z','#677070')+line('M13 73 44 65m-31 12 34-9','#959b8c',1))+group('torso',path('M37 54Q52 38 77 43L95 52 91 68Q76 83 52 75Z','#89928a')+path('M57 61 88 54 87 69 67 78Z','#c6c9b8')+Array.from({length:7},(_,i)=>line(`M${62+i*3} ${62+(i%3)*4}l-2 6`,'#8e978b',1.2)).join('')),
 head:group('head',path('M74 47 76 36 72 28 82 31 83 22 90 29 95 25 101 33 107 42 120 45 106 51 99 58 86 58Z','#828f8b')+ellipse(91,48,7,7,'#9d7858')+line('M80 34l9 6m-3-12 7 9','#b4bbae',1)+eye(101,39,1.7)+path('M106 42l16 3-15 4Z','#515b51')),
 wing:f=>group('wing',path(f?'M40 54Q34 27 50 12L84 49 75 66Z':'M42 52Q58 47 84 55L68 70 45 66Z','#727f79')+line(f?'M45 29 64 52m-10-31 18 30':'M49 56 75 57m-26 3 23 2m-22 3 15 2','#a6ada1',1.2)),
 legs:f=>limbs([`M63 74 57 84 ${f?'42 85':'48 87'}`,`M81 71 86 83 ${f?'101 83':'97 87'}`],'#5d6654',1.9),pivot:'92 48'};

accuratePacks.goshawk={body:group('tail',path('M44 57 8 69 10 83 55 72Z','#899089')+line('M16 67l3 14m7-17 3 15m8-18 3 15','#444e4b',3)+line('M10 81l15-4','#d2d2b9',2))+group('torso',path('M37 45Q49 34 77 38L95 54 83 76Q66 83 46 73Z','#73817f')+path('M68 46Q83 41 91 55L82 75 61 77 55 64Z','#dedec8')+Array.from({length:7},(_,i)=>line(`M${64-i*.5} ${51+i*3.4}q10 3 21 0`,'#707b70',1.1)).join('')),
 head:group('head',path('M74 41Q73 23 88 22L102 29 106 39 100 50 86 53Z','#758480')+path('M79 31 99 28l4 4-22 4Z','#f0ead4')+ellipse(98,35,2.6,2.8,'#cc9552')+eye(98,35,1.1)+path('M103 35l13 2-1 10-4-5-8-1Z','#444d45')+path('M103 36l5 1-2 5-4-1Z','#cebb6a')),
 wing:f=>group('wing',path(f?'M37 46Q28 20 46 8Q64 3 84 16L84 54 62 69Z':'M38 46Q56 40 82 50L69 69 43 68Z','#657774')+line(f?'M41 17 60 52m-11-39 17 38m-9-38 15 36m-8-36 13 34':'M45 51 72 55m-28 3 25 3m-22 4 18 1','#a5b1a3',1.2)),
 legs:f=>limbs([`M62 75 62 84 ${f?'48 86':'49 83'}`,`M80 72 85 83 ${f?'102 86':'101 81'}`],'#c4a85c',2.5)+line('M49 83v4m7-3v4m38-6 1 4','#464937',1),pivot:'89 43'};

const acorn=(x,y)=>`<g transform="translate(${x} ${y})">${ellipse(0,4,5,7,'#bd9155')}${path('M-7 1q0-9 14 0l-1 4H-6Z','#8a8054')}${line('M-6 1-9-2m5 1-2-5m5 5v-6m3 5 3-4m0 6 4-2','#b4a168',1.1)}</g>`;
accuratePacks.oak={plant:true,body:group('trunk',path('M51 87 55 46 68 39 75 86 64 84Z','#86765b')+line('M60 76 45 52 30 43m34 23 22-21m-24 9 1-26','#77684e',4)+line('M58 57 59 80m8-30 2 13m-7 3 2 15','#b4a386',1.3)),
 head:group('crown',path('M13 39Q6 22 31 20Q33 6 53 13Q74 3 88 18Q111 16 116 33Q122 53 94 59L39 60Q14 59 13 39Z','#628b4d')+[[25,48,-55],[44,43,-24],[63,46,4],[82,48,34],[101,45,54]].map(a=>`<g transform="translate(${a[0]} ${a[1]}) scale(.72)">${leaf(0,0,a[2],a[0]%2?'#84a45c':'#90af64','lance')}</g>`).join('')+acorn(38,59)+acorn(83,59)),legs:()=>'',pivot:'63 81'};

function needles(x,y,scale=1){return `<g transform="translate(${x} ${y}) scale(${scale})" data-part="paired-needles">${[-54,-27,0,27,54].map(a=>`<g transform="rotate(${a})">${line('M0 0-3-18M0 0 2-20','#4f8045',1.15)}${line('M0 0v-3','#93794c',1.4)}</g>`).join('')}</g>`;}
accuratePacks.pine={plant:true,body:group('trunk',path('M48 87Q63 65 58 43L66 28 73 35Q69 58 75 75l10 12-18-3Z','#b07c53')+line('M63 65 28 50m37 0 29-17m-30 5-24-16','#9d6b45',4)+line('M61 69l5 9m-3-28 5 7m-5-18 4-5','#d6a579',1.8)),
 head:group('open-crown',ellipse(25,45,16,5.5,'#65874d','stroke="#65874d"')+ellipse(45,44,17,5.5,'#65874d','stroke="#65874d"')+ellipse(64,23,18,6,'#65874d','stroke="#65874d"')+ellipse(86,38,18,6,'#65874d','stroke="#65874d"')+ellipse(106,38,12,5,'#65874d','stroke="#65874d"')+needles(23,45,.75)+needles(43,45,.8)+needles(64,23,.85)+needles(85,38,.8)+needles(106,38,.65)+ellipse(85,56,4,6,'#a88958','transform="rotate(25 85 56)"')+line('M82 52l7 3m-8 0 8 3m-8 0 6 2','#6f6644',.9)),legs:()=>'',pivot:'65 82'};

accuratePacks.hazel={plant:true,body:group('trunk',path('M54 87 58 52 51 36 60 36 66 55 72 85Z','#9c9880')+line('M61 65 40 47 22 41m40 17 25-17 17 1m-45 5 6-29','#827e69',3)+line('M60 67v12m4-24 2 9','#c6c1a1',1.3)),
 head:group('spreading-crown',path('M9 42Q12 20 39 27Q55 8 79 20Q105 15 119 34L111 53Q89 68 65 58 37 69 16 54Z','#7e9c5a')+[[26,50,-53],[48,43,-24],[70,42,9],[96,50,42]].map(a=>`<g transform="translate(${a[0]} ${a[1]}) scale(.86)">${leaf(0,0,a[2],'#a0b771','hack')}${line('M0-2-9-16m9 14 8-15','#567e44',.7)}</g>`).join('')+line('M40 48 34 66m54-15 7 16','#82794c',1)+ellipse(34,68,3.7,3.7,'#ba8a4e')+ellipse(96,69,3.7,3.7,'#c79653')),legs:()=>'',pivot:'62 82'};

const berry=(x,y)=>`<g transform="translate(${x} ${y})" data-part="aggregate-fruit">${[[0,-4],[-4,-1],[4,-1],[-3,4],[3,4],[0,1]].map(([a,b])=>ellipse(a,b,3,3,'#b75f4f','stroke="#874c3c" stroke-width=".75"')).join('')}${path('M-5-6 0-3 5-6 2-1-2-1Z','#6c8548')}</g>`;
accuratePacks.raspberry={plant:true,body:group('canes',line('M58 87 57 57 32 33m26 37 31-31m-30 9 8-31','#8c7450',3)+line('M40 42l-5 2m22 17 4-4m17-5 5 1m-20-16-3-3','#7f6747',1.3)),
 head:group('palmate-simple-leaves',[[30,52,-40],[61,43,10],[92,59,45]].map(a=>`<g transform="translate(${a[0]} ${a[1]}) scale(.74)">${leaf(0,0,a[2],'#79a05a','palm')}</g>`).join('')+berry(40,66)+berry(79,69)+berry(91,37)),legs:()=>'',pivot:'60 80'};

function foxtail(x,y,angle){return `<g transform="translate(${x} ${y}) rotate(${angle})" data-part="bristled-panicle">${ellipse(0,0,4.2,17,'#a4af5e')}${Array.from({length:11},(_,i)=>{const h=-13+i*2.6;return line(`M-3 ${h}l-5-4m10 4 5-5`,'#8a9d50',.85)+ellipse(i%2?-1:1,h,1.6,2,'#c1bf72','stroke="none"');}).join('')}</g>`;}
accuratePacks.grass={plant:true,body:group('jointed-culms',line('M58 87 42 45 34 26M60 87 66 39 66 15M61 87 86 45 94 27','#698347',1.9)+line('M50 66h5m8-18h5m12 10 5 2','#456b3e',1.6)+path('M56 78Q27 68 19 49Q40 54 56 78M62 72Q78 48 111 44Q92 62 62 72M60 84Q34 84 23 71Q46 71 60 84Z','#7a9b50')+line('M27 55 54 76m16-9 31-18','#b4bc78',.8)),
 head:group('seedheads',foxtail(33,27,-28)+foxtail(66,22,3)+foxtail(94,31,28)),legs:()=>'',pivot:'61 82'};

function fan(x,y,scale){const silhouette='M-23 4Q-29-1-23-8Q-24-16-15-17Q-12-24-4-20Q4-26 10-19Q20-22 23-12Q32-6 25 2L7 11Z';return `<g transform="translate(${x} ${y}) scale(${scale})" data-part="bracket-cap">${path(silhouette,'#dfd3b3')}${path('M-21 1Q-25-9-14-13Q-9-20-1-16Q7-22 14-13Q25-12 23-2L8 8Z','#7c8075')}${path('M-17-1Q-17-11-6-11Q0-18 9-10Q18-11 19-2L8 5Z','#b4a18a')}${path('M-13-1Q-12-9-4-8Q3-14 12-6L14-1 7 3Z','#6a665b')}${path('M-8 0Q-4-8 4-5L9 0 5 3Z','#b6b6a0')}${line('M-22 4q16 10 46-2','#eee6ce',2)}${[[-16,3],[-10,5],[-3,7],[5,8],[13,6],[20,3]].map(([a,b])=>ellipse(a,b,.6,.6,'#9a9278','stroke="none"')).join('')}</g>`;}
accuratePacks.mushroom={colony:true,body:group('deadwood',path('M12 71Q39 64 113 68L115 84 17 88Z','#8f7755')+line('M20 79 105 75m-77 7 26-3m20 0 24 2','#c5ac7d',1.6)),head:group('shelving-fruitbodies',fan(38,65,.84)+fan(77,54,1)+fan(87,76,.7)),legs:()=>'',pivot:'64 72'};

accuratePacks['litter-mold']={colony:true,body:group('litter',path('M10 74 21 52 53 50 62 72 43 87 16 84Z','#a58a5c')+path('M63 77 75 48 105 54 117 77 95 88Z','#ae9162')+line('M17 78 47 57m-19 13-5-9m12 4 1 13m42 1 20-19m-12 11-3-10m8 6 12 5','#d5bd8e',1.1)),
 head:group('branching-hyphae',line('M17 77 35 68 50 73 71 60 88 67 110 62m-76 7-2-15m16 19 1-14m23 1 5-12m10 20 3-15m-40 20-4 10m27-24-8-8m-29 17-13-9m83 5 1 14','#ece5ca',1.2)+line('M19 71 33 62 54 65 72 74 97 67m-62-5 9-11m13 15 1 10m10-4-6 8m31-13 7 12','#c9d0b4',.8)),legs:()=>'',pivot:'63 73'};

const rod=(x,y,a=0,spore=false)=>`<g transform="translate(${x} ${y}) rotate(${a})" data-part="bacillus-cell">${path('M-9-3H9a3 3 0 0 1 0 6H-9a3 3 0 0 1 0-6','#a5b199','stroke="#627c64" stroke-width="1"')}${spore?ellipse(3,0,2.5,1.7,'#e4dfba','stroke="none"'):line('M-6-1h10','#cdd0b4',.65)}</g>`;
accuratePacks['soil-bacteria']={colony:true,body:group('microscope-field',ellipse(64,61,49,24,'#e6dfc5','stroke="#b5ad8a" stroke-dasharray="2 4"')),head:group('rods-and-short-chains',rod(38,50,-18)+rod(61,43,-18)+rod(76,66,25,true)+rod(97,76,25)+rod(37,72,-24,true)+rod(88,46,10)),legs:()=>'',pivot:'64 62'};

// Keep the long sawtooth leaves inside the same view during the5° leaf pose.
accuratePacks.oak.head=`<g transform="translate(9 6) scale(.88)">${accuratePacks.oak.head}</g>`;
accuratePacks.raspberry.head=`<g transform="translate(9 6) scale(.88)">${accuratePacks.raspberry.head}</g>`;
accuratePacks.hazel.head=`<g transform="translate(10 6) scale(.86)">${accuratePacks.hazel.head}</g>`;
accuratePacks.grass.head=`<g transform="translate(0 3)">${accuratePacks.grass.head}</g>`;
accuratePacks.rabbit.head=`<g transform="translate(0 2) scale(.96)">${accuratePacks.rabbit.head}</g>`;
accuratePacks.ladybird.head=`<g transform="translate(-5 0)">${accuratePacks.ladybird.head}</g>`;
accuratePacks.bulbul.head=`<g transform="translate(-3 0)">${accuratePacks.bulbul.head}</g>`;

// Leave room for the outline stroke as the head turns toward food.
accuratePacks.grasshopper.head=`<g transform="translate(-2 0)">${accuratePacks.grasshopper.head}</g>`;
accuratePacks.snail.head=`<g transform="translate(-2 0)">${accuratePacks.snail.head}</g>`;
