// 這份腳本只在獨立 iframe 執行，所有狀態、亂數、物件池都屬於小場景。
const previewSpec = globalThis.SURVIVOR_PREVIEW.spec;
let previewTime = 0, previewFired = false, previewRequest = null, previewLast = 0;
let previewVisible = frameElement._previewVisible !== false;
const previewCard = UPGRADES.find(c=>c.id===previewSpec.id);
if(previewCard && previewSpec.kind==='effect') previewCard.effects=[previewCard.effects[previewSpec.index]];
gameSettings.music = false; gameSettings.sound = false; gameSettings.vibration = false;
// 所有入口共用 1.35 倍基準；大範圍效果仍依邊界拉遠。
// 主角圖寬 40 格；假怪至少留三個主角寬，水球飛行和命中都有空間。
const PREVIEW_COMPOSITION = { scale: 1.35, padding: 12, targetDistances: [125,165,200], minDistance: 120, originX: 80 };
const previewFeatures = previewCard ? previewCard.effects.map(e=>e.feature).filter(Boolean) : [];
const previewMove = previewSpec.kind === 'move' && BOSS_MOVES.find(m=>m.id===previewSpec.id);
const previewDash = previewFeatures.some(id=>/dash|fusion-storm/.test(id)) || (previewCard && (previewCard.slot === 'dash' || previewCard.effects.some(e=>!e.feature && e.trigger==='dash')));
const previewRadii = {'water-skill':gameSettings.bombRadius,'thunder-skill':gameSettings.bombRadius,'thunder-counter':BUILD_TUNING.counterRadius,'fusion-puddle':gameSettings.bombRadius,'wind-ultimate':BUILD_TUNING.tornadoRadius+50};
const previewRadius = Math.max(0,...previewFeatures.map(id=>previewRadii[id]||0),...(previewCard ? previewCard.effects.filter(e=>!e.feature).map(e=>e.radius||0) : []), previewMove && ['ring','cage'].includes(previewMove.kind) ? previewMove.radius : 0);
let previewOrigin = {x:0,y:0};
function sizePreview() {
  state.zoom=null;state.screenWidth=null;state.screenHeight=null;
  const width = document.documentElement ? document.documentElement.clientWidth : 640;
  const height = document.documentElement ? document.documentElement.clientHeight : 360;
  const ratio = Math.max(.5, width / Math.max(1,height));
  const padding = PREVIEW_COMPOSITION.padding;
  const displacement = previewCard ? Math.max(0,...previewCard.effects.filter(e=>!e.feature && e.type==='knockback').map(e=>Math.abs(e.distance||0))) : 0;
  const halfWidth = previewMove ? Math.max(250, previewMove.kind==='dash' ? previewMove.distance : 0) : previewDash ? PLAYER_SPEED*gameSettings.dashMultiplier*gameSettings.dashSeconds+padding : 140+displacement;
  state.height = Math.max(height / PREVIEW_COMPOSITION.scale, (Math.max(halfWidth,previewRadius)+padding)*2/ratio, previewRadius ? (previewRadius+padding)*2 : 80);
  state.width = state.height * ratio;
  canvas.width = Math.round(state.width * 3); canvas.height = Math.round(state.height * 3);
  ctx.setTransform(3,0,0,3,0,0); ctx.imageSmoothingEnabled = false;
}
// 展示用固定鏡頭：假怪從第一格就在命中位置，無須先走到定位。
updateCamera = function () {
  state.cameraX = previewOrigin.x - state.width/2;
  state.cameraY = previewOrigin.y - state.height/2;
};
sizePreview();
window.addEventListener('resize',()=>{sizePreview();resetPreview();paintPreview();});
function resetPreview() {
  resetGame(); state.mode = 'playing'; settingsPanel.hidden = true;
  state.spawnTimer = 999; state.shotTimer = 999;
  if (GAME_DATA.weapons.some(w=>w.id===previewSpec.weaponId)) state.weaponId=previewSpec.weaponId;
  // 免傷獨立於受傷／閃爍計時，衝刺也不會切成受傷表情。
  state.player.damageDisabled = true;
  previewTime = 0; previewFired = false;
  const p = state.player;
  previewOrigin = {x:p.x + (previewMove ? 0 : PREVIEW_COMPOSITION.originX), y:p.y}; updateCamera();
  state.enemies = (activeWeapon().kind==='melee' ? [45,60,75] : PREVIEW_COMPOSITION.targetDistances).map((d,i) => ({homeX:p.x+d,homeY:p.y+(i%2)*24-12,typeId:'jaben',behavior:'still',x:p.x+d,y:p.y+(i%2)*24-12,r:17,speed:0,damage:0,hp:100000,maxHp:100000,wobble:0,alive:true,flash:0,shotCooldown:999}));
  if (previewSpec.kind === 'move') {
    state.enemies = [];
    state.boss = {x:p.x-160,y:p.y,r:32,hp:2000,maxHp:2000,speed:0,wobble:0,flash:0};
    state.bossPhase = 3; state.boss.hp = 500; state.bossRest = 999;
    beginBossMove(previewSpec.id);
  } else {
    const card = UPGRADES.find(c=>c.id===previewSpec.id);
    // 效果積木單獨展示；合體卡同時保留前置，才能看見組合的兩種元素。
    if (card) {
      const acquire = (c,seen=new Set()) => { if(seen.has(c.id)) return; seen.add(c.id); (c.requires||[]).forEach(id=>{const pre=UPGRADES.find(c=>c.id===id);if(pre)acquire(pre,seen);}); state.upgrades[c.id]=1; };
      if (card.tier === 'fusion') acquire(card);
      state.upgrades[card.id] = previewSpec.level || 1;
    }
    // 在三秒展示內提早觸發，數值仍交給真正的遊戲效果處理。
    for (const id of ['water-fountain','wind-gust','water-rain','thunder-rod','thunder-static']) state.schoolCombat.timers[id] = .35;
    state.schoolCombat.shots = GAME_DATA.schoolRules.bigDropEvery - 1;
    if (previewFeatures.includes('thunder-super')) state.upgrades['thunder-attack']=1;
    if (previewFeatures.includes('thunder-charge')) state.schoolCombat.kills = GAME_DATA.schoolRules.chargeKills;
    if (previewFeatures.includes('water-wet')) { state.enemies.forEach(e => e.wetTimer=GAME_DATA.schoolRules.wetSeconds); }
    if (previewFeatures.includes('thunder-static')) { state.enemies[0].x=p.x+p.r+12; state.enemies[0].homeX=state.enemies[0].x; }
    if (previewCard && previewCard.neutral) {
      neutralEvent('acquire',p.x,p.y,previewCard.id);
      if (previewFeatures.includes('item-bank')) { state.neutral.gems=GAME_DATA.neutralRules.bankEvery-1;neutralEvent('pickup',p.x,p.y); }
      if (previewFeatures.includes('item-cookie')) { state.neutral.kills=GAME_DATA.neutralRules.cookieKills-1; }
      if (previewFeatures.some(id=>['item-split','item-candy'].includes(id))) { state.enemies[0].hp=1; }
      if (previewFeatures.includes('item-candy')) state.neutral.bombs.push({x:state.enemies[1].x,y:state.enemies[1].y,timer:.5});
    }
    state.player.health = PLAYER_HEALTH / 2;
    state.healTimer = UPGRADE_TUNING.autoHealSeconds;
    state.gems = [{x:p.x-90,y:p.y+60,r:8,value:0,alive:true,wobble:0}];
  }
}
function stepPreview(dt) {
  dt=SurvivorDebugTools.step(dt);if(!dt){paintPreview();return;}
  previewTime += dt;
  if (previewTime >= 3) resetPreview();
  if (!previewFired && previewTime >= .25) {
    previewFired = true;
    if (previewSpec.kind !== 'move') {
      const p = state.player;
      const effects = previewCard ? previewCard.effects : [];
      const features = effects.map(e=>e.feature).filter(Boolean);
      if (previewCard && previewCard.neutral) {
        fireAtNearest();
        if(features.includes('item-cookie')) { state.enemies[0].hp=1;damageEnemy(state.enemies[0],2); }

      }
      // 導電水窪也示範普攻命中，讓前置水技能在假怪腳下留下會放電的水窪。
      if (features.some(id=>['big-water','rapid-water','multi-water','piercing-water','splash-water','water-attack','wind-attack','thunder-attack','wind-speed','fusion-puddle','water-drop','wind-blade','thunder-charge','water-wet','thunder-super'].includes(id)) || effects.some(e=>!e.feature && e.trigger==='hit')) {
        state.shotTimer=0; fireAtNearest(); triggerMakerEffects('hit',p.x+45,p.y);
      }
      if(features.some(id=>['water-skill','thunder-skill','fusion-puddle','wind-dash'].includes(id)) || effects.some(e=>!e.feature && e.trigger==='skill')) activateSkill();
      if((previewCard && previewCard.slot === 'dash') || features.some(id=>['water-dash','wind-dash','fusion-storm','fusion-dash','dash-boost'].includes(id)) || effects.some(e=>!e.feature && e.trigger==='dash')) { activateDash(); state.shotTimer = .25; }
      if(features.includes('thunder-super')) state.upgrades['thunder-attack']=1;
      if(features.includes('thunder-counter')) {
        // 只有反擊卡每輪示範一次受傷；假怪本身不造成接觸傷害。
        p.health = Math.max(1,p.health-1); p.hitFlash = .16; p.invincible = Math.min(.7,INVINCIBLE_SECONDS);
        counterDischarge();
      }
      if(previewSpec.id === 'heal') {state.player.health += Math.ceil(PLAYER_HEALTH/BUILD_TUNING.shieldHealthDivisor);addHealEffect();}
    }
  }
  // 不生成無關小怪、不抽卡、不結算；只推進這個沙盒的真實引擎。
  state.spawnTimer = 999; state.shotTimer = previewSpec.kind === 'move' ? 999 : state.shotTimer;
  state.bossRest = 999;
  if (previewSpec.kind !== 'move') state.keys = new Set();
  const move = previewSpec.kind === 'move' && BOSS_MOVES.find(m=>m.id===previewSpec.id);
  const simulationSeconds = dt * (move ? Math.max(1,(move.warning+.7)/2.5) : 1);
  // 長預警加速展示，仍逐步跑真實引擎，單步不超過 .05 秒。
  for(let left=simulationSeconds;left>0;left-=.05) {
    tick(Math.min(.05,left));
    spacePreviewTargets();
  }
  // 老師召喚在正式遊戲從鏡頭外進場，展示縮短走入鏡頭的等待。
  if(previewSpec.kind==='move') state.enemies.forEach(e=>{ if(!targetVisible(e)){e.x=state.player.x+100;e.y=state.player.y+40;} });
  // 命中時保留引擎的擊退／吸引位移，最後 .7 秒平順回位；重播不跳動。
  if (previewSpec.kind !== 'move' && previewTime > 2.3) {
    const blend = Math.min(1, dt / Math.max(dt, 3-previewTime));
    state.enemies.forEach(e=>{e.x+=(e.homeX-e.x)*blend;e.y+=(e.homeY-e.y)*blend;e.slide=null;});
  }
  spacePreviewTargets();
  SurvivorDebugTools.sample();paintPreview();
}
// 保留擊退／拉近，但不讓拉近或衝刺把主角和假怪擠在一起。
function spacePreviewTargets() {
  if (previewSpec.kind === 'move') return;
  const p = state.player;
  state.enemies.forEach(e=>{
    const dx=e.x-p.x, dy=e.y-p.y, distance=Math.hypot(dx,dy);
    const minimum=previewFeatures.includes('item-wall') && activeWeapon().kind==='melee' ? 40 : PREVIEW_COMPOSITION.minDistance;
    if(distance < minimum) {
      const scale=minimum/Math.max(.001,distance);
      e.x=p.x+(distance ? dx*scale : PREVIEW_COMPOSITION.minDistance); e.y=p.y+dy*scale;
    }
  });
}
function paintPreview() {
  render();SurvivorDebugTools.draw();
  if (previewFeatures.includes('item-clover')) {ctx.fillStyle='#fff1b9';ctx.font='12px sans-serif';ctx.fillText('重抽 '+state.rerollsRemaining+' 次 · 稀有 ×'+GAME_DATA.neutralRules.luckyRareMultiplier,6,18);}
  if (previewSpec.id === 'heal' || previewFeatures.some(id=>['bubble-shield','auto-heal','item-crown','item-cookie'].includes(id))) {
    ctx.fillStyle='#142331';ctx.fillRect(4,4,90,16);
    ctx.fillStyle='#5be08b';ctx.fillRect(6,6,86*state.player.health/maxPlayerHealth(),12);
    ctx.fillStyle='#fff';ctx.font='10px sans-serif';ctx.fillText(Math.round(state.player.health)+' / '+maxPlayerHealth(),8,16);
  }
}
function previewFrame(now) {
  previewRequest = null;
  if (!previewVisible || document.hidden) return;
  if (!previewLast) previewLast = now;
  if(now-previewLast >= 1000/30) {stepPreview(Math.min(.05,(now-previewLast)/1000));previewLast=now;}
  previewRequest = requestAnimationFrame(previewFrame);
}
window.setPreviewVisible = visible => {
  previewVisible = visible; previewLast = 0;
  if (previewRequest !== null) cancelAnimationFrame(previewRequest);
  previewRequest = visible && !document.hidden ? requestAnimationFrame(previewFrame) : null;
};
document.addEventListener('visibilitychange',()=>{state.mode='playing';window.setPreviewVisible(previewVisible);});
resetPreview(); SurvivorDebugTools.mount(); paintPreview(); window.setPreviewVisible(previewVisible);
