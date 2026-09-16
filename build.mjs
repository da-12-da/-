import {mkdir,copyFile,writeFile,readdir,readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {relative,join} from 'node:path';
import {deploymentConfig} from './deployment.mjs';
const deployment=deploymentConfig();
const dist=new URL('./dist/',import.meta.url),assets=['index.html','app.js','core.js','style.css','favicon.svg','success.wav'];
await mkdir(new URL('api/',dist),{recursive:true});
// Only allow public assets. Never package server code, credentials, or test fixtures.
const expected=new Set([...assets,'_headers','api/config']);
for(const entry of await readdir(dist,{recursive:true,withFileTypes:true})){
 if(!entry.isFile())continue;
 const name=relative(fileURLToPath(dist),join(entry.parentPath,entry.name)).replaceAll('\\','/');
 if(!expected.has(name))throw Error(`dist contains an unexpected file: ${name}. Review it before building.`);
}
for(const name of assets)await copyFile(new URL(`./public/${name}`,import.meta.url),new URL(name,dist));
await writeFile(new URL('api/config',dist),JSON.stringify(deployment)+'\n');
await writeFile(new URL('_headers',dist),`/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: no-referrer
  Permissions-Policy: geolocation=(self)
  Cache-Control: no-cache
  Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self'; connect-src 'self' ${deployment.workerBaseUrl}; base-uri 'none'; frame-ancestors 'none'; form-action 'self'
/api/config
  Content-Type: application/json; charset=utf-8
  Cache-Control: no-store
/success.wav
  Content-Type: audio/wav
`);
const config=JSON.parse(await readFile(new URL('api/config',dist),'utf8'));
if(config.workerBaseUrl!==deployment.workerBaseUrl)throw Error('Worker URL mismatch.');
console.log('Build successful: '+fileURLToPath(dist));
for(const name of expected)console.log(name);
