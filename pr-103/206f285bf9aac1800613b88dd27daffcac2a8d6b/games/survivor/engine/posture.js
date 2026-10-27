// 純規則：同樣的事件積木可用於主角或敵人的架勢，不讀 DOM、實體或時鐘。
globalThis.SurvivorPosture = (() => {
  const initial=()=>({value:0,stun:0});
  function perfect(seconds,window) {return Number.isFinite(seconds)&&seconds>=0&&seconds<=window+1e-8;}
  // 移動圓與靜止圓第一次接觸的秒數（相對世界座標）；遠離、擦不到皆 Infinity。
  function contact(dx,dy,vx,vy,r) {
    const c=dx*dx+dy*dy-r*r,a=vx*vx+vy*vy,b=dx*vx+dy*vy;
    if(c<=0)return 0;
    if(!a||b>=0||b*b-a*c<0)return Infinity;
    return (-b-Math.sqrt(b*b-a*c))/a;
  }
  function step(previous,rule,config,dt=0,breakRule=null) {
    const p=previous||initial(), seconds=Math.max(0,dt);
    if(p.stun>0)return {state:{value:0,stun:Math.max(0,p.stun-seconds)},events:[]};
    const amount=(rule&&rule.actions||[]).filter(a=>a.type==='posture').reduce((n,a)=>n+a.amount,0);
    const value=Math.max(0,Math.min(config.maximum,p.value+amount-(amount>0?0:config.decay*seconds)));
    if(value<config.maximum)return {state:{value,stun:0},events:[]};
    const actions=breakRule?breakRule.actions:[{type:'stun',duration:config.stunSeconds},{type:'heal',amount:config.heal}];
    return {state:{value:0,stun:(actions.find(a=>a.type==='stun')||{}).duration||0},events:[{type:'posture-broken',actions}]};
  }
  function bonuses(previous,config) {const active=!!previous&&previous.stun>0;return {charge:active?1+config.chargeBonus:1,damage:active?config.damageMultiplier:1};}
  return {initial,perfect,contact,step,bonuses};
})();
SurvivorEffectBlocks.posture=SurvivorPosture;

function teacherBonuses() {return SurvivorPosture.bonuses(state.boss&&state.boss.posture,GAME_DATA.boss.posture);}
function teacherPostureEvent(trigger) {
  const b=state.boss;if(!b||state.bossIntro>0||state.bossPhasePause>0)return;
  const rule=SurvivorEffectBlocks.event('posture',trigger,GAME_DATA);
  const result=SurvivorPosture.step(b.posture,rule,GAME_DATA.boss.posture,0,SurvivorEffectBlocks.event('posture','onPostureBreak',GAME_DATA));
  const old=b.posture||SurvivorPosture.initial();b.posture=result.state;
  if(old.value<GAME_DATA.boss.posture.maximum*.75&&b.posture.value>=GAME_DATA.boss.posture.maximum*.75)playSound('warning');
  if(result.events.length) {
    // 只有真的 posture-broken 事件才提供原因；撞牆／普通暈眩共用 stun 不能冒充。
    if(result.events.some(event=>event.type==='posture-broken'))triggerBossWeakpoint(b,'posture-break',b.posture.stun);
    clearBossMoves();b.recoveryLeft=0;b.pursuing=false;
    const heal=result.events[0].actions.filter(a=>a.type==='heal').reduce((n,a)=>n+a.amount,0);
    state.player.health=Math.min(maxPlayerHealth(),state.player.health+heal);
    b.flash=.3;tierImpact('large',state.player,b);
    skillVisual('discharge',b.x,b.y,{radius:b.r+36,color:'#fff0a5',life:.5});burst(b.x,b.y,'#fff0a5',20);playSound('posture');
  }
  updateHud();
}
function teacherRecoveryHit() {
  if(state.boss && ((state.boss.recoveryLeft||0)>0||state.bossMoves.some(m=>m.recovery>0)))teacherPostureEvent('onRecoveryHit');
}
// 所有暈眩效果共用這個入口；打斷立即清除招式，不讓預警在暈完後突然生效。
function stunTarget(target,seconds) {
  if(target.trialActor&&target!==state.boss)return withTrialBody(target,()=>stunTarget(target,seconds));
  if(target!==state.boss){target.stunTimer=seconds;return;}
  if(!(seconds>0))return;
  if(target===state.boss && state.bossMoves.length && !(target.stunTimer>0) && !(target.posture&&target.posture.stun>0)) {
    const interrupt=state.bossMoves.some(m=>!(m.recovery>0));
    clearBossMoves();if(interrupt)teacherPostureEvent('onInterrupt');
    state.bossRest=GAME_DATA.boss.phases[state.bossPhase-1].rest;
  }
  target.stunTimer=Math.max(target.stunTimer||0,seconds);
}
// 輸入層提供一次衝刺事件；只計算真正會碰到主角的老師招式，並記住已閃過的物件。
function teacherDodgeThreat() {
  const p=state.player,b=state.boss,cfg=GAME_DATA.boss.posture;
  if(state.trial&&state.trial.actors&&state.bossIntro<=0&&p.invincible<=0&&!p.damageDisabled)return encounterDodgeThreat();
  if(!b||state.bossIntro>0||state.bossPhasePause>0||p.invincible>0||p.damageDisabled||b.posture&&b.posture.stun>0)return null;
  const contact=(x,y,vx,vy,r)=>SurvivorPosture.contact(deltaX(x,p.x),deltaY(y,p.y),vx,vy,r+p.r);
  for(const shot of state.enemyShots)if(shot.source==='teacher'&&!shot.dodged&&shot.damage>0) {
    const time=contact(shot.x,shot.y,shot.vx,shot.vy,shot.r);
    if(time<=shot.life&&SurvivorPosture.perfect(time,cfg.window))return shot;
  }
  if(state.trial)return trialDodgeThreat();
  for(const m of state.bossMoves) {
    const def=bossDefinition(m),kind=bossKind(m);
    if(m.dodged||m.recovery>0||!(def.damage>0))continue;
    let time=Infinity;
    const wait=m.active?0:m.warning;
    const near=q=>Math.hypot(deltaX(q.x,p.x),deltaY(q.y,p.y))<=q.r+p.r;
    if(['rain','call','tracking'].includes(kind)&&!m.active&&m.points.some(near))time=wait;
    if(kind==='leap'&&m.points.some(near))time=wait+(m.active?m.life:def.duration);
    if(['dash','combo'].includes(kind)) {
      const x=m.active?b.x:m.x,y=m.active?b.y:m.y,dx=deltaX(m.endX,x),dy=deltaY(m.endY,y),len=Math.hypot(dx,dy);
      const t=contact(x,y,dx/Math.max(1,len)*def.speed,dy/Math.max(1,len)*def.speed,b.r);
      if(t<=len/def.speed)time=wait+t;
    }
    if(['words','chalk','sniper'].includes(kind)&&!m.active)for(let i=0;i<m.count;i++) {
      const a=m.angle+(i-(m.count-1)/2)*def.spread;
      const speed=state.bossPhase>=2&&['words','chalk'].includes(kind)?(kind==='words'?GAME_DATA.boss.combat.phaseWordsSpeed:GAME_DATA.boss.combat.phaseChalkSpeed):def.speed;
      time=Math.min(time,wait+contact(m.x,m.y,Math.cos(a)*speed,Math.sin(a)*speed,kind==='words'?17:10));
    }
    if(['ring','cage'].includes(kind)) {
      const distance=Math.hypot(deltaX(p.x,m.x),deltaY(p.y,m.y));
      const end=kind==='cage'?0:Math.max(50,m.radius*.52),speed=(m.radius-end)/def.duration;
      const radius=end+(m.radius-end)*(m.active?m.life/def.duration:1);
      const t=Math.max(0,(radius-distance-p.r-10)/Math.max(.001,speed));
      if(t<=(m.active?m.life:def.duration) && (kind==='cage'?Math.abs(radius-speed*t-distance)<=p.r+10:ringPoints({...m,life:Math.max(0,(m.active?m.life:def.duration)-t)}).some(near)))time=wait+t;
    }
    if(kind==='wall') {
      const x=wallX(m),dx=deltaX(p.x,x),dy=deltaY(p.y,m.y);
      if(dy>=0&&dy<=m.wallHeight&&dx>=-p.r-10)time=wait+Math.max(0,(dx-p.r-10)/def.speed);
    }
    if(SurvivorPosture.perfect(time,cfg.window))return m;
  }
  return null;
}
function teacherPerfectDodge(threat) {
  if(threat&&threat.owner&&state.trial&&state.trial.actors){const body=trialBodies().find(b=>b.actorId===threat.owner);if(body&&body!==state.boss)return withTrialBody(body,()=>teacherPerfectDodge(threat));}
  if(!threat)return;
  threat.dodged=true;state.player.perfectFlash=.35;
  teacherPostureEvent('onPerfectDodge');playSound('perfect');
}
Survivor.engine.posture={rules:SurvivorPosture,teacherPostureEvent,stunTarget};
