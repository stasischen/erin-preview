// 通用積木：新作品可組合觸發時機和參數；既有卡沿用有回歸測試的配方。
function triggerMakerEffects(trigger, x, y, comboStep = 0) {
  for (const card of UPGRADES) {
    const level = upgradeLevel(card.id);
    if (!level) continue;
    card.effects.forEach((effect, i) => {
      if (effect.feature || effect.trigger !== trigger) return;
      if(trigger==='combo' && effect.comboStep!==comboStep) return;
      const key = card.id + ":" + i;
      if ((state.makerTimers[key] || 0) > 0) return;
      state.makerTimers[key] = effect.interval;
      if (!(trigger === "dash" && effect.type === "dash-trail")) executeMakerEffect(effect, x, y, level);
    });
  }
}
function executeMakerEffect(effect, x, y, level) {
  let targets = combatTargets().filter(t => Math.hypot(deltaX(t.x, x), deltaY(t.y, y)) <= effect.radius + t.r);
  const damage = Math.min(600, effect.damage * level);
  if (effect.type === "projectile") {
    const target = closestEnemy(); if (!target) return;
    playSound("shoot");
    const angle = Math.atan2(deltaY(target.y, y), deltaX(target.x, x));
    for (let n = 0; n < effect.count && state.projectiles.length < PROJECTILE_LIMIT; n++) {
      const a = angle + (n - (effect.count - 1) / 2) * effect.spread;
      state.projectiles.push(takeFromPool(state.projectilePool, { x, y, vx: Math.cos(a) * effect.speed, vy: Math.sin(a) * effect.speed, r: 10, damage, pierce: 0, piercing: false, colors: buildAppearance().colors, transformed:false, push:0, charged:false, blade:false, schools: [], rangeLeft: BUILD_TUNING.shotRange, hitList: [], alive: true, bounces:0, fragment:false, bigBubble:false,autoCharged:false,boosted: false, maker: true }));
    }
    return;
  }
  if (effect.type === "dash-trail" || effect.type === "summon") {
    if (state.makerFields.length >= 18) state.makerFields.shift();
    x = wrapCoordinate(x, state.worldWidth); y = wrapCoordinate(y, state.worldHeight);
    state.makerFields.push({ x, y, life: effect.duration, timer: 0, level, effect }); return;
  }
  if (effect.type === "chain") {
    const remaining = combatTargets();
    for (let n=0; n<effect.count; n++) {
      const next = remaining.filter(t => Math.hypot(deltaX(t.x, x),deltaY(t.y, y))<=effect.radius).sort((a,b)=>Math.hypot(deltaX(a.x, x),deltaY(a.y, y))-Math.hypot(deltaX(b.x, x),deltaY(b.y, y)))[0];
      if(!next) break;
      remaining.splice(remaining.indexOf(next),1);lightning(x,y,next.x,next.y);hitBuildTarget(next,damage,{source:{x,y}});x=next.x;y=next.y;
      if(state.mode!=="playing") return;
    }
    return;
  }
  if (effect.type === "aoe" || effect.type === "ring-with-gap") skillVisual(effect.type === "aoe" ? "splash" : "maker-ring", x, y, { radius: effect.radius, gap: effect.gap });
  for (const target of targets) {
    if (effect.type === "slow") { target.slowTimer = effect.duration; target.makerSlow = effect.multiplier; }
    else if (effect.type === "stun") stunTarget(target,effect.duration);
    else if (effect.type === "knockback") shiftTarget(target, x, y, effect.distance, false, effect.slideSeconds);
    else if (effect.type === "aoe" || (effect.type === "ring-with-gap" && Math.abs(Math.atan2(deltaY(target.y, y),deltaX(target.x, x))) > effect.gap/2 && Math.hypot(deltaX(target.x, x),deltaY(target.y, y)) >= effect.radius * .65)) hitBuildTarget(target,damage,{source:{x,y}});
    if (state.mode !== "playing") return;
  }
}
function updateMakerEffects(dt) {
  for (const key of Object.keys(state.makerTimers)) state.makerTimers[key] = countdown(state.makerTimers[key], dt);
  triggerMakerEffects("interval", state.player.x, state.player.y);
  for (let i=state.makerFields.length-1;i>=0;i--) {
    const field = state.makerFields[i]; field.life-=dt; field.timer-=dt;
    if(field.life<=0) {state.makerFields.splice(i,1);continue;}
    if(field.timer>0) continue; field.timer=field.effect.interval;
    executeMakerEffect({...field.effect,type:field.effect.type==="summon"?"projectile":"aoe"}, field.x,field.y,field.level);
  }
  for(let i=state.enemyHazards.length-1;i>=0;i--) {
    const h=state.enemyHazards[i]; h.warning=countdown(h.warning,dt);
    if(h.warning>0) continue;
    state.enemyHazards.splice(i,1);
    if (h.owner) skillVisual('splash',h.x,h.y,{radius:h.r,color:'#b68159',life:.4});
    if(state.practiceHit && targetVisible(h) && Math.hypot(deltaX(h.x,state.player.x),deltaY(h.y,state.player.y))<h.r+state.player.r) pacingHurtPlayer(h.damage,h.feedback);
    if(targetVisible(h) && !state.player.damageDisabled && state.dashTimer<=0 && state.player.invincible<=0 && Math.hypot(deltaX(h.x, state.player.x),deltaY(h.y, state.player.y))<h.r+state.player.r) {
      feedbackImpact(h.feedback,true,null,state.player);state.player.health=Math.max(0,state.player.health-absorbSchoolHit(h.damage));state.player.invincible=INVINCIBLE_SECONDS;state.player.hitFlash=.16;updateHud();counterDischarge();
      if(state.player.health<=0) finishRun(false);
    }
  }
}

// Module accessors; the original combat facade and globals stay compatible.
globalThis.Survivor.engine = globalThis.Survivor.engine || {};
globalThis.Survivor.engine['maker-effects'] = globalThis.Survivor.engine['maker-effects'] || {};
Object.defineProperties(globalThis.Survivor.engine['maker-effects'], {
  triggerMakerEffects: { enumerable: true, get: () => triggerMakerEffects },
  executeMakerEffect: { enumerable: true, get: () => executeMakerEffect },
  updateMakerEffects: { enumerable: true, get: () => updateMakerEffects }
});
