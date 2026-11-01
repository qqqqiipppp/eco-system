import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,readFileSync,readdirSync,statSync,existsSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {stampModule,stampPage,build} from '../tools/stamp_version.mjs';

test('every relative import gets the version, nothing else changes', () => {
  const code = `import {a} from './a.js';\nimport {\n b,\n c\n} from "../data/b.js";\nexport {d} from './d.js';\nimport './side.js';\nconst s='./not-an-import.js';\n// from './comment.js' stays a comment either way\n`;
  const out = stampModule(code, 'v1');
  for (const p of ["'./a.js?v=v1'", '"../data/b.js?v=v1"', "'./d.js?v=v1'", "'./side.js?v=v1'"]) assert.ok(out.includes(p), p);
  assert.ok(out.includes("const s='./not-an-import.js'"));
  assert.equal(stampModule(out, 'v1'), out, 'stamping twice changes nothing');
});

test('the page links its styles and script with the version and names it', () => {
  const html = '<head>\n<link rel="icon" href="./assets/images/leaf.svg">\n<link rel="stylesheet" href="./css/base.css">\n<script type="module" src="./js/main.js"></script>\n</head>';
  const out = stampPage(html, 'v1');
  assert.ok(out.includes('href="./css/base.css?v=v1"') && out.includes('src="./js/main.js?v=v1"'));
  assert.ok(out.includes('href="./assets/images/leaf.svg"'), 'images keep their address');
  assert.ok(out.includes('<meta name="app-version" content="v1">'));
});

test('the real site builds with no unstamped module address left', () => {
  const out = mkdtempSync(join(tmpdir(), 'site-'));
  build(process.cwd(), out, 'abc1234');
  const files = dir => readdirSync(dir).flatMap(n => { const p = join(dir, n); return statSync(p).isDirectory() ? files(p) : [p]; });
  const js = files(out).filter(f => f.endsWith('.js'));
  assert.ok(js.length > 100);
  for (const f of js) for (const m of readFileSync(f, 'utf8').matchAll(/\b(?:from|import)\s*['"](\.{1,2}\/[^'"]+)['"]/g)) assert.match(m[1], /\?v=abc1234$/, f);
  assert.deepEqual(JSON.parse(readFileSync(join(out, 'version.json'), 'utf8')), {version: 'abc1234'});
  assert.ok(!existsSync(join(out, 'tests')) && !existsSync(join(out, '.git')));
  assert.throws(() => build(process.cwd(), out, 'bad version'));
});
