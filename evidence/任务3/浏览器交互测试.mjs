import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';

const dir=path.dirname(fileURLToPath(import.meta.url));
const pagePath=path.resolve(dir,'../../output/任务3/校园网服务页.html');
const stage=process.argv[2]||'初版';
const pages=await (await fetch('http://127.0.0.1:9433/json/list')).json();
const target=pages.find(p=>p.type==='page'&&p.url.includes(encodeURIComponent('校园网服务页.html')))||pages.find(p=>p.type==='page'&&p.url.startsWith('file:'));
assert(target,'未找到本地HTML测试页面');
const ws=new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve,reject)=>{ws.addEventListener('open',resolve,{once:true});ws.addEventListener('error',reject,{once:true});});
let seq=0;
const pending=new Map(), exceptions=[], consoleErrors=[], requests=[];
ws.addEventListener('message',e=>{
  const msg=JSON.parse(e.data);
  if(msg.id){const p=pending.get(msg.id);if(p){pending.delete(msg.id);msg.error?p.reject(Error(JSON.stringify(msg.error))):p.resolve(msg.result);}}
  if(msg.method==='Runtime.exceptionThrown')exceptions.push(msg.params.exceptionDetails);
  if(msg.method==='Runtime.consoleAPICalled'&&msg.params.type==='error')consoleErrors.push(msg.params.args);
  if(msg.method==='Network.requestWillBeSent')requests.push(msg.params.request.url);
});
function call(method,params={}){
  return new Promise((resolve,reject)=>{
    const id=++seq;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}));
    setTimeout(()=>{if(pending.has(id)){pending.delete(id);reject(Error('超时 '+method));}},15000).unref();
  });
}
async function evaluate(expression){
  const result=await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});
  if(result.exceptionDetails)throw Error(JSON.stringify(result.exceptionDetails));
  return result.result.value;
}
await call('Runtime.enable'); await call('Page.enable'); await call('Network.enable');
await call('Network.emulateNetworkConditions',{offline:true,latency:0,downloadThroughput:0,uploadThroughput:0});
await call('Emulation.setDeviceMetricsOverride',{width:1400,height:1000,deviceScaleFactor:1,mobile:false});
await call('Page.navigate',{url:pathToFileURL(pagePath).href});
for(let i=0;i<20;i++){
  if(await evaluate("document.readyState==='complete'&&document.querySelectorAll('.qa-card').length===5"))break;
  await new Promise(r=>setTimeout(r,100));
}
const initial=await evaluate(`({
  url:location.href,date:document.getElementById('maintenance-date').textContent,time:document.getElementById('maintenance-time').textContent,
  area:document.getElementById('maintenance-area').textContent,access:document.getElementById('maintenance-access').textContent,
  dorm:document.getElementById('maintenance-dorm').textContent,qa:document.querySelectorAll('.qa-card').length,
  total:document.getElementById('device-total').textContent,rows:document.querySelectorAll('#device-body tr').length,
  currentCount:document.getElementById('device-count').textContent,
  chartNumbers:[...document.querySelectorAll('#location-chart .chart-number')].map(x=>Number(x.textContent)),
  locations:[...document.querySelectorAll('#location-filter option')].map(x=>x.textContent),
  pending:[...document.querySelectorAll('#device-body tr')].filter(x=>x.textContent.includes('待核验')).length,
  unregistered:[...document.querySelectorAll('#device-body tr')].filter(x=>x.textContent.includes('未登记')).length,
  simulation:document.body.textContent.includes('教学模拟'),
})`);
assert.equal(initial.date,'2026 年 10 月 13 日'); assert.equal(initial.time,'22:00—23:30');
assert.equal(initial.area,'教学楼 A、教学楼 B'); assert.equal(initial.access,'无线网络');
assert.equal(initial.dorm,'学生宿舍不在本次维护范围内'); assert.equal(initial.qa,5);
assert.equal(initial.total,'19 台'); assert.equal(initial.rows,19); assert.equal(initial.pending,1);assert.equal(initial.unregistered,1);
assert.deepEqual(initial.chartNumbers,[5,5,4,4,1]);assert(initial.locations.includes('未登记'));assert(initial.simulation);
const tests=[{name:'A 空搜索',expected:5,actual:initial.qa,pass:true}];
async function search(text,expected,label){
  await evaluate(`(()=>{const el=document.getElementById('qa-search');el.value=${JSON.stringify(text)};el.dispatchEvent(new Event('input',{bubbles:true}));return true;})()`);
  const result=await evaluate(`({count:document.querySelectorAll('.qa-card').length,text:document.getElementById('qa-list').textContent})`);
  assert.equal(result.count,expected,label);
  if(expected===0)assert(result.text.includes('无匹配结果'));
  tests.push({name:label,keyword:text,expected,actual:result.count,pass:true});return result;
}
const password=await search('密码',1,'B 密码搜索');assert(password.text.includes('账号、密码均无需提供'));
await search('火星食堂',0,'C 无匹配结果'); await search('',5,'D 清空搜索恢复');
await search('  密 码  ',1,'搜索首尾及内部空白'); await search(' t04 ',1,'英文大小写与空白'); await search('',5,'恢复默认搜索');
async function filter(value,expected,label){
  await evaluate(`(()=>{const el=document.getElementById('location-filter');el.value=${JSON.stringify(value)};el.dispatchEvent(new Event('change',{bubbles:true}));return true;})()`);
  const result=await evaluate(`({count:document.querySelectorAll('#device-body tr').length,current:document.getElementById('device-count').textContent,locations:[...document.querySelectorAll('#device-body tr')].map(tr=>tr.children[4].textContent),pending:document.getElementById('device-body').textContent.includes('待核验'),rawStatus:document.getElementById('device-body').textContent.includes('正常')})`);
  assert.equal(result.count,expected);assert.equal(result.current,'当前设备数量：'+expected);
  if(value!=='__all__')assert(result.locations.every(x=>x===value));
  tests.push({name:label,selected:value,expected,actual:result.count,pass:true});return result;
}
await filter('教学楼A',5,'E 教学楼A筛选');const all=await filter('__all__',19,'F 全部地点恢复');
assert(all.locations.includes('未登记'));assert(all.pending&&all.rawStatus);
await filter('未登记',1,'未登记筛选保留');await filter('__all__',19,'最终恢复全部设备');
if(stage!=='初版'){
  const hasButton=await evaluate("Boolean(document.getElementById('clear-search'))");assert(hasButton);
  await search('火星食堂',0,'优化后无结果');
  await evaluate("document.getElementById('clear-search').click()");
  assert.equal(await evaluate("document.querySelectorAll('.qa-card').length"),5);
  tests.push({name:'优化后清除搜索按钮',expected:5,actual:5,pass:true});
}
const desktop=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:true});
await fs.writeFile(path.join(dir,stage+'_桌面浏览器.png'),Buffer.from(desktop.data,'base64'));
await call('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
const mobileInfo=await evaluate(`({width:innerWidth,bodyWidth:document.documentElement.scrollWidth,tableScrollable:document.querySelector('.table-card').scrollWidth>document.querySelector('.table-card').clientWidth,qas:document.querySelectorAll('.qa-card').length,total:document.getElementById('device-total').textContent})`);
assert.equal(mobileInfo.width,390);assert(mobileInfo.bodyWidth<=392,'手机页面出现全局横向溢出');assert(mobileInfo.tableScrollable);
const mobile=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:true});
await fs.writeFile(path.join(dir,stage+'_手机浏览器.png'),Buffer.from(mobile.data,'base64'));
await call('Emulation.setDeviceMetricsOverride',{width:1400,height:1000,deviceScaleFactor:1,mobile:false});
await call('Page.reload',{ignoreCache:true});
const externalRequests=requests.filter(url=>!url.startsWith('file:')&&!url.startsWith('data:')&&!url.startsWith('about:'));
assert.equal(exceptions.length,0,'浏览器JavaScript异常');assert.equal(consoleErrors.length,0,'浏览器控制台错误');assert.equal(externalRequests.length,0,'页面发起外部请求');
const result={stage,engine:'Microsoft Edge',offline:true,initial,tests,mobileInfo,exceptions,consoleErrors,externalRequests,allPassed:true};
await fs.writeFile(path.join(dir,stage+'_浏览器测试结果.json'),JSON.stringify(result,null,2));
console.log(JSON.stringify(result,null,2));
ws.close();
