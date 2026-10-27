// 純輸入規則：只接收秒數、世界方向和武器設定，不讀 DOM。
globalThis.SurvivorAttackInput = {
  step(previous, weapon, dt, holding, chargeRate=1) {
    const p=previous||{number:0,idle:0,charge:0};
    const idle=p.idle+dt;
    return {...p,number:idle>=weapon.comboReset?0:p.number,idle,
      charge:holding&&weapon.chargeEnabled?Math.min(weapon.chargeSeconds,p.charge+dt*chargeRate):0};
  },
  release(kind, heldSeconds, angle, weapon, dash) {
    return {type:'attack-released',kind,weaponId:weapon.id,heldSeconds,angle,
      charged:kind==='attack'&&weapon.chargeEnabled&&heldSeconds>=weapon.chargeSeconds,dash:!!dash};
  },
  // 特殊招也由武器積木編譯出的資料驅動；保留事件與戰鬥接合邊界。
  special(weaponId, angle, weapon = SURVIVOR_DEFAULTS.weapons.find(w=>w.id===weaponId)) {
    return {type:'weapon-special',weaponId,angle,cooldown:weapon.specialCooldown,
      kind:weapon.specialKind,count:weapon.specialCount,spread:weapon.specialSpread,
      range:weapon.specialRange,damageMultiplier:weapon.specialDamage,
      leapDistance:weapon.specialLeapDistance,leapSeconds:weapon.specialLeapSeconds};
  }
};
const manualHolds={attack:null,special:null};
const manualButtons={attack:document.getElementById('attackButton'),special:document.getElementById('specialButton')};
function manualMode() {return GAME_DATA.attackMode==='manual';}
function manualAimAngle(hold) {
  if(hold&&hold.angle!==null)return hold.angle;
  const t=closestEnemy();
  return t?Math.atan2(deltaY(t.y,state.player.y),deltaX(t.x,state.player.x)):Math.atan2(state.faceY,state.faceX);
}
function beginManualAttack(kind, pointerId=null, point=null) {
  if(!manualMode()||state.mode!=='playing'||manualHolds[kind])return false;
  if(kind==='special'&&(state.specialCooldown>0||state.manualLeap))return false;
  manualHolds[kind]={pointerId,origin:point,angle:null,seconds:0};
  if(inputActionLocked()){bufferAction({kind:'held',attackKind:kind});}
  // 衝刺中的按下立即出招，不必等手指放開。
  if(kind==='attack'&&state.dashTimer>0&&!state.manualDashUsed)releaseManualAttack(kind);
  return true;
}
function cancelManualAttack() {
  state.inputBuffer=null;
  manualHolds.attack=null;manualHolds.special=null;
  if(state.weaponAttack&&manualMode())state.weaponAttack.charge=0;
}
function releaseManualAttack(kind) {
  const hold=manualHolds[kind];manualHolds[kind]=null;
  if(!hold||!manualMode()||state.mode!=='playing')return;
  const dash=state.dashTimer>0&&!state.manualDashUsed;
  const event=SurvivorAttackInput.release(kind,hold.seconds,manualAimAngle(hold),activeWeapon(),dash);
  if(inputActionLocked()){bufferAction({kind:'attack',event});return;}
  executeAttackInput(event);
}
function executeAttackInput(event) {
  const kind=event.kind,dash=event.dash;
  state.lastAttackInput=event;
  if(kind==='special') {
    if(state.specialCooldown>0||state.manualLeap)return;
    const special=SurvivorAttackInput.special(state.weaponId,event.angle,activeWeapon());
    state.specialCooldown=special.cooldown;state.lastSpecialEvent=special;
    if(special.kind==='leap') {
      state.manualLeap={...special,left:special.leapSeconds};
      skillVisual('gust',state.player.x,state.player.y,{x2:state.player.x+Math.cos(event.angle)*special.leapDistance,y2:state.player.y+Math.sin(event.angle)*special.leapDistance,color:'#fff0a5'});
    } else executeManualSpecial(special);
  } else {
    if(state.manualTiming && state.manualTiming.phase!=='ready')return;
    const timing={...activeWeapon().timing};
    state.manualTiming={...SurvivorTiming.start(timing),config:timing,event};
    if(dash)state.manualDashUsed=true;
    // 零起手可立即生效；其餘等待同一套時間軸進入 active。
    if(!timing.windup) advanceManualTiming(0);

  }
  updateActionControls();
}
function executeManualSpecial(event) {return withImpactBatch(()=>manualSpecialImpacts(event));}
function manualSpecialImpacts(event) {
  if(event.kind==='leap') {
    const swing={angle:event.angle,arc:Math.PI*.8,radius:event.range,damage:effectiveDamage()*event.damageMultiplier,push:45,heavy:true,shape:'sector',width:20};
    skillVisual('hammer-swing',state.player.x,state.player.y,{...swing,...(moveFeedback(activeWeapon(),'special').slash?{}:{slash:false}),colors:['water'],life:.3});
    for(const t of combatTargets().filter(t=>SurvivorWeapons.intersects(deltaX(t.x,state.player.x),deltaY(t.y,state.player.y),t.r,swing))) {
      const hp=t.hp;hitBuildTarget(t,swing.damage);
      if(t.hp<hp && state.mode==='playing')meleeImpact(t,{...swing,feedbackId:'special'});
      if(state.mode!=='playing')return;
      if(t.alive||t===state.boss){shiftTarget(t,state.player.x,state.player.y,swing.push);stunTarget(t,Math.max(t.stunTimer||0,.8));}
    }
  } else {
    for(let i=0;i<event.count&&state.projectiles.length<PROJECTILE_LIMIT;i++) {
      const angle=event.angle+(i-(event.count-1)/2)*event.spread;
      state.projectiles.push(takeFromPool(state.projectilePool,{x:state.player.x,y:state.player.y,vx:Math.cos(angle)*PROJECTILE_SPEED,vy:Math.sin(angle)*PROJECTILE_SPEED,
        r:event.kind==='sword-wave'?16:12,damage:effectiveDamage()*event.damageMultiplier,pierce:event.kind==='sword-wave'?99:0,piercing:event.kind==='sword-wave',
        feedback:feedbackPayload(weaponFeedback({feedbackId:'special'})),rangeLeft:event.range,colors:buildAppearance().colors,schools:[],hitList:[],alive:true,push:0,charged:false,blade:event.kind==='sword-wave',bigBubble:false,autoCharged:false,boosted:false,bounces:0,fragment:false,maker:false}));
    }
  }
  const feedback=moveFeedback(activeWeapon(),'special');
  if(event.kind==='leap')queueImpact(0,feedback.sound===undefined?'shoot':feedback.sound,-2);
  else feedbackSound(feedback,'shoot');
}
function advanceManualTiming(dt) {
  let a=state.manualTiming;
  if(!a || a.phase==='ready')return;
  a=SurvivorTiming.advance(a,a.config,dt); state.manualTiming=a;
  if(a.phase==='active' && a.entered) {
    const event=a.event;
    state.weaponAttack={...(state.weaponAttack||{number:0,idle:0}),charge:event.charged?activeWeapon().chargeSeconds:0};
    fireAtNearest(event);
    // 連段最後一擊的額外收招仍保留，供衝刺取消。
    a.config={...a.config,recovery:a.config.recovery+(state.attackRecovery||0)};
    state.attackRecovery=0;
    if(state.weaponAttack)state.weaponAttack.charge=0;
  }
  state.manualRecovery=a.phase==='ready'?0:a.left;
  if(a.phase!=='ready' && !a.left)advanceManualTiming(0);
}
function cancelManualRecovery() {
  if(!manualMode() || !state.manualTiming)return;
  state.manualTiming=SurvivorTiming.cancelRecovery(state.manualTiming,state.manualTiming.config);
  // 零冷卻直接回到可出招；有冷卻仍必須等待。
  if(state.manualTiming.phase==='cooldown' && !state.manualTiming.left)advanceManualTiming(0);
  state.manualRecovery=state.manualTiming.phase==='ready'?0:state.manualTiming.left;
}
function tickManualAttack(dt) {
  if(!manualMode())return;
  advanceManualTiming(dt);
  state.specialCooldown=countdown(state.specialCooldown||0,dt);
  const chargeDt=dt*teacherBonuses().charge;
  for(const [kind,hold] of Object.entries(manualHolds))if(hold)hold.seconds+=kind==='attack'?chargeDt:dt;
  state.weaponAttack=SurvivorAttackInput.step(state.weaponAttack,activeWeapon(),dt,!!manualHolds.attack,teacherBonuses().charge);
  if(state.manualLeap) {
    const leap=state.manualLeap,step=Math.min(dt,leap.left)/leap.leapSeconds*leap.leapDistance;
    state.player.x+=Math.cos(leap.angle)*step;state.player.y+=Math.sin(leap.angle)*step;
    clampToMap(state.player);updateCamera();leap.left=countdown(leap.left,dt);
    if(!leap.left){state.manualLeap=null;executeManualSpecial(leap);}
  }
}
function updateManualControls() {
  const enabled=manualMode();
  if(actionControls.classList.toggle)actionControls.classList.toggle('manual-controls',enabled);
  for(const [kind,button] of Object.entries(manualButtons)) {
    if(!button)continue;
    button.hidden=!enabled;
    if (kind === 'attack' && button.dataset.weaponIcon !== activeWeapon().icon) {
      button.dataset.weaponIcon = activeWeapon().icon;
      button.innerHTML = '<span aria-hidden="true">' + SurvivorIcons.html(activeWeapon().icon) + '</span>';
    }
    const remaining=kind==='special'?(state.specialCooldown||0):(state.manualTiming && state.manualTiming.phase!=='ready' ? Math.max(.001,state.manualTiming.left) : 0);
    button.setAttribute('aria-disabled',String(remaining>0));
    button.style.background=`conic-gradient(#9df6ff ${Math.max(0,1-remaining/(kind==='special'?6:Math.max(.001,state.manualTiming ? state.manualTiming.config[state.manualTiming.phase] : .12)))*360}deg,#375776 0deg)`;
  }
  if(state.mode!=='playing')cancelManualAttack();
}
function drawManualAim() {
  return SurvivorArt.paint('layer/draw-manual-aim', null, () => drawManualAimPlaceholder.apply(this, arguments));
}
function drawManualAimPlaceholder() {
  if(!manualMode())return;
  const hold=manualHolds.special||manualHolds.attack;
  if(!hold||hold.angle===null)return;
  if(!moveFeedback(activeWeapon(),manualHolds.special?'special':'primary').hint)return;
  const angle=hold.angle,x=state.player.x,y=state.player.y,length=85;
  ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.strokeStyle='#fff0a5';ctx.lineWidth=4;
  warningFeedback(moveFeedback(activeWeapon(),manualHolds.special?'special':'primary'),state.elapsed);
  ctx.beginPath();ctx.moveTo(22,0);ctx.lineTo(length,0);ctx.lineTo(length-14,-12);ctx.moveTo(length,0);ctx.lineTo(length-14,12);ctx.stroke();ctx.restore();
}
for(const [kind,button] of Object.entries(manualButtons)) {
  if(!button)continue;
  button.innerHTML='<span aria-hidden="true">'+SurvivorIcons.html(kind==='attack'?'candy-sword':'thunder-charge')+'</span>';
  button.addEventListener('pointerdown',e=>{
    e.preventDefault();e.stopPropagation();
    if(beginManualAttack(kind,e.pointerId,canvasPoint(e)))button.setPointerCapture(e.pointerId);
  });
  button.addEventListener('pointermove',e=>{
    const hold=manualHolds[kind];if(!hold||hold.pointerId!==e.pointerId)return;
    e.preventDefault();const p=canvasPoint(e),dx=p.x-hold.origin.x,dy=p.y-hold.origin.y;
    hold.angle=Math.hypot(dx,dy)>=14?Math.atan2(dy,dx):null;
  });
  button.addEventListener('pointerup',e=>{
    const hold=manualHolds[kind];if(!hold||hold.pointerId!==e.pointerId)return;
    e.preventDefault();releaseManualAttack(kind);
  });
  for(const name of ['pointercancel','lostpointercapture'])button.addEventListener(name,e=>{
    if(manualHolds[kind]&&manualHolds[kind].pointerId===e.pointerId){manualHolds[kind]=null;if(kind==='attack'&&state.weaponAttack)state.weaponAttack.charge=0;}
  });
  button.addEventListener('click',e=>{if(e.detail===0){beginManualAttack(kind);releaseManualAttack(kind);}});
}
window.addEventListener('blur',cancelManualAttack);
document.addEventListener('visibilitychange',()=>{if(document.hidden)cancelManualAttack();});

function inputActionLocked() {
  return (state.player.hitStop||0)>0 || !!state.player.feedbackFrozen || !!(state.manualTiming && ['recovery','cooldown'].includes(state.manualTiming.phase));
}
function bufferAction(command) {
  state.inputBuffer=SurvivorTiming.buffer(state.inputBuffer,command,activeWeapon().timing.inputBuffer??.12);
}
function flushBufferedInput(dt) {
  const result=SurvivorTiming.consume(state.inputBuffer,dt,!inputActionLocked());
  state.inputBuffer=result.buffer;
  const c=result.command;if(!c)return;
  if(c.kind==='dash')activateDash();
  else if(c.kind==='attack')executeAttackInput(c.event);
  else if(c.kind==='held' && manualHolds[c.attackKind])releaseManualAttack(c.attackKind);
}
Survivor["manual-attack"]={rules:SurvivorAttackInput,beginManualAttack,releaseManualAttack,cancelManualAttack,tickManualAttack};
