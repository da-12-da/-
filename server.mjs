import {deploymentConfig} from './deployment.mjs';
import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import {configured,parseQuery,searchMerchants,ServiceError} from './provider.mjs';
const publicRoot=new URL('./public/',import.meta.url);
const assets={'/':'index.html','/index.html':'index.html','/style.css':'style.css','/app.js':'app.js','/core.js':'core.js','/favicon.svg':'favicon.svg','/success.wav':'success.wav'};
const types={html:'text/html; charset=utf-8',css:'text/css; charset=utf-8',js:'text/javascript; charset=utf-8',svg:'image/svg+xml',wav:'audio/wav'};
export function createServer(env=process.env,fetcher=fetch){return http.createServer(async(req,res)=>{res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');res.setHeader('Cache-Control','no-store');res.setHeader('Permissions-Policy','geolocation=(self)');res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self'; connect-src 'self' "+deploymentConfig().workerBaseUrl+"; base-uri 'none'; frame-ancestors 'none'; form-action 'self'");const json=(code,data)=>{res.writeHead(code,{'Content-Type':'application/json; charset=utf-8'});res.end(JSON.stringify(data));};try{if(req.method!=='GET'){json(405,{code:'METHOD_NOT_ALLOWED'});return;}const url=new URL(req.url,'http://localhost');if(req.url.length>4096){json(414,{code:'TOO_LONG'});return;}if(['/api/config','/config.json'].includes(url.pathname)){json(200,deploymentConfig().workerBaseUrl?deploymentConfig():{configured:configured(env)});return;}if(url.pathname==='/api/shops'){const query=parseQuery(url.searchParams);json(200,await searchMerchants(query,env,fetcher));return;}const asset=assets[url.pathname];if(!asset){json(404,{code:'NOT_FOUND'});return;}res.writeHead(200,{'Content-Type':types[asset.split('.').pop()]});res.end(await readFile(new URL(asset,publicRoot)));}catch(error){if(error instanceof ServiceError){json(error.status,{code:error.code,message:error.message});}else{json(500,{code:'SERVER_ERROR',message:'服务暂时不可用，请稍后重试。'});}}});}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){const port=Number(process.env.PORT||5173),host=process.env.HOST||'127.0.0.1';createServer().listen(port,host,()=>console.log(`就这么定：http://${host}:${port}`));}


