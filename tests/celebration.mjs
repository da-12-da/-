import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
import {createServer} from '../server.mjs';
const require=createRequire(import.meta.url);
let chromium;try{({chromium}=require('playwright'));}catch{({chromium}=require(process.env.PLAYWRIGHT_MODULE||'C:/Users/11858/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));}
const server=createServer({});await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({headless:true,...(process.platform==='win32'?{executablePath:process.env.BROWSER_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'}:{})});
try{
 const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{const Original=window.AudioContext;window.audioContexts=[];window.AudioContext=class extends Original{constructor(...args){super(...args);window.audioContexts.push(this);this.bursts=0;}createBufferSource(){this.bursts++;return super.createBufferSource();}};});
 await page.goto(`http://127.0.0.1:${server.address().port}`);for(const idea of ['火锅','烧烤']){await page.locator('#new-idea').fill(idea);await page.locator('#add-form button').click();}await page.locator('#start').click();await page.locator('#spin').click();await page.waitForSelector('#chosen-category');
 assert.equal(await page.locator('.celebration-confetti span').count(),80);
 assert.equal(await page.locator('.celebration-confetti').evaluate(el=>getComputedStyle(el).pointerEvents),'none');
 await page.waitForFunction(()=>audioContexts[0]?.bursts===1);
 assert.deepEqual(await page.evaluate(()=>audioContexts.map(c=>({state:c.state,bursts:c.bursts}))),[{state:'running',bursts:1}]);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 await page.locator('#nearby').click();assert.equal(await page.locator('.celebration-confetti').count(),0);
 await page.locator('.back').click();assert.equal(await page.locator('.celebration-confetti').count(),0);
 await page.locator('.back').click();await page.locator('#spin').click();await page.waitForSelector('#chosen-category');assert.equal(await page.locator('.celebration-confetti span').count(),80);
 await page.waitForFunction(()=>!document.querySelector('.celebration-confetti'),{},{timeout:6000});
 await page.emulateMedia({reducedMotion:'reduce'});await page.locator('.back').click();await page.locator('#spin').click();await page.waitForSelector('#chosen-category');assert.equal(await page.locator('.celebration-confetti').count(),0);
 assert.deepEqual(errors,[]);console.log('PASS 彩带生成、WAV 解码播放、按钮可点击、离页停止、返回不重播、重复抽取、动画清理、减少动态效果');
}finally{await browser.close();await new Promise(r=>server.close(r));}

