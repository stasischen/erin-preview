// 可序列化回饋設定 → 表現；不改命中、傷害或時機。
globalThis.SurvivorFeedback = {
  scale(config,intensity,heavy=false) {
    const base=SurvivorData.FEEDBACK_TIERS.small,f={...base,...config};
    return {stop:Math.min(.15,f.stopSeconds*intensity*(config.level?1:heavy?1.5:1)*(f.hitStop??1)),
      shake:.12*intensity*(f.shake??1),pixels:2*intensity*(heavy?1.5:1)*(f.shake??1),
      trauma:f.trauma*intensity*(f.shake??1),particles:Math.ceil(f.particles*intensity),flash:f.flash*intensity,numberScale:f.numberScale};
  },
  // 同一更新幀／揮擊只取最強回饋；音效強度與震動開關無關。
  mergeImpact(previous,event) {
    const p=previous||{trauma:0,sound:null,priority:-Infinity};
    return {trauma:Math.max(p.trauma,event.trauma||0),
      sound:event.priority>p.priority?event.sound:p.sound,priority:Math.max(p.priority,event.priority)};
  },
  trauma(value,added,dt) {return Math.max(0,Math.min(1,(value||0)+added)-Math.max(0,dt)*1.8);},
  camera(value,clock,enabled) {
    const strength=enabled?Math.min(1,Math.max(0,value||0))**2:0;
    return {x:Math.sin(clock*43)*6*strength,y:Math.sin(clock*57+.7)*6*strength,rotation:Math.sin(clock*31)*.012*strength};
  },
  collision(result) {return result.hit>=0 && result.fraction<1 ? [{type:'slide-blocked',level:'small'}] : [];}
};
function moveFeedback(owner,id='primary') {
  const f=owner && (owner.blocks && owner.blocks.moves.find(m=>m.id===id) || {}).feedback || owner && owner.feedback && owner.feedback[id] || {};
  const level=f.level||(id==='charge'?'medium':'small');
  return {...SurvivorData.FEEDBACK_TIERS[level==='custom'?'small':level],level,sound:undefined,warningStyle:'original',slash:true,hitStop:['phase','legacy','move'].includes(id)?0:1,shake:['phase','legacy'].includes(id)?0:1,hint:true,...f};
}
// 接合層：巢狀揮擊沿用同一批，return／換場也一定結算；不跨幀保留。
let impactBatch=null;
function withImpactBatch(action) {
  if(impactBatch)return action();
  impactBatch={trauma:0,sound:null,priority:-Infinity};
  try {return action();}
  finally {
    const result=impactBatch;impactBatch=null;
    state.trauma=SurvivorFeedback.trauma(state.trauma,result.trauma,0);
    if(result.sound && result.sound!=='none')playSound(result.sound);
  }
}
function queueImpact(trauma=0,sound=null,priority=-Infinity) {
  if(impactBatch)impactBatch=SurvivorFeedback.mergeImpact(impactBatch,{trauma,sound,priority});
  else {
    state.trauma=SurvivorFeedback.trauma(state.trauma,trauma,0);
    if(sound && sound!=='none')playSound(sound);
  }
}
function damageHitSound() {queueImpact(0,'hit',-1);}
function feedbackSound(config,fallback) {const sound=config.sound===undefined?fallback:config.sound;if(sound!=='none')playSound(sound);}
function enemyFeedback(enemy,id='phase') {return moveFeedback(ENEMY_TYPES.find(t=>t.id===enemy.typeId),id);}
function weaponFeedback(event={}) {
  const w=activeWeapon(),id=event.feedbackId || (event.charged?'charge':event.dash?'dash':event.heavy?'combo':'primary');
  const f=moveFeedback(w,id),impact=w.kind==='melee' && (id!=='special'||w.specialKind==='leap');
  if(!w.blocks && !w.feedback) {f.hitStop=impact?1:0;f.shake=impact?1:0;}
  return f;
}
function warningFeedback(config,clock) {
  if(config.warningStyle==='outline') ctx.fillStyle='rgba(0,0,0,0)';
  if(config.warningStyle==='pulse') ctx.globalAlpha*=.55+.45*Math.abs(Math.sin(clock*10));
}

function feedbackImpact(config,shake=true,attacker=null,target=state.player) {
  if(!config)return;
  const h=GAME_DATA.hitJuice,strength=h.enabled?h.intensity:0;
  const f={...SurvivorData.FEEDBACK_TIERS.small,...(config||{})};
  const scaled=SurvivorFeedback.scale(shake?f:{...f,shake:0},strength);
  // hitStop is a compatibility indicator only; never a world pause.
  state.hitStop=Math.max(state.hitStop||0,scaled.stop);
  state.hitShake=Math.max(state.hitShake||0,scaled.shake);
  state.hitShakePixels=Math.max(state.hitShakePixels||0,scaled.pixels);
  queueImpact(scaled.trauma,target && strength?(f.sound===undefined?'hit':f.sound):null,target && strength?f.trauma:-Infinity);
  for(const actor of [attacker,target])if(actor && scaled.stop>0){actor.hitStop=Math.max(actor.hitStop||0,scaled.stop);actor.feedbackFrozen=true;}
  if(target && strength) {
    target.impactFlash=scaled.flash;target.meleeFlash=true;target.impactSquash=.14*strength;
    target.feedbackNumberScale=scaled.numberScale;
    const number=[...state.effects].reverse().find(e=>e.kind==='number'&&e.x===target.x);
    if(number)number.numberScale=scaled.numberScale;
    burst(target.x,target.y,'#fff0a5',scaled.particles);
  }
}
function tierImpact(level,attacker,target,extra={}) {
  feedbackImpact({...SurvivorData.FEEDBACK_TIERS[level],level,hitStop:1,shake:1,...extra},true,attacker,target);
}
function feedbackPayload(f) {
  if(!GAME_DATA.hitJuice.enabled || !GAME_DATA.hitJuice.intensity)return undefined;
  return f;
}
Survivor.engine.feedback={rules:SurvivorFeedback,moveFeedback,feedbackSound,feedbackImpact};

function bossFeedbackShake(move) {
  const f=moveFeedback(bossDefinition(move),'move'),h=GAME_DATA.hitJuice;
  queueImpact(h.enabled?f.trauma*f.shake*h.intensity:0);
}
