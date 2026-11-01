// 接合層：純規則產生的事件在這裡更新狀態與特效。
function handleSchoolEvents(events) {
  for (const event of events) {
    if (event.type === 'transformed') {
      if (event.schoolId === 'wind') state.dashCharges += GAME_DATA.schoolRules.windFormCharges;
      skillVisual('discharge', state.player.x, state.player.y, {radius:85,color:BUILD_TUNING[event.schoolId].color,life:1});
    }
    if (state.effects.length < 90) state.effects.push(takeFromPool(state.effectPool,{kind:'number',x:state.player.x,y:state.player.y-50,vx:0,vy:-15,text:event.type === 'transformed' ? GAME_DATA.schools.find(s => s.id === event.schoolId).form : '終極卡解鎖',color:BUILD_TUNING[event.schoolId].color,life:1.5,maxLife:1.5}));
  }
}
function schoolDamage(target, damage) {
  const block=effectLevel('water-wet') ? cardBlock('water-wet','onDamage') : null;
  const wet=block && block.conditions.every(c=>SurvivorEffectBlocks.matches(c,{wetTimer:target.wetTimer}));
  return damage * neutralDamageMultiplier() * (wet ? block.actions[0].multiplier : 1);
}
function absorbSchoolHit(damage) {
  const block=cardBlock('water-bubble','onHurt');
  if (state.schoolCombat && block.conditions.every(c=>SurvivorEffectBlocks.matches(c,{damage,bubble:state.schoolCombat.bubble}))) {
    state.schoolCombat.bubble = block.actions[0].active;
    skillVisual('splash',state.player.x,state.player.y,{radius:50,color:BUILD_TUNING.water.color});
    return block.actions[0].damage;
  }
  return SurvivorWeapons.receivedDamage(damage, activeWeapon());
}
function schoolWindWall() { return state.schoolCombat && effectLevel('wind-eye') && SurvivorEffectBlocks.matches(cardBlock('wind-eye','onStill').conditions[0],{seconds:state.schoolCombat.still}); }
function schoolDashEnded() {
  const c = state.schoolCombat, r = GAME_DATA.schoolRules;
  if (!c) return;
  if (effectLevel('water-bubble')) c.bubble = cardBlock('water-bubble','onDashEnd').actions[0].active;
  if (effectLevel('wind-refund')) {
    // 半格是回充進度，不能用半格再發動一次完整衝刺。
    state.dashCooldown = Math.max(0, state.dashCooldown - gameSettings.dashCooldown * cardBlock('wind-refund','onDashEnd').actions[0].fraction);
    if (state.dashCooldown === 0 && state.dashCharges < maxDashCharges()) { state.dashCharges++; state.dashCooldown = state.dashCharges < maxDashCharges() ? gameSettings.dashCooldown : 0; }
  }
}
function schoolShotHit(shot, target) {
  const r = GAME_DATA.schoolRules;
  if ((shot.schools || []).includes('water') || effectLevel('water-skill')) applyCardTargetActions(cardBlock('water-skill','onShotHit'),target);
  if (!shot.melee) waveNeutralHit(target,shot.vx,shot.vy);
  if (shot.push) shiftTarget(target, shot.x - shot.vx, shot.y - shot.vy, shot.push);
  if (shot.charged) { lightning(state.player.x,state.player.y,target.x,target.y); schoolEffect('thunder',target,target.x,target.y,shot.damage,shot.hitList); }
  const blade=cardBlock('wind-blade','onShotHit');
  if (effectLevel('wind-blade') && SurvivorEffectBlocks.matches(blade.conditions[0],shot)) {
    const other = combatTargets().find(e => !shot.hitList.includes(e) && cardBlockMatches(blade.conditions[1],e,target.x,target.y));
    skillVisual('gust',target.x,target.y,{x2:target.x+shot.vx*.15,y2:target.y+shot.vy*.15,color:BUILD_TUNING.wind.color});
    if (other && state.projectiles.length < PROJECTILE_LIMIT) {
      const a = Math.atan2(deltaY(other.y,target.y),deltaX(other.x,target.x));
      state.projectiles.push(takeFromPool(state.projectilePool,{x:target.x,y:target.y,vx:Math.cos(a)*PROJECTILE_SPEED,vy:Math.sin(a)*PROJECTILE_SPEED,r:5,damage:shot.damage*blade.actions[0].multiplier,rangeLeft:blade.actions[0].range,hitList:[target],alive:true,blade:true,pierce:0,schools:[],colors:['wind'],transformed:false,push:0,charged:false,maker:true}));
    }
  }
}
function updateSchoolCombat(dt) {
  const c = state.schoolCombat, r = GAME_DATA.schoolRules;
  if (!c) return;
  c.still = state.moveRate > .01 ? 0 : c.still + dt;
  for (const target of state.enemies.concat(state.trial?trialBodies():state.boss ? [state.boss] : [])) target.wetTimer = countdown(target.wetTimer || 0,dt);
  const pulse = (id, seconds, action) => {
    if (!effectLevel(id)) return;
    c.timers[id] = (c.timers[id] === undefined ? seconds : c.timers[id]) - dt;
    if (c.timers[id] > 0) return;
    c.timers[id] += seconds; action();
  };
  const push = (radius, distance, color) => {
    skillVisual('discharge',state.player.x,state.player.y,{radius,color,life:.4});
    for (const target of combatTargets()) if (Math.hypot(deltaX(target.x,state.player.x),deltaY(target.y,state.player.y)) <= radius) shiftTarget(target,state.player.x,state.player.y,distance);
  };
  const fountain=cardBlock('water-fountain','onPulse');
  pulse('water-fountain',fountain.interval,() => {
    push(fountain.conditions[0].radius,fountain.actions[0].distance,BUILD_TUNING.water.color);
    for (const t of combatTargets()) if (cardBlockMatches(fountain.conditions[0],t,state.player.x,state.player.y)) applyCardTargetActions({actions:fountain.actions.slice(1)},t);
  });
  const gust=cardBlock('wind-gust','onPulse');
  pulse('wind-gust',gust.interval,() => push(gust.conditions[0].radius,gust.actions[0].distance,BUILD_TUNING.wind.color));
  const rain=cardBlock('water-rain','onPulse');
  pulse('water-rain',rain.interval,() => {
    c.rain = rain.actions[0].duration;
    // 保留全場緩速與濕潤；不造成畫面外傷害。
    for (const target of state.enemies.concat(state.trial?trialBodies():state.boss ? [state.boss] : [])) applyCardTargetActions({actions:rain.actions.slice(1)},target);
    skillVisual('splash',state.player.x,state.player.y,{radius:rain.actions[0].cueRadius,color:BUILD_TUNING.water.color,life:.8});
  });
  c.rain = countdown(c.rain || 0,dt);
  if (c.rain > 0) for (const t of state.enemies.concat(state.trial?trialBodies():state.boss ? [state.boss] : [])) {
    const tick=cardBlock('water-rain','onRainTick',{dt});
    t.slowTimer=Math.max(t.slowTimer || 0,tick.actions[0].duration); t.makerSlow=tick.actions[0].multiplier;
    applyCardTargetActions({actions:tick.actions.slice(1)},t);
  }
  const summon=cardBlock('thunder-rod','onSummonTimer'), rodBlock=summon.actions[0];
  pulse('thunder-rod',summon.interval,() => { if (c.rods.length < rodBlock.limit) c.rods.push({x:state.player.x,y:state.player.y,life:rodBlock.seconds,timer:0}); });
  for (const rod of c.rods) {
    rod.life -= dt; rod.timer -= dt;
    if (rod.timer <= 0) {
      rod.timer += rodBlock.interval;
      skillVisual('sparkle',rod.x,rod.y,{radius:20,color:BUILD_TUNING.thunder.color,life:.5});
      for (const target of combatTargets()) if (Math.hypot(deltaX(target.x,rod.x),deltaY(target.y,rod.y)) <= rodBlock.radius) { lightning(rod.x,rod.y,target.x,target.y); hitBuildTarget(target,rodBlock.damage,{source:rod}); if(state.mode!=='playing') return; }
    }
  }
  c.rods = c.rods.filter(rod => rod.life > 0);
  const wall=cardBlock('wind-eye','onWallTick',{dt});
  if (schoolWindWall()) for (const target of combatTargets()) if (cardBlockMatches(wall.conditions[0],target,state.player.x,state.player.y)) shiftTarget(target,state.player.x,state.player.y,wall.actions[0].distance);
  applyEffectBlockTimer(dt);

}

function schoolDashCrossed(fromX,fromY,toX,toY) {
  if (!effectLevel('thunder-step')) return;
  const block=cardBlock('thunder-step','onDashCross');
  for (const target of combatTargets()) {
    if (cardBlockMatches(block.conditions[0],target,fromX,fromY,{x:deltaX(toX,fromX),y:deltaY(toY,fromY)})) {
      applyCardTargetActions(block,target);
      lightning(fromX,fromY,target.x,target.y);
    }
  }
}
Survivor.engine['school-combat'] = { handleSchoolEvents, schoolDamage, absorbSchoolHit, updateSchoolCombat };

// 接合層保留合法目標、環繞座標、既有傷害入口與勝敗停止；純規則只輸出 id。
// WeakMap 不延長敵人生命；同一實體跨更新使用同一 id，不把物件傳入純規則。
const effectBlockTargetIds = new WeakMap();
let effectBlockTargetSerial = 0;
function effectBlockTargetId(target) {
  if (!effectBlockTargetIds.has(target)) effectBlockTargetIds.set(target,'target-'+(++effectBlockTargetSerial));
  return effectBlockTargetIds.get(target);
}
function applyEffectBlockTimer(dt) {
  const targets=combatTargets(), byId=new Map(targets.map(target=>[effectBlockTargetId(target),target]));
  const result=SurvivorEffectBlocks.step({dt, timers:state.schoolCombat.timers,
    levels:Object.fromEntries(SurvivorEffectBlocks.recipes.map(recipe=>[recipe.feature,effectLevel(recipe.feature)])),
    data:GAME_DATA, player:{r:state.player.r},
    targets:targets.map(target=>({id:effectBlockTargetId(target),dx:deltaX(target.x,state.player.x),dy:deltaY(target.y,state.player.y),r:target.r}))});
  Object.assign(state.schoolCombat.timers,result.timers);
  for (const event of result.events) {
    const target=byId.get(event.targetId);
    if (event.type==='cue') lightning(state.player.x,state.player.y,target.x,target.y);
    if (event.type==='damage') {hitBuildTarget(target,event.amount);if(state.mode!=='playing') return;}
  }
}

// 舊 feature 存檔只提供擁有等級；運算與條件由同一份積木資料解讀。
function cardBlock(feature,trigger,context={}) {
  return SurvivorEffectBlocks.event(feature,trigger,GAME_DATA,{level:effectLevel(feature),transformed:transformed('thunder')?1:0,...context});
}
function cardBlockMatches(condition,target,x,y,end) {
  return SurvivorEffectBlocks.matches(condition,{dx:deltaX(target.x,x),dy:deltaY(target.y,y),r:target.r},state.player,end);
}

function applyCardTargetActions(rule,target,source=state.player) {
  for(const action of rule.actions) {
    if(action.type==='wet') target.wetTimer=action.duration;
    else if(action.type==='slow') {target.slowTimer=action.duration;target.makerSlow=action.multiplier;}
    else if(action.type==='stun') stunTarget(target,action.duration);
    else if(action.type==='damage') { hitBuildTarget(target,action.amount,{source}); if(state.mode!=='playing')return; }
    else throw new Error('Unsupported target action');
  }
}
