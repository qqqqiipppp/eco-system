// Copies the site to an output folder and adds ?v=<version> to every module,
// stylesheet and script address, so a new deploy never mixes with files a
// browser still holds from the last one (GitHub Pages caches each for 10 min).
// Usage: node tools/stamp_version.mjs <version> [out=_site]
import {cpSync,readFileSync,writeFileSync,readdirSync,statSync,rmSync,mkdirSync} from 'node:fs';
import {join,resolve} from 'node:path';

const skip=new Set(['.git','.github','node_modules','_site','tests']);
export function stampModule(code,v){
 return code.replace(/(\b(?:from|import)\s*)(['"])(\.{1,2}\/[^'"?]+\.js)\2/g,(_,head,q,path)=>`${head}${q}${path}?v=${v}${q}`);
}
export function stampPage(html,v){
 return html.replace(/((?:href|src)=")(\.\/[^"?]+\.(?:css|js))"/g,(_,head,path)=>`${head}${path}?v=${v}"`)
  .replace('</head>',`  <meta name="app-version" content="${v}">\n</head>`);
}
const files=dir=>readdirSync(dir).flatMap(n=>{const p=join(dir,n);return statSync(p).isDirectory()?files(p):[p];});
export function build(root,out,v){
 if(!/^[\w.-]+$/.test(v))throw new Error('version must be letters, digits, . _ -');
 rmSync(out,{recursive:true,force:true});
 // Entry by entry: the output may sit inside the root (_site in the Pages
 // workflow), and copying a folder into itself is refused.
 mkdirSync(out,{recursive:true});
 for(const name of readdirSync(root))if(!skip.has(name)&&resolve(root,name)!==resolve(out))cpSync(join(root,name),join(out,name),{recursive:true});
 for(const f of files(out))if(f.endsWith('.js'))writeFileSync(f,stampModule(readFileSync(f,'utf8'),v));
 const index=join(out,'index.html');writeFileSync(index,stampPage(readFileSync(index,'utf8'),v));
 writeFileSync(join(out,'version.json'),JSON.stringify({version:v})+'\n');
}
if(import.meta.url===`file://${process.argv[1]}`){
 const [v,out='_site']=process.argv.slice(2);if(!v){console.error('usage: node tools/stamp_version.mjs <version> [out]');process.exit(1);}
 build(process.cwd(),out,v);console.log(`stamped ${v} into ${out}`);
}
