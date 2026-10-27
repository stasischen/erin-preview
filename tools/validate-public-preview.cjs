// Local-only publication audit. Does not change source, publish, or approve gameplay.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),http=require('node:http');
const {spawn}=require('node:child_process'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const [stageArg,otherArg,reportArg]=process.argv.slice(2);
assert.ok(stageArg&&otherArg&&reportArg,'Usage: node validate-public-preview.cjs <stage-A> <private-stage-B> <private-report.json>');
const stage=path.resolve(stageArg),other=path.resolve(otherArg),reportPath=path.resolve(reportArg);
const findManifest=root=>{const scan=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(d=>d.isDirectory()?scan(path.join(dir,d.name)):[path.join(dir,d.name)]);const files=scan(root).filter(f=>f.endsWith('/preview-manifest.json'));assert.equal(files.length,1);return JSON.parse(fs.readFileSync(files[0],'utf8'));};
const A=findManifest(stage),B=findManifest(other);assert.notEqual(A.storage_prefix,B.storage_prefix);
assert.deepEqual(Object.keys(A.storage_keys).sort(),Object.keys(B.storage_keys).sort(),'A/B stages must use the same audited storage profile');
const trialKeys=['erin-survivor-trial-best-seconds-v1','erin-survivor-maker-trial-best-seconds-v1'];
const hasTrialRecords=trialKeys.every(key=>Object.hasOwn(A.storage_keys,key));
assert.equal(trialKeys.some(key=>Object.hasOwn(A.storage_keys,key)),hasTrialRecords,'Partial trial record storage profile');
const requests=[],browserErrors=[],consoleErrors=[],badResponses=[];
const worker=`self.addEventListener('install',()=>self.skipWaiting());self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));`;
const types={'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.md':'text/plain; charset=utf-8','.patch':'text/plain; charset=utf-8'};
const server=http.createServer((req,res)=>{
 const pathname=new URL(req.url,'http://localhost').pathname;
 const reply=(status,body,type='text/plain')=>{requests.push({path:pathname,status});res.writeHead(status,{'Content-Type':type,'Cache-Control':'no-store'});res.end(body);};
 if(pathname==='/erin/sw.js')return reply(200,worker,'application/javascript'); // local test sentinel, never deployed
 const selected=pathname.startsWith(B.candidate_path)?other:stage;
 if(!pathname.startsWith('/erin-preview/'))return reply(404,'No test resource');
 let rel;try{rel=decodeURIComponent(pathname.slice('/erin-preview/'.length));}catch{return reply(400,'Bad path');}
 let file=path.resolve(selected,rel||'index.html');
 if(file!==selected&&!file.startsWith(selected+path.sep))return reply(403,'Outside test stage');
 if(fs.existsSync(file)&&fs.statSync(file).isDirectory())file=path.join(file,'index.html');
 if(!fs.existsSync(file)||!fs.statSync(file).isFile())return reply(404,'No stage file');
 reply(200,fs.readFileSync(file),types[path.extname(file)]||'application/octet-stream');
});
let chrome,exited,timeout,sessionId,id=0,buffer='';const pending=new Map();
function send(method,params={},session){return new Promise((resolve,reject)=>{const key=++id;pending.set(key,{resolve,reject});chrome.stdio[3].write(JSON.stringify({id:key,method,params,...(session?{sessionId:session}:{})})+'\0');});}
const call=(method,params={})=>send(method,params,sessionId);
async function evaluate(expression){const r=await call('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value;}
async function waitFor(expression){for(let n=0;n<200;n++){try{if(await evaluate(expression))return;}catch{}await new Promise(r=>setTimeout(r,20));}throw Error('Browser condition timed out: '+expression);}
async function navigate(url,game=true){await call('Page.navigate',{url});await waitFor(`location.href===${JSON.stringify(url)}&&document.readyState==='complete'`);if(game)await waitFor("typeof SurvivorData==='object'&&typeof startGame==='function'");}
async function click(selector){const point=await evaluate(`(()=>{const n=document.querySelector(${JSON.stringify(selector)});if(!n)throw Error('Missing control');n.scrollIntoView({block:'center',inline:'center'});const r=n.getBoundingClientRect();if(r.width<=0||r.height<=0)throw Error('Hidden control '+${JSON.stringify(selector)});const x=r.x+r.width/2,y=r.y+r.height/2;if(!n.contains(document.elementFromPoint(x,y)))throw Error('Covered control '+${JSON.stringify(selector)}+' '+JSON.stringify(r));return{x,y};})()`);await call('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',clickCount:1,...point});await call('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',clickCount:1,...point});}
const sha256=raw=>crypto.createHash('sha256').update(raw).digest('hex');
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const origin=`http://127.0.0.1:${server.address().port}`;
 // Every published file is independently fetched and hashed, including assets and proof metadata.
 let httpFiles=0;
 const scan=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(d=>d.isDirectory()?scan(path.join(dir,d.name)):[path.join(dir,d.name)]);
 for(const file of scan(stage)){
  const response=await fetch(origin+'/erin-preview/'+path.relative(stage,file).split(path.sep).join('/'));assert.equal(response.status,200,file);
  assert.equal(sha256(Buffer.from(await response.arrayBuffer())),sha256(fs.readFileSync(file)));httpFiles++;
 }
 for(const row of A.files){assert.equal(sha256(fs.readFileSync(path.join(stage,row.path))),row.deployed_sha256,row.path);}
 const profile=fs.mkdtempSync(path.join(os.tmpdir(),'erin-public-preview-'));
 const executable=process.env.CHROME_BIN||(process.platform==='darwin'?'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome':'chromium');
 chrome=spawn(executable,['--headless','--disable-gpu','--no-first-run',`--user-data-dir=${profile}`,'--remote-debugging-pipe'],{stdio:['ignore','ignore','pipe','pipe','pipe']});
 let stderr='';chrome.stderr.on('data',data=>{stderr+=data;});
 exited=new Promise(resolve=>chrome.once('exit',resolve));
 chrome.stdio[4].on('data',data=>{buffer+=data;let end;while((end=buffer.indexOf('\0'))>=0){const raw=buffer.slice(0,end);buffer=buffer.slice(end+1);if(!raw)continue;const message=JSON.parse(raw);
  if(message.method==='Runtime.exceptionThrown')browserErrors.push(message.params.exceptionDetails);
  if(message.method==='Runtime.consoleAPICalled'&&message.params.type==='error')consoleErrors.push(message.params.args);
  if(message.method==='Network.responseReceived'&&message.params.response.status>=400)badResponses.push(message.params.response);
  const p=pending.get(message.id);if(p){pending.delete(message.id);message.error?p.reject(Error(JSON.stringify(message.error))):p.resolve(message.result);}
 }});
 chrome.once('exit',()=>{for(const p of pending.values())p.reject(Error('Chrome exited: '+stderr));pending.clear();});
 timeout=setTimeout(()=>{chrome.kill();},120000);
 const {targetId}=await send('Target.createTarget',{url:'about:blank'});({sessionId}=await send('Target.attachToTarget',{targetId,flatten:true}));
 for(const domain of ['Page.enable','Runtime.enable','Network.enable'])await call(domain);
 await call('Emulation.setDeviceMetricsOverride',{width:1024,height:461,deviceScaleFactor:1,mobile:false});
 await call('Page.addScriptToEvaluateOnNewDocument',{source:'globalThis.SURVIVOR_AUDIO_MUTED=true;'});
 const aURL=origin+A.candidate_path+'games/survivor/',bURL=origin+B.candidate_path+'games/survivor/';
 await navigate(aURL);
 // A local stand-in /erin/ registration/cache proves candidate loading never unregisters/deletes it.
 const production=await evaluate(`(async()=>{
  const work=SurvivorData.defaults();work.weapons[0].name='正式站 sentinel';
  const data={${JSON.stringify(Object.keys(A.storage_keys)[0])}:JSON.stringify(work),
   'erin-survivor-settings-v3':JSON.stringify({attackMode:'auto',attackModeChosen:true,sound:false}),
   'erin-survivor-player-settings-v1':JSON.stringify({attackMode:'auto',attackModeChosen:true,sound:false}),
   'erin-survivor-best-seconds-v1':'987654','erin-survivor-maker-best-seconds-v1':'987655',
   ...(${hasTrialRecords}?{'erin-survivor-trial-best-seconds-v1':JSON.stringify({gatekeeper:987656}),'erin-survivor-maker-trial-best-seconds-v1':JSON.stringify({gatekeeper:987657})}:{})};
  for(const [key,value] of Object.entries(data))localStorage.setItem(key,value);
  for(const key of Object.keys(localStorage))if(key.startsWith(${JSON.stringify(A.storage_prefix)}))localStorage.removeItem(key);
  const reg=await navigator.serviceWorker.register('/erin/sw.js',{scope:'/erin/'});
  for(let n=0;n<100&&!reg.active;n++)await new Promise(r=>setTimeout(r,20));if(!reg.active)throw Error('Sentinel worker did not activate');
  const cache=await caches.open('erin-games-production-sentinel');await cache.put('/erin/cache-sentinel.txt',new Response('production-cache-sentinel'));
  return {storage:data,scope:reg.scope,script:reg.active.scriptURL};
 })()`);
 const requestBoundary=requests.length;
 await navigate(aURL);
 assert.equal(await evaluate('gameSettings.attackMode'),'manual');assert.equal(await evaluate('gameSettings.sound'),true);assert.equal(await evaluate('bestRecord'),0);
 if(hasTrialRecords){
  assert.deepEqual(await evaluate('loadTrialRecords(false)'),{});assert.deepEqual(await evaluate('loadTrialRecords(true)'),{});
  await evaluate('saveTrialRecord("gatekeeper",13,true,false);saveTrialRecord("gatekeeper",23,true,true);true');
  assert.equal(await evaluate(`JSON.parse(localStorage.getItem(${JSON.stringify(A.storage_keys[trialKeys[0]])})).gatekeeper`),13);
  assert.equal(await evaluate(`JSON.parse(localStorage.getItem(${JSON.stringify(A.storage_keys[trialKeys[1]])})).gatekeeper`),23);
  await navigate(bURL);assert.deepEqual(await evaluate('loadTrialRecords(false)'),{});assert.deepEqual(await evaluate('loadTrialRecords(true)'),{});
  await evaluate('saveTrialRecord("gatekeeper",17,true,false);saveTrialRecord("gatekeeper",29,true,true);true');
  assert.equal(await evaluate(`JSON.parse(localStorage.getItem(${JSON.stringify(B.storage_keys[trialKeys[0]])})).gatekeeper`),17);
  assert.equal(await evaluate(`JSON.parse(localStorage.getItem(${JSON.stringify(B.storage_keys[trialKeys[1]])})).gatekeeper`),29);
  // Fresh navigation resets the in-memory normal/maker caches: both modes must
  // reload their own persisted map without reading production or candidate B.
  await navigate(aURL);assert.equal(await evaluate('loadTrialRecords(false).gatekeeper'),13);assert.equal(await evaluate('loadTrialRecords(true).gatekeeper'),23);
  await navigate(bURL);assert.equal(await evaluate('loadTrialRecords(false).gatekeeper'),17);assert.equal(await evaluate('loadTrialRecords(true).gatekeeper'),29);
  await navigate(aURL);
 }
 assert.equal(await evaluate('fetch("version.json").then(r=>r.json()).then(v=>v.version)'),A.version);
 await click('#startButton');await waitFor('state.pickingWeapon===true');await click('#upgradeCards button:first-child');await click('#confirmUpgrade');await waitFor("state.mode==='playing'");
 // One real start and movement input; this is deployment smoke, not gameplay acceptance.
 const oldX=await evaluate('state.player.x');await call('Input.dispatchKeyEvent',{type:'keyDown',key:'ArrowRight',code:'ArrowRight',windowsVirtualKeyCode:39});
 await new Promise(r=>setTimeout(r,120));await call('Input.dispatchKeyEvent',{type:'keyUp',key:'ArrowRight',code:'ArrowRight',windowsVirtualKeyCode:39});assert.notEqual(await evaluate('state.player.x'),oldX);
 await click('#pauseButton');await waitFor("state.mode==='paused'");await click('#settingsButton');await waitFor('settingsPanel.hidden===false');await click('#soundToggle');assert.equal(await evaluate('gameSettings.sound'),false);
 assert.equal(await evaluate(`JSON.parse(localStorage.getItem(${JSON.stringify(A.storage_keys['erin-survivor-player-settings-v1'])})).sound`),false);
 await evaluate('closeSettings();showOverlay("paused");true');await click('#makerLink');await waitFor("state.mode==='maker'");
 async function saveWeaponCharge(value){
  await evaluate(`(()=>{const n=document.querySelector('#editor input[aria-label="站定聚氣秒數"]');if(!n)throw Error('Weapon charge control missing');n.value=${JSON.stringify(value)};n.dispatchEvent(new Event('input',{bubbles:true}));return true;})()`);await click('#save');
 }
 await saveWeaponCharge(1.1);
 assert.equal(await evaluate(`JSON.parse(localStorage.getItem(${JSON.stringify(A.storage_keys['erin-survivor-maker-v1'])})).weapons[0].chargeSeconds`),1.1);
 await evaluate('state.mode="playing";state.elapsed=17;finishRun(false);true');
 assert.equal(await evaluate(`localStorage.getItem(${JSON.stringify(A.storage_keys['erin-survivor-best-seconds-v1'])})`),'17');
 await navigate(bURL);assert.equal(await evaluate('gameSettings.sound'),true);assert.equal(await evaluate('bestRecord'),0);await click('#makerLink');await waitFor("state.mode==='maker'");await saveWeaponCharge(1.3);
 assert.equal(await evaluate(`JSON.parse(localStorage.getItem(${JSON.stringify(B.storage_keys['erin-survivor-maker-v1'])})).weapons[0].chargeSeconds`),1.3);
 await click('#makerClose');await waitFor("state.mode==='ready'");assert.equal(await evaluate('location.pathname'),B.candidate_path+'games/survivor/');
 await navigate(aURL+'?maker=1');assert.equal(await evaluate('GAME_DATA.weapons[0].chargeSeconds'),1.1);assert.equal(await evaluate('gameSettings.sound'),false);
 await evaluate('state.mode="playing";state.elapsed=29;finishRun(false);true');assert.equal(await evaluate(`localStorage.getItem(${JSON.stringify(A.storage_keys['erin-survivor-maker-best-seconds-v1'])})`),'29');
 // Exercise legacy migration using candidate A's legacy key, never the production key.
 await evaluate(`localStorage.removeItem(${JSON.stringify(A.storage_keys['erin-survivor-player-settings-v1'])});localStorage.setItem(${JSON.stringify(A.storage_keys['erin-survivor-settings-v3'])},JSON.stringify({attackMode:'auto',attackModeChosen:true,sound:true}));true`);
 await navigate(aURL);assert.equal(await evaluate('gameSettings.attackMode'),'auto');assert.equal(await evaluate('bestRecord'),17);
 await navigate(bURL);assert.equal(await evaluate('gameSettings.attackMode'),'manual');assert.equal(await evaluate('bestRecord'),0);
 // Return link remains inside this exact candidate, never silently navigates to /erin/.
 const backHref=await evaluate("document.querySelector('a.back').href");assert.equal(backHref,origin+B.candidate_path);await navigate(backHref,false);
 const preserved=await evaluate(`(async()=>({storage:Object.fromEntries(Object.keys(${JSON.stringify(production.storage)}).map(key=>[key,localStorage.getItem(key)])),
  registrations:(await navigator.serviceWorker.getRegistrations()).map(reg=>({scope:reg.scope,script:reg.active&&reg.active.scriptURL})),
  cache:await(await caches.open('erin-games-production-sentinel')).match('/erin/cache-sentinel.txt').then(r=>r&&r.text()),
  controller:navigator.serviceWorker.controller&&navigator.serviceWorker.controller.scriptURL,
  keys:Object.keys(localStorage).sort()}))()`);
 assert.deepEqual(preserved.storage,production.storage);assert.deepEqual(preserved.registrations,[{scope:production.scope,script:production.script}]);assert.equal(preserved.cache,'production-cache-sentinel');assert.equal(preserved.controller,null);
 const unexpected=preserved.keys.filter(key=>!Object.keys(production.storage).includes(key)&&!key.startsWith(A.storage_prefix)&&!key.startsWith(B.storage_prefix));assert.deepEqual(unexpected,[]);
 const runtimeRequests=requests.slice(requestBoundary);assert.equal(runtimeRequests.some(r=>r.path.startsWith('/erin/')),false,'preview requested production path');
 assert.deepEqual(runtimeRequests.filter(r=>r.status>=400),[]);assert.deepEqual(badResponses,[]);assert.deepEqual(consoleErrors,[]);assert.deepEqual(browserErrors,[]);
 const report={status:'passed',source_commit:A.source_commit,version:A.version,local_url:aURL,http_files_verified:httpFiles,
  checks:['all published bytes HTTP200 and SHA256 match','candidate deep path starts game and moves','Maker saves under candidate key','settings write candidate modern key','normal and Maker records write candidate keys','candidate legacy migration isolated','A/B candidate Maker/settings/records isolated',`all ${Object.keys(A.storage_keys).length} production key sentinels unchanged`,...(hasTrialRecords?['normal/Maker per-Boss best records persist across fresh navigation and remain A/B isolated']:[]),'existing /erin/ worker and cache sentinel preserved','no candidate worker/controller or production-root runtime request','Maker return and resolved home navigation stay under candidate','no HTTP404/console error/JS exception'],
  stage_files:httpFiles,production_sentinels_preserved:true,service_worker_unchanged:true,candidate_A:A.source_commit,candidate_B:B.source_commit,
  runtime_requests:runtimeRequests.length,console_errors:consoleErrors,browser_errors:browserErrors,
  scope:'local deployment smoke only; not Dot/browser gameplay acceptance'};
 fs.mkdirSync(path.dirname(reportPath),{recursive:true});fs.writeFileSync(reportPath,JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({status:report.status,source_commit:report.source_commit,http_files_verified:httpFiles,runtime_requests:runtimeRequests.length,report:reportPath}));
})().catch(error=>{console.error(error.stack||error);process.exitCode=1;}).finally(async()=>{clearTimeout(timeout);if(chrome){chrome.kill();await exited;}await new Promise(resolve=>server.close(resolve));});
