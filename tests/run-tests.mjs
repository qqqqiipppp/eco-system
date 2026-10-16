import {readdirSync} from 'node:fs';import {spawnSync} from 'node:child_process';
const historical=readdirSync(new URL('./',import.meta.url)).filter(f=>f.endsWith('.test.mjs')&&!['pacing','habitat','replay','balance','spatial','feeding-audit','food-expansion'].some(p=>f.startsWith(p))).map(f=>'tests/'+f);
const current=['logic','activities','environment','feeding','events','management','point-economy','food-web','guidance','detritus','persistence','pacing','pacing.long','habitat','habitat.long','replay','replay.long','balance','balance.long','spatial','spatial.long','feeding-audit','feeding-audit.long'].map(f=>'tests/'+f+'.test.mjs');
const expanded=['logic','activities','environment','feeding','events','management','point-economy','guidance','persistence','feeding-audit','food-expansion','food-expansion.long','food-expansion.motion'].map(f=>'tests/'+f+'.test.mjs');
let failed=false;for(const [name,args]of [
 ['Historical duration fixtures / original22 graph',['--import','./tests/original-food-web-register.mjs','--import','./tests/original-pacing-register.mjs','--test',...historical]],
 ['Current compressed fixtures / original22 graph',['--import','./tests/original-food-web-register.mjs','--test',...current]],
 ['Expanded graph / actual production policy',['--test',...expanded]],
]){console.log(name);const result=spawnSync(process.execPath,args,{stdio:'inherit',cwd:new URL('../',import.meta.url)});if(result.status!==0)failed=true;}
process.exitCode=failed?1:0;
