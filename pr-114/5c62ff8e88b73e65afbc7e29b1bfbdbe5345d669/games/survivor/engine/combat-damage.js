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
  const count = cardBlock('multi-water','onShot').actions[0].count+(SurvivorLoadout.config()?.count||1)-1;
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
  // 同一隻小怪 0.3 秒內連續受傷時合併成一個數字，避免「44 44 44」疊在一起看不清楚。
  // 魔王、試煉王、大熊、精英不合併：弱點 3 倍等大傷害要單獨跳出來。
  const ordinary = target !== state.boss && !target.trialActor && !target.miniboss && !target.elite;
  const recent = ordinary && state.effects.find(effect => effect.kind === "number" && effect.owner === target && effect.maxLife - effect.life < .3);
  if (recent) {
    recent.total += damage; recent.text = `${Math.round(recent.total)}`;
    recent.x = target.x; recent.y = target.y - target.r; recent.life = recent.maxLife;
    return;
  }
  if (state.effects.length >= 90) {
    const spark = state.effects.findIndex(effect => effect.kind === "spark");
    state.effectPool.push(state.effects.splice(spark >= 0 ? spark : 0, 1)[0]);
  }
  state.effects.push(takeFromPool(state.effectPool, { kind: "number", x: target.x, y: target.y - target.r, vx: 0, vy: -28, color: "#fff", life: .7, maxLife: .7, text: `${Math.round(damage)}`, owner: target, total: damage }));
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
function effectiveDamage() { return PROJECTILE_DAMAGE * cardBlock('big-water','onShot').actions[1].multiplier*(SurvivorLoadout.config()?.power||1); }
function effectiveShotInterval() { return Math.max(0.12, (SurvivorLoadout.interval() || (activeWeapon().kind === "melee" ? activeWeapon().interval : SHOT_INTERVAL)) * cardBlock('rapid-water','onShot').actions[0].multiplier / SurvivorAbilities.haste() / cardBlock('wind-speed','onShot',{moving:state.moveRate||0}).actions[0].multiplier); }
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

// Module accessors; the original combat facade and globals stay compatible.
globalThis.Survivor.engine = globalThis.Survivor.engine || {};
globalThis.Survivor.engine['combat-damage'] = globalThis.Survivor.engine['combat-damage'] || {};
Object.defineProperties(globalThis.Survivor.engine['combat-damage'], {
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
  shiftTarget: { enumerable: true, get: () => shiftTarget }
});
