// 獨立 iframe 的平台接合層：正式 tick、碰撞、攻擊與繪圖照用，僅隔離生成／傷害／結算。
const practiceRules=SurvivorPracticeRules;
let practiceId=frameElement._practiceId||'water-ball',practiceConfig,practiceEnemy=null,practiceHome,practiceClock=0,practiceHold=0;
let practiceRequest=null,practiceLast=0,practiceVisible=true,practicePaused=false;
let practiceStats={dodged:0,hit:0,streak:0},practiceRound=0,practiceWasHit=false,practiceResolved=false,practiceFast=false,practiceToast=0,practiceDashProtected=false,practiceBasicFired=false;
const practiceMini=!!frameElement._practiceMini;
if(practiceMini) document.body.classList.add('mini');
function practiceHit() {
  if(practiceWasHit||practiceResolved||practiceDashProtected) return;
  practiceWasHit=true;state.player.hitFlash=.3;practiceMessage('被打到了','#ff7a86');
}
state.practiceHit=practiceHit;
function practiceMessage(text,color) {const n=document.getElementById('practiceFeedback');n.textContent=text;n.style.color=color;practiceToast=1.2;}
function practiceScore() {
  if(practiceResolved)return;practiceResolved=true;
  practiceStats=practiceRules.score(practiceStats,practiceWasHit);practiceRound++;
  if(!practiceWasHit)practiceMessage(practiceStats.streak===10?'連續 10 次！挑戰成功！':'躲開了！','#8af4ad');
}
function practiceStartRound() {
  const e=practiceEnemy,c=practiceConfig;
  practiceWasHit=false;practiceResolved=false;practiceHold=0;
  const angle=Math.atan2(deltaY(state.player.y,e.y),deltaX(state.player.x,e.x));
  c.windup=practiceRules.windup(practiceRules.model(GAME_DATA,practiceId).windup,practiceRound,practiceFast);
  if(c.timing)c.timing={...c.timing,windup:c.windup};
  if(!c.legacy)e.phaseAttack={phase:'windup',left:c.windup,x:e.x,y:e.y,angle,config:{...c},hit:false};
  else e.action={kind:c.shape==='charge'?'charge':'blast',warning:c.windup,angle};
  practiceBuildTimeline();
}

const practiceDirection=enemyDirection;
enemyDirection=function(e,distance) {
  if(state.enemies.includes(e)) {
    if(e.action || e.phaseAttack && !['ready','cooldown'].includes(e.phaseAttack.phase)) return 0;
    return distance>e.r+state.player.r+4?1:0;
  }
  return practiceDirection(e,distance);
};
const practiceNav=document.getElementById('practiceMoves');
const practiceOriginalBehavior=updateEnemyBehavior, practiceOriginalBlob=drawBlob,practiceOriginalWarnings=drawPacingWarnings;
// 木頭假人是本機程式圖，攻擊來源仍保留原來的怪物造型。
drawBlob=function(x,y,r,color,wobble,flash,id,...rest) {
  if(id!=='practice-dummy') return practiceOriginalBlob(x,y,r,color,wobble,flash,id,...rest);
  ctx.save();ctx.translate(x,y);ctx.fillStyle=flash?'#ffffff':'#98693e';ctx.fillRect(-5,-28,10,55);ctx.fillRect(-27,-12,54,9);ctx.fillRect(-15,-32,30,24);
  ctx.fillStyle='#d9ae72';ctx.fillRect(-11,-29,22,17);ctx.fillStyle='#533d2d';ctx.fillRect(-7,-24,4,4);ctx.fillRect(4,-24,4,4);ctx.fillRect(-18,24,36,6);ctx.restore();
};
// 固定鏡頭讓主角可走位；世界規則仍為遊戲單位。
updateCamera=function(){state.cameraX=practiceHome?practiceHome.x-state.width/2:0;state.cameraY=practiceHome?practiceHome.y-state.height/2:0;};
canvasScreenPoint=function(event){const r=canvas.getBoundingClientRect();return {x:(event.clientX-r.left)*(state.screenWidth||state.width)/r.width,y:(event.clientY-r.top)*(state.screenHeight||state.height)/r.height};};
updateEnemyBehavior=function(e,dt) {
  if(e!==practiceEnemy) return practiceOriginalBehavior(e,dt);
  const old={x:e.x,y:e.y}, charging=e.action&&e.action.kind==='charge'&&e.action.warning<=dt;
  if(practiceConfig.enabled) {
    if(!practiceConfig.legacy) { if(e.phaseAttack&&e.phaseAttack.phase!=='ready')updatePhasedAttack(e,dt); }
    else if(e.action) practiceOriginalBehavior(e,dt);
  } else practiceOriginalBehavior(e,dt);
  if(charging) {
    const vx=e.x-old.x,vy=e.y-old.y,px=state.player.x-old.x,py=state.player.y-old.y;
    const t=Math.max(0,Math.min(1,(px*vx+py*vy)/(vx*vx+vy*vy||1)));
    if(Math.hypot(px-vx*t,py-vy*t)<e.r+state.player.r)practiceHit();
  }
};
// 舊招式也以主角中心的真實碰撞區顯示：衝撞為掃掠膠囊、自爆加上主角半徑。
drawPacingWarnings=function() {
  if(!state.practiceHitboxes) return;
  if(practiceConfig&&!practiceConfig.enabled){practiceOriginalWarnings();return;}
  const e=practiceEnemy,a=e&&e.action;if(!a)return;
  ctx.save();ctx.strokeStyle='#efc94e';ctx.fillStyle='rgba(239,201,78,.22)';
  if(a.kind==='charge') {
    ctx.lineCap='round';ctx.lineWidth=2*(e.r+state.player.r);ctx.globalAlpha=.25;
    ctx.beginPath();ctx.moveTo(e.x,e.y);const distance=GAME_DATA.pacing.chargeSpeed*(a.life===undefined?GAME_DATA.pacing.chargeSeconds:a.life);
    ctx.lineTo(e.x+Math.cos(a.angle)*distance,e.y+Math.sin(a.angle)*distance);ctx.stroke();
  } else {ctx.beginPath();ctx.arc(e.x,e.y,GAME_DATA.pacing.blastRadius+state.player.r,0,Math.PI*2);ctx.fill();ctx.lineWidth=2;ctx.stroke();}
  ctx.restore();
};
function practiceSize() {
  const r=canvas.getBoundingClientRect();applyWorldViewport(Math.max(1,r.width),Math.max(1,r.height));
  state.pointerId=null;state.joy=null;state.keys.clear();
}
function practiceButtons() {
  practiceNav.textContent='';
  for(const m of practiceRules.moves(GAME_DATA)) {
    const b=document.createElement('button');b.type='button';b.title=m.name;b.setAttribute('aria-label',m.name);b.setAttribute('aria-pressed',String(m.id===practiceId));
    if(m.kind==='enemy') {const image=document.createElement('canvas');image.width=image.height=32;const g=image.getContext('2d');g.imageSmoothingEnabled=false;g.drawImage(SurvivorMonsters.picture(GAME_DATA.enemies.find(e=>e.id===m.id).spriteId),0,0,32,32);b.appendChild(image);}
    else b.innerHTML=SurvivorIcons.html(m.icon);
    b.addEventListener('click',()=>{practiceId=m.id;frameElement._practiceId=m.id;practiceReset();practiceButtons();practiceMenu(false);});practiceNav.appendChild(b);
  }
  document.getElementById('practiceReplay').innerHTML=SurvivorIcons.html('reroll');
}
function practiceReset(keepPosition=false) {
  const position=keepPosition?{x:state.player.x,y:state.player.y}:null;
  const home=practiceHome,joy=state.joy,pointerId=state.pointerId,keys=new Set(state.keys);
  resetGame();state.mode=practicePaused?'paused':'playing';settingsPanel.hidden=true;
  if(!keepPosition){practiceStats={dodged:0,hit:0,streak:0};practiceRound=0;}
  state.practiceHit=practiceHit;practiceWasHit=false;practiceResolved=false;practiceToast=0;practiceDashProtected=false;practiceBasicFired=false;
  gameSettings.music=false;gameSettings.sound=false;gameSettings.vibration=true;
  practiceHome=home||{x:state.player.x,y:state.player.y};updateCamera();
  state.player.x=position?position.x:practiceHome.x-80;state.player.y=position?position.y:practiceHome.y;
  if(keepPosition) {state.joy=joy;state.pointerId=pointerId;state.keys=keys;}
  state.practiceHitboxes=SurvivorDebugTools.options.hitboxes || document.getElementById('practiceHitboxes').checked;
  state.player.damageDisabled=true;practiceClock=0;practiceHold=0;practiceEnemy=null;
  practiceConfig=practiceRules.model(GAME_DATA,practiceId);
  if(practiceConfig.kind==='weapon') {
    state.weaponId=practiceId==='item-wall'?'water-ball':practiceId;
    if(practiceId==='item-wall') state.upgrades['item-wall']=1;
    const distance=activeWeapon().kind==='melee'?55:150;
    state.enemies=[0,1].map(i=>({typeId:'practice-dummy',spriteId:'practice-dummy',behavior:'chaser',x:state.player.x+distance+i*65,y:state.player.y,homeX:state.player.x+distance+i*65,homeY:state.player.y,r:18,speed:45,damage:0,hp:1e9,maxHp:1e9,alive:true,flash:0,wobble:0,shotCooldown:Infinity}));
    state.shotTimer=0;
  } else {
    practiceEnemy=spawnEnemy({typeId:practiceId});
    Object.assign(practiceEnemy,{x:practiceHome.x+40,y:practiceHome.y,speed:GAME_DATA.enemies.find(e=>e.id===practiceId).speed,hp:1e9,maxHp:1e9,shotCooldown:practiceConfig.enabled?Infinity:0,actionCooldown:Infinity});
    if(practiceConfig.enabled)practiceStartRound();
    else {state.level=20;state.bookShotTimer=0;}

  }
  updateActionControls();
  document.getElementById('practiceName').textContent=practiceConfig.name+' · 免傷練習';
  document.getElementById('practiceDescription').textContent=practiceRules.describe(practiceConfig);
  practiceBuildTimeline();practicePaint();
}
function practiceTimelineState() {
  const c=practiceConfig,e=practiceEnemy;
  if(!c.enabled) return {phase:'ready',left:0};
  if(c.kind==='weapon') return manualMode() ? state.manualTiming||{phase:'ready',left:0} : {phase:'active',left:Math.max(0,state.shotTimer)};
  if(!c.legacy) return e.phaseAttack||{phase:'ready',left:0};
  if(e.action) return e.action.warning>0?{phase:'windup',left:e.action.warning}:{phase:'active',left:e.action.life||0};
  return {phase:'cooldown',left:Math.max(0,c.cooldown-practiceHold)};
}
function practiceStep(dt) {
  dt=SurvivorDebugTools.step(dt);if(!dt){practicePaint();return;}
  if(state.mode!=='playing') return;
  const c=practiceConfig;
  // 停用遊戲事件與自然生成；不修改共享作品中的設定值。
  state.spawnTimer=Infinity;state.eliteTimer=Infinity;state.bearSpawned=true;state.stageElapsed=0;
  state.bossRest=Infinity;if(c.enabled||practiceBasicFired)state.bookShotTimer=Infinity;
  if(c.kind!=='weapon') state.shotTimer=Infinity;
  practiceClock+=dt;
  practiceDashProtected=state.dashTimer>0;
  const prepared=practiceEnemy&&practiceEnemy.shotPrepared;
  tick(dt);
  if(c.basic&&prepared&&!practiceEnemy.shotPrepared&&practiceEnemy.shotCooldown>0)practiceBasicFired=true;
  practiceToast=Math.max(0,practiceToast-dt);
  // 沙盒不收集經驗；玩家與來源留在固定可視練習區。
  state.gems=[];state.xp=0;state.rewardChoices=0;
  state.player.x=Math.max(state.cameraX+state.player.r,Math.min(state.cameraX+state.width-state.player.r,state.player.x));
  state.player.y=Math.max(state.cameraY+state.player.r,Math.min(state.cameraY+state.height-state.player.r,state.player.y));
  // 擊退仍然有效，但練習對手不會被推到鏡頭外而停止出招。
  for(const e of state.enemies){e.x=Math.max(state.cameraX+e.r,Math.min(state.cameraX+state.width-e.r,e.x));e.y=Math.max(state.cameraY+e.r,Math.min(state.cameraY+state.height-e.r,e.y));}
  if(c.kind==='weapon') {
    // 木樁沿正式敵人移動規則追來，受擊擊退後繼續走，不重設位置或冷卻。
  } else if(c.basic) {
    if(practiceBasicFired&&!state.enemyShots.length&&!state.enemyHazards.length) {
      practiceScore();
      if(practiceEnemy.shotCooldown<=0){practiceBasicFired=false;practiceWasHit=false;practiceResolved=false;state.bookShotTimer=0;}
    }
  } else if(c.enabled) {
    const finished=c.legacy?!practiceEnemy.action:practiceEnemy.phaseAttack&&practiceEnemy.phaseAttack.phase==='ready';
    if(finished && !state.enemyShots.length) {
      if(!practiceResolved)practiceScore();
      practiceHold+=dt;
      if(practiceHold>=Math.max(.45,c.legacy?c.cooldown:0)) {
        if(!practiceEnemy.alive) {practiceEnemy.alive=true;state.enemies=[practiceEnemy];}
        if(encounterDistance(practiceEnemy,state.player)<=(c.triggerDistance||c.radius+70)) practiceStartRound();
      }
    }
  }

  SurvivorDebugTools.sample();practicePaint();
}
function practiceBuildTimeline() {
  const line=practiceRules.timeline(practiceConfig,'ready',0);
  const segments=document.getElementById('practiceSegments'),legend=document.getElementById('practiceLegend');segments.textContent='';legend.textContent='';
  line.segments.forEach(s=>{
    const node=document.createElement('span');node.style.width=(line.total?s.duration/line.total*100:0)+'%';node.style.background=s.color;segments.appendChild(node);
    const label=document.createElement('span');label.style.borderColor=s.color;label.textContent=s.label+' '+Number(s.duration.toFixed(3))+'s';legend.appendChild(label);
  });
}
function practicePaint() {
  render();SurvivorDebugTools.draw();
  // 免傷仍用正式攻擊碰撞；受擊紅環與文字由練習接合層呈現。
  const px=state.player.x-state.cameraX,py=state.player.y-state.cameraY;
  if(practiceWasHit&&practiceToast>0){ctx.save();ctx.strokeStyle='#ff596d';ctx.lineWidth=5;ctx.beginPath();ctx.arc(px,py,state.player.r+5,0,Math.PI*2);ctx.stroke();if(state.player.hitFlash>0){ctx.fillStyle='rgba(255,50,70,.45)';ctx.fill();}ctx.restore();}
  const toast=document.getElementById('practiceFeedback');toast.hidden=practiceToast<=0;
  toast.style.left=(Math.max(80,Math.min(state.width-80,px))/state.width*100)+'%';toast.style.top=(Math.max(90,py-32)/state.height*100)+'%';
  document.getElementById('practiceStats').textContent=practiceConfig.kind==='weapon'?`武器練習 · 連段 ${state.weaponAttack?state.weaponAttack.number:0}/${activeWeapon().comboEvery} · 聚氣 ${Math.round((state.weaponAttack?state.weaponAttack.charge:0)/activeWeapon().chargeSeconds*100)}% · ${GAME_DATA.attackMode==='manual'?'點按連段／長按聚氣／拖曳瞄準（J 普攻、K 特殊、空白衝刺）':'站定聚氣，移動保留 '+Math.round(activeWeapon().moveRetention*100)+'%'}` :`躲開 ${practiceStats.dodged} · 被打 ${practiceStats.hit+(practiceWasHit&&!practiceResolved?1:0)} · 連續 ${practiceWasHit?0:practiceStats.streak}｜挑戰 ${practiceWasHit?0:Math.min(10,practiceStats.streak)}/10`;

  const current=practiceTimelineState(),line=practiceRules.timeline(practiceConfig,current.phase,current.left);
  document.getElementById('practiceCursor').style.left=(line.progress*100)+'%';
}
window.updatePracticeData=function(data) {
  if(window.captureDebugBefore)window.captureDebugBefore();
  const result=SurvivorData.validate(data);if(!result.valid)return;
  frameElement._practicePayload={data:result.data};
  // 更新既有物件，保留引擎對資料表的引用；不重開 iframe。
  function copyInto(target,source) {
    for(const key of Object.keys(source)) {
      if(source[key]&&typeof source[key]==='object'&&target[key]&&typeof target[key]==='object')copyInto(target[key],source[key]);
      else target[key]=source[key];
    }
    if(Array.isArray(target))target.length=source.length;
  }
  copyInto(GAME_DATA,result.data);Object.assign(gameSettings,SETTING_DEFAULTS,GAME_DATA.tuning);
  PLAYER_SPEED=GAME_DATA.tuning.playerSpeed;PLAYER_HEALTH=GAME_DATA.tuning.playerHealth;SHOT_INTERVAL=GAME_DATA.tuning.shotInterval;
  practiceReset();practiceButtons();
};
function practiceMenu(open) {
  practicePaused=open;state.mode=open?'paused':'playing';practiceLast=0;
  state.keys.clear();state.joy=null;state.pointerId=null;
  document.getElementById('practicePanel').hidden=!open;updateActionControls();
  if(!open && canvas.focus)canvas.focus();
}
// 練習場自己的暫停入口，避免啟動正式遊戲的排程或隱藏設定頁。
togglePause=function(){practiceMenu(!practicePaused);};
function practiceFrame(now) {
  practiceRequest=null;if(!practiceVisible||document.hidden)return;
  if(practiceLast) practiceStep(Math.min(.05,(now-practiceLast)/1000));practiceLast=now;
  practiceRequest=requestAnimationFrame(practiceFrame);
}
function practiceVisibility(visible) {
  practiceVisible=visible;practiceLast=0;state.keys.clear();state.joy=null;state.pointerId=null;
  if(practiceRequest!==null)cancelAnimationFrame(practiceRequest);
  if(!visible)practiceMenu(true);
  practiceRequest=visible?requestAnimationFrame(practiceFrame):null;
}
for(const [id,icon] of [['practiceMenu','tree'],['practicePause','settings'],['practiceReplay','reroll'],['practiceResume','play'],['practiceExit','close']])document.getElementById(id).innerHTML=SurvivorIcons.html(icon);
dashButton.innerHTML='<span>'+SurvivorIcons.html('dash')+'</span>';skillButton.innerHTML='<span>'+SurvivorIcons.html('skill')+'</span>';
document.getElementById('practiceMenu').addEventListener('click',()=>practiceMenu(true));
document.getElementById('practicePause').addEventListener('click',()=>practiceMenu(true));
document.getElementById('practiceResume').addEventListener('click',()=>practiceMenu(false));
document.getElementById('practiceExit').addEventListener('click',()=>{if(frameElement._practiceClose)frameElement._practiceClose();});
document.getElementById('practiceReplay').addEventListener('click',()=>{practiceReset();practiceMenu(false);});
document.getElementById('practiceHitboxes').addEventListener('change',e=>{state.practiceHitboxes=e.target.checked;practicePaint();});
document.getElementById('practiceFast').addEventListener('change',e=>{practiceFast=e.target.checked;practiceReset();});
document.addEventListener('pointerdown',event=>{if(event.target===canvas&&canvas.focus)canvas.focus();},true);
window.addEventListener('resize',()=>{practiceSize();practiceHome=null;practiceReset();});
window.addEventListener('blur',()=>{state.keys.clear();state.joy=null;state.pointerId=null;if(practiceMini)state.mode='playing';else practiceMenu(true);});
window.addEventListener('focus',()=>practiceVisibility(true));
document.addEventListener('visibilitychange',()=>practiceVisibility(!document.hidden));
practiceSize();practiceReset();SurvivorDebugTools.mount();practiceButtons();practiceVisibility(true);

window.setPracticeActive=function(active){practiceVisibility(active);if(active&&practiceMini)practiceMenu(false);};

const practiceTrials=document.getElementById('practiceTrials');
practiceTrials.innerHTML=SurvivorIcons.html('boss');
practiceTrials.onclick=()=>{if(window.parent && window.parent.openSurvivorTrials){const open=window.parent.openSurvivorTrials;if(frameElement._practiceClose)frameElement._practiceClose();open(GAME_DATA);}};
