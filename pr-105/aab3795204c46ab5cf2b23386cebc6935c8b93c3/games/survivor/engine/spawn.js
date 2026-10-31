function spawnEnemy(options = {}) {
  if (state.enemies.filter(e=>e.alive).length >= ENEMY_LIMIT) return;
  if(options.elite && state.enemies.filter(e=>e.alive&&e.elite).length>=GAME_DATA.elites.limit) return;
  const configuredTypes = ENEMY_TYPES.map((type,i)=> i===0 ? {...type,speed:gameSettings.enemySpeed,hp:gameSettings.enemyHealth} : i===1 ? {...type,speed:gameSettings.secondEnemySpeed,hp:gameSettings.secondEnemyHealth} : type);
  const typeId=options.typeId || pacingType();
  const type=configuredTypes.find(t=>t.id===typeId) || configuredTypes[0];
  const scale = options.elite ? GAME_DATA.elites.sizeScale : options.small ? .6 : 1;
  const radius = type.radius * scale;
  const position = options.small && options.position ? {...options.position} : options.offscreen ? offscreenSpawn(radius) : options.side === undefined ? bossZoneSpawn(radius) : offscreenSpawn(radius,options.side);
  if (!position) return; // 視窗大到看見整張地圖時，等有鏡頭外空間再生成。
  const { x, y } = position;
  state.enemies.push({ typeId: type.id, shadowSize: type.shadowSize, behavior: type.behavior, spriteId:type.spriteId, small:!!options.small, x, y, r: radius, speed: type.speed * currentStage().enemySpeedScale, damage: type.damage, color: type.color, hp: type.hp * currentStage().enemyHealthScale * (options.small ? .3 : 1), maxHp: type.hp * currentStage().enemyHealthScale * (options.small ? .3 : 1), wobble: Math.random() * Math.PI * 2, alive: true, flash: 0, shotCooldown: Math.random() * bookShotInterval(type.id) });
  const enemy = state.enemies[state.enemies.length-1];
  if (options.elite) makeElite(enemy);
  return enemy;
}

function bookShotInterval(typeId) {
  if (MAKER_MODE || !["jaben","otsubon"].includes(typeId)) return ENEMY_TYPES.find(e => e.id === typeId).attack.interval;
  return typeId === "otsubon" ? gameSettings.secondEnemyShotInterval : gameSettings.enemyShotInterval;
}

function startBookShooting() {
  const firstLevel = MAKER_MODE ? Math.min(...ENEMY_TYPES.filter(e => e.attack.type !== "none").map(e => e.attack.level)) : gameSettings.enemyShootLevel;
  if (state.bookShootingStarted || state.level < firstLevel) return;
  state.bookShootingStarted = true; state.bookNoticeTimer = 4;
  enemyNotice.textContent = MAKER_MODE ? "怪物開始用招式了！" : ENEMY_TYPES[0].name + "開始丟字了！"; enemyNotice.hidden = false;
}

function updateBookShooting(dt) {
  if (state.bossIntro > 0) return;
  state.bookShotTimer = Math.max(0, state.bookShotTimer - dt);
  for (const enemy of state.enemies) {
    if(enemy.feedbackFrozen)continue;
    enemy.shotCooldown = Math.max(0, enemy.shotCooldown - dt);
    enemy.shotWarning = Math.max(0, (enemy.shotWarning || 0) - dt);
    if (!targetVisible(enemy)) { enemy.shotPrepared = false; enemy.shotWarning = 0; }
  }
  if (state.bookShotTimer > 0 || state.enemyShots.filter((shot) => shot.source === "book").length >= UPGRADE_TUNING.enemyShotLimit) return;
  // 每次只選一隻準備好的小兵；離開畫面的、被打倒的都不能丟字。
  const ready = state.enemies.filter((enemy) => !enemy.miniboss && enemy.alive && !enemy.feedbackFrozen && !(enemy.stunTimer > 0) && enemy.shotCooldown <= 0 && targetVisible(enemy));
  if (!ready.length) return;
  const allowed = ready.filter(e => {
    const type=ENEMY_TYPES.find(t=>t.id===e.typeId);
    return type && !type.phaseAttack.enabled && type.attack.type!=="none" && state.level >= (MAKER_MODE || e.typeId!=="jaben" && e.typeId!=="otsubon" ? type.attack.level : gameSettings.enemyShootLevel);
  });
  if (!allowed.length) return;
  const enemy = allowed.find(e=>e.shotPrepared) || allowed[Math.floor(Math.random() * allowed.length)];
  if (!enemy.shotPrepared) { enemy.shotPrepared = true; enemy.shotWarning = GAME_DATA.pacing.warning; feedbackSound(enemyFeedback(enemy,'legacy'),'warning'); return; }
  if (enemy.shotWarning > 0) return;
  enemy.shotPrepared = false;
  const attack = MAKER_MODE || !["jaben","otsubon"].includes(enemy.typeId) ? ENEMY_TYPES.find(t => t.id === enemy.typeId).attack : { type: "projectile", count: 1, spread: 0, speed: gameSettings.enemyShotSpeed, damage: gameSettings.enemyShotDamage, radius: 12 };
  const angle = Math.atan2(deltaY(state.player.y, enemy.y), deltaX(state.player.x, enemy.x));
  if (attack.type === "aoe") {
    // 怪物範圍攻擊先預警，落點固定，不追著玩家跑。
    if (state.enemyHazards.length < 8) state.enemyHazards.push({ x: state.player.x, y: state.player.y, r: attack.radius, damage: attack.damage, warning: .9,feedback:feedbackPayload(enemyFeedback(enemy,'legacy')) });
  } else if (attack.type === "summon") {
    for (let n = 0; n < attack.count; n++) spawnEnemy();
  } else for (let n = 0; n < attack.count; n++) {
    if (state.enemyShots.filter(s => s.source === "book").length >= UPGRADE_TUNING.enemyShotLimit) break;
    const a = angle + (n - (attack.count - 1) / 2) * attack.spread;
    state.enemyShots.push(takeFromPool(state.enemyShotPool, {
      dodged: false, phaseShot:false, source: "book", life: 8, x: enemy.x, y: enemy.y, vx: Math.cos(a) * attack.speed, vy: Math.sin(a) * attack.speed,
      text: BOOK_CHARACTERS[Math.floor(Math.random() * BOOK_CHARACTERS.length)], r: attack.radius, damage: attack.damage,feedback:feedbackPayload(enemyFeedback(enemy,'legacy'))
    }));
  }
  enemy.shotCooldown = bookShotInterval(enemy.typeId);
  state.bookShotTimer = UPGRADE_TUNING.enemyShotGap;
}

// 先在鏡頭外選位置，再回到環形世界；四邊永遠都可以生成。
function offscreenSpawn(r, side, minimumDistance = state.player.r + r + 160) {
  // 多留 1 格，避免接縫回圈的浮點誤差把邊緣外的位置判成不安全。
  const gap = r + 17, left = state.cameraX, top = state.cameraY;
  const sides = [
    () => ({ x: left - gap, y: top + Math.random() * state.height }),
    () => ({ x: left + state.width + gap, y: top + Math.random() * state.height }),
    () => ({ x: left + Math.random() * state.width, y: top - gap }),
    () => ({ x: left + Math.random() * state.width, y: top + state.height + gap })
  ];
  // 回圈後必須再檢查，避免跨地圖接縫時出現在看得到的另一側。
  const centerX = left + state.width / 2, centerY = top + state.height / 2;
  function safe(point) {
    clampToMap(point);
    const dx = Math.abs(deltaX(point.x, centerX)), dy = Math.abs(deltaY(point.y, centerY));
    const distance = Math.hypot(deltaX(point.x, state.player.x), deltaY(point.y, state.player.y));
    return (dx >= state.width / 2 + r + 16 || dy >= state.height / 2 + r + 16) && distance >= minimumDistance;
  }
  const point = sides[side === undefined ? Math.floor(Math.random() * 4) : side%4]();
  if (safe(point)) return point;
  // 特大或很小的視窗改用中心與最遠座標的組合；沒有安全空間就暫停生成。
  for (const x of [centerX, centerX + state.worldWidth / 2]) {
    for (const y of [centerY, centerY + state.worldHeight / 2]) {
      const fallback = { x, y };
      if (safe(fallback)) return fallback;
    }
  }
  return null;
}

// Live accessors preserve shared state and the legacy globals used by preview/VM callers.
globalThis.Survivor.engine = globalThis.Survivor.engine || {};
globalThis.Survivor.engine.spawn = globalThis.Survivor.engine.spawn || {};
Object.defineProperties(globalThis.Survivor.engine.spawn, {
  spawnEnemy: { enumerable: true, get: () => spawnEnemy },
  bookShotInterval: { enumerable: true, get: () => bookShotInterval },
  startBookShooting: { enumerable: true, get: () => startBookShooting },
  updateBookShooting: { enumerable: true, get: () => updateBookShooting },
  offscreenSpawn: { enumerable: true, get: () => offscreenSpawn }
});
