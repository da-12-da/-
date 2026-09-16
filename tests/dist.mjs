import http from 'node:http';import {readFile} from 'node:fs/promises';import {createRequire} from 'node:module';import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);let chromium;try{({chromium}=require('playwright'));}catch{({chromium}=require(process.env.PLAYWRIGHT_MODULE||'C:/Users/11858/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));}
const root=new URL('../dist/',import.meta.url),files=['index.html','app.js','core.js','style.css','favicon.svg','success.wav','api/config'];
const server=http.createServer(async(req,res)=>{const name=req.url==='/'?'index.html':req.url.slice(1);if(!files.includes(name)){res.writeHead(404);res.end();return;}try{res.setHeader('Content-Type',name.endsWith('.js')?'text/javascript':name.endsWith('.css')?'text/css':name.endsWith('.wav')?'audio/wav':name==='api/config'?'application/json':'text/html');res.end(await readFile(new URL(name,root)));}catch{res.writeHead(500);res.end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}`;
const browser=await chromium.launch({headless:true,...(process.platform==='win32'?{executablePath:process.env.BROWSER_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'}:{})});
try{const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base);assert.equal(await page.locator('.option').count(),0);assert.equal(await page.locator('#start').isDisabled(),true);
 for(const value of ['米线','小炒']){await page.locator('#new-idea').fill(value);await page.locator('#add-form button').click();}
 await page.locator('#start').click();await page.locator('#spin').click();await page.waitForSelector('#chosen-category');assert.equal(await page.locator('.celebration-confetti span').count(),80);
 await page.locator('#nearby').click();await page.getByRole('heading',{name:'商家数据未接入'}).waitFor();
 const audio=await fetch(base+'/success.wav');assert.equal(audio.headers.get('content-type'),'audio/wav');assert.equal((await audio.arrayBuffer()).byteLength,352844);
 assert.deepEqual(errors,[]);console.log('PASS dist: empty input, GO, result, confetti, WAV asset, explicit unconfigured data, no runtime errors');
}finally{await browser.close();await new Promise(r=>server.close(r));}
