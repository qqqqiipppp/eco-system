import {readdirSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
const historical=readdirSync(new URL('./',import.meta.url)).filter(f=>f.endsWith('.test.mjs')&&!f.startsWith('pacing')&&!f.startsWith('habitat')&&!f.startsWith('replay')).map(f=>'tests/'+f);
const current=['logic','activities','environment','feeding','events','management','point-economy','food-web','guidance','detritus','persistence','pacing','pacing.long','habitat','habitat.long','replay','replay.long'].map(f=>'tests/'+f+'.test.mjs');
let failed=false;
for(const [name,args]of [['Historical duration fixtures',['--import','./tests/original-pacing-register.mjs','--test',...historical]],['Current compressed policy',['--test',...current]]]){
 console.log(name);const result=spawnSync(process.execPath,args,{stdio:'inherit',cwd:new URL('../',import.meta.url)});if(result.status!==0)failed=true;
}
process.exitCode=failed?1:0;
