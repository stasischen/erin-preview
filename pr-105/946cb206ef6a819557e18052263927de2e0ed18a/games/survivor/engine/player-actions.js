function imminentDashThreat() {
  const p = state.player, window = UPGRADE_TUNING.perfectWindow;
  const near = (x,y,r) => Math.hypot(deltaX(x,p.x),deltaY(y,p.y)) <= r + p.r;
  if (p.invincible > 0 || p.damageDisabled) return false;
  for (const enemy of state.enemies) {
    if (enemy.alive && enemy.damage > 0 && !enemy.dodged && near(enemy.x,enemy.y,enemy.r + (enemy.speed || 0)*window)) {
      enemy.dodged = true; return true;
    }
  }
  for (const shot of state.enemyShots) {
    if(shot.source==="teacher")continue;
    const dx = deltaX(shot.x,p.x), dy = deltaY(shot.y,p.y);
    const speed2 = shot.vx ** 2 + shot.vy ** 2;
    const t = speed2 ? Math.max(0,Math.min(window,-(dx*shot.vx+dy*shot.vy)/speed2)) : 0;
    if (!shot.dodged && near(p.x+dx+shot.vx*t,p.y+dy+shot.vy*t,shot.r)) { shot.dodged = true; return true; }
  }
  for (const h of state.enemyHazards) if (!h.dodged && h.warning <= window && near(h.x,h.y,h.r)) { h.dodged = true; return true; }
  return false;
}
function activateDash() {
  if(state.mode==='playing' && ((state.player.hitStop||0)>0 || state.player.feedbackFrozen)) {bufferAction({kind:'dash'});return;}
  if (state.mode !== "playing" || state.dashTimer > 0 || state.dashCharges <= 0) return;
  const teacherThreat=teacherDodgeThreat();
  const perfect = teacherThreat || imminentDashThreat();
  const input = movementInput(), length = Math.hypot(input.x, input.y);
  state.dashX = length > 0.01 ? input.x / length : state.faceX;
  state.dashY = length > 0.01 ? input.y / length : state.faceY;
  state.faceX = state.dashX; state.faceY = state.dashY;
  state.trailDistance = BUILD_TUNING.trailSpacing;
  leaveDashTrail(state.player.x, state.player.y, 0);
  triggerMakerEffects("dash", state.player.x, state.player.y);
  skillVisual("gust", state.player.x, state.player.y, { x2: state.player.x + state.dashX * 60, y2: state.player.y + state.dashY * 60, color: "#23815e" });
  state.dashCharges--;
  if (state.dashCooldown <= 0) state.dashCooldown = gameSettings.dashCooldown;
  state.dashTimer = gameSettings.dashSeconds;
  state.dashBodyPass = Math.max(gameSettings.dashSeconds, UPGRADE_TUNING.dashInvincible);
  state.dashAttack = UPGRADE_TUNING.dashAttackSeconds;
  if (perfect) {
    tierImpact('medium',teacherThreat?state.boss:null,state.player);
    teacherPerfectDodge(teacherThreat);
    state.player.health = Math.min(maxPlayerHealth(), state.player.health + UPGRADE_TUNING.perfectHeal);
    state.dashBodyPass = Math.max(state.dashBodyPass, UPGRADE_TUNING.perfectShield);
    state.player.invincible = Math.max(state.player.invincible, UPGRADE_TUNING.perfectShield);
    state.slowMotion = UPGRADE_TUNING.perfectSlowSeconds;
    skillVisual("discharge", state.player.x, state.player.y, {radius:90,color:"#fff5a3",life:.45});
    burst(state.player.x, state.player.y, "#fff5a3", 14); updateHud();
  }
  if (!state.player.damageDisabled) state.player.invincible = Math.max(state.player.invincible, UPGRADE_TUNING.dashInvincible);
  cancelManualRecovery();
  state.manualDashUsed=false; playSound("dash"); updateActionControls();
}
function activateSkill() {
  if(SurvivorAbilities.cast())return;
  if (state.mode !== "playing" || state.skillCooldown > 0 || state.bomb) return;
  state.bomb = { x: state.player.x, y: state.player.y, timer: gameSettings.bombDelay,
    delay: gameSettings.bombDelay, radius: gameSettings.bombRadius, damage: gameSettings.bombDamage, knockback: gameSettings.bombKnockback, schools: ["water", "wind", "thunder"].filter((school) => effectLevel(`${school}-skill`) || school === "wind" && effectLevel("wind-dash")) };
  state.skillCooldown = gameSettings.bombCooldown;
  triggerMakerEffects("skill", state.player.x, state.player.y);
  playSound("water");
 updateActionControls();
}
function updateBomb(dt) {
  if (state.bombBlast) { state.bombBlast.life -= dt; if (state.bombBlast.life <= 0) state.bombBlast = null; }
  const bomb = state.bomb;
  if (!bomb) return;
  bomb.timer -= dt;
  if (bomb.timer > 0.000001) return;
  state.bomb = null; state.bombBlast = { x: bomb.x, y: bomb.y, radius: bomb.radius, life: 0.35, schools: bomb.schools };
  const wind=cardBlock("wind-dash","onSkillBlast",{radius:bomb.radius});
  if (bomb.schools.includes("wind")) for (const target of combatTargets()) {
    if (cardBlockMatches(wind.conditions[0],target,bomb.x,bomb.y)) shiftTarget(target, bomb.x, bomb.y, wind.actions[0].distance);
  }
  if (bomb.schools.includes("water")) addField("water", bomb.x, bomb.y, bomb.radius);
  if (bomb.schools.includes("thunder")) {
    const block=cardBlock("thunder-skill","onSkillBlast",{radius:bomb.radius,damage:bomb.damage});
    skillVisual("discharge", bomb.x, bomb.y, { radius: bomb.radius, color: "#7737b0" });
    for (const target of combatTargets()) {
      if (cardBlockMatches(block.conditions[0],target,bomb.x,bomb.y)) { lightning(bomb.x, bomb.y, target.x, target.y); applyCardTargetActions(block,target); }
      if (state.mode !== "playing") return;
    }
  }
  function pushAway(target) {
    shiftTarget(target,bomb.x,bomb.y,bomb.knockback,true);
  }
  for (const enemy of state.enemies) {
    if (!enemy.alive || !canAttackTarget(enemy) || Math.hypot(deltaX(enemy.x, bomb.x), deltaY(enemy.y, bomb.y)) > bomb.radius + enemy.r) continue;
    const previous=enemy.slide;
    damageEnemy(enemy, bomb.damage);
    enemy.slide=previous; // 炸彈沿用自己的距離，不額外加普攻擊退。
    if (enemy.alive) pushAway(enemy);
  }
  for(const boss of state.trial?trialBodies():state.boss?[state.boss]:[]) {
    if(!canAttackTarget(boss)||Math.hypot(deltaX(boss.x,bomb.x),deltaY(boss.y,bomb.y))>bomb.radius+boss.r)continue;
    withTrialBody(boss,()=>{
      hitBuildTarget(boss,bomb.damage,{source:bomb});
      if(boss.hp>0&&state.mode==='playing')pushAway(boss);
    });
    if(state.mode!=='playing')return;
  }
  burst(bomb.x, bomb.y, "#80eaff", 20); playSound("explosion");
}



// Module accessors; the original combat facade and globals stay compatible.
globalThis.Survivor.engine = globalThis.Survivor.engine || {};
globalThis.Survivor.engine['player-actions'] = globalThis.Survivor.engine['player-actions'] || {};
Object.defineProperties(globalThis.Survivor.engine['player-actions'], {
  imminentDashThreat: { enumerable: true, get: () => imminentDashThreat },
  activateDash: { enumerable: true, get: () => activateDash },
  activateSkill: { enumerable: true, get: () => activateSkill },
  updateBomb: { enumerable: true, get: () => updateBomb }
});
