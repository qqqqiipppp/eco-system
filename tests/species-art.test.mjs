import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import cp from 'node:child_process';import {createHash} from 'node:crypto';
import {organisms} from '../data/organisms.js';
const hash=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex'),root=new URL('../',import.meta.url);
test('24 source-generated sheets reproduce exactly and retain every previous156 view name/crop',()=>{
 const paths=organisms.map(o=>'assets/images/species/'+o.id+'.svg'),before=Object.fromEntries(paths.map(p=>[p,hash(new URL(p,root))]));
 const build=cp.spawnSync(process.execPath,['tools/build-species-art.mjs','--check'],{cwd:root,encoding:'utf8'});assert.equal(build.status,0,build.stderr);
 let count=0;for(const p of paths){assert.equal(hash(new URL(p,root)),before[p],p+' reproducible');const original=cp.execFileSync('git',['show','3b28ecb04c75345628954e08310471faaaee40bb:'+p],{cwd:root,encoding:'utf8'});const current=fs.readFileSync(new URL(p,root),'utf8');const views=s=>[...s.matchAll(/<view id="([^"]+)" viewBox="([^"]+)"/g)].map(m=>m.slice(1));assert.deepEqual(views(current),views(original),p+' view contract');count+=views(current).length;const ids=new Set([...current.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]));for(const match of current.matchAll(/href="([^"]+)"/g)){assert(match[1].startsWith('#'));assert(ids.has(match[1].slice(1)),p+' resolved local shape');}}assert.equal(count,156);
});
