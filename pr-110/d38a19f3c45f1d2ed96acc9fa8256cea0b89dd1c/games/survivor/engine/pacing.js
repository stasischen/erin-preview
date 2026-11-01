// 可移植規則：抽樣由呼叫者傳入；時間用秒，回傳值只有資料。
(function(root) {
  const pick = (rows, sample) => rows[Math.min(rows.length-1,Math.floor(sample*rows.length))];
  function drawTwo(rows, samples) {
    const pool=rows.slice(), result=[];
    for(let i=0;i<2 && pool.length;i++) {const id=pick(pool,samples[i]);result.push(id);pool.splice(pool.indexOf(id),1);}
    return result;
  }
  function plan(data,stageId,samples) {
    const themes=data.pacing.themes[stageId];
    const extra=drawTwo(data.enemies.slice(2).map(e=>e.id).filter(id=>!themes.includes(id)),samples);
    return {stageId,types:['jaben','otsubon',...themes,...extra],events:drawTwo(data.pacing.eventPool,samples.slice(2)),eventIndex:0,queue:[],cursor:0};
  }
  function candidates(run,seconds) {
    if(seconds<20) return ['jaben'];
    if(seconds<45) return ['jaben','otsubon'];
    if(seconds<70) return run.types.filter(id=>!['pudding','pop-candy'].includes(id));
    return run.types;
  }
  function density(config,seconds) { return config.density * ((config.pattern==='steady' || Math.floor(seconds/config.cycleSeconds)%2) ? config.strongScale : config.weakScale); }
  // 純狀態轉換：每次最多換一階段，避免掉幀跳過玩家應看到的預警／生效。
  function advanceAttack(a,c,dt) {
    return SurvivorTiming.advance(a,c,dt);
  }
  function attackAngles(c,angle) {
    if(!c.radial || c.count===1) return [angle];
    const gap=c.gapDegrees*Math.PI/180;
    return Array.from({length:c.count},(_,i)=>angle+gap/2+i*(Math.PI*2-gap)/(c.count-1));
  }
  // 同一形狀資料用於地面繪圖與主角中心命中；座標由外層換成相對世界座標。
  function inShape(c,x,y) {
    const d=Math.hypot(x,y);
    if(c.shape==='line') return x>=0 && x<=c.length && Math.abs(y)<=c.radius;
    if(c.shape==='sector') return d<=c.radius && Math.abs(Math.atan2(y,x))<=c.angle*Math.PI/360;
    if(c.shape==='circle') return d<=c.radius;
    if(c.shape==='ring') return d<=c.radius && d>=c.innerRadius;
    return false;
  }
  function side(position,index=0) {return position==='sides'?index%4:({left:0,right:1,top:2,bottom:3})[position];}
  root.SurvivorPacing={side,plan,candidates,density,pick,advanceAttack,attackAngles,inShape};
})(globalThis);

function resetPacing() { state.pacing=null; }
function ensurePacing() {
  if(!state.pacing || state.pacing.stageId!==currentStage().id) state.pacing=SurvivorPacing.plan(GAME_DATA,currentStage().id,Array.from({length:4},()=>Math.random()));
  return state.pacing;
}
function pacingType() {
  if(PREVIEW_MODE) return ENEMY_TYPES[0].id;
  const run=ensurePacing(), ids=SurvivorPacing.candidates(run,state.stageElapsed);
  // 每三隻至少一隻沙包，始終保留容易打倒的目標。
  return run.cursor++%3===0 ? 'jaben' : SurvivorPacing.pick(ids,Math.random());
}
function updatePacing(dt) {
  if(PREVIEW_MODE || state.boss || state.bossIntro>0) return;
  const run=ensurePacing(), cfg=GAME_DATA.pacing;
  const times=cfg.eventTimes || [45,90];
  if(run.eventIndex<2 && state.stageElapsed>=times[run.eventIndex]) {
    const kind=run.events[run.eventIndex++];
    run.queue=Array.from({length:cfg.eventCount},(_,i)=>({kind,index:i}));
    run.warning=cfg.warning; run.timer=0;
    // 波次改用畫面邊緣脈動預告；不改動其他事件的必要文字。
    playSound('warning');
  }
  if(run.warning>0) {run.warning=countdown(run.warning,dt);return;}
  run.timer=countdown(run.timer||0,dt);
  if(run.queue.length && !run.timer) {
    const entry=run.queue[0], kind=entry.kind;
    const effect=GAME_DATA.waveEvents && GAME_DATA.waveEvents[kind] || {typeId:kind==='tide'?'otsubon':kind==='candy-rain'?'pop-candy':'jaben',elite:kind==='elite-squad',position:kind==='ring'?'sides':kind==='tide'?'left':'zone'};
    const enemy=spawnEnemy({typeId:effect.typeId==='pacing'?undefined:effect.typeId,elite:effect.elite,side:SurvivorPacing.side(effect.position,entry.index),offscreen:effect.position==='random'});
    if(enemy) run.queue.shift();
    // 精英仍遵守同時上限，滿額跳過，不能堵住事件佇列。
    else if(effect.elite && state.enemies.filter(e=>e.alive&&e.elite).length>=GAME_DATA.elites.limit) run.queue.shift();
    run.timer=cfg.eventSeconds/cfg.eventCount;
  }
}
function updateEnemyBehavior(e,dt) {
  if(e.miniboss) return;
  const cfg=GAME_DATA.pacing;
  e.actionCooldown=countdown(e.actionCooldown===undefined ? 2 : e.actionCooldown,dt);
  e.fairyShieldLife=countdown(e.fairyShieldLife||0,dt);
  if(!e.fairyShieldLife) e.fairyShield=0;
  if(e.stunTimer>0 || state.bossIntro>0) return;
  const visible=targetVisible(e), distance=encounterDistance(e,state.player);
  if(!visible) {e.action=null;e.phaseAttack=null;return;}
  if(!e.action && !(e.behavior==='support' && !e.phaseAttack && e.actionCooldown<=0) && updatePhasedAttack(e,dt)) return;
  if(e.action) {
    e.action.warning=countdown(e.action.warning,dt);
    if(e.action.warning>0) return;
    if(e.action.kind==='charge') {
      if(e.action.life===undefined) e.action.life=cfg.chargeSeconds;
      const step=Math.min(dt,e.action.life); e.action.life=countdown(e.action.life,dt);
      e.x+=Math.cos(e.action.angle)*cfg.chargeSpeed*step;
      e.y+=Math.sin(e.action.angle)*cfg.chargeSpeed*step;
      clampToMap(e);
      if(!e.action.life) {e.action=null;e.actionCooldown=3;}
    } else if(e.action.kind==='blast') {
      const point={x:e.x,y:e.y,r:cfg.blastRadius};
      e.alive=false; // 消耗自己，不觸發擊敗獎勵或遞迴自爆。
      skillVisual('splash',e.x,e.y,{radius:cfg.blastRadius,color:'#ffad91',life:.4});
      if(distance<cfg.blastRadius+state.player.r) pacingHurtPlayer(cfg.blastDamage);
      for(const other of state.enemies.slice()) if(other!==e && other.alive && encounterDistance(point,other)<cfg.blastRadius+other.r) damageEnemy(other,cfg.blastEnemyDamage);
      e.action=null;
    } else {
      for(const other of state.enemies) if(other!==e && other.alive && !other.miniboss && encounterDistance(e,other)<cfg.shieldRadius) {
        other.fairyShield=cfg.shieldHits; other.fairyShieldLife=cfg.shieldSeconds;
      }
      e.action=null;e.actionCooldown=cfg.shieldSeconds;
    }
    return;
  }
  if(e.actionCooldown>0) return;
  if(e.behavior==='charger' && distance<420) e.action={kind:'charge',warning:cfg.warning,angle:Math.atan2(deltaY(state.player.y,e.y),deltaX(state.player.x,e.x))};
  if(e.behavior==='bomber' && distance<cfg.blastRadius+70) e.action={kind:'blast',warning:cfg.fuseSeconds};
  if(e.behavior==='support') e.action={kind:'shield',warning:cfg.warning};
  if(e.action) feedbackSound(enemyFeedback(e,'legacy'),'warning');
}
function enemyDirection(e,distance) {
  if(e.action || e.phaseAttack && !['cooldown','ready'].includes(e.phaseAttack.phase) || e.behavior==='still') return 0;
  if(['retreat','shooter','support'].includes(e.behavior)) {
    const range=e.behavior==='support'?280:230;
    return distance<range ? -1 : distance<range+60 ? 0 : 1;
  }
  return 1;
}
function separateTanks() {
  for(const tank of state.enemies) if(tank.alive && tank.behavior==='tank') {
    for(const other of state.enemies) if(other!==tank && other.alive && !other.miniboss) {
      const dx=deltaX(other.x,tank.x),dy=deltaY(other.y,tank.y),d=Math.hypot(dx,dy),gap=tank.r+other.r;
      if(d<gap) {other.x+=(d?dx/d:1)*(gap-d);other.y+=(d?dy/d:0)*(gap-d);clampToMap(other);}
    }
  }
}
function splitJelly(e) {
  if(e.behavior!=='splitter' || e.small) return;
  // 只入列可序列化的死亡位置；下一個更新邊界才生成，避免遍歷時遞迴。
  for(let i=0;i<2 && state.jellyQueue.length<18;i++) state.jellyQueue.push({typeId:e.typeId,x:e.x+(i?10:-10),y:e.y});
}

function pacingHurtPlayer(damage,feedback,attacker=null) {
  if (state.practiceHit) { if(state.dashTimer<=0 && state.player.invincible<=0) {state.practiceHit();feedbackImpact(feedback||{...SurvivorData.FEEDBACK_TIERS.small,hitStop:1,shake:1},true,attacker,state.player);} return; }
  if(state.player.damageDisabled || state.dashTimer>0 || state.player.invincible>0) return;
  feedbackImpact(feedback||{...SurvivorData.FEEDBACK_TIERS.small,hitStop:1,shake:1},true,attacker,state.player);
  state.player.health=Math.max(0,state.player.health-absorbSchoolHit(damage));
  state.player.invincible=INVINCIBLE_SECONDS;state.player.hitFlash=.16;
  playSound('hurt'); updateHud(); counterDischarge();
  if(state.player.health<=0) finishRun(false);
}
Survivor.engine.pacing={rules:SurvivorPacing,resetPacing,ensurePacing,updatePacing,updateEnemyBehavior,splitJelly};

// 平台接合層：純規則回傳階段，這裡才套用傷害、投射物及聲音。
function updatePhasedAttack(e,dt) {
  const config=(ENEMY_TYPES.find(t=>t.id===e.typeId)||{}).phaseAttack;
  if(!config || !config.enabled || e.miniboss) return false;
  let a=e.phaseAttack;
  if(!a || a.phase==='ready') {
    if(encounterDistance(e,state.player)>config.triggerDistance) return false;
    a={...SurvivorTiming.start(config),x:e.x,y:e.y,
      angle:Math.atan2(deltaY(state.player.y,e.y),deltaX(state.player.x,e.x)),config:{...config},hit:false};
    e.phaseAttack=a;feedbackSound(enemyFeedback(e),'warning');return true;
  }
  a=SurvivorPacing.advanceAttack(a,a.config,dt);e.phaseAttack=a;
  const c=a.config;
  if(a.phase==='active') {
    if(c.shape==='projectiles' && a.entered) {
      for(const angle of SurvivorPacing.attackAngles(c,a.angle)) {
        if(state.enemyShots.filter(s=>s.source==='book').length>=UPGRADE_TUNING.enemyShotLimit) break;
        state.enemyShots.push(takeFromPool(state.enemyShotPool,{source:'book',phaseShot:true,dodged:false,feedback:feedbackPayload(enemyFeedback(e)),
          x:a.x,y:a.y,vx:Math.cos(angle)*c.speed,vy:Math.sin(angle)*c.speed,
          r:c.radius,damage:c.damage,candy:c.radial,text:'●',life:Math.min(SurvivorTiming.segments(c)[1].seconds,c.length/c.speed)}));
      }
    } else if(c.shape!=='projectiles' && !a.hit) {
      const dx=deltaX(state.player.x,a.x),dy=deltaY(state.player.y,a.y);
      const x=dx*Math.cos(a.angle)+dy*Math.sin(a.angle),y=-dx*Math.sin(a.angle)+dy*Math.cos(a.angle);
      if(SurvivorPacing.inShape(c,x,y)) {
        a.hit=true;pacingHurtPlayer(c.damage,enemyFeedback(e),e);
      }
    }
  }
  return !['cooldown','ready'].includes(a.phase);
}
function bodyContactDamage(enemy) {
  if(enemy.miniboss) return enemy.damage;
  return GAME_DATA.bodyContact.pushOnly ? 0 : enemy.damage*GAME_DATA.bodyContact.damageScale;
}
function pushEnemyBodies() {
  if(!GAME_DATA.bodyContact.pushOnly) return;
  for(const e of state.enemies) {
    if(!e.alive || e.miniboss) continue;
    const dx=deltaX(e.x,state.player.x),dy=deltaY(e.y,state.player.y),d=Math.hypot(dx,dy),gap=e.r+state.player.r;
    if(d<gap) {e.x+=(d?dx/d:1)*(gap-d);e.y+=(d?dy/d:0)*(gap-d);clampToMap(e);}
  }
}
