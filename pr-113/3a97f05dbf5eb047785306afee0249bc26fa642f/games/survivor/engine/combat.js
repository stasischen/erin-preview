function targetVisible(target) {
  const x = deltaX(target.x, state.cameraX + state.width / 2);
  const y = deltaY(target.y, state.cameraY + state.height / 2);
  const r = target.r || 0;
  return Math.abs(x) + r <= state.width / 2 && Math.abs(y) + r <= state.height / 2;
}
function canAttackTarget(target) {
  if(target.vanished)return false;
  if(state.trial&&(target.emergeTimer>0||target.trialActor&&(state.bossIntro>0||target.hp<=0)))return false;
  return targetVisible(target) && Math.hypot(deltaX(target.x, state.player.x), deltaY(target.y, state.player.y)) <= BUILD_TUNING.attackRadius &&
    (target !== state.boss || state.bossIntro <= 0);
}
function closestEnemy() {
  return combatTargets().reduce((best,target)=>!best||Math.hypot(deltaX(target.x,state.player.x),deltaY(target.y,state.player.y))<Math.hypot(deltaX(best.x,state.player.x),deltaY(best.y,state.player.y))?target:best,null);
}

function fireAtNearest(command = null) {
  if (activeWeapon().kind === "melee") { swingAtNearest(!!(command && command.dash), command); return; }
  const target = closestEnemy();
  if ((!target && !command) || state.projectiles.length >= PROJECTILE_LIMIT) return;
  const sequence=SurvivorEffectBlocks.attack(state.weaponAttack,activeWeapon());
  state.weaponAttack=sequence.state; state.lastWeaponAttack=sequence.event;
  const bigBubble=sequence.event.finisher && !sequence.event.charged;
  const autoCharged=sequence.event.charged, weapon=activeWeapon();
  triggerMakerEffects('combo',state.player.x,state.player.y,sequence.event.number);
  if(state.mode!=='playing') return;
  const boosted = state.dashAttack > 0 && state.dashTimer <= 0;
  if (boosted) {
    state.dashAttack = 0;
    skillVisual("splash", state.player.x, state.player.y, {radius:65,color:"#fff5a3",life:.45});
  }
  const c = state.schoolCombat, r = GAME_DATA.schoolRules;
  if (c) c.shots++;
  const properties = SurvivorSchools.shot(c ? c.shots : 1,c ? c.kills : 0,c ? c.chargedUsed : 0,{drop:effectLevel('water-drop'),charge:effectLevel('thunder-charge')},r);
  if (properties.charged) c.chargedUsed = Math.floor(c.kills / r.chargeKills);
  const look = buildAppearance();
  const angle = command ? command.angle : SurvivorWeapons.aim(weapon,deltaX(target.x,state.player.x),deltaY(target.y,state.player.y),state.faceX,state.faceY);
  feedbackSound(weaponFeedback({charged:autoCharged,heavy:bigBubble}),"shoot");
  const count = cardBlock('multi-water','onShot').actions[0].count;
  for (let i = 0; i < count && state.projectiles.length < PROJECTILE_LIMIT; i++) {
    const offset = (i - (count - 1) / 2) * cardBlock('multi-water','onShot').actions[0].angle;
    const spread = autoCharged ? Math.max(-Math.PI/2,Math.min(Math.PI/2,offset)) : offset, a = angle + spread;
    state.projectiles.push(takeFromPool(state.projectilePool, { x: state.player.x, y: state.player.y, vx: Math.cos(a) * PROJECTILE_SPEED * cardBlock('wind-attack','onShot').actions[0].multiplier, vy: Math.sin(a) * PROJECTILE_SPEED * cardBlock('wind-attack','onShot').actions[0].multiplier, r: state.player.r * 2 / 3 * (autoCharged ? weapon.chargeSize : bigBubble ? weapon.comboSize : 1) * properties.size * (transformed("water") ? 1 + r.waterFormSize : 1) * cardBlock('big-water','onShot').actions[0].multiplier * (boosted ? UPGRADE_TUNING.dashAttackSize : 1), damage: effectiveDamage() * (autoCharged ? weapon.chargeMultiplier : bigBubble ? weapon.comboMultiplier : 1) * properties.damage * (boosted ? UPGRADE_TUNING.dashAttackDamage : 1), boosted, bigBubble, autoCharged, piercing: autoCharged || effectLevel("piercing-water") > 0, pierce: (autoCharged ? 99 : 0) + cardBlock('piercing-water','onShot').actions[0].count + (effectLevel('wind-blade') ? cardBlock('wind-blade','onShot').actions[0].count : 0), colors: look.colors, transformed:look.forms.includes(look.main), push:properties.push, charged:properties.charged, blade:false, schools: ["water", "wind", "thunder"].filter((school) => (effectLevel(`${school}-attack`) || school === "water" && (effectLevel("water-skill") || effectLevel("fusion-puddle")))), feedback:feedbackPayload(weaponFeedback({charged:autoCharged,heavy:bigBubble})),rangeLeft: BUILD_TUNING.shotRange * cardBlock('wind-attack','onShot').actions[0].multiplier, hitList: [], alive: true, bounces:0, fragment:false, maker: false }));
  }
  if (!autoCharged) prepareNeutralShots(angle);
}

// 命中時在水球位置留下水花；即使粒子很多也保留這個提示。
function resolveWaterHit(shot) {
  queueImpact(0,'water',-1);
  if(shot.bigBubble) {
    shot.bigBubble=false;
    const weapon=GAME_DATA.weapons.find(w=>w.id==='water-ball');
    const original=shot.damage;
    // 小水花是範圍命中，不產生遞迴大泡泡；同一顆泡泡不重複命中本體目標。
    skillVisual('splash',shot.x,shot.y,{radius:shot.r*weapon.splashSize});
    for(const t of combatTargets()) if(!shot.hitList.includes(t) && Math.hypot(deltaX(t.x,shot.x),deltaY(t.y,shot.y))<=shot.r*weapon.splashSize+t.r) {
      shot.hitList.push(t);hitBuildTarget(t,original*weapon.splashDamage,{source:shot});
      if(state.mode!=='playing') return;
    }
  }
  if (!shot.maker) triggerMakerEffects("hit", shot.x, shot.y);
  const continues = shot.pierce > 0;
  if (continues) shot.pierce--; else shot.alive = false;
  if (state.effects.length >= 90) state.effectPool.push(state.effects.shift());
  state.effects.push(takeFromPool(state.effectPool, { kind: "water-hit", x: shot.x, y: shot.y, vx: 0, vy: -18, color: continues ? "#ffffff" : "#168cff", life: 0.35, maxLife: 0.35, text: continues ? "穿！" : "啪" }));
  burst(shot.x, shot.y, "#75d7ff", 5);
}

// 獨立於小粒子的預算：粒子滿了也看得見技能。所有位置都存世界座標。
function skillVisual(kind, x, y, options = {}) {
  if (state.vfx.length >= VFX_TUNING.limit) state.vfxPool.push(state.vfx.shift());
  const life = options.life || 0.35;
  state.vfx.push(takeFromPool(state.vfxPool, { kind, x, y, x2: x, y2: y, radius: 30,
    color: "#237bc2", text: "", life, maxLife: life, ...options }));
}
function lightning(x, y, x2, y2) {
  playSound("lightning");
  skillVisual("lightning", x, y, { x2, y2, color: "#7737b0", life: VFX_TUNING.lightningSeconds });
  skillVisual("sparkle", x2, y2, { color: "#ffdd38", radius: 16, life: VFX_TUNING.lightningSeconds });
}
function updateSkillVisuals(dt) {
  for (let i = state.vfx.length - 1; i >= 0; i--) {
    state.vfx[i].life -= dt;
    if (state.vfx[i].life <= 0) state.vfxPool.push(state.vfx.splice(i, 1)[0]);
  }
}
function burst(x, y, color, count = 8) {
  if (gameSettings.lowEffects) count=Math.min(2,count);
  for (let i = 0; i < count && state.effects.length < 90; i++) {
    const angle = Math.random() * Math.PI * 2, speed = 45 + Math.random() * 110;
    state.effects.push(takeFromPool(state.effectPool, { kind: "spark", x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, color, life: 0.42 + Math.random() * 0.22, maxLife: 0.64, text: "" }));
  }
}

function damageNumber(target, damage) {
  if (state.effects.length >= 90) {
    const spark = state.effects.findIndex(effect => effect.kind === "spark");
    state.effectPool.push(state.effects.splice(spark >= 0 ? spark : 0, 1)[0]);
  }
  state.effects.push(takeFromPool(state.effectPool, { kind: "number", x: target.x, y: target.y - target.r, vx: 0, vy: -28, color: "#fff", life: .7, maxLife: .7, text: `${Math.round(damage)}` }));
}
function damageEnemy(enemy, damage = effectiveDamage()) {
  if (!enemy.alive || !canAttackTarget(enemy)) return;
  if (encounterShield(enemy, damage)) { damageHitSound(); return; }
  damageHitSound();
  damage = schoolDamage(enemy, damage);
  enemy.meleeFlash=false;
  enemy.hp -= damage;
  enemy.flash = HIT_FLASH_SECONDS; shiftTarget(enemy,state.player.x,state.player.y,KNOCKBACK_SPEED / 2);
  if (enemy.hp <= 0) playSound("death");
  damageNumber(enemy, damage);
  if (enemy.hp <= 0) {
    enemy.alive = false;
    if (state.schoolCombat) state.schoolCombat.kills++;
    neutralEvent("death", enemy.x, enemy.y);
    encounterDefeated(enemy);
    if (state.effects.length < 90) state.effects.push(takeFromPool(state.effectPool, { kind: "evaporate", x: enemy.x, y: enemy.y, vx: 0, vy: 0, color: "#ffe2a8", life: 0.42, maxLife: 0.42, text: "" }));
    burst(enemy.x, enemy.y, "#ffe2a8", 8);
    if (state.gems.length < GEM_LIMIT) state.gems.push(takeFromPool(state.gemPool, { x: enemy.x, y: enemy.y, r: 8, value: 1, alive: true, wobble: Math.random() * 6 }));
  } else burst(enemy.x, enemy.y, "#ffffff", 4);
}

function upgradeLevel(id) { return state.upgrades[id] || 0; }
function effectLevel(feature) {
  return Math.min(5, UPGRADES.reduce((total, card) => total + upgradeLevel(card.id) * card.effects.reduce((n, effect) => n + (effect.feature === feature ? effect.power : 0), 0), 0));
}
function effectiveDamage() { return PROJECTILE_DAMAGE * cardBlock('big-water','onShot').actions[1].multiplier; }
function effectiveShotInterval() { return Math.max(0.12, (activeWeapon().kind === "melee" ? activeWeapon().interval : SHOT_INTERVAL) * cardBlock('rapid-water','onShot').actions[0].multiplier / cardBlock('wind-speed','onShot',{moving:state.moveRate||0}).actions[0].multiplier); }
function maxPlayerHealth() {
  return Math.max(1, SurvivorEffectBlocks.modify('maxHealth', PLAYER_HEALTH + cardBlock('bubble-shield','onHealth').actions[0].amount, {'item-crown':effectLevel('item-crown')}, GAME_DATA));
}
function addHealEffect() {
  if (state.effects.length >= 90) return;
  state.effects.push(takeFromPool(state.effectPool, { kind: "heal", x: state.player.x, y: state.player.y - state.player.r, vx: 0, vy: -24, color: "#21b85b", life: 0.8, maxLife: 0.8, text: "+1" }));
}

function experienceNeeded() { return XP_TO_LEVEL + (state.level - 1) * UPGRADE_TUNING.xpGrowthPerLevel; }
function grantExperience(value) {
  playSound("xp");
  state.xp += value;
  if (state.xp >= experienceNeeded()) { state.xp -= experienceNeeded(); state.level++; startBookShooting(); updateHud(); chooseUpgradeCards(); } else updateHud();
}

function combatTargets() {
  return state.enemies.filter((enemy) => enemy.alive).concat(state.trial?trialBodies():state.boss ? [state.boss] : []).filter(canAttackTarget);
}
function hitBuildTarget(target, damage, attack = {}) {
  if(target.trialActor&&target!==state.boss)return withTrialBody(target,()=>hitBuildTarget(target,damage,attack));
  if (!canAttackTarget(target)) return;
  if (target === state.boss) {
    const weakpoint = resolveBossWeakpoint(target, attack);
    if(attack.charged && weakpoint.kind === 'normal')damage*=teacherBonuses().damage;
    damage = schoolDamage(target, damage) * weakpoint.multiplier;
    if(weakpoint.kind === 'normal')damageHitSound();
    damageNumber(target, damage);
    target.meleeFlash=false;
    target.hp -= damage; target.flash = HIT_FLASH_SECONDS; updateHud();
    weakpointImpact(target, weakpoint, attack.attacker || state.player);
    if (target.hp <= 0) { tierImpact('large',state.player,target);if(state.trial)trialBossDefeated(target);else {state.boss = null; finishRun(true);} }
    else teacherRecoveryHit();
  } else if (target.alive) damageEnemy(target, damage);
}
function shiftTarget(target, x, y, distance, centerFallback = false, duration = GAME_DATA.knockback.slideSeconds) {
  if (target !== state.player && !canAttackTarget(target)) return;
  distance = targetDisplacement(target,distance);
  let dx=deltaX(target.x,x),dy=deltaY(target.y,y);
  if(centerFallback && Math.hypot(dx,dy)<.01){dx=1;dy=0;}
  const length=Math.max(1,Math.hypot(dx,dy));
  if(!distance || !Math.hypot(dx,dy))return;
  target.slide=SurvivorSlide.impulse(target.slide,dx/length*distance,dy/length*distance,duration);
  const end=slidePrediction(target);
  skillVisual("gust",target.x,target.y,{x2:target.x+end.dx,y2:target.y+end.dy,color:"#23815e"});
}
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
function schoolEffect(school, target, x, y, damage, excluded = []) {
  if (school === "water") {
    const level = effectLevel("water-attack");
    const block=cardBlock('water-attack','onWaterHit',{damage});
    if (level) skillVisual('splash',x,y,{radius:block.conditions[0].radius});
    if (level) for (const other of combatTargets()) if (other !== target && cardBlockMatches(block.conditions[0],other,x,y)) applyCardTargetActions(block,other,{x,y});
    if (effectLevel('water-skill') || effectLevel('fusion-puddle')) addField('water',x,y);
  }
  if (school === "wind") return; // 入門只提升水球速度；擊退由旋風處理。
  if (school === "thunder") {
    const visited = [target, ...excluded];
    const chain=cardBlock('thunder-attack','onChain').actions[0];
    const modifier=effectLevel('thunder-super') ? cardBlock('thunder-super','onChain').actions[0] : null;
    const jumps=chain.count+(modifier?modifier.extra:0), radius=chain.radius;
    for (let i=0;i<jumps;i++) {
      const other = combatTargets().filter(e => !visited.includes(e) && Math.hypot(deltaX(e.x,x),deltaY(e.y,y)) <= radius).sort((a,b) => Math.hypot(deltaX(a.x,x),deltaY(a.y,y))-Math.hypot(deltaX(b.x,x),deltaY(b.y,y)))[0];
      if (!other) break;
      visited.push(other); lightning(x,y,other.x,other.y);
      hitBuildTarget(other, damage * (modifier?modifier.multiplier:chain.multiplier),{source:{x,y}});
      x=other.x;y=other.y;
      if(state.mode!=='playing') return;
    }
  }
}
function addField(school, x, y, radius) {
  const block=school === "water" ? cardBlock("water-skill","onWaterHit").actions[0] : school === "thunder" ? cardBlock("fusion-dash","onDashTrail").actions[0] : cardBlock("wind-dash","onDashTrail").actions[0];
  if(radius===undefined) radius=block?block.radius:BUILD_TUNING.fieldRadius;
  if (state.fields.length >= (block?block.limit:BUILD_TUNING.fieldLimit)) state.fieldPool.push(state.fields.shift());
  state.fields.push(takeFromPool(state.fieldPool, { school, x, y, radius: radius * (1 + Math.max(0, effectLevel(school === "water" ? "water-skill" : "wind-dash") - 1) * (block?block.radiusGrowth:BUILD_TUNING.fieldRadiusGrowth)), life: block?block.seconds:BUILD_TUNING.fieldSeconds, timer: 0 }));
}
function updateFields(dt) {
  for (let i = state.fields.length - 1; i >= 0; i--) {
    const field = state.fields[i]; field.life -= dt; field.timer -= dt;
    if (field.life <= 0) { state.fieldPool.push(state.fields.splice(i, 1)[0]); continue; }
    if (field.timer > 0) continue;
    const block=field.school === "water" ? cardBlock("water-skill","onWaterHit").actions[0] : field.school === "thunder" ? cardBlock("fusion-dash","onDashTrail").actions[0] : cardBlock("wind-dash","onDashTrail").actions[0];
    field.timer += block?block.interval:BUILD_TUNING.fieldInterval;
    for (const target of combatTargets()) {
      if (Math.hypot(deltaX(target.x, field.x), deltaY(target.y, field.y)) > field.radius + target.r) continue;
      const level = field.school === "water" ? Math.max(effectLevel("water-skill"), effectLevel("water-dash"), effectLevel("fusion-storm")) : field.school === "wind" ? effectLevel("wind-dash") : effectLevel("fusion-dash");
      if (field.school === 'water') hitBuildTarget(target,cardBlock('water-skill','onFieldTick',{level}).actions[0].amount,{source:field});
      else hitBuildTarget(target, block?block.damage:BUILD_TUNING.fieldDamage * Math.max(1, level),{source:field});
      if (field.school === "water") {
        const tick=cardBlock('water-skill','onFieldTick',{level});
        applyCardTargetActions({actions:tick.actions.slice(1)},target);
        if (effectLevel("fusion-puddle")) { lightning(field.x, field.y, target.x, target.y); applyCardTargetActions(cardBlock('fusion-puddle','onFieldTick'),target); burst(target.x, target.y, BUILD_TUNING.thunder.color, 3); }
      }
      if (field.school === "wind") shiftTarget(target, field.x, field.y, cardBlock('wind-dash','onFieldTick',{level}).actions[0].distance);
      if (field.school === "thunder") schoolEffect("thunder", target, target.x, target.y, block.damage);
      if (state.mode !== "playing") return;
    }
  }
}
function leaveDashTrail(x, y, distance, fromX = x, fromY = y) {
  // 沿走過的路每隔一小段留痕跡，速度變快時也不會留下大空洞。
  const spacing = Math.max(1, effectLevel("fusion-dash") ? cardBlock("fusion-dash","onDashTrail").actions[0].spacing : (effectLevel("fusion-storm") ? cardBlock("fusion-storm","onDashTrail").actions[0].spacing : effectLevel("wind-dash") ? cardBlock("wind-dash","onDashTrail").actions[0].spacing : cardBlock("water-dash","onDashTrail").actions[0].spacing));
  let next = Math.max(0, spacing - state.trailDistance);
  while (next <= distance) {
    const fraction = distance > 0 ? next / distance : 0;
    const storm=effectLevel("fusion-storm") ? cardBlock("fusion-storm","onDashTrail").actions.map(a=>a.school) : [];
    for (const school of ["water", "wind", "thunder"]) if (storm.includes(school) || (school === "water" && effectLevel("water-dash")) || (school === "wind" && effectLevel("wind-dash")) || (school === "thunder" && effectLevel("fusion-dash"))) addField(school, fromX + (deltaX(x, fromX)) * fraction, fromY + (deltaY(y, fromY)) * fraction);
    for (const card of UPGRADES) if (upgradeLevel(card.id)) for (const effect of card.effects) {
      if (!effect.feature && effect.type === "dash-trail" && effect.trigger === "dash") executeMakerEffect(effect, fromX + (deltaX(x, fromX))*fraction, fromY + (deltaY(y, fromY))*fraction, upgradeLevel(card.id));
    }
    next += spacing;
  }
  state.trailDistance = (state.trailDistance + distance) % spacing;
}
function counterDischarge() {
  const level = effectLevel("thunder-counter");
  if (!level) return;
  const block=cardBlock("thunder-counter","onHurt"), radius=block.conditions[0].radius;
  skillVisual("discharge", state.player.x, state.player.y, { radius, color: "#7737b0", life: .4 });
  for (const target of combatTargets()) {
    if (cardBlockMatches(block.conditions[0],target,state.player.x,state.player.y)) {
      applyCardTargetActions(block,target); burst(target.x, target.y, BUILD_TUNING.thunder.color, 5);
      if (state.mode !== "playing") return;
    }
  }
}
function updateUltimate(dt) {
  const schools = GAME_DATA.schools.map(s => s.id).filter(id => effectLevel(id+'-ultimate'));
  if (!state.ultimateTimers) state.ultimateTimers = {};
  if (!state.ultimateVisuals) state.ultimateVisuals = {};
  if (schools.length <= 1) { updateOneUltimate(dt, schools[0]); if (schools[0]) state.ultimateTimers[schools[0]] = state.ultimateTimer; return; }
  for (const school of schools) {
    state.ultimateTimer = state.ultimateTimers[school] || 0;
    state.ultimateVisual = state.ultimateVisuals[school] || null;
    updateOneUltimate(dt,school);
    state.ultimateTimers[school] = state.ultimateTimer;
    state.ultimateVisuals[school] = state.ultimateVisual;
    if(state.mode !== 'playing') return;
  }
}
function updateOneUltimate(dt, selectedSchool) {
  if (state.ultimateVisual) { state.ultimateVisual.life -= dt; if (state.ultimateVisual.life <= 0) state.ultimateVisual = null; }
  const ultimateSchool = selectedSchool;
  const card = ultimateSchool ? { school: ultimateSchool, id: ultimateSchool + "-ultimate" } : null;
  if (!card) return;
  const orbit=cardBlock("wind-ultimate","onUltimate").actions[1];
  state.ultimateTimer = countdown(state.ultimateTimer || 0, dt);
  if (state.ultimateTimer > 0) {
    if (card.school === "wind" && state.ultimateVisual) {
      state.ultimateVisual.x = state.player.x + Math.cos(state.elapsed * orbit.speed) * orbit.radius;
      state.ultimateVisual.y = state.player.y + Math.sin(state.elapsed * orbit.speed) * orbit.radius;
    }
    return;
  }
  const ultimateBlock=cardBlock(card.id,"onUltimate");
  const level = effectLevel(card.id), damage = ultimateBlock ? ultimateBlock.actions[0].amount : BUILD_TUNING.ultimateDamage * (1 + (level - 1) * BUILD_TUNING.ultimateGrowth);
  let targets = combatTargets();
  const x = state.player.x + Math.cos(state.elapsed * orbit.speed) * orbit.radius;
  const y = state.player.y + Math.sin(state.elapsed * orbit.speed) * orbit.radius;
  if (card.school === "thunder") targets = SurvivorEffectBlocks.select(ultimateBlock,targets,targets.length?Math.random():0);
  if (card.school === "wind") targets = targets.filter(target => cardBlockMatches(ultimateBlock.conditions[0],target,x,y));
  state.ultimateVisual = { worldWidth: state.worldWidth, worldHeight: state.worldHeight, school: card.school, x: card.school === "thunder" && targets.length ? targets[0].x : x, y: card.school === "thunder" && targets.length ? targets[0].y : y, life: card.school === "water" ? 1.2 : .5 };
  state.ultimateTimer = ultimateBlock.interval;
  for (const target of targets) { if (card.school === "thunder") lightning(target.x, target.y - 90, target.x, target.y); hitBuildTarget(target, damage,{source:{x,y}}); burst(target.x, target.y, BUILD_TUNING[card.school].color, 5); if (state.mode !== "playing") return; }
}
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


// Live accessors preserve shared state and the legacy globals used by preview/VM callers.
globalThis.Survivor.engine = globalThis.Survivor.engine || {};
globalThis.Survivor.engine.combat = globalThis.Survivor.engine.combat || {};
Object.defineProperties(globalThis.Survivor.engine.combat, {
  targetVisible: { enumerable: true, get: () => targetVisible },
  canAttackTarget: { enumerable: true, get: () => canAttackTarget },
  closestEnemy: { enumerable: true, get: () => closestEnemy },
  fireAtNearest: { enumerable: true, get: () => fireAtNearest },
  resolveWaterHit: { enumerable: true, get: () => resolveWaterHit },
  skillVisual: { enumerable: true, get: () => skillVisual },
  lightning: { enumerable: true, get: () => lightning },
  updateSkillVisuals: { enumerable: true, get: () => updateSkillVisuals },
  burst: { enumerable: true, get: () => burst },
  damageNumber: { enumerable: true, get: () => damageNumber },
  damageEnemy: { enumerable: true, get: () => damageEnemy },
  upgradeLevel: { enumerable: true, get: () => upgradeLevel },
  effectLevel: { enumerable: true, get: () => effectLevel },
  effectiveDamage: { enumerable: true, get: () => effectiveDamage },
  effectiveShotInterval: { enumerable: true, get: () => effectiveShotInterval },
  maxPlayerHealth: { enumerable: true, get: () => maxPlayerHealth },
  addHealEffect: { enumerable: true, get: () => addHealEffect },
  experienceNeeded: { enumerable: true, get: () => experienceNeeded },
  grantExperience: { enumerable: true, get: () => grantExperience },
  combatTargets: { enumerable: true, get: () => combatTargets },
  hitBuildTarget: { enumerable: true, get: () => hitBuildTarget },
  shiftTarget: { enumerable: true, get: () => shiftTarget },
  triggerMakerEffects: { enumerable: true, get: () => triggerMakerEffects },
  executeMakerEffect: { enumerable: true, get: () => executeMakerEffect },
  updateMakerEffects: { enumerable: true, get: () => updateMakerEffects },
  schoolEffect: { enumerable: true, get: () => schoolEffect },
  addField: { enumerable: true, get: () => addField },
  updateFields: { enumerable: true, get: () => updateFields },
  leaveDashTrail: { enumerable: true, get: () => leaveDashTrail },
  counterDischarge: { enumerable: true, get: () => counterDischarge },
  updateUltimate: { enumerable: true, get: () => updateUltimate },
  activateDash: { enumerable: true, get: () => activateDash },
  activateSkill: { enumerable: true, get: () => activateSkill },
  updateBomb: { enumerable: true, get: () => updateBomb }
});
