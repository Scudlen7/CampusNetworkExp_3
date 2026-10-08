const version=await (await fetch('http://127.0.0.1:9433/json/version')).json();
const ws=new WebSocket(version.webSocketDebuggerUrl);
await new Promise((resolve,reject)=>{ws.addEventListener('open',resolve,{once:true});ws.addEventListener('error',reject,{once:true});});
const closed=new Promise(resolve=>ws.addEventListener('close',resolve,{once:true}));
ws.send(JSON.stringify({id:1,method:'Browser.close'}));
await closed;
console.log('独立Edge测试浏览器已完全关闭。');
