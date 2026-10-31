// 引擎無關積木：輸入世界座標、秒、固定抽樣；回傳可序列化結果。
globalThis.SurvivorTrialRules=(()=>{
  function boundary(body,arena) {
    const dx=body.x-arena.x,dy=body.y-arena.y,d=Math.hypot(dx,dy),limit=Math.max(0,arena.radius-(body.r||0));
    return {hit:d>limit,position:d>limit?{x:arena.x+dx/d*limit,y:arena.y+dy/d*limit}:{x:body.x,y:body.y}};
  }
  function rayLength(origin,angle,arena) {
    const dx=origin.x-arena.x,dy=origin.y-arena.y,projection=dx*Math.cos(angle)+dy*Math.sin(angle);
    return Math.max(0,-projection+Math.sqrt(Math.max(0,projection*projection+arena.radius*arena.radius-dx*dx-dy*dy)));
  }
  function camera(player,arena,width,height) {
    const axis=(value,center,half)=>center+Math.max(-Math.max(0,arena.radius-half+48),Math.min(Math.max(0,arena.radius-half+48),value-center));
    return {x:axis(player.x,arena.x,width/2)-width/2,y:axis(player.y,arena.y,height/2)-height/2};
  }
  function entry(arena,r,index=0,count=1) {
    // 橫向入口留在固定面積視野中，雙子並排；預警圓也留在短邊內。
    return boundary({x:arena.x+(count>1?(index?85:-85):-Math.min(240,arena.radius-r-30)),y:arena.y-(count>1?95:0),r:r+30},arena).position;
  }
  function pursue(body,target,speed,dt,stop=body.r+target.r+12) {
    const dx=target.x-body.x,dy=target.y-body.y,d=Math.hypot(dx,dy);
    const step=Math.min(Math.max(0,d-stop),Math.max(0,speed*dt));
    return {x:body.x+(d?dx/d*step:0),y:body.y+(d?dy/d*step:0)};
  }
  function phase(boss,hp) {return hp/boss.maxHp<boss.threshold?2:1;}
  function choose(definition,phase,distance,previous,sample) {
    const rules=definition.moves.map(m=>({...m.ai,moveId:m.id,weight:m.weight}));
    return SurvivorBossAI.choose(SurvivorBossAI.scores(definition.moves,rules,{phase,distance,previous,visible:true,angle:0}),sample);
  }
  function contains(shape,origin,angle,target) {
    const dx=target.x-origin.x,dy=target.y-origin.y,d=Math.hypot(dx,dy),r=target.r||0;
    if(shape.type==='line') {const forward=dx*Math.cos(angle)+dy*Math.sin(angle),side=-dx*Math.sin(angle)+dy*Math.cos(angle);return forward>=-r&&forward<=shape.length+r&&Math.abs(side)<=shape.radius+r;}
    if(d>shape.radius+r)return false;
    if(shape.type!=='sector'||d<=r)return true;
    const diff=Math.atan2(Math.sin(Math.atan2(dy,dx)-angle),Math.cos(Math.atan2(dy,dx)-angle));
    return Math.abs(diff)<=shape.angle*Math.PI/360+Math.asin(Math.min(1,r/d));
  }
  function hazard(field,target,dt) {
    const life=Math.max(0,field.life-dt),inside=contains({type:'circle',radius:field.radius},field,0,target),pulse=field.pulse-dt;
    return {state:{...field,life,pulse:pulse<=0?field.interval:pulse},slow:inside&&field.life>0?field.slow:1,events:inside&&field.life>0&&pulse<=0?[{type:'hazard-hit',damage:field.damage}]:[]};
  }
  function wallStun(hit,seconds) {return hit?[{type:'wall-stun',seconds,weakness:true}]:[];}
  function summon(origin,count,existing,limit,radius) {
    return Array.from({length:Math.max(0,Math.min(count,limit-existing))},(_,i)=>({type:'summon',x:origin.x,y:origin.y,r:radius,emergeSeconds:.6,index:i}));
  }
  return {boundary,rayLength,camera,entry,pursue,phase,choose,contains,hazard,wallStun,summon};
})();
Survivor.engine.gallery={rules:SurvivorTrialRules};
SurvivorEffectBlocks.trial=SurvivorTrialRules;
function trialMoveDefinition(move) {
  const d=state.trial.definition.moves.find(d=>d.id===move.id),s=d.blocks.moves[0];
  return {...d,blocks:undefined,kind:d.id,damage:s.effect.damage,duration:s.timing.active,radius:s.shape.radius,recovery:s.timing.recovery,feedback:{move:s.feedback}};
}
function trialAnimation() {
  const b=state.boss,m=state.bossMoves[0];return b&&b.flash>0?'hurt':b&&b.posture.stun>0?'stun':m?m.ai.phase==='windup'?'windup':m.ai.phase==='active'?'active':'recovery':'idle';
}
let trialDraft=null,trialReturnToMaker=false;
function trialSettings() {return state.trial?state.trial.config:trialDraft||GAME_DATA.gallery;}
function startTrial(id) {
  const definition=trialSettings().bosses.find(b=>b.id===id);if(!definition)return;
  if(globalThis.SurvivorPreview)SurvivorPreview.stop();
  resetGame();
  const arena={x:trialSettings().arenaRadius+200,y:trialSettings().arenaRadius+200,radius:trialSettings().arenaRadius};
  state.trial={definition,config:trialSettings(),arena,slow:1,hazards:[],entry:trialSettings().entrySeconds,elapsed:0,custom:MAKER_MODE||!!trialDraft,previous:[],events:[]};
  state.player.x=arena.x;state.player.y=arena.y;
  state.boss={...SurvivorTrialRules.entry(arena,definition.radius),r:definition.radius,hp:definition.hp,maxHp:definition.hp,posture:SurvivorPosture.initial(),recoveryLeft:0,wobble:0,flash:0};
  initTrialEncounter();
  state.bossIntro=state.trial.entry;state.bossRest=.5;state.mode='playing';state.weaponId='candy-sword';
  state.practiceHit=null;state.player.damageDisabled=false;
  overlay.classList.add('hidden');document.getElementById('trialPanel').hidden=true;
  state.lastTime=performance.now();updateHud();updateCamera();updateActionControls();scheduleFrame();
}
function trialMenu(message='王的試煉',data=null) {
  if(data) {const checked=SurvivorData.validate(data);if(!checked.valid)return;trialDraft=checked.data.gallery;}
  const maker=document.getElementById('makerPanel');
  if(maker&&!maker.hidden){trialReturnToMaker=true;maker.hidden=true;}
  if(globalThis.SurvivorPractice)SurvivorPractice.close();
  const panel=document.getElementById('trialPanel');
  if(!panel)return;
  clearBossMoves();state.boss=null;state.bossIntro=0;state.trial=null;state.mode='trial-menu';state.keys.clear();state.pointerId=null;state.joy=null;
  if(typeof cancelManualAttack==='function')cancelManualAttack();
  overlay.classList.remove('hidden');messageCard.hidden=true;settingsPanel.hidden=true;upgradePanel.hidden=true;panel.hidden=false;
  document.getElementById('trialTitle').textContent=message;updateActionControls();updateHud();
  const choices=document.getElementById('trialChoices');choices.innerHTML='';
  const records=loadTrialRecords(MAKER_MODE||!!trialDraft);
  for(const b of trialSettings().bosses) {
    const button=document.createElement('button');button.type='button';button.className='trial-choice';button.setAttribute('aria-label',b.name);button.title=b.name;
    const image=trialMenuImage(b.artId);button.appendChild(image);
    const name=document.createElement('span');name.textContent=b.name;button.appendChild(name);
    const best=document.createElement('small');best.textContent=records[b.id]?`最佳 ${records[b.id].toFixed(2)} 秒`:'最佳 —';button.appendChild(best);
    button.onclick=()=>startTrial(b.id);choices.appendChild(button);
  }
}
window.openSurvivorTrials=data=>trialMenu('王的試煉',data);
function closeTrialMenu() {document.getElementById('trialPanel').hidden=true;resetGame();trialDraft=null;if(trialReturnToMaker&&window.openSurvivorMaker){trialReturnToMaker=false;window.openSurvivorMaker();}else showOverlay('ready');}
function trialDodgeThreat() {
  if(state.trial.actors)return encounterDodgeThreat();
  const p=state.player,b=state.boss;
  for(const m of state.bossMoves) {
    if(m.dodged||['recovery','cooldown'].includes(m.ai.phase))continue;
    const def=state.trial.definition.moves.find(d=>d.id===m.id),shape=def.blocks.moves[0].shape;
    let time=m.ai.phase==='windup'?m.ai.left:0;
    let near=SurvivorTrialRules.contains(shape,m.id==='leap'?m.target:b,m.angle,p);
    if(m.id==='leap')time+=m.ai.phase==='windup'?def.blocks.moves[0].timing.active:m.ai.left;
    if(m.id==='charge') {
      const speed=def.blocks.moves[0].effect.speed,dx=b.x-p.x,dy=b.y-p.y;
      const contact=SurvivorPosture.contact(dx,dy,Math.cos(m.angle)*speed,Math.sin(m.angle)*speed,b.r+p.r);
      time+=contact;near=contact<=(m.ai.phase==='active'?m.ai.left:def.blocks.moves[0].timing.active);
    }
    if(near&&SurvivorPosture.perfect(time,GAME_DATA.boss.posture.window))return m;
  }return null;
}
function createTrialHazard(position,config=trialSettings().hazard) {
  if(!state.trial||state.trial.hazards.length>=trialSettings().hazardLimit)return;
  const field={...config,...position,life:config.duration,pulse:config.interval};
  Object.assign(field,SurvivorTrialRules.boundary({...field,r:field.radius},state.trial.arena).position);state.trial.hazards.push(field);
}
function summonTrialMinions(count,typeId=ENEMY_TYPES[0].id) {
  if(!state.trial||!state.boss)return [];
  return SurvivorTrialRules.summon(state.boss,count,state.enemies.length,trialSettings().summonLimit,12).map(event=>{
    const enemy=spawnEnemy({small:true,position:event,typeId});if(enemy){enemy.emergeTimer=event.emergeSeconds;enemy.stunTimer=event.emergeSeconds;}return enemy;
  }).filter(Boolean);
}
function updateTrial(dt) {
  if(state.trial&&state.trial.actors){updateTrialEncounter(dt);return;}
  const t=state.trial,b=state.boss;if(!t||!b)return;
  t.events=[];t.slow=1;
  t.hazards=t.hazards.flatMap(field=>{const r=SurvivorTrialRules.hazard(field,state.player,dt);t.slow=Math.min(t.slow,r.slow);for(const event of r.events)bossHurtPlayer(event.damage);return r.state.life>0?[r.state]:[];});
  if(state.mode!=='playing')return;
  if(t.entry>0) {t.entry=countdown(t.entry,dt);state.bossIntro=t.entry;if(!t.entry) {playSound('warning');updateHud();}return;}
  b.posture=SurvivorPosture.step(b.posture,null,GAME_DATA.boss.posture,dt).state;b.flash=countdown(b.flash||0,dt);b.wobble+=dt*3;
  b.stunTimer=countdown(b.stunTimer||0,dt);b.slowTimer=countdown(b.slowTimer||0,dt);
  if(b.posture.stun>0||b.stunTimer>0){clearBossMoves();updateHud();return;}
  const next=SurvivorTrialRules.phase({maxHp:b.maxHp,threshold:t.definition.phases[1].threshold},b.hp);
  if(next>state.bossPhase) {state.bossPhase=next;clearBossMoves();state.bossRest=1;t.events.push({type:'phase-changed',phase:next});burst(b.x,b.y,'#ffca72',24);}
  const factor=t.definition.phases[state.bossPhase-1].speed;
  if(!state.bossMoves.length) {
    state.bossRest=countdown(state.bossRest,dt);
    const dx=state.player.x-b.x,dy=state.player.y-b.y,d=Math.hypot(dx,dy);
    Object.assign(b,SurvivorTrialRules.pursue(b,state.player,t.definition.speed*factor*(b.slowTimer>0?BUILD_TUNING.slowMultiplier:1),dt));clampToMap(b);
    if(state.bossRest>0)return;
    const id=SurvivorTrialRules.choose(t.definition,state.bossPhase,Math.hypot(state.player.x-b.x,state.player.y-b.y),t.previous,Math.random());if(!id){state.bossRest=.3;return;}
    const def=t.definition.moves.find(m=>m.id===id);
    const target=SurvivorTrialRules.boundary({...state.player,r:b.r},t.arena).position;
    const m={id,kind:id,ai:SurvivorBossAI.start(def.blocks.moves[0].timing),x:b.x,y:b.y,origin:{x:b.x,y:b.y},target,angle:Math.atan2(dy,dx),dodged:false,repeat:0};
    state.bossMoves.push(m);t.previous=[id];playSound('warning');return;
  }
  const m=state.bossMoves[0],def=t.definition.moves.find(d=>d.id===m.id),timing=def.blocks.moves[0].timing;
  if(m.ai.phase==='cooldown'){Object.assign(b,SurvivorTrialRules.pursue(b,state.player,t.definition.speed*factor*(b.slowTimer>0?BUILD_TUNING.slowMultiplier:1),dt));clampToMap(b);}
  const oldPhase=m.ai.phase;
  m.warning=oldPhase==='windup'?m.ai.left:0;m.active=oldPhase==='active';m.recovery=oldPhase==='recovery'?m.ai.left:0;m.life=m.ai.left;
  b.recoveryLeft=m.recovery;
  if(m.active) {
    const speed=def.blocks.moves[0].effect.speed;
    if(m.id==='charge') {
      b.x+=Math.cos(m.angle)*speed*dt;b.y+=Math.sin(m.angle)*speed*dt;
      const collision=SurvivorTrialRules.boundary(b,t.arena);Object.assign(b,collision.position);
      const events=SurvivorTrialRules.wallStun(collision.hit,trialSettings().wallStun);
      if(events.length) {t.events.push(...events);b.posture={value:0,stun:events[0].seconds};triggerBossWeakpoint(b,'wall-stun',events[0].seconds);clearBossMoves();b.flash=.3;updateHud();return;}
    }
    if(m.id==='spin') {const dx=state.player.x-b.x,dy=state.player.y-b.y,d=Math.max(1,Math.hypot(dx,dy));b.x+=dx/d*speed*dt;b.y+=dy/d*speed*dt;clampToMap(b);}
    if(m.id==='leap') {const progress=Math.min(1,1-Math.max(0,m.ai.left-dt)/timing.active);b.x=m.origin.x+(m.target.x-m.origin.x)*progress;b.y=m.origin.y+(m.target.y-m.origin.y)*progress;}
    const hit=m.id==='charge'?Math.hypot(b.x-state.player.x,b.y-state.player.y)<b.r+state.player.r:SurvivorTrialRules.contains(def.blocks.moves[0].shape,m.id==='leap'?m.target:b,m.angle,state.player);
    if(hit&&(m.id!=='leap'||m.ai.left<=dt+1e-6))bossHurtPlayer(def.blocks.moves[0].effect.damage,def.blocks.moves[0].feedback);
    if(state.mode!=='playing'||!state.bossMoves.includes(m))return;
  }
  const result=SurvivorBossAI.advance(m.ai,timing,dt);m.ai=result.state;
  if(m.ai.phase!==oldPhase) {
    t.events.push({type:'move-phase',moveId:m.id,phase:m.ai.phase});
    if(m.ai.phase==='active') {m.active=true;m.warning=0;}
    if(m.ai.phase==='recovery'&&m.id==='axe'&&m.repeat===0) {m.repeat=1;m.ai={phase:'windup',left:Math.max(.6,timing.recovery)};m.angle+=Math.PI/5;m.dodged=false;m.active=false;}
    if(m.ai.phase==='recovery')noteBossRecovery(b,m.id,timing.recovery);
    if(m.ai.phase==='select') {clearBossMoves();state.bossRest=.35;b.recoveryLeft=.35;}
  }
  // 同幀把狀態機的結果交給繪圖與架勢命中接合層，落地不殘留上一幀騰空狀態。
  if(state.bossMoves.includes(m)) {
    m.warning=m.ai.phase==='windup'?m.ai.left:0;m.active=m.ai.phase==='active';
    m.recovery=m.ai.phase==='recovery'?m.ai.left:0;m.life=m.ai.left;b.recoveryLeft=m.recovery;
  }
}

// 離局確認只改平台介面；取消前不清除本局任何戰鬥資料。
function requestTrialMenu() {
  if(state.mode!=='paused'||state.trial){trialMenu();return;}
  state.mode='trial-confirm';messageCard.hidden=true;
  document.getElementById('trialConfirm').hidden=false;
  document.getElementById('trialConfirmNo').focus?.();
}
function confirmTrialMenu(leave) {
  if(state.mode!=='trial-confirm')return;
  document.getElementById('trialConfirm').hidden=true;
  if(leave)trialMenu();
  else {showOverlay('paused');document.getElementById('trialEntry').focus?.();}
}

// Menu uses the same manifest frame adapter as battle; its onload hook refreshes tagged images.
function trialMenuImage(id){
 const image=document.createElement('img');image.alt='';image.dataset.survivorArt=id;
 const frame=SurvivorArt.picture(id,'idle',0);
 if(frame){image.src=frame.toDataURL();return image;}
 const art=SurvivorArt.lookup(id),canvas=document.createElement('canvas');
 canvas.width=art.frameSize[0];canvas.height=art.frameSize[1];
 const colors=SurvivorArtManifest.assets[id].placeholder||{outline:'#35434c',body:'#9cabb1',eyes:'#b9e7cf'},g=canvas.getContext('2d');
 g.scale(canvas.width/16,canvas.height/16);g.fillStyle=colors.outline;g.fillRect(4,1,8,14);
 g.fillStyle=colors.body;g.fillRect(5,2,6,5);g.fillRect(3,8,10,4);g.fillStyle=colors.eyes;g.fillRect(6,5,4,1);
 image.src=canvas.toDataURL();return image; // Loading/error stays a manifest-derived placeholder, never the raw sheet.
}
