// 純規則：角度用弧度、距離用世界單位；不讀時間、畫面或亂數。
globalThis.SurvivorWeapons = (() => {
  function receivedDamage(damage, weapon) { return damage * (1 - (weapon.damageReduction || 0)); }
  function swing(weapon, number, angle, powers, attack = {}) {
    const sword=weapon.id==='candy-sword';
    const finisher=weapon.comboEnabled && number % weapon.comboEvery === 0;
    const charged=!!attack.charged;
    const shape=charged ? (weapon.chargeShape==='spin'?'sector':weapon.chargeShape) : attack.dash ? 'line' : finisher ? weapon.comboShape : weapon.baseShape;
    const thrust=shape==='line', spin=shape==='spin';
    const scale=charged ? weapon.chargeSize : finisher || thrust ? weapon.comboSize : 1;
    return { type:'weapon-swung', weaponId:weapon.id, number, angle, shape, spin, charged, thrust, stun:charged?weapon.chargeStun:0, heavy:charged || finisher || !!attack.dash, reverse:sword && number===2, width:weapon.thrustWidth*powers.size,
      recovery:finisher && !charged ? weapon.finisherRecovery : 0, step:thrust ? weapon.stepDistance : 0,
      arc:spin ? Math.PI * 2 : Math.min(charged ? Math.PI : Math.PI * 2, weapon.arcDegrees * Math.PI / 180 + powers.extraArc),
      radius:weapon.radius * powers.size * scale, damage:powers.damage * weapon.damageMultiplier * (charged ? weapon.chargeMultiplier : finisher || attack.dash ? weapon.comboMultiplier : 1), push:weapon.push + powers.push + (charged || thrust ? weapon.comboPush : 0) };
  }
  // 圓形敵人與扇形相交：先比半徑，再比兩條邊線，角落不會漏判。
  function intersects(dx, dy, radius, event) {
    if(event.thrust) {
      const along=dx*Math.cos(event.angle)+dy*Math.sin(event.angle), across=-dx*Math.sin(event.angle)+dy*Math.cos(event.angle);
      return Math.hypot(Math.max(0,-along,along-event.radius),Math.max(0,Math.abs(across)-event.width)) <= radius;
    }
    const distance = Math.hypot(dx,dy);
    if (distance > event.radius + radius) return false;
    const diff = Math.abs(Math.atan2(Math.sin(Math.atan2(dy,dx)-event.angle),Math.cos(Math.atan2(dy,dx)-event.angle)));
    if (diff <= event.arc / 2 || distance <= radius) return true;
    const edge = event.angle + (Math.sin(Math.atan2(dy,dx)-event.angle) >= 0 ? 1 : -1) * event.arc/2;
    return SurvivorSchools.segmentDistance(dx,dy,Math.cos(edge)*event.radius,Math.sin(edge)*event.radius) <= radius;
  }
  function aim(weapon,dx,dy,faceX,faceY) {return weapon.direction==='facing'?Math.atan2(faceY,faceX):Math.atan2(dy,dx);}
  function cardNote(card, weapon) {
    if (weapon.kind !== 'melee') return card.description;
    return (weapon.id==='candy-sword' && card.descriptionSword) || card.descriptionMelee || card.description;
  }
  return { swing, intersects, receivedDamage, cardNote, aim };
})();

// 接合層：一次揮擊產生一次事件；先取命中清單，再結算，特效不參與判定。
function activeWeapon() { return GAME_DATA.weapons.find(w => w.id === state.weaponId) || GAME_DATA.weapons[0]; }
function swingAtNearest(dash = false, command = null) {return withImpactBatch(()=>swingWithImpacts(dash,command));}
function swingWithImpacts(dash,command) {
  const target = closestEnemy(), weapon = activeWeapon();
  if (!target && !command) return;
  const c = state.schoolCombat, r = GAME_DATA.schoolRules;
  const sequence=SurvivorEffectBlocks.attack(state.weaponAttack,weapon,state.swingCount);
  const number = sequence.event.number;
  const properties = SurvivorSchools.shot(c ? c.shots + 1 : number,c ? c.kills : 0,c ? c.chargedUsed : 0,{drop:effectLevel('water-drop'),charge:effectLevel('thunder-charge')},r);
  const boosted = state.dashAttack > 0 && state.dashTimer <= 0;
  const look = buildAppearance();
  const event = SurvivorWeapons.swing(weapon,number,command ? command.angle : SurvivorWeapons.aim(weapon,deltaX(target.x,state.player.x),deltaY(target.y,state.player.y),state.faceX,state.faceY),{
    extraArc:cardBlock('multi-water','onShot').actions[0].extraArc,
    size:properties.size * (transformed('water') ? 1+r.waterFormSize : 1) * cardBlock('big-water','onShot').actions[0].multiplier * cardBlock('wind-attack','onShot').actions[0].multiplier * cardBlock('piercing-water','onShot').actions[0].size * (boosted ? UPGRADE_TUNING.dashAttackSize : 1),
    damage:effectiveDamage()*properties.damage*(boosted ? UPGRADE_TUNING.dashAttackDamage : 1),push:properties.push
  },{...sequence.event,dash});
  const targets = combatTargets();
  const hits = targets.filter(t=>SurvivorWeapons.intersects(deltaX(t.x,state.player.x),deltaY(t.y,state.player.y),t.r,event));
  // 目標太遠不空揮，也不消耗蓄電、第四下或衝刺強化。
  if (!hits.length && !command) return;
  state.swingCount++;
  state.weaponAttack=sequence.state; state.lastWeaponAttack=sequence.event; state.attackRecovery=event.recovery;
  triggerMakerEffects('combo',state.player.x,state.player.y,number);
  if(state.mode!=='playing') return;
  if (c) { c.shots++; if (properties.charged) c.chargedUsed = Math.floor(c.kills/r.chargeKills); }
  if (boosted) state.dashAttack = 0;
  const feedbackEvent={...event,feedbackId:event.charged?'charge':dash?'dash':event.heavy?'combo':'primary'};
  const feedback=weaponFeedback(feedbackEvent);
  const visual = {...event,...(feedback.slash?{}:{slash:false}),colors:look.colors.slice(),boosted,life:.24};
  skillVisual('hammer-swing',state.player.x,state.player.y,visual); queueImpact(0,feedback.sound===undefined?'shoot':feedback.sound,-2);
  // 後射對應後方小扇形；同一揮擊每個目標最多結算一次。
  if (effectLevel('item-rear') && !event.spin && !event.charged) {
    const rear={...event,angle:event.angle+Math.PI};
    skillVisual('hammer-swing',state.player.x,state.player.y,{...rear,...(feedback.slash?{}:{slash:false}),colors:look.colors.slice(),boosted,life:.24});
    for(const t of targets) if(!hits.includes(t) && SurvivorWeapons.intersects(deltaX(t.x,state.player.x),deltaY(t.y,state.player.y),t.r,rear)) hits.push(t);
  }
  for (const t of hits) {
    if (t !== state.boss && !t.alive) continue;
    const shot={x:t.x,y:t.y,vx:deltaX(t.x,state.player.x),vy:deltaY(t.y,state.player.y),damage:event.damage,push:0,charged:properties.charged,schools:effectLevel('water-attack')?['water']:[],hitList:hits,melee:true,pierce:0};
    schoolShotHit(shot,t);
    const hpBefore=t.hp;
    hitBuildTarget(t,event.damage,{charged:event.charged});
    if(t.hp<hpBefore && state.mode==='playing') meleeImpact(t,feedbackEvent);
    if(state.mode!=='playing') return;
    if((t.alive || t===state.boss) && event.stun) stunTarget(t,Math.max(t.stunTimer||0,event.stun));
    if(t===state.boss || t.alive) shiftTarget(t,state.player.x,state.player.y,event.push);
    if(t.alive) waveNeutralHit(t,deltaX(t.x,state.player.x),deltaY(t.y,state.player.y));
    for(const school of ['water','thunder']) if(effectLevel(school+'-attack') || school==='water' && (effectLevel('water-skill')||effectLevel('fusion-puddle'))) {
      schoolEffect(school,t,t.x,t.y,event.damage,hits);
      if(state.mode!=='playing') return;
    }
    if(effectLevel('splash-water')) {
      const splash=cardBlock('splash-water','onShotHit',{damage:event.damage}), radius=splash.conditions[0].radius;
      skillVisual('splash',t.x,t.y,{radius});
      for(const other of combatTargets()) if(other!==t && !hits.includes(other) && cardBlockMatches(splash.conditions[0],other,t.x,t.y)) {hitBuildTarget(other,splash.actions[0].amount,{source:t});if(state.mode!=='playing')return;}
    }
    triggerMakerEffects('hit',t.x,t.y);
    if(state.mode!=='playing') return;
  }
  if(event.step && state.mode==='playing') {state.player.x+=Math.cos(event.angle)*event.step;state.player.y+=Math.sin(event.angle)*event.step;clampToMap(state.player);updateCamera();}
  // 風刃變成一次近距離追斬；不額外發射遠程水球。
  if(effectLevel('wind-blade')) {
    const blade=cardBlock('wind-blade','onMeleeHit');
    const other=combatTargets().find(t=>!hits.includes(t) && Math.hypot(deltaX(t.x,state.player.x),deltaY(t.y,state.player.y))<=event.radius+t.r && hits.some(h=>cardBlockMatches(blade.conditions[0],t,h.x,h.y)));
    if(other) {skillVisual('gust',state.player.x,state.player.y,{x2:other.x,y2:other.y,color:BUILD_TUNING.wind.color});hitBuildTarget(other,event.damage*blade.actions[0].multiplier);}
  }
}
Survivor.engine.weapons = {activeWeapon,swingAtNearest,rules:SurvivorWeapons};

// 表現接合：只接收揮擊事件與受擊目標；不改傷害、範圍或擊退規則。
function meleeImpact(target,event) {
  if(bossWeakpointConfig(target))return; // 共用傷害入口已選護甲小回饋／弱點大回饋。
  feedbackImpact(weaponFeedback(event),true,state.player,target);
}
