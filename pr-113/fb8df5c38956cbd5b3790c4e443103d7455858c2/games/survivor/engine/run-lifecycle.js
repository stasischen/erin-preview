function resetGame() {
  state.trial=null;
  if (typeof cancelManualAttack === "function") cancelManualAttack();
  state.specialCooldown=0; state.manualTiming=null; state.manualRecovery=0; state.manualDashUsed=false; state.manualLeap=null;
  state.trauma=0; state.inputBuffer=null; state.hitStop=0; state.hitShake=0; state.hitShakePixels=0; state.juiceClock=0;
  state.stageIndex = MAKER_MODE && typeof location!=='undefined' ? Math.max(0,STAGES.findIndex(s=>s.id===new URLSearchParams(location.search).get('stage'))) : 0; state.stageElapsed = 0; state.stageTransition = 0;
  resetEncounters();
  state.enemyHazards = []; state.makerFields = []; state.makerTimers = {};
  state.schoolRun = PREVIEW_MODE ? null : SurvivorSchools.createRun(GAME_DATA, Array.from({length:64}, () => Math.random()));
  state.neutral = { kills:0, gems:0, birdAngle:0, birdTimer:0, bombs:[] };
  state.survivalRoute=null;state.survivalWave=null;state.abilities=null;state.loadout=null;state.weaponEffects=[];state.weaponContext=null;state.pendingTrial=null;
  state.pickingWeapon = false; state.weaponId = 'water-ball'; state.swingCount = 0; state.weaponAttack=null; state.lastWeaponAttack=null; state.attackRecovery=0; state.schoolCombat = { shots:0, kills:0, chargedUsed:0, timers:{}, bubble:false, still:0, rods:[] };
  resetMap();
  for (const visual of state.vfx) state.vfxPool.push(visual);
  state.vfx = [];
  for (const field of state.fields) state.fieldPool.push(field);
  state.fields = []; state.trailDistance = 0; state.ultimateTimer = 0; state.ultimateTimers = {}; state.ultimateVisuals = {}; state.ultimateVisual = null; state.moveRate = 0;
  state.dashCharges = UPGRADE_TUNING.dashCharges; state.dashAttack = 0; state.slowMotion = 0; state.dashGhosts = [];
  state.dashBodyPass = 0; state.dashTimer = 0; state.dashCooldown = 0; state.skillCooldown = 0;
  state.dashX = 1; state.dashY = 0; state.faceX = 1; state.faceY = 0;
  state.bomb = null; state.bombBlast = null; state.pointerId = null;
  for (const item of state.projectiles) state.projectilePool.push(item);
  for (const item of state.gems) state.gemPool.push(item);
  for (const item of state.effects) state.effectPool.push(item);
  state.player = { x: state.width * MAP_SCREENS / 2, y: state.height * MAP_SCREENS / 2, r: 18, health: PLAYER_HEALTH, invincible: 0, hitFlash: 0, walkPhase: 0, moving: false, facing: 1 };
  state.enemies = [];
  for (const item of state.enemyShots) state.enemyShotPool.push(item);
  state.enemyShots = [];
  state.bookShotTimer = 0; state.bookNoticeTimer = 0; state.bookShootingStarted = false;
  enemyNotice.hidden = true;
  state.boss = null; state.bossIntro = 0; state.bossZone = null;
  clearBossMoves(); state.bossPhase = 1; state.bossPhasePause = 0; state.bossRest = 0; state.lastBossMoves = []; state.bossShout = 0; state.bossShake = 0;
  state.projectiles = [];
  state.gems = [];
  state.effects = [];
  state.elapsed = 0;
  state.spawnTimer = 0.5;
  state.shotTimer = 0.15;
  state.healTimer = 0;
  state.xp = 0;
  state.level = 1;
  state.upgrades = {}; state.pendingChoices = []; state.rerollsRemaining = LEVELUP_REROLLS;
  state.keys.clear();
  state.joy = null;
  state.player.health = PLAYER_HEALTH;
  updateCamera(); updateHud();
}

function startGame() {
  const route=SurvivorRoutes.selected();
  if (globalThis.SurvivorPreview) SurvivorPreview.stop();
  resetGame();
  state.survivalRoute=route;
  enterRunMode();
  state.mode = "playing";
  overlay.classList.add("hidden");
  SurvivorIcons.set(pauseButton, "settings");
  state.lastTime = performance.now();
  scheduleFrame();
  if(SURVIVAL_MODE){SurvivorLoadout.initialize();spawnEnemy();}else if(PREVIEW_MODE)spawnEnemy();else showWeaponChoices();
  updateActionControls();
  playSound("click");
}

function finishRun(won) {
  if(state.trial) {saveTrialRecord(state.trial.definition.id,state.trial.elapsed,won,state.trial.custom);trialMenu(won?"挑戰成功！":"再試一次！");return;}
  if (won && !PREVIEW_MODE && state.stageIndex < STAGES.length - 1) {
    // 換場保留本局成長與血量，清空上一關的攻擊、警示、怪物與操作輸入。
    const progress = { survivalRoute:state.survivalRoute, abilities:state.abilities, skillCooldown:state.skillCooldown, loadout:state.loadout, weaponId: state.weaponId, swingCount: state.swingCount, stageIndex: state.stageIndex+1, elapsed: state.elapsed, level: state.level, xp: state.xp, upgrades: state.upgrades, schoolRun: state.schoolRun, schoolCombat: state.schoolCombat, neutral: state.neutral, rerolls:state.rerollsRemaining, health: state.player.health };
    resetGame();
    if(progress.abilities){progress.abilities.effects=[];progress.abilities.shield=null;progress.abilities.linger=0;}
    Object.assign(state, { survivalRoute:progress.survivalRoute, abilities:progress.abilities, skillCooldown:progress.skillCooldown, loadout:progress.loadout, weaponId: progress.loadout?.[0].weaponId || progress.weaponId, swingCount: progress.swingCount, stageIndex: progress.stageIndex, elapsed: progress.elapsed, level: progress.level, xp: progress.xp, upgrades: progress.upgrades, schoolRun: progress.schoolRun, schoolCombat: progress.schoolCombat, neutral:progress.neutral, rerollsRemaining:progress.rerolls, stageTransition: 2, mode: "transition" });
    state.player.health = progress.health;
    updateHud(); updateActionControls(); return;
  }
  clearBossMoves(); state.bossZone = null; state.bossShake = 0;
  bestRecord = Math.max(bestRecord, Math.floor(state.elapsed));
  try { localStorage.setItem(RECORD_KEY, String(bestRecord)); } catch (_) { /* 無法儲存紀錄時不影響結算 */ }
  playSound(won ? "win" : "over");
  if (MAKER_MODE && window.openSurvivorMaker) window.openSurvivorMaker(won ? "過關了！繼續設計或再試玩。" : "試玩結束！繼續設計或再試玩。");
  else showOverlay(won ? "won" : "over");
}



// Module accessors; original global functions and loop facade remain unchanged.
globalThis.Survivor.engine = globalThis.Survivor.engine || {};
globalThis.Survivor.engine['run-lifecycle'] = globalThis.Survivor.engine['run-lifecycle'] || {};
Object.defineProperties(globalThis.Survivor.engine['run-lifecycle'], {
  resetGame: { enumerable: true, get: () => resetGame },
  startGame: { enumerable: true, get: () => startGame },
  finishRun: { enumerable: true, get: () => finishRun }
});
