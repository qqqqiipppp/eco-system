// Ad blockers in the students' Chrome refuse some script names (seen:
// "fullscreen.js", net::ERR_BLOCKED_BY_CLIENT). One refused module stops every
// module that imports it, so the game never starts. This test refuses the same
// names and checks the chapter still starts.
const assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const base=process.env.BASE_URL||'http://127.0.0.1:8093/eco-system/';
const launch=process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH,headless:true,args:['--no-sandbox']}:{channel:'msedge',headless:true};
(async()=>{
 const b=await chromium.launch(launch),p=await b.newPage({viewport:{width:1280,height:650}}),errors=[],blocked=[];
 p.on('pageerror',e=>errors.push(e.message));
 await p.route(u=>/fullscreen/i.test(new URL(u).pathname),r=>{blocked.push(r.request().url());return r.abort('blockedbyclient');});
 await p.goto(base);await p.evaluate(()=>localStorage.clear());await p.reload();
 await p.waitForSelector('.chapter-hud',{timeout:8000});
 assert.deepEqual(errors,[],'no error');
 await b.close();console.log(`PASS blocked name (${blocked.length} refused)`);
})().catch(e=>{console.error(e.message);process.exit(1);});
