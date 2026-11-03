// A GPT delivery goes in with one command: frames and growth-stage pictures
// are converted, registered for the game, and drifting art is flagged.
import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdtempSync,cpSync,readFileSync,existsSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';

const raster=new URL('../assets/images/species-raster/',import.meta.url).pathname;
const run=(...args)=>execFileSync('python3',args,{encoding:'utf8',stdio:['ignore','pipe','pipe']});
function delivery(){
 const dir=mkdtempSync(join(tmpdir(),'motion-')),art=join(dir,'art'),out=join(dir,'raster'),registry=join(dir,'species-frames.js');
 cpSync(raster,out,{recursive:true});run('tests/fixtures/make_motion_art.py',raster,art);
 // Start from the base pictures and the grasshopper's hop only, whatever art the repository has by now.
 const m=JSON.parse(readFileSync(join(out,'manifest.json'),'utf8'));delete m.stages;
 for(const [id,s] of Object.entries(m.species))if(id!=='grasshopper')delete s.frames;else for(const k of Object.keys(s.frames))if(!k.startsWith('move-'))delete s.frames[k];
 writeFileSync(join(out,'manifest.json'),JSON.stringify(m));
 return {dir,art,out,registry,import:()=>run('tools/build_species_raster.py','--import',art,out,registry)};
}
const registered=async file=>import(file+'?'+Math.random());

test('frames and growth stages are converted and registered', async () => {
 const d=delivery(),report=d.import();
 const {paintedFrames,paintedStages}=await registered(d.registry);
 assert.deepEqual(paintedFrames.frog,{move:4});assert.deepEqual(paintedFrames.bulbul,{move:4,eat:3});assert.deepEqual(paintedFrames.weasel,{move:4});
 assert.deepEqual(paintedFrames['grasshopper:nymph'],{eat:2});assert.deepEqual(paintedFrames.snake,{sense:2});assert.deepEqual(paintedStages,['grasshopper:nymph']);
 assert.deepEqual(paintedFrames.grasshopper,{move:4},'frames already in keep their place');
 for(const f of ['frog-move-3.webp','bulbul-eat-1.webp','grasshopper-nymph.webp','grasshopper-nymph-eat-0.webp'])assert.ok(existsSync(join(d.out,f)),f);
 const manifest=JSON.parse(readFileSync(join(d.out,'manifest.json'),'utf8'));
 assert.equal(manifest.stages['grasshopper:nymph'].frames['eat-1'].file,'grasshopper-nymph-eat-1.webp');
 assert.match(manifest.species.frog.frames['move-2'].sourceSha256,/^[0-9a-f]{64}$/);
 assert.match(report,/넣은 그림 23장/);
});

test('drifting or misnamed art is flagged, not silently used', () => {
 const report=delivery().import();
 assert.match(report,/확인 필요 rabbit-eat-0\.png: 색이 기본 그림과 달라 보여요/);
 assert.match(report,/확인 필요 rabbit-eat-1\.png: .*몸 크기가 기본 그림의 \d+%예요/);
 assert.match(report,/확인 필요 chipmunk-eat-0\.png: 발 높이가 기본 그림과 \+\d+px 달라요/);
 assert.doesNotMatch(report,/확인 필요 (frog|bulbul|weasel)-move/,'a hop or a flight may leave the ground');
 assert.match(report,/건너뜀 snake-move-0\.png: 캔버스가/);assert.match(report,/건너뜀 frog-move-0-draft\.png: 이름 규칙/);
});

test('an asset-manifest.json picks the final files out of drafts', async () => {
 const d=delivery();writeFileSync(join(d.art,'asset-manifest.json'),JSON.stringify({final:[{file:'frog/frog-move-0.png'},{file:'frog/frog-move-1.png'}]}));
 assert.match(d.import(),/넣은 그림 2장/);
 const {paintedFrames}=await registered(d.registry);
 assert.deepEqual(paintedFrames.frog,{move:2});assert.equal(paintedFrames.bulbul,undefined);
});

test('the game registry matches the manifest in the repository', () => {
 const d=mkdtempSync(join(tmpdir(),'reg-')),file=join(d,'species-frames.js');
 run('-c',`import sys,json;sys.path.insert(0,'tools');import build_species_raster as b;from pathlib import Path;b.write_registry(json.load(open('${raster}manifest.json')),Path('${file}'))`);
 assert.equal(readFileSync(file,'utf8'),readFileSync(new URL('../js/ui/species-frames.js',import.meta.url),'utf8'),'run the import tool instead of editing species-frames.js');
});
