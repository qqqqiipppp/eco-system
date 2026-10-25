import {readdirSync} from 'node:fs';import {spawnSync} from 'node:child_process';
import {resultsDirectory} from './result-output.mjs';
process.env.TEST_RESULTS_DIR=resultsDirectory;
console.log('New test output directory: '+resultsDirectory);
const historical=readdirSync(new URL('./',import.meta.url)).filter(f=>f.endsWith('.test.mjs')&&!['visual-assets','student-ux','full-forest','field-guide','learning-goal','ux','pacing','habitat','replay','balance','spatial','feeding-audit','food-expansion','biodiversity','chapter'].some(p=>f.startsWith(p))).map(f=>'tests/'+f);
const current=['logic','activities','environment','feeding','events','management','point-economy','food-web','guidance','detritus','persistence','pacing','pacing.long','habitat','habitat.long','replay','replay.long','balance','balance.long','spatial','spatial.long','feeding-audit','feeding-audit.long'].map(f=>'tests/'+f+'.test.mjs');
const expanded=['logic','activities','environment','feeding','events','management','point-economy','guidance','persistence','feeding-audit','food-expansion','food-expansion.long','food-expansion.motion'].map(f=>'tests/'+f+'.test.mjs');
let failed=false;for(const [name,args]of [
 ['15.9 presentation policy',['--test','tests/ux.test.mjs']],
 ['Historical duration fixtures / original22 graph / pre15.8 survival',['--import','./tests/original-survival-register.mjs','--import','./tests/original-food-web-register.mjs','--import','./tests/original-pacing-register.mjs','--test',...historical]],
 ['Compressed fixtures / original22 graph / pre15.8 survival',['--import','./tests/original-survival-register.mjs','--import','./tests/original-food-web-register.mjs','--test',...current]],
 ['Expanded27 fixtures / pre15.8 numerical controls',['--import','./tests/original-survival-register.mjs','--test',...expanded]],
 ['Actual15.8 production policy',['--test',...['logic','activities','environment','feeding','events','management','point-economy','guidance','persistence','feeding-audit','biodiversity','biodiversity.long'].map(f=>'tests/'+f+'.test.mjs')]],
]){console.log(name+' / legacy goal cohort1 / original placement boundary');const result=spawnSync(process.execPath,['--import','./tests/original-placement-register.mjs','--import','./tests/legacy-goal-register.mjs',...args],{stdio:'inherit',cwd:new URL('../',import.meta.url)});if(result.status!==0)failed=true;}
console.log('Stage15.10 actual new goal policy2, current production ecology');
const learning=readdirSync(new URL('./',import.meta.url)).filter(f=>f.startsWith('learning-goal')&&f.endsWith('.test.mjs')).map(f=>'tests/'+f);
if(learning.length&&spawnSync(process.execPath,['--test',...learning],{stdio:'inherit',cwd:new URL('../',import.meta.url)}).status!==0)failed=true;
process.exitCode=failed?1:0;
console.log('Stage15.11 read-only guide and directed graph');
if(spawnSync(process.execPath,['--test','tests/field-guide.test.mjs'],{stdio:'inherit',cwd:new URL('../',import.meta.url)}).status!==0)process.exitCode=1;
console.log('Stage15.11.5 actual expanded placement and current production ecology');
if(spawnSync(process.execPath,['--test','tests/full-forest.test.mjs','tests/full-forest.long.test.mjs'],{stdio:'inherit',cwd:new URL('../',import.meta.url)}).status!==0)process.exitCode=1;

console.log('Stage15.11.6 student guidance, Korean and actual mission selectors');
if(spawnSync(process.execPath,['--test','tests/student-ux.test.mjs'],{stdio:'inherit',cwd:new URL('../',import.meta.url)}).status!==0)process.exitCode=1;

console.log('Stage15.12 original art and actual state bindings');
if(spawnSync(process.execPath,['--test','tests/visual-assets.test.mjs'],{stdio:'inherit',cwd:new URL('../',import.meta.url)}).status!==0)process.exitCode=1;

console.log('Chapter mode stages, current production ecology');
if(spawnSync(process.execPath,['--test','tests/chapter-stage.test.mjs'],{stdio:'inherit',cwd:new URL('../',import.meta.url)}).status!==0)process.exitCode=1;
