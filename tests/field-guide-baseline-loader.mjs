import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
const root=fileURLToPath(new URL('../',import.meta.url)).replaceAll('\\','/');
export async function load(url,context,nextLoad){
 if(url.startsWith('file:')){const file=fileURLToPath(url).replaceAll('\\','/'),relative=file.startsWith(root)?file.slice(root.length):'';
  if(/^(data|js)\/.+\.js$/.test(relative)){try{return {format:'module',shortCircuit:true,source:execFileSync('git',['-c','safe.directory='+root.replace(/\/$/,''),'--no-optional-locks','show','59566e4cc11571d1e7e4884d0b8432f85ceb5c03:'+relative],{cwd:root,encoding:'utf8',stdio:['ignore','pipe','ignore']})};}catch{}}
 }return nextLoad(url,context);
}
