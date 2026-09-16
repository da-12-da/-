import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
test('entry assets stay within GitHub repository subpath',async()=>{
 const html=await readFile(new URL('../public/index.html',import.meta.url),'utf8');
 for(const [,path] of html.matchAll(/(?:src|href)="([^"]+)"/g)){
  if(path.startsWith('#'))continue;
  assert.ok(new URL(path,'https://da-12-da.github.io/-/').pathname.startsWith('/-/'));
 }
});
