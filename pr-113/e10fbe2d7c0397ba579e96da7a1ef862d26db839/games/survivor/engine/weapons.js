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
    return { type:'weapon-swung', weaponId:weapon.id, number, angle, shape, spin, charged, thrust, stun:charged?weapon.chargeStun:0, heavy:charged || finisher || !!attack.dash, reverse:sword && number===2, width:weapon.thrustWidth*powers.size*(1+Math.min(.5,powers.extraArc||0)),
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
    const original=globalThis.SURVIVOR_DEFAULTS?.cards.find(c=>c.id===card.id), note=weapon.id==='candy-sword'?'descriptionSword':'descriptionMelee';
    if(original && card.description===original.description && card[note]===original[note] && card.effects?.some(e=>e.feature===card.id)) {
      if(card.id==='splash-water')return weapon.id==='candy-sword'?'連段收尾、蓄力或衝刺攻擊追加一道穿透劍氣。':'連段收尾、蓄力或衝刺重擊追加一次環形震波。';
      if(card.id==='wind-blade' && weapon.id==='candy-sword')return '命中後追斬仍在前方範圍內的目標，單一敵人也有效。';
    }
    return (weapon.id==='candy-sword' && card.descriptionSword) || card.descriptionMelee || card.description;
  }
  function cardPresentation(card, weapon) {
    const original=globalThis.SURVIVOR_DEFAULTS?.cards.find(c=>c.id===card.id);
    if(weapon.kind!=='melee' || !original || card.name!==original.name) return card;
    const sword=weapon.id==='candy-sword', noun=sword?'劍':'錘';
    const names={'big-water':sword?'巨刃強化':'重錘強化','rapid-water':'疾速揮'+noun,
      'multi-water':sword?'闊刃斬擊':'廣域揮錘','piercing-water':sword?'延伸劍鋒':'延伸錘擊',
      'splash-water':sword?'收招劍氣':'重擊震波','water-attack':'水紋'+noun+'擊',
      'wind-attack':sword?'疾風劍鋒':'疾風錘擊','thunder-attack':'雷霆'+noun+'擊',
      'water-drop':sword?'蓄勢重斬':'蓄勢重錘','wind-blade':sword?'追風斬':'追風錘'};
    return names[card.id]?{...card,name:names[card.id],icon:card.icon===original.icon?weapon.icon:card.icon}:card;
  }
  function upgradeSummary(data,card,weapon,current) {
    const effect=(card?.effects||[]).find(e=>['big-water','rapid-water','multi-water','piercing-water','splash-water','wind-blade'].includes(e.feature));
    if(!effect)return '';
    const feature=effect.feature, next=Math.min(current+1,card.maxLevel||5), melee=weapon.kind==='melee', sword=weapon.id==='candy-sword';
    const rule=(level,trigger='onShot')=>SurvivorEffectBlocks.event(feature,trigger,data,{level:Math.min(data.tuning.maxUpgradeLevel,level*(effect.power||1)),damage:100});
    const percent=n=>Math.round(n*100)+'%', pair=fn=>fn(current)+' → '+fn(next);
    if(feature==='big-water')return '基礎傷害 '+pair(n=>percent(rule(n).actions[1].multiplier))+'；範圍 '+pair(n=>percent(rule(n).actions[0].multiplier));
    if(feature==='rapid-water')return '基礎攻擊間隔 '+pair(n=>percent(Math.max(.12/(melee?weapon.interval:data.tuning.shotInterval),rule(n).actions[0].multiplier)));
    if(feature==='multi-water')return melee?'橫斬角度 '+pair(n=>Math.round(Math.min(360,weapon.arcDegrees+rule(n).actions[0].extraArc*180/Math.PI))+'°')+(sword?'；突刺寬度 '+pair(n=>percent(1+Math.min(.5,rule(n).actions[0].extraArc))):''):'每次水球 '+pair(n=>rule(n).actions[0].count+' 顆');
    if(feature==='piercing-water')return melee?'揮擊距離 '+pair(n=>percent(rule(n).actions[0].size)):'額外穿透 '+pair(n=>rule(n).actions[0].count+' 隻');
    if(feature==='splash-water')return (melee?(sword?'劍氣延伸 ':'震波擴展 '):'水花半徑 ')+pair(n=>n?rule(n,'onShotHit').conditions[0].radius+' 格':'未解鎖')+'；追加傷害 '+percent(data.build.supportSplashDamage);
    return '追加傷害 '+pair(n=>n?percent(data.schoolRules.windBladeDamage):'未解鎖');
  }
  return { swing, intersects, receivedDamage, cardNote, cardPresentation, upgradeSummary, aim };
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
  const visual = {...event,elementCharged:properties.charged,...(feedback.slash?{}:{slash:false}),colors:look.colors.slice(),boosted,life:.24};
  skillVisual('hammer-swing',state.player.x,state.player.y,visual); queueImpact(0,feedback.sound===undefined?'shoot':feedback.sound,-2);
  // 後射對應後方小扇形；同一揮擊每個目標最多結算一次。
  if (effectLevel('item-rear') && !event.spin && !event.charged) {
    const rear={...event,angle:event.angle+Math.PI};
    skillVisual('hammer-swing',state.player.x,state.player.y,{...rear,elementCharged:properties.charged,...(feedback.slash?{}:{slash:false}),colors:look.colors.slice(),boosted,life:.24});
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
    triggerMakerEffects('hit',t.x,t.y);
    if(state.mode!=='playing') return;
  }
  // One finisher effect per swing, never one per target; secondary hits do not trigger cards.
  if(effectLevel('splash-water') && (event.heavy || !weapon.comboEnabled && !weapon.chargeEnabled)) {
    const splash=cardBlock('splash-water','onShotHit',{damage:event.damage}), sword=weapon.id==='candy-sword';
    const wave={...event,thrust:sword,arc:Math.PI*2,radius:event.radius+splash.conditions[0].radius};
    skillVisual('weapon-wave',state.player.x,state.player.y,{angle:event.angle,radius:wave.radius,width:event.width,thrust:sword,color:BUILD_TUNING[look.main].color,life:.35});
    for(const other of combatTargets()) if(canAttackTarget(other) && SurvivorWeapons.intersects(deltaX(other.x,state.player.x),deltaY(other.y,state.player.y),other.r,wave)) {
      hitBuildTarget(other,splash.actions[0].amount,{source:state.player});if(state.mode!=='playing')return;
    }
  }
  if(event.step && state.mode==='playing') {state.player.x+=Math.cos(event.angle)*event.step;state.player.y+=Math.sin(event.angle)*event.step;clampToMap(state.player);updateCamera();}
  // 風刃變成一次近距離追斬；不額外發射遠程水球。
  if(effectLevel('wind-blade')) {
    const blade=cardBlock('wind-blade','onMeleeHit');
    const targets=combatTargets().filter(t=>canAttackTarget(t) && (weapon.id!=='candy-sword' || Math.hypot(deltaX(t.x,state.player.x),deltaY(t.y,state.player.y))<=event.radius+t.r));
    const other=(weapon.id==='candy-sword' && targets.find(t=>hits.includes(t) && SurvivorWeapons.intersects(deltaX(t.x,state.player.x),deltaY(t.y,state.player.y),t.r,event))) || targets.find(t=>!hits.includes(t) && Math.hypot(deltaX(t.x,state.player.x),deltaY(t.y,state.player.y))<=event.radius+t.r && hits.some(h=>cardBlockMatches(blade.conditions[0],t,h.x,h.y)));
    if(other) {skillVisual('gust',state.player.x,state.player.y,{x2:other.x,y2:other.y,color:BUILD_TUNING.wind.color});hitBuildTarget(other,event.damage*blade.actions[0].multiplier);}
  }
}
Survivor.engine.weapons = {activeWeapon,swingAtNearest,rules:SurvivorWeapons};

// 表現接合：只接收揮擊事件與受擊目標；不改傷害、範圍或擊退規則。
function meleeImpact(target,event) {
  if(bossWeakpointConfig(target))return; // 共用傷害入口已選護甲小回饋／弱點大回饋。
  feedbackImpact(weaponFeedback(event),true,state.player,target);
}
