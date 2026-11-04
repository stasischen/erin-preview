function countdown(value, dt) { return value - dt < 0.000001 ? 0 : value - dt; }

function tick(dt,clockDt=dt) {return withImpactBatch(()=>tickImpacts(dt,clockDt));}
function tickImpacts(dt,clockDt=dt) {
  const inputDt=dt;
  // 試煉用活動中的真實 dt；不含入口預警／暫停，不因完美閃避慢動作縮短紀錄。
  if(state.mode==='playing'&&state.trial&&state.trial.entry<=0)state.trial.elapsed+=Math.max(0,clockDt);
  if(state.mode==='playing') {
    state.juiceClock=(state.juiceClock||0)+dt;
    state.hitShake=countdown(state.hitShake||0,dt);
    if(!GAME_DATA.hitJuice.enabled || !GAME_DATA.hitJuice.intensity) {state.hitStop=0;state.hitShake=0;}
    state.hitStop=countdown(state.hitStop||0,dt);
    state.trauma=SurvivorFeedback.trauma(state.trauma,0,dt);
    for(const t of [state.player,...state.enemies,...(state.trial?trialBodies():state.boss?[state.boss]:[])]) {
      if((t.hitStop||0)>0 && GAME_DATA.hitJuice.enabled && GAME_DATA.hitJuice.intensity>0) {t.feedbackFrozen=true;t.hitStop=countdown(t.hitStop,dt);}
      else {delete t.feedbackFrozen;delete t.hitStop;}
    }
    for(const t of combatTargets()) t.impactSquash=countdown(t.impactSquash||0,dt);
  }
  if (state.mode === "playing" && state.slowMotion > 0) {
    state.slowMotion = countdown(state.slowMotion, dt);
    dt *= UPGRADE_TUNING.perfectSlowScale;
  }
  if (state.mode === "transition") {
    state.stageTransition = countdown(state.stageTransition, dt);
    if (state.stageTransition <= 0) { state.mode = "playing"; state.keys.clear(); updateActionControls(); }
    return;
  }
  if (state.mode !== "playing") return;
  if (openEncounterReward()) return;
  for(const target of [state.player,...state.enemies.filter(e=>e.alive),...(state.trial?trialBodies():state.boss?[state.boss]:[])]) if(!target.feedbackFrozen)updateTargetSlide(target,dt);
  if(state.mode!=="playing") return;
  updateCamera();
  updateSkillVisuals(dt);
  updateMakerEffects(dt);
  if (state.mode !== "playing") return;
  state.elapsed += dt; state.stageElapsed += dt;
  if(!state.trial)startBookShooting();
  state.bookNoticeTimer = Math.max(0, state.bookNoticeTimer - dt);
  enemyNotice.hidden = state.bookNoticeTimer <= 0;
  const healLevel = effectLevel("auto-heal");
  if (healLevel > 0) {
    state.healTimer += dt;
    const healInterval = cardBlock('auto-heal','onHealTick').interval;
    while (state.healTimer >= healInterval) {
      state.healTimer -= healInterval;
      if (SurvivorEffectBlocks.matches(cardBlock('auto-heal','onHealTick').conditions[0],{health:state.player.health,maxHealth:maxPlayerHealth()})) {
        state.player.health = Math.min(maxPlayerHealth(), state.player.health + cardBlock('auto-heal','onHealTick').actions[0].amount);
        addHealEffect();
        updateHud();
      }
    }
  }
  const playerDt=state.player.feedbackFrozen?0:dt;
  const input = movementInput();
  let dx = input.x, dy = input.y;
  if (Math.hypot(dx, dy) > 0.01) {
    const length = Math.hypot(dx, dy); state.faceX = dx / length; state.faceY = dy / length;
  }
  const dashTime = Math.min(playerDt, state.dashTimer);
  const speed = PLAYER_SPEED * SurvivorAbilities.speed() * cardBlock('wind-light','onMove').actions[0].multiplier * cardBlock('onion-dash','onMove').actions[0].multiplier * (outsideBossZone() ? 0.8 : 1) * syrupSpeed() * (state.trial ? state.trial.slow : 1);
  const oldX = state.player.x, oldY = state.player.y;
  state.player.x += speed * (dx * (playerDt - dashTime) + state.dashX * gameSettings.dashMultiplier * dashTime);
  state.player.y += speed * (dy * (playerDt - dashTime) + state.dashY * gameSettings.dashMultiplier * dashTime);
  clampToMap(state.player); updateCamera();
  // 這幀有衝刺就保護到碰撞判斷結束，最後才扣時間。
  if (state.dashTimer > 0 && !state.player.damageDisabled) state.player.invincible = Math.max(state.player.invincible, dt);
  state.dashTimer = countdown(state.dashTimer, playerDt);
  if (dashTime > 0 && state.dashTimer === 0) schoolDashEnded();
  if (state.dashCharges < maxDashCharges()) {
    state.dashCooldown = countdown(state.dashCooldown, dt);
    if (state.dashCooldown <= 0) {
      state.dashCharges++;
      if (state.dashCharges < maxDashCharges()) state.dashCooldown = gameSettings.dashCooldown;
    }
  }
  if (dashTime > 0) state.dashAttack = UPGRADE_TUNING.dashAttackSeconds;
  else state.dashAttack = countdown(state.dashAttack, dt);
  state.dashGhosts = state.dashGhosts.filter(g => (g.life -= dt) > 0);
  if (dashTime > 0) state.dashGhosts.push({x:oldX,y:oldY,life:.22});
  state.skillCooldown = countdown(state.skillCooldown, dt);
  if (typeof tickManualAttack === "function") tickManualAttack(playerDt);
  flushBufferedInput(inputDt);
  if (state.mode !== "playing") return;
  updateActionControls();
  if (dashTime > 0) schoolDashCrossed(oldX,oldY,state.player.x,state.player.y);
  if (dashTime > 0) leaveDashTrail(state.player.x, state.player.y, Math.hypot(deltaX(state.player.x, oldX), deltaY(state.player.y, oldY)), oldX, oldY);
  state.moveRate = Math.hypot(deltaX(state.player.x, oldX), deltaY(state.player.y, oldY)) / Math.max(.001, dt) / PLAYER_SPEED;
  updateNeutralItems(dt);
  if (state.mode !== "playing") return;
  updateSchoolCombat(dt);
  if (state.mode !== "playing") return;
  updateUltimate(dt);
  if (state.mode !== "playing") return;
  updateFields(dt);
  if (state.mode !== "playing") return;
  updateBomb(dt);
  if (state.mode !== "playing") return;

  if(state.player.perfectFlash>0)state.player.perfectFlash=countdown(state.player.perfectFlash,dt);
  const moved = Math.hypot(deltaX(state.player.x, oldX), deltaY(state.player.y, oldY));
  state.player.moving = moved > 0.001;
  if(state.loadout)SurvivorLoadout.charge(dt);
  else if (GAME_DATA.attackMode !== "manual") state.weaponAttack=SurvivorEffectBlocks.attackTick(state.weaponAttack,activeWeapon(),dt,state.player.moving,teacherBonuses().charge);
  if (state.player.moving) state.player.walkPhase += moved / 12;
  else state.player.walkPhase = 0;
  if (deltaX(state.player.x, oldX)) state.player.facing = deltaX(state.player.x, oldX) > 0 ? 1 : -1;

  if(!state.trial) {updatePacing(dt);updateEncounters(dt);}
  SurvivorWaves.update();
  state.spawnTimer -= dt;
  if (!state.trial && !state.boss && state.stageElapsed >= SurvivorWaves.bossTime() && state.bossIntro <= 0) summonTeacher();
  if (!state.trial && !state.boss) {
    let wave = currentWaves()[0];
    for (const row of currentWaves()) if (state.stageElapsed >= row.start) wave = row;
    const spawnEvery = (SurvivorWaves.enabled()?SurvivorWaves.current().every:wave.every) / gameSettings.spawnScale / SurvivorPacing.density(GAME_DATA.pacing,state.stageElapsed);
    while (state.spawnTimer <= 0) {
      if(SurvivorWaves.enabled())SurvivorWaves.spawnBatch();
      else for(let i=0;i<(wave.count||1);i++) spawnEnemy({typeId:wave.typeId==='pacing'?undefined:wave.typeId,side:SurvivorPacing.side(wave.position,i),offscreen:wave.position==='random'});
      if(wave.sound==='warning') playSound('warning');
      if(wave.hint) {enemyNotice.textContent='新一批怪物進場了！';enemyNotice.hidden=false;state.bookNoticeTimer=2;}
      state.spawnTimer += spawnEvery;
    }
  }
  if (state.bossIntro > 0) {
    if(!state.trial)state.bossIntro -= dt;
    for (const enemy of state.enemies) { if (enemy.miniboss) continue; enemy.x += (deltaX(state.boss.x, enemy.x)) * Math.min(1, dt * 3); enemy.y += (deltaY(state.boss.y, enemy.y)) * Math.min(1, dt * 3); }
    if (state.bossIntro <= 0) { burst(state.boss.x, state.boss.y, "#fff36b", 32); updateHud(); }
  }
  state.shotTimer -= playerDt;
  if (!state.loadout && GAME_DATA.attackMode !== 'manual' && dashTime>0 && state.dashTimer===0 && activeWeapon().id==='candy-sword' && activeWeapon().dashThrust) {swingAtNearest(true);if(state.mode!=='playing')return;state.shotTimer=effectiveShotInterval()+state.attackRecovery;state.attackRecovery=0;}
  if(state.loadout){SurvivorLoadout.tick(dt);if(state.mode!=='playing')return;}
  if (!state.loadout && !state.player.feedbackFrozen && GAME_DATA.attackMode !== "manual" && state.shotTimer <= 0) { fireAtNearest(); if (state.mode !== "playing") return; state.shotTimer += effectiveShotInterval()+(state.attackRecovery||0); state.attackRecovery=0; }
  for (const enemy of state.enemies) {
    if (!enemy.alive || enemy.feedbackFrozen) continue;
    if(state.trial && enemy.emergeTimer>0) {enemy.emergeTimer=countdown(enemy.emergeTimer,dt);continue;}
    const aim=SurvivorAbilities.lure(enemy);
    const vx = deltaX(aim.x, enemy.x), vy = deltaY(aim.y, enemy.y);
    const distance = Math.max(0.01, Math.hypot(vx, vy));
    if(!targetVisible(enemy)) enemy.phaseAttack=null;
    updateEnemyBehavior(enemy,dt);
    if(state.mode!=="playing") return;
    if(!enemy.alive) continue;
    const direction=enemyDirection(enemy,distance), curve=enemy.behavior==='fast' ? Math.sin(enemy.wobble)*.65 : 0;
    const speed=enemy.speed*eliteSpeed(enemy)*direction*(enemy.stunTimer>0?0:1)*(enemy.slowTimer>0?(enemy.makerSlow||BUILD_TUNING.slowMultiplier):1)*(SurvivorWaves.enabled()?1:1+Math.floor(state.stageElapsed/30)*UPGRADE_TUNING.enemySpeedGrowth);
    enemy.x += (vx-vy*curve)/distance * speed * dt;
    enemy.y += (vy+vx*curve)/distance * speed * dt;
    clampToMap(enemy);
    enemy.stunTimer = countdown(enemy.stunTimer || 0, dt);
    enemy.slowTimer = Math.max(0, (enemy.slowTimer || 0) - dt);
    enemy.wobble += dt * 6 * (enemy.weightStep||1);
    enemy.flash = Math.max(0, enemy.flash - dt);
  }
  if(!GAME_DATA.bodySeparation.enabled) separateTanks();
  for (const shot of state.projectiles) {
    if (!shot.alive) continue;
    if(dt>0 && (shot.hitStop||0)>0){shot.hitStop=countdown(shot.hitStop,dt);continue;}
    shot.x += shot.vx * dt; shot.y += shot.vy * dt;
    shot.rangeLeft -= Math.hypot(shot.vx, shot.vy) * dt;
    if (shot.rangeLeft <= 0) { if(shot.bigBubble) resolveWaterHit(shot); if(state.mode!=="playing")return; shot.alive = false; continue; }
    clampToMap(shot);
    if(!shot.alive)continue;
    for (const enemy of state.enemies) {
      if (enemy.alive && canAttackTarget(enemy) && !shot.hitList.includes(enemy) && Math.hypot(deltaX(enemy.x, shot.x), deltaY(enemy.y, shot.y)) < enemy.r + shot.r) {
        shot.hitList.push(enemy);
        schoolShotHit(shot, enemy);
        damageEnemy(enemy, shot.damage);feedbackImpact(shot.feedback,true,shot,enemy);
        if (!enemy.alive) splitNeutralShot(shot);
        for (const school of shot.schools || []) schoolEffect(school, enemy, school === "wind" ? state.player.x : enemy.x, school === "wind" ? state.player.y : enemy.y, shot.damage, shot.hitList);
        if (state.mode !== "playing") return;
        if (effectLevel("splash-water") > 0) {
          const splash=cardBlock('splash-water','onShotHit',{damage:shot.damage}), radius=splash.conditions[0].radius;
          skillVisual("splash", enemy.x, enemy.y, { radius });
          for (const nearby of state.enemies) if (nearby !== enemy && nearby.alive && canAttackTarget(nearby) && !shot.hitList.includes(nearby) && cardBlockMatches(splash.conditions[0],nearby,enemy.x,enemy.y)) { shot.hitList.push(nearby); damageEnemy(nearby, splash.actions[0].amount); }
        }
        resolveWaterHit(shot);
        if (state.mode !== "playing") return;
        if (!shot.alive) break;
      }
    }
    if(state.trial&&state.trial.actors)for(const body of trialBodies()) {
      if(!shot.alive||!canAttackTarget(body)||shot.hitList.includes(body)||Math.hypot(body.x-shot.x,body.y-shot.y)>=body.r+shot.r)continue;
      withTrialBody(body,()=>{
        shot.hitList.push(body);schoolShotHit(shot,body);
        if(!bossWeakpointConfig(body))feedbackImpact(shot.feedback,true,shot,body);
        hitBuildTarget(body,shot.damage,{charged:shot.autoCharged,source:{x:body.x-shot.vx,y:body.y-shot.vy},point:shot,attacker:shot});
        if(state.mode==='playing'){for(const school of shot.schools||[])schoolEffect(school,body,body.x,body.y,shot.damage,shot.hitList);resolveWaterHit(shot);}
      });
      if(state.mode!=='playing')return;
    }
    if (!(state.trial&&state.trial.actors) && shot.alive && state.boss && canAttackTarget(state.boss) && !shot.hitList.includes(state.boss) && Math.hypot(deltaX(state.boss.x, shot.x), deltaY(state.boss.y, shot.y)) < state.boss.r + shot.r) {
      shot.hitList.push(state.boss);
      const boss = state.boss;
      schoolShotHit(shot, boss);
      if(!bossWeakpointConfig(boss))feedbackImpact(shot.feedback,true,shot,boss);
      hitBuildTarget(boss,shot.damage,{charged:shot.autoCharged,source:{x:boss.x-shot.vx,y:boss.y-shot.vy},point:shot,attacker:shot});
      if(state.mode!=='playing')return;
      for (const school of shot.schools || []) schoolEffect(school, boss, school === "wind" ? state.player.x : boss.x, school === "wind" ? state.player.y : boss.y, shot.damage, shot.hitList);
      resolveWaterHit(shot);
      if (state.mode !== "playing") return;
      if (state.boss && state.boss.hp <= 0) { tierImpact('large',state.player,state.boss);state.boss = null; finishRun(true); return; }
    }
  }
  for (let i = state.projectiles.length - 1; i >= 0; i--) {
    if (!state.projectiles[i].alive) state.projectilePool.push(state.projectiles.splice(i, 1)[0]);
  }
  state.enemies = state.enemies.filter((enemy) => enemy.alive);
  updateBookShooting(dt);
  if(state.trial&&state.trial.actors||!state.boss || !state.boss.feedbackFrozen)updateBoss(dt);
  updateBossWeakpoints(dt);
  updateBossZone(dt);
  if (state.mode !== "playing") return;
  for (let i = state.enemyShots.length - 1; i >= 0; i--) {
    const shot = state.enemyShots[i];
    if(dt>0 && (shot.hitStop||0)>0){shot.hitStop=countdown(shot.hitStop,dt);continue;}
    if(shot.phaseShot && (shot.life=countdown(shot.life,dt))<=0) {state.enemyShotPool.push(state.enemyShots.splice(i,1)[0]);continue;}
    shot.x += shot.vx * dt; shot.y += shot.vy * dt; clampToMap(shot);
    if(state.trial&&shot.wallHit){state.enemyShotPool.push(state.enemyShots.splice(i,1)[0]);continue;}
    if (shot.source === "teacher" && (!state.boss || (!targetVisible(shot) && !shot.remote) || (shot.life -= dt) <= 0)) {
      state.enemyShotPool.push(state.enemyShots.splice(i, 1)[0]); continue;
    }
    if (schoolWindWall() && cardBlockMatches(cardBlock('wind-eye','onEnemyShot').conditions[0],shot,state.player.x,state.player.y)) { state.enemyShotPool.push(state.enemyShots.splice(i, 1)[0]); continue; }
    if (Math.hypot(deltaX(shot.x, state.player.x), deltaY(shot.y, state.player.y)) < state.player.r + shot.r) {
      if (state.practiceHit) pacingHurtPlayer(shot.damage || 0,shot.feedback);
      if (!state.player.damageDisabled && state.player.invincible <= 0) { feedbackImpact(shot.feedback,true,shot,state.player);state.player.health = Math.max(0, state.player.health - absorbSchoolHit(shot.damage === undefined ? UPGRADE_TUNING.teacherShotDamage : shot.damage)); counterDischarge(); if (state.mode !== "playing") return; state.player.hitFlash = 0.16; state.player.invincible = INVINCIBLE_SECONDS; if (gameSettings.vibration && navigator.vibrate) navigator.vibrate(35); playSound("hurt"); updateHud(); }
      state.enemyShotPool.push(state.enemyShots.splice(i, 1)[0]);
    } else if (!shot.phaseShot && shot.source !== "teacher" && ((shot.life = (shot.life === undefined ? 8 : shot.life) - dt) <= 0)) state.enemyShotPool.push(state.enemyShots.splice(i, 1)[0]);
  }
  if (state.player.health <= 0) { finishRun(false); return; }
  for (const gem of state.gems) {
    if (!gem.alive) continue;
    gem.wobble += dt * 5;
    const dx = deltaX(state.player.x, gem.x), dy = deltaY(state.player.y, gem.y), distance = Math.hypot(dx, dy);
    const pullRadius = GEM_PULL_RADIUS * (effectLevel("item-magnet") ? cardBlock('item-magnet','onPickup').actions[0].multiplier : 1) * cardBlock('wind-light','onPickup').actions[0].multiplier * cardBlock('gem-magnet','onPickup').actions[0].multiplier;
    if (distance < pullRadius && distance > 0.1) { const speed = 150 + (pullRadius - distance) * 3; gem.x += dx / distance * speed * dt; gem.y += dy / distance * speed * dt; }
    clampToMap(gem);
    if (distance < state.player.r + gem.r + 3) { gem.alive = false; neutralEvent("pickup", gem.x, gem.y); grantExperience(gem.value); if (state.mode === "levelup") break; }
  }
  if (state.mode === "levelup") return;
  for (let i = state.gems.length - 1; i >= 0; i--) {
    if (!state.gems[i].alive) state.gemPool.push(state.gems.splice(i, 1)[0]);
  }

  for (const effect of state.effects) { effect.life -= dt; effect.x += effect.vx * dt; effect.y += effect.vy * dt; clampToMap(effect); }
  for (let i = state.effects.length - 1; i >= 0; i--) {
    if (state.effects[i].life <= 0) state.effectPool.push(state.effects.splice(i, 1)[0]);
  }
  // 先判斷碰撞，再減少無敵時間，避免最後一幀又被撞一次。
  if (!state.player.damageDisabled && state.player.invincible <= 0) {
    const touchingEnemy = state.enemies.find((enemy) => enemy.alive && (enemy.miniboss || !GAME_DATA.bodyContact.pushOnly) && Math.hypot(deltaX(enemy.x, state.player.x), deltaY(enemy.y, state.player.y)) < enemy.r + state.player.r - 2);
    const touchingBoss = !state.trial && state.boss && targetVisible(state.boss) && state.bossIntro <= 0 && state.bossPhasePause <= 0 && !(state.boss.posture&&state.boss.posture.stun>0) && !(state.boss.stunTimer>0) && !state.bossMoves.some(move => bossKind(move) === "dash") && Math.hypot(deltaX(state.boss.x, state.player.x), deltaY(state.boss.y, state.player.y)) < state.boss.r + state.player.r - 2;
    if (touchingEnemy || touchingBoss) {
      tierImpact('small',touchingEnemy||state.boss,state.player);
      state.player.health = Math.max(0, state.player.health - absorbSchoolHit(touchingEnemy ? bodyContactDamage(touchingEnemy) : UPGRADE_TUNING.enemyDamage));
      counterDischarge(); if (state.mode !== "playing") return;
      state.player.invincible = INVINCIBLE_SECONDS;
      state.player.hitFlash = 0.16;
      if (gameSettings.vibration && navigator.vibrate) navigator.vibrate(35);
      playSound("hurt");
      updateHud();
    }
  }
  const bodyPass = dashTime>0 || state.dashBodyPass>0;
  separateEnemyBodies(dt,{x:oldX,y:oldY},bodyPass);
  state.dashBodyPass = countdown(state.dashBodyPass,dt);
  // 保留舊作品「只推開」行為；新分離關閉時才使用，不阻擋衝刺。
  if(!GAME_DATA.bodySeparation.enabled && !bodyPass) pushEnemyBodies();
  state.player.invincible = Math.max(0, state.player.invincible - dt);
  state.player.hitFlash = Math.max(0, state.player.hitFlash - dt);
  if (state.player.health <= 0) { finishRun(false); return; }
  // 計時器下方小字倒數魔王，讓玩家知道還要撐多久；魔王出場或試煉時不顯示。
  const bossLeft=!state.trial&&!PREVIEW_MODE&&!state.boss&&state.bossIntro<=0?Math.ceil(SurvivorWaves.bossTime()-state.stageElapsed):0;
  const statusKey=Math.floor(state.elapsed)+'|'+bossLeft;
  if(statusEl.dataset.key!==statusKey){
    statusEl.dataset.key=statusKey;statusEl.textContent=`${Math.floor(state.elapsed)} 秒`;
    if(bossLeft>0){const eta=document.createElement('small');eta.className='boss-eta';eta.textContent=`魔王 ${bossLeft} 秒後來`;statusEl.appendChild(eta);}
  }
}

// 小型背景圖塊預先繪製並快取；逐幀只貼鏡頭內圖塊，不配置世界大小的圖片。

function renderLoop(now=0) {
  if(state.mode!=='playing') {const dt=Math.min(.05,Math.max(0,(now-(state.visualTime||now))/1000));state.trauma=SurvivorFeedback.trauma(state.trauma,0,dt);state.juiceClock=(state.juiceClock||0)+dt;}
  state.visualTime=now;render(); requestAnimationFrame(renderLoop);
}

function scheduleFrame() { if (frameRequest !== null) return; frameRequest = requestAnimationFrame(frame); }
function frame(now) { Survivor.audio.sync(); frameRequest = null; const clockDt = Math.max(0, (now - state.lastTime) / 1000), dt = Math.min(MAX_DT, clockDt); state.lastTime = now; tick(dt,clockDt); if (state.mode === "playing" || state.mode === "transition") scheduleFrame(); }
function togglePause() { if (!settingsPanel.hidden || state.mode === "levelup") return; if (state.mode === "playing") { if (frameRequest !== null) { cancelAnimationFrame(frameRequest); frameRequest = null; } showOverlay("paused"); } else if (state.mode === "paused") { state.mode = "playing"; overlay.classList.add("hidden"); SurvivorIcons.set(pauseButton, "settings"); updateActionControls(); state.lastTime = performance.now(); scheduleFrame(); } }


// Live accessors preserve shared state and the legacy globals used by preview/VM callers.
globalThis.Survivor.engine = globalThis.Survivor.engine || {};
globalThis.Survivor.engine.loop = globalThis.Survivor.engine.loop || {};
Object.defineProperties(globalThis.Survivor.engine.loop, {
  wrapCoordinate: { enumerable: true, get: () => wrapCoordinate },
  wrapDelta: { enumerable: true, get: () => wrapDelta },
  deltaX: { enumerable: true, get: () => deltaX },
  deltaY: { enumerable: true, get: () => deltaY },
  clampToMap: { enumerable: true, get: () => clampToMap },
  updateCamera: { enumerable: true, get: () => updateCamera },
  resetMap: { enumerable: true, get: () => resetMap },
  fitVisibleViewport: { enumerable: true, get: () => fitVisibleViewport },
  resize: { enumerable: true, get: () => resize },
  resetGame: { enumerable: true, get: () => resetGame },
  startGame: { enumerable: true, get: () => startGame },
  finishRun: { enumerable: true, get: () => finishRun },
  countdown: { enumerable: true, get: () => countdown },
  tick: { enumerable: true, get: () => tick },
  renderLoop: { enumerable: true, get: () => renderLoop },
  scheduleFrame: { enumerable: true, get: () => scheduleFrame },
  frame: { enumerable: true, get: () => frame },
  togglePause: { enumerable: true, get: () => togglePause }
});
