// 純規則：世界距離與固定抽樣 → 可用招式；血量按本局已升級次數成長。
function teacherHealth(base,stageScale,upgrades,perUpgrade) {return (base+Math.max(0,upgrades)*perUpgrade)*stageScale;}
function teacherChoices(moves,phase,distance,visible,policy,previous=[]) {
  const unlocked=moves.filter(m=>m.minPhase<=phase);
  const kinds=!visible||distance>=policy.farDistance?['leap','sniper']:distance<=policy.nearDistance?['rain','call','ring','cage','leap','tracking']:['words','chalk','barriers','dash','combo','summon'];
  const choices=unlocked.filter(m=>kinds.includes(m.kind));
  const fresh=choices.filter(m=>!previous.includes(m.id));
  return fresh;
}
function summonTeacher() {
  // 老師只需身體與名字都在鏡頭外，不套小怪的額外 160 格安全距離。
  // 窄畫面若套用小怪距離，近邊候選會失敗，退到半張世界之外。
  const position = offscreenSpawn(60, undefined, state.player.r + GAME_DATA.boss.radius);
  if (!position) return;
  playSound("warning");
  const hp=teacherHealth(gameSettings.teacherHealth,currentStage().bossHealthScale,state.level-1,GAME_DATA.boss.combat.healthPerUpgrade);
  state.boss = { ...position, r: GAME_DATA.boss.radius, speed: GAME_DATA.boss.speed, hp, maxHp:hp, posture:SurvivorPosture.initial(), recoveryLeft:0, flash: 0, wobble: 0 };
  clearBossMoves(); state.bossPhase = 1; state.bossPhasePause = 0; state.bossRest = 0.5; state.lastBossMoves = []; state.bossShout = 0; state.bossShake = 0; state.bossIntro = 2.2;
  startBossZone();
  updateHud();
}

// 老師招式的預告、位置和命中都用世界座標；離開鏡頭仍持續追擊。
function clearBossMoves() {
  for (const move of state.bossMoves) state.bossMovePool.push(move);
  state.bossMoves = [];
  if(state.trial&&state.boss&&state.boss.trialActor){
    state.boss.moves=state.bossMoves;
    if(state.boss.posture.stun>0&&state.trial.fields)state.trial.fields=state.trial.fields.filter(f=>f.owner!==state.boss.actorId);
  }
  for (let i = state.enemyShots.length - 1; i >= 0; i--) {
    if (state.enemyShots[i].source === "teacher") state.enemyShotPool.push(state.enemyShots.splice(i, 1)[0]);
  }
}
function bossHurtPlayer(damage,feedback) {
  if (!state.boss || state.boss.posture&&state.boss.posture.stun>0 || state.player.damageDisabled || state.player.invincible > 0) return;
  feedbackImpact(feedback,true,state.boss,state.player);
  state.player.health = Math.max(0, state.player.health - absorbSchoolHit(damage));
  state.player.invincible = INVINCIBLE_SECONDS; state.player.hitFlash = 0.16;
  playSound("hurt"); updateHud(); counterDischarge();
  if (state.mode === "playing" && state.player.health <= 0) finishRun(false);
}
function bossDefinition(move) { if(state.trial)return trialMoveDefinition(move); return BOSS_MOVES.find(row => row.id === move.id); }
function bossKind(move) { return move.kind || (bossDefinition(move) || {}).kind; }
function beginBossMove(id) {
  const definition = BOSS_MOVES.find(row => row.id === id);
  if (!definition || definition.minPhase > state.bossPhase || state.boss && ((state.boss.stunTimer||0)>0 || state.boss.posture&&state.boss.posture.stun>0)) return;
  const kind = definition.kind;
  const p = state.player;
  const b = state.boss && { ...state.boss, x: state.cameraX + state.width / 2 + deltaX(state.boss.x, state.cameraX + state.width / 2), y: state.cameraY + state.height / 2 + deltaY(state.boss.y, state.cameraY + state.height / 2) };
  if (!b || state.bossMoves.length >= BOSS_TUNING.hazardLimit) return;
  if (["ring","cage"].includes(kind) && Math.min(state.width, state.height) < 196) return; // 太窄就不封路。
  feedbackSound(moveFeedback(definition,'move'),'warning');
  const angle = Math.atan2(deltaY(p.y, b.y), deltaX(p.x, b.x));
  const move = takeFromPool(state.bossMovePool, {
    id, kind, x: b.x, y: b.y, angle, warning: kind==='tracking'?GAME_DATA.boss.combat.trackingSeconds+GAME_DATA.boss.combat.lockSeconds:Math.max(.6,definition.warning),
    repeats:kind==='combo'?Math.min(3,definition.count+Math.max(0,state.bossPhase-2)):1, recovery:0,
    wallWidth: 0, wallHeight: 0, wallDuration: 0, dodged: false, active: false, pulse: 0, life: 0, points: [], radius: 0, endX: b.x, endY: b.y,
    ai: SurvivorBossAI.start({windup:kind==='tracking'?GAME_DATA.boss.combat.trackingSeconds+GAME_DATA.boss.combat.lockSeconds:Math.max(.6,definition.warning)}),
    count: Math.min(10, definition.count + definition.phaseCount * state.bossPhase)
  });
  if(kind==='leap') {move.radius=definition.radius;move.endX=p.x;move.endY=p.y;move.points=[{x:p.x,y:p.y,r:definition.radius}];}
  if(kind==='tracking') {move.radius=definition.radius;move.points=[{x:p.x,y:p.y,r:definition.radius}];move.x=p.x;move.y=p.y;}
  if(kind==='barriers') {move.x=p.x;move.y=p.y;move.radius=definition.radius;move.wallWidth=definition.distance;}
  if (kind === "wall") { move.wallWidth = state.width - 24; move.wallHeight = state.height; move.x = state.cameraX + 12; move.y = state.cameraY; move.endY = state.cameraY + state.height; move.endX = state.cameraX + state.width - 12; move.wallDuration = Math.max(definition.duration,state.width / definition.speed + .1); }
  if (kind === "dash" || kind==='combo') {
    const length = Math.min(definition.distance, Math.hypot(deltaX(p.x, b.x), deltaY(p.y, b.y)) + 70);
    move.endX = b.x + Math.cos(angle) * length;
    move.endY = b.y + Math.sin(angle) * length;
  }
  if (kind === "rain" || kind === "call") {
    move.radius = definition.radius;
    const count = Math.min(10, definition.count + definition.phaseCount * state.bossPhase);
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2, distance = i ? 85 + Math.random() * 65 : 0;
      const point = { x: p.x + Math.cos(a) * distance, y: p.y + Math.sin(a) * distance, r: move.radius };
      clampToMap(point);
      if (targetVisible(point)) move.points.push(point);
    }
  }
  if (kind === "ring" || kind === "cage") {
    move.radius = Math.min(definition.radius, state.width / 2 - 38, state.height / 2 - 38);
    move.x = Math.max(state.cameraX + move.radius + 12, Math.min(state.cameraX + state.width - move.radius - 12, p.x));
    move.y = Math.max(state.cameraY + move.radius + 12, Math.min(state.cameraY + state.height - move.radius - 12, p.y));
    // 缺口朝向主角；整段綠色弧線不會長出國字。
    move.angle = Math.atan2(deltaY(p.y, move.y), deltaX(p.x, move.x));
  }
  const endX = move.endX, endY = move.endY;
  clampToMap(move);
  move.endX = wrapCoordinate(endX, state.worldWidth); move.endY = wrapCoordinate(endY, state.worldHeight);
  state.boss.recoveryLeft=0;
  state.bossMoves.push(move);
}
function fireBossFan(move) {
  const spread = bossDefinition(move).spread;
  const def=bossDefinition(move), policy=GAME_DATA.boss.combat;
  const speed=state.bossPhase>=2 && ['words','chalk'].includes(def.kind)?(def.kind==='words'?policy.phaseWordsSpeed:policy.phaseChalkSpeed):def.speed;
  for (let i = 0; i < move.count; i++) {
    if (state.enemyShots.filter(shot => shot.source === "teacher").length >= UPGRADE_TUNING.teacherShotLimit) break;
    const a = move.angle + (i - (move.count - 1) / 2) * spread;
    state.enemyShots.push(takeFromPool(state.enemyShotPool, {
      dodged: false, phaseShot:false, remote:bossKind(move)==='sniper', source: "teacher", feedback:feedbackPayload(moveFeedback(bossDefinition(move),'move')), x: move.x, y: move.y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed,
      r: ["chalk","sniper"].includes(bossKind(move)) ? 10 : 17, text: ["chalk","sniper"].includes(bossKind(move)) ? "粉筆" : ["作業！", "認真！", "加油！"][i % 3],
      damage: bossDefinition(move).damage, life: 4
    }));
  }
}
function ringPoints(move) {
  const definition = bossDefinition(move);
  const points = [], gap = bossKind(move) === "cage" ? 0 : definition.gap;
  const endRadius = bossKind(move) === "cage" ? 0 : Math.max(50, move.radius * 0.52); // 收到最後也留得下主角通過的缺口。
  const radius = endRadius + (move.radius - endRadius) * Math.max(0, move.life / definition.duration);
  for (let i = 0; i <= 16; i++) {
    const a = move.angle + gap / 2 + (Math.PI * 2 - gap) * i / 16;
    points.push({ x: move.x + Math.cos(a) * radius, y: move.y + Math.sin(a) * radius, r: 10 });
  }
  return points;
}
function wallX(move) { return move.x + (move.active ? Math.min(move.wallWidth, ((move.wallDuration || bossDefinition(move).duration) - move.life) * bossDefinition(move).speed) : 0); }
function updateBoss(dt) {
  if(state.trial) {updateTrial(dt);return;}
  state.bossShake = countdown(state.bossShake, dt); state.bossShout = countdown(state.bossShout, dt);
  const b = state.boss;
  if (!b || state.bossIntro > 0) { clearBossMoves(); return; }
  b.posture=SurvivorPosture.step(b.posture,null,GAME_DATA.boss.posture,dt).state;
  b.recoveryLeft=countdown(b.recoveryLeft||0,dt);
  b.wobble += dt * 3; b.flash = Math.max(0, b.flash - dt);
  b.slowTimer = countdown(b.slowTimer || 0, dt); b.stunTimer = countdown(b.stunTimer || 0, dt);
  if(b.posture.stun>0) {b.pursuing=false;clearBossMoves();updateHud();return;}
  if(b.stunTimer>0 && state.bossMoves.length) {
    const interrupt=state.bossMoves.some(m=>!(m.recovery>0));clearBossMoves();if(interrupt)teacherPostureEvent('onInterrupt');
  }
  // 逐一跨過 66%、33%；一次大傷害跨兩條線也會依序演出兩次轉場。
  const nextPhase = SurvivorBossAI.phase(GAME_DATA.boss.phases,b.hp/b.maxHp);
  if (nextPhase > state.bossPhase && state.bossPhasePause <= 0) {
    state.bossPhase++; state.bossPhasePause = BOSS_TUNING.phasePause;
    state.bossShout = BOSS_TUNING.phasePause; b.flash = 0.25;
    clearBossMoves(); state.bossRest = GAME_DATA.boss.phases[state.bossPhase - 1].rest;
    tierImpact('large',null,state.boss,{hitStop:0});
  }
  if (state.bossPhasePause > 0) { state.bossPhasePause = countdown(state.bossPhasePause, dt); updateHud(); return; }
  // 預警時老師站定；衝撞只沿預告線走，不追蹤玩家。
  if (!state.bossMoves.length && !(b.stunTimer > 0)) {
    const dx = deltaX(state.player.x, b.x), dy = deltaY(state.player.y, b.y), length = Math.max(1, Math.hypot(dx, dy));
    b.pursuing=length>GAME_DATA.boss.combat.pursuitDistance;
    const speed = (b.speed===0?0:GAME_DATA.boss.phases[state.bossPhase-1].speed) * (b.pursuing?GAME_DATA.boss.combat.pursuitMultiplier:1) * (b.slowTimer > 0 ? (b.makerSlow || BUILD_TUNING.slowMultiplier) : 1);
    b.x += dx / length * speed * dt; b.y += dy / length * speed * dt; clampToMap(b);
  }
  if (b.stunTimer > 0) return;
  if (!state.bossMoves.length) {
    b.ai=SurvivorBossAI.advance({phase:'cooldown',left:state.bossRest},{},dt).state;
    state.bossRest=b.ai.left;
    if (state.bossRest > 0) return;
    if (state.bossRest <= 0) {
      const previousMoves = state.lastBossMoves;
      const choices=teacherChoices(BOSS_MOVES,state.bossPhase,Math.hypot(deltaX(state.player.x,b.x),deltaY(state.player.y,b.y)),targetVisible(b),GAME_DATA.boss.combat,state.lastBossMoves)
        .filter(move=>!['ring','cage'].includes(move.kind)||Math.min(state.width,state.height)>=196);
      if (!choices.length) { state.bossRest = GAME_DATA.boss.phases[state.bossPhase-1].rest; return; }
      const input={phase:state.bossPhase,distance:Math.hypot(deltaX(state.player.x,b.x),deltaY(state.player.y,b.y)),
        angle:Math.atan2(deltaY(state.player.y,b.y),deltaX(state.player.x,b.x))-(b.aiFacing||0),visible:targetVisible(b),previous:state.lastBossMoves};
      const id=SurvivorBossAI.choose(SurvivorBossAI.scores(choices,GAME_DATA.boss.ai.rules,input),Math.random());
      if(!id) {state.bossRest=GAME_DATA.boss.phases[state.bossPhase-1].rest;return;}
      b.aiFacing=Math.atan2(deltaY(state.player.y,b.y),deltaX(state.player.x,b.x));
      b.ai={phase:'select',left:0};
      beginBossMove(id); state.lastBossMoves = [id];
      // 只搭配容易看懂的兩招，避開衝撞與收縮圈同時封路。
      if (state.bossPhase >= 2 && (["rain", "call"].includes(BOSS_MOVES.find(m => m.id === id).kind))) {
        const combo = GAME_DATA.boss.phases[state.bossPhase - 1].combo;
        if (targetVisible(b) && combo && combo !== id && !previousMoves.includes(combo) && GAME_DATA.boss.ai.rules.some(r=>r.moveId===combo && r.weight>0)) { beginBossMove(combo); state.lastBossMoves.push(combo); }
      }
      return; // 開始預告的這幀不扣時間，保證完整預警。
    }
  }
  for (let i = state.bossMoves.length - 1; i >= 0; i--) {
    const move = state.bossMoves[i];
    const kind=bossKind(move),definition=bossDefinition(move),policy=GAME_DATA.boss.combat;
    if(move.recovery>0) {
      move.ai=SurvivorBossAI.advance({phase:'recovery',left:move.recovery},{cooldown:definition.cooldown||0},dt).state;
      move.recovery=move.ai.phase==='recovery'?move.ai.left:0;
      if(move.recovery<=0) {state.bossRest=Math.max(state.bossRest,move.ai.left);state.bossMovePool.push(state.bossMoves.splice(i,1)[0]);}
      continue;
    }
    if (!move.active) {
      if(kind==='sniper')move.angle=Math.atan2(deltaY(state.player.y,move.y),deltaX(state.player.x,move.x));
      if(kind==='tracking' && move.warning>policy.lockSeconds+1e-6) {
        move.x=state.player.x;move.y=state.player.y;move.points=[{x:move.x,y:move.y,r:move.radius}];
      }
      move.ai=SurvivorBossAI.advance({...move.ai,left:move.warning},{active:definition.duration},dt).state;
      move.warning=move.ai.phase==='windup'?move.ai.left:0;
      if (move.warning > 0) continue;
      move.active = true; move.life = ["dash","combo"].includes(kind) ? Math.hypot(deltaX(move.endX, move.x), deltaY(move.endY, move.y)) / bossDefinition(move).speed : (move.wallDuration || bossDefinition(move).duration);
      move.ai={phase:'active',left:move.life};
      if (["words","chalk","sniper"].includes(kind)) { fireBossFan(move); move.pulse = bossDefinition(move).pulse; }
      if (bossKind(move) === "summon") for (let n = 0; n < Math.min(10, bossDefinition(move).count + bossDefinition(move).phaseCount * state.bossPhase); n++) spawnEnemy();
      if (bossKind(move) === "ring" || bossKind(move) === "dash" || bossKind(move) === "rain") bossFeedbackShake(move);
      continue; // 出手畫面至少呈現一幀，再開始範圍命中判斷。
    }
    if(kind==='leap') {
      const progress=Math.min(1,1-Math.max(0,move.life-dt)/definition.duration);
      b.x=wrapCoordinate(move.x+deltaX(move.endX,move.x)*progress,state.worldWidth);
      b.y=wrapCoordinate(move.y+deltaY(move.endY,move.y)*progress,state.worldHeight);
      if(progress>=1) {
        if(Math.hypot(deltaX(state.player.x,b.x),deltaY(state.player.y,b.y))<move.radius+state.player.r) {
          const beforeHealth=state.player.health;
          bossHurtPlayer(definition.damage,moveFeedback(definition,'move'));
          if(state.player.health<beforeHealth) {
            const angle=Math.atan2(deltaY(state.player.y,b.y),deltaX(state.player.x,b.x));
            shiftTarget(state.player,state.player.x-Math.cos(angle),state.player.y-Math.sin(angle),policy.leapPush);
          }
        }
        move.recovery=Math.max(policy.leapRecovery,definition.recovery||0);move.ai={phase:'recovery',left:move.recovery};noteBossRecovery(b,move.id,move.recovery);bossFeedbackShake(move);continue;
      }
    } else if(kind==='barriers') {
      // 兩側短牆；上下均有缺口。碰撞沿用位移修正，不造成隱形傷害。
      for(const sign of [-1,1]) {
        const dx=deltaX(state.player.x,move.x+sign*move.wallWidth),dy=deltaY(state.player.y,move.y);
        if(Math.abs(dx)<state.player.r+8 && Math.abs(dy)<move.radius+state.player.r) {
          state.player.x=wrapCoordinate(move.x+sign*move.wallWidth+(dx>=0?1:-1)*(state.player.r+8),state.worldWidth);
        }
      }
    } else if (bossKind(move) === "wall") {
      if (Math.abs(deltaX(wallX(move),state.player.x)) < state.player.r + 10 && deltaY(state.player.y,move.y) >= 0 && deltaY(state.player.y,move.y) <= move.wallHeight) bossHurtPlayer(bossDefinition(move).damage,moveFeedback(bossDefinition(move),'move'));
    } else if (bossKind(move) === "chalk") {
      move.pulse = countdown(move.pulse, dt);
      if (move.pulse <= 0) { fireBossFan(move); move.pulse = bossDefinition(move).pulse; }
    } else if (["rain","call","tracking"].includes(kind)) {
      for (const point of move.points) if (targetVisible(point) && Math.hypot(deltaX(state.player.x, point.x), deltaY(state.player.y, point.y)) < point.r + state.player.r) bossHurtPlayer(bossDefinition(move).damage,moveFeedback(bossDefinition(move),'move'));
    } else if (bossKind(move) === "cage") {
      const radius = move.radius * Math.max(0,move.life/bossDefinition(move).duration);
      if (Math.abs(Math.hypot(deltaX(state.player.x,move.x),deltaY(state.player.y,move.y))-radius) < state.player.r+10) bossHurtPlayer(bossDefinition(move).damage,moveFeedback(bossDefinition(move),'move'));
    } else if (bossKind(move) === "ring") {
      for (const point of ringPoints(move)) if (targetVisible(point) && Math.hypot(deltaX(state.player.x, point.x), deltaY(state.player.y, point.y)) < point.r + state.player.r) bossHurtPlayer(bossDefinition(move).damage,moveFeedback(bossDefinition(move),'move'));
    } else if (["dash","combo"].includes(kind)) {
      const dx = deltaX(move.endX, b.x), dy = deltaY(move.endY, b.y), length = Math.hypot(dx, dy);
      const step = Math.min(length, bossDefinition(move).speed * dt);
      if (length > 0) { b.x += dx / length * step; b.y += dy / length * step; clampToMap(b); }
      if (Math.hypot(deltaX(b.x, state.player.x), deltaY(b.y, state.player.y)) < b.r + state.player.r) bossHurtPlayer(bossDefinition(move).damage,moveFeedback(bossDefinition(move),'move'));
    }
    if (state.mode !== "playing" || state.boss !== b) { clearBossMoves(); return; }
    if(!state.bossMoves.includes(move)){updateHud();return;} // 反擊可能在命中接合層打斷本招。
    move.ai=SurvivorBossAI.advance({phase:'active',left:move.life},{recovery:definition.recovery||0},dt).state;
    move.life=move.ai.phase==='active'?move.ai.left:0;
    if(move.life<=0 && kind==='combo' && move.repeats>1) {
      const repeats=move.repeats-1;state.bossMovePool.push(state.bossMoves.splice(i,1)[0]);
      beginBossMove(move.id);const next=state.bossMoves[state.bossMoves.length-1];if(next){next.repeats=repeats;next.warning=Math.max(.6,definition.warning);}
    } else if (move.life <= 0) {
      noteBossRecovery(b,move.id,definition.recovery||.6);
      if(definition.recovery>0) {move.recovery=definition.recovery;move.ai={phase:'recovery',left:move.recovery};}
      else {state.bossRest=Math.max(state.bossRest,definition.cooldown||0);state.bossMovePool.push(state.bossMoves.splice(i,1)[0]);}
    }
  }
  if (!state.bossMoves.length) {state.bossRest = Math.max(state.bossRest,GAME_DATA.boss.phases[state.bossPhase - 1].rest);b.recoveryLeft=state.bossRest;}
  if(state.bossMoves.length) b.ai={...state.bossMoves[0].ai};
  updateHud();
}


// Live accessors preserve shared state and the legacy globals used by preview/VM callers.
globalThis.Survivor.engine = globalThis.Survivor.engine || {};
globalThis.Survivor.engine.boss = globalThis.Survivor.engine.boss || {};
Object.defineProperties(globalThis.Survivor.engine.boss, {
  startBossZone: { enumerable: true, get: () => startBossZone },
  bossZoneDistance: { enumerable: true, get: () => bossZoneDistance },
  outsideBossZone: { enumerable: true, get: () => outsideBossZone },
  updateBossZone: { enumerable: true, get: () => updateBossZone },
  bossZoneSpawn: { enumerable: true, get: () => bossZoneSpawn },
  summonTeacher: { enumerable: true, get: () => summonTeacher },
  clearBossMoves: { enumerable: true, get: () => clearBossMoves },
  bossHurtPlayer: { enumerable: true, get: () => bossHurtPlayer },
  bossDefinition: { enumerable: true, get: () => bossDefinition },
  bossKind: { enumerable: true, get: () => bossKind },
  beginBossMove: { enumerable: true, get: () => beginBossMove },
  fireBossFan: { enumerable: true, get: () => fireBossFan },
  ringPoints: { enumerable: true, get: () => ringPoints },
  updateBoss: { enumerable: true, get: () => updateBoss }
});

// ✏️ Erin 設定在 data/defaults.js 的 bossZone，Maker「魔王」也能改。
// 老師出場時的戰場（鏡頭）中心固定下來，不追著主角跑；接縫共用 wrapped 距離。
function startBossZone() {
  const config = GAME_DATA.bossZone;
  state.bossZone = !PREVIEW_MODE && config.enabled ? {
    x: state.player.x, y: state.player.y, span: config.initialRadius,
    radius: config.initialRadius, target: config.initialRadius,
    completed: 0, warning: 0, shrinking: false
  } : null;
}
function bossZoneDistance(body) {
  const z = state.bossZone;
  return z ? Math.hypot(deltaX(body.x, z.x), deltaY(body.y, z.y)) : 0;
}
function outsideBossZone() {
  return !!(state.boss && state.bossZone && bossZoneDistance(state.player) > state.bossZone.radius);
}
function updateBossZone(dt) {
  const z = state.bossZone, config = GAME_DATA.bossZone;
  if (!state.boss || !config.enabled || PREVIEW_MODE) { state.bossZone = null; return; }
  if (!z || state.mode !== "playing" || state.bossIntro > 0) return;
  const due = Math.min(config.steps, state.bossPhase);
  if (!z.shrinking && z.warning <= 0 && z.radius <= z.target && z.completed < due) {
    z.target = config.initialRadius+(config.finalRadius-config.initialRadius)*(z.completed+1)/config.steps;
    z.warning = config.warning; playSound("warning");
  }
  // 完成每次預告才開始收圈；大傷害跨階段也按順序預告。
  if (z.warning > 0) z.warning = countdown(z.warning, dt);
  else if (z.radius > z.target) {
    z.shrinking = true;
    z.radius = Math.max(z.target, z.radius - config.speed * dt);
    if (z.radius <= z.target) { z.completed++; z.shrinking = false; }
  }
  // 紫霧是持續小傷害，不觸發反擊、連續音效或受傷無敵；衝刺仍可保護。
  if (outsideBossZone() && !state.player.damageDisabled && state.player.invincible <= 0 && config.damage > 0) {
    state.player.health = Math.max(0, state.player.health - SurvivorWeapons.receivedDamage(config.damage, activeWeapon()) * Math.min(dt, MAX_DT));
    updateHud();
    if (state.player.health <= 0) finishRun(false);
  }
}
function bossZoneSpawn(r) {
  // 安全圈只影響主角；小怪可在紫霧裡生成，再走向主角。
  return offscreenSpawn(r);
}
