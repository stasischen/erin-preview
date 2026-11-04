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
  if(SurvivorAbilities.enabled()){SurvivorAbilities.tick(dt);return;}
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
function ultimateOrbitPoints(orbit) {
  return Array.from({length:orbit.count},(_,i)=>{const a=state.elapsed*orbit.speed+i*Math.PI*2/orbit.count;return {x:state.player.x+Math.cos(a)*orbit.radius,y:state.player.y+Math.sin(a)*orbit.radius};});
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
      state.ultimateVisual.orbits=ultimateOrbitPoints(orbit);
      Object.assign(state.ultimateVisual,state.ultimateVisual.orbits[0]);
    }
    return;
  }
  const ultimateBlock=cardBlock(card.id,"onUltimate");
  const level = effectLevel(card.id), damage = ultimateBlock ? ultimateBlock.actions[0].amount : BUILD_TUNING.ultimateDamage * (1 + (level - 1) * BUILD_TUNING.ultimateGrowth);
  let targets = combatTargets();
  const x = state.player.x + Math.cos(state.elapsed * orbit.speed) * orbit.radius;
  const y = state.player.y + Math.sin(state.elapsed * orbit.speed) * orbit.radius;
  if (card.school === "thunder") targets = SurvivorEffectBlocks.select(ultimateBlock,targets,targets.length?Math.random():0);
  const orbits=ultimateOrbitPoints(orbit);
  if (card.school === "wind") targets = targets.filter(target => orbits.some(p=>cardBlockMatches(ultimateBlock.conditions[0],target,p.x,p.y)));
  state.ultimateVisual = { worldWidth: state.worldWidth, worldHeight: state.worldHeight, school: card.school, x: card.school === "thunder" && targets.length ? targets[0].x : x, y: card.school === "thunder" && targets.length ? targets[0].y : y, life: card.school === "water" ? 1.2 : .5 };
  state.ultimateVisual.orbits=orbits;
  state.ultimateVisual.targets=targets.map(t=>({x:t.x,y:t.y}));
  state.ultimateTimer = ultimateBlock.interval;
  for (const target of targets) { if (card.school === "thunder") lightning(target.x, target.y - 90, target.x, target.y); hitBuildTarget(target, damage,{source:{x,y}}); burst(target.x, target.y, BUILD_TUNING[card.school].color, 5); if (state.mode !== "playing") return; }
}

// Module accessors; the original combat facade and globals stay compatible.
globalThis.Survivor.engine = globalThis.Survivor.engine || {};
globalThis.Survivor.engine['element-combat'] = globalThis.Survivor.engine['element-combat'] || {};
Object.defineProperties(globalThis.Survivor.engine['element-combat'], {
  schoolEffect: { enumerable: true, get: () => schoolEffect },
  addField: { enumerable: true, get: () => addField },
  updateFields: { enumerable: true, get: () => updateFields },
  leaveDashTrail: { enumerable: true, get: () => leaveDashTrail },
  counterDischarge: { enumerable: true, get: () => counterDischarge },
  updateUltimate: { enumerable: true, get: () => updateUltimate },
  ultimateOrbitPoints: { enumerable: true, get: () => ultimateOrbitPoints },
  updateOneUltimate: { enumerable: true, get: () => updateOneUltimate }
});
