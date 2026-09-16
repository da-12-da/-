// Cloudflare module Worker. Paste into JZMD's editor after reviewing existing routes.
// Secrets: AMAP_KEY. Plain variable: ALLOWED_ORIGINS (comma-separated exact origins).
class ApiError extends Error {
 constructor(status,code,message){super(message);this.status=status;this.code=code;}
}
const coord=p=>p&&Number.isFinite(p.lat)&&Math.abs(p.lat)<=90&&Number.isFinite(p.lng)&&Math.abs(p.lng)<=180;
const str=(value,max)=>typeof value==='string'&&value.trim().length>0&&value.length<=max;
const optionalNumber=(value,max=Infinity)=>(typeof value==='number'||typeof value==='string'&&value.trim()!=='')&&Number.isFinite(Number(value))&&Number(value)>=0&&Number(value)<=max?Number(value):undefined;
function distance(a,b){const rad=x=>x*Math.PI/180,x=Math.sin(rad(b.lat-a.lat)/2)**2+Math.cos(rad(a.lat))*Math.cos(rad(b.lat))*Math.sin(rad(b.lng-a.lng)/2)**2;return 12742000*Math.asin(Math.sqrt(Math.min(1,Math.max(0,x))));}
export function parseSearch(url){let location;try{location=JSON.parse(url.searchParams.get('location'));}catch{}
 const category=url.searchParams.get('category')?.trim(),radius=Number(url.searchParams.get('radius'));
 if(!str(category,12)||/[\u0000-\u001f$|]/.test(category)||![3,5,10].includes(radius)||!location)throw new ApiError(400,'INVALID_QUERY','请提供有效的品类、位置和范围。');
 if(location.kind==='region'&&str(location.label,40))return {category,radiusMeters:radius*1000,location:{kind:'region',label:location.label.trim()}};
 if(location.kind==='coordinates'&&coord(location)&&location.coordType==='wgs84')return {category,radiusMeters:radius*1000,location:{kind:'coordinates',lat:location.lat,lng:location.lng}};
 throw new ApiError(400,'INVALID_LOCATION','请选择有效的城市、区域或当前位置。');
}
async function amap(path,params,env,fetcher,signal){
 const url=new URL(path,'https://restapi.amap.com');url.search=new URLSearchParams({...params,output:'json',key:env.AMAP_KEY});
 let data;try{const response=await fetcher(url.href,{signal,redirect:'error'});if(!response.ok)throw Error('upstream');const body=await response.text();if(body.length>2000000)throw Error('size');data=JSON.parse(body);}catch{throw new ApiError(502,'AMAP_UNAVAILABLE','地图服务暂时不可用，请稍后重试。');}
 if(String(data.status)!=='1'){const quota=[10003,10004,10019,10020,10021,10029,10044].includes(Number(data.infocode));throw new ApiError(quota?429:502,quota?'AMAP_QUOTA':'AMAP_REJECTED',quota?'地图查询额度暂时用尽，请稍后重试。':'地图服务未能完成查询，请检查服务权限或稍后重试。');}
 return data;
}
function point(value){if(typeof value!=='string'||!/^[-\d.]+,[-\d.]+$/.test(value))return null;const [lng,lat]=value.split(',').map(Number);return coord({lng,lat})?{lng,lat}:null;}
export function normalizeShops(results,center,radius){const seen=new Set();return results.flatMap(p=>{
 const location=point(p?.location);
 if(!p||!str(p.id,100)||!str(p.name,200)||!location||seen.has(p.id))return [];
 const meters=distance(center,location);if(meters>radius)return [];seen.add(p.id);
 const rating=optionalNumber(p.biz_ext?.rating,5);
 const shop={id:p.id,name:p.name,location:{...location,coordType:'gcj02'},distanceMeters:Math.round(meters)};
 if(str(p.address,300))shop.address=p.address;
 if(rating!==undefined)shop.rating=rating;
 // Amap does not document review counts or positive rates for this endpoint.
 return [shop];
 }).sort((a,b)=>(b.rating??-1)-(a.rating??-1)||a.distanceMeters-b.distanceMeters||a.id.localeCompare(b.id)).slice(0,3);}
export async function searchAmap(query,env,fetcher=fetch){
 const signal=AbortSignal.timeout(12000);let center;
 if(query.location.kind==='region'){
  const data=await amap('/v3/geocode/geo',{address:query.location.label},env,fetcher,signal);center=point(data.geocodes?.[0]?.location);
 }else{
  const data=await amap('/v3/assistant/coordinate/convert',{locations:query.location.lng.toFixed(6)+','+query.location.lat.toFixed(6),coordsys:'gps'},env,fetcher,signal);center=point(data.locations);
 }
 if(!coord(center))throw new ApiError(422,'LOCATION_NOT_FOUND','未找到这个位置，请输入更具体的城市和区域。');
 const data=await amap('/v3/place/around',{keywords:query.category,types:'050000',location:center.lng+','+center.lat,radius:String(query.radiusMeters),sortrule:'distance',extensions:'all',offset:'25',page:'1'},env,fetcher,signal);
 if(!Array.isArray(data.pois))throw new ApiError(502,'INVALID_DATA','地图返回数据异常，请稍后重试。');
 return {source:'高德地图 Place API',category:query.category,center:{...center,coordType:'gcj02'},shops:normalizeShops(data.pois,center,query.radiusMeters),ranking:'半径内候选按评分优先、距离次之；最多展示3家，不代表附近全部商家'};
}
// Best-effort per-isolate burst protection; bind RATE_LIMITER for platform rate limits.
const clients=new Map();
async function limited(request,env){const ip=request.headers.get('CF-Connecting-IP')||'unknown';
 if(env.RATE_LIMITER){const result=await env.RATE_LIMITER.limit({key:ip});return !result.success;}
 const now=Date.now();for(const [key,item] of clients)if(item.until<=now)clients.delete(key);
 let item=clients.get(ip);if(!item){if(clients.size>=10000)return true;item={count:0,until:now+60000};clients.set(ip,item);}return ++item.count>30;
}
export async function handle(request,env,fetcher=fetch){
 const origin=request.headers.get('Origin'),allowed=(env.ALLOWED_ORIGINS||'').split(',').map(x=>x.trim()).filter(Boolean),headers={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Vary':'Origin'};
 const json=(status,data)=>new Response(JSON.stringify(data),{status,headers});
 if(!origin||!allowed.includes(origin))return json(403,{code:'ORIGIN_DENIED',message:'此网站尚未获准访问商家服务。'});
 headers['Access-Control-Allow-Origin']=origin;headers['Access-Control-Allow-Methods']='GET, OPTIONS';headers['Access-Control-Allow-Headers']='Content-Type';
 const url=new URL(request.url);
 if(!['/api/config','/api/shops'].includes(url.pathname))return json(404,{code:'NOT_FOUND'});
 if(request.method==='OPTIONS')return new Response(null,{status:204,headers});
 if(request.method!=='GET')return json(405,{code:'METHOD_NOT_ALLOWED'});
 try{
  if(url.href.length>4096)throw new ApiError(414,'INVALID_QUERY','查询内容过长。');
  if(url.pathname==='/api/config')return json(200,{configured:Boolean(env.AMAP_KEY)});
  const query=parseSearch(url);
  if(!env.AMAP_KEY)throw new ApiError(503,'NOT_CONFIGURED','商家数据未接入。');
  if(await limited(request,env))throw new ApiError(429,'RATE_LIMITED','查询较频繁，请稍后再试。');
  return json(200,await searchAmap(query,env,fetcher));
 }catch(error){return error instanceof ApiError?json(error.status,{code:error.code,message:error.message}):json(500,{code:'WORKER_ERROR',message:'商家服务暂时不可用。'});}
}
export default {fetch(request,env){return handle(request,env);}};
