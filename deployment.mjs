import {readFileSync} from 'node:fs';
export function deploymentConfig(){const settings=JSON.parse(readFileSync(new URL('./deployment.json',import.meta.url),'utf8'));
 if(Object.keys(settings).some(key=>key!=='workerBaseUrl'))throw Error('deployment.json only accepts the public workerBaseUrl.');
 const value=settings.workerBaseUrl;if(typeof value!=='string')throw Error('workerBaseUrl must be a string.');
 if(!value)return {configured:false,workerBaseUrl:''};
 const url=new URL(value);if(url.protocol!=='https:'||url.username||url.password||url.search||url.hash||url.pathname!=='/')throw Error('Use the HTTPS Worker origin only, without keys, query, or paths.');
 return {configured:true,workerBaseUrl:url.origin};
}
