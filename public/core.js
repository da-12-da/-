export const palette=['#c4b0fa','#d3ee82','#ffcd98','#a4daef','#ffb9d5','#b8e1c9','#edda92','#d3c4ef'];
export const defaults=[];
export function validateIdeas(values,minimum=2){if(values.length<minimum||values.length>8)return '请保留 2–8 个选项。';const names=values.map(x=>x.trim().normalize('NFKC'));if(names.some(x=>!x))return '餐饮选项不能为空。';if(names.some(x=>Array.from(x).length>12))return '每个选项最多 12 个字。';if(new Set(names.map(x=>x.toLocaleLowerCase())).size!==names.length)return '这个想法已经在清单里了。';return '';}
export function uniform(n,random=()=>crypto.getRandomValues(new Uint32Array(1))[0]){if(!Number.isInteger(n)||n<2||n>8)throw Error('invalid options');const limit=2**32-(2**32%n);let value;do{value=random();}while(value>=limit);return value%n;}
export function targetRotation(previous,index,n){const target=(360-(index+.5)*360/n)%360;return previous+1440+(target-previous%360+360)%360;}
export function pointerIndex(rotation,n){return Math.floor(((360-rotation%360)%360)/(360/n));}
export function distance(m){return m<1000?`${Math.round(m)} m`:`${(m/1000).toFixed(1)} km`;}
export function navigationURL(shop,provider){if(shop.demo)throw Error('演示商家不能发起真实导航。');let {lng,lat,coordType}=shop.location;if(!['gcj02','bd09ll'].includes(coordType)||!Number.isFinite(lng)||!Number.isFinite(lat)||Math.abs(lng)>180||Math.abs(lat)>90)throw Error('导航坐标无效。');const name=[shop.name,shop.address].filter(Boolean).join(' · ').replace(/[|,]/g,' ');if(provider==='amap'){
 if(coordType==='bd09ll'){const x=lng-.0065,y=lat-.006,z=Math.sqrt(x*x+y*y)-.00002*Math.sin(y*Math.PI*3000/180),theta=Math.atan2(y,x)-.000003*Math.cos(x*Math.PI*3000/180);lng=z*Math.cos(theta);lat=z*Math.sin(theta);}
 const url=new URL('https://uri.amap.com/navigation');url.search=new URLSearchParams({to:`${lng},${lat},${name}`,mode:'car',src:'just-pick',callnative:'1'});return url.href;}
 const url=new URL('https://api.map.baidu.com/direction');url.search=new URLSearchParams({origin:'我的位置',destination:`latlng:${lat},${lng}|name:${name}`,mode:'driving',coord_type:coordType,output:'html',src:'webapp.justpick.meal'});return url.href;}

