// 共用試煉效果積木；固定輸入、dt -> 狀態／事件，不依賴 DOM、時鐘、亂數或 Boss id。
globalThis.SurvivorTrialBlocks=(()=>{
 function count(effect,phase){return effect.sequence?(phase>=2?effect.sequence.phaseCount:effect.sequence.count):1;}
 function start(timing,effect,phase){return {...SurvivorBossAI.start(timing),index:0,count:count(effect,phase)};}
 function advance(previous,timing,dt){
  let state={...previous},seconds=Math.max(0,dt);const events=[],segments=[],timeline=[];
  // 上限由 schema 的最多八刀決定；保留跨階段的剩餘 dt，不能把慢幀變成漏刀。
  for(let i=0;i<64&&state.phase!=='select';i++){
   const used=Math.min(seconds,state.left);const segment={phase:state.phase,index:state.index,dt:used,left:state.left};segments.push(segment);timeline.push({type:'segment',...segment});
   state.left=Math.max(0,state.left-used);seconds=Math.max(0,seconds-used);
   if(state.left>1e-8)break;
   const next=SurvivorBossAI.advance(state,timing,0).state;
   if(next.phase==='recovery'&&state.index+1<state.count){state={phase:'windup',left:timing.windup,index:state.index+1,count:state.count};}
   else state={...next,index:state.index,count:state.count};
   const entered={type:'move-phase',phase:state.phase,index:state.index};events.push(entered);timeline.push(entered);
   if(state.phase==='active'){const strike={type:'strike',index:state.index};events.push(strike);timeline.push(strike);}
   if(seconds<=1e-8)break;
  }
  return {state,events,segments,timeline};
 }
 function behind(player,facing,distance,radius,arena){
  const length=Math.hypot(facing.x,facing.y)||1;
  return SurvivorTrialRules.boundary({x:player.x-facing.x/length*distance,y:player.y-facing.y/length*distance,r:radius},arena).position;
 }
 function slide(body,angle,speed,dt,arena){return SurvivorTrialRules.boundary({...body,x:body.x+Math.cos(angle)*speed*dt,y:body.y+Math.sin(angle)*speed*dt},arena).position;}
 function record(previous,id,seconds,won){
  const result={...previous};if(won&&Number.isFinite(seconds)&&seconds>0&&(!Number.isFinite(result[id])||seconds<result[id]))result[id]=seconds;
  return result;
 }
 // Lock the landing center once and cap reach; arena clipping must not move it beyond reach.
 function limbTarget(body,target,reach,arena){
  const dx=target.x-body.x,dy=target.y-body.y,d=Math.hypot(dx,dy),n=d?Math.min(1,reach/d):0;
  return SurvivorTrialRules.boundary({x:body.x+dx*n,y:body.y+dy*n,r:0},arena).position;
 }
 function limbChoice(def,phase,lastSide,distance,sample){
  const moves=def.moves.filter(m=>{const limb=m.blocks.moves[0].effect.limb;return limb&&limb.side!==lastSide;});
  return SurvivorTrialRules.choose({...def,moves},phase,distance,[],sample);
 }
 function limbPose(body,side,move,spec,exposure=null){
  // The guard hand clears the actual core circle; active hand retains its frozen landing geometry.
  const home=exposure?{x:exposure.x+side*(exposure.radius+spec.shape.radius*.6+body.r*.1),y:exposure.y,height:0}:
   {x:body.x+side*body.r*.35,y:body.y-body.r*.2,height:0};
  if(!move||!spec||spec.effect.limb.side!==side)return home;
  const phase=move.ai.phase,progress=Math.max(0,Math.min(1,1-move.ai.left/(spec.timing[phase]||1)));
  if(phase==='windup')return {x:move.target.x,y:move.target.y,height:spec.effect.limb.lift*Math.min(1,progress*3)};
  if(phase==='active')return {...move.target,height:0};
  if(phase==='recovery')return {x:move.target.x+(home.x-move.target.x)*progress,y:move.target.y+(home.y-move.target.y)*progress,height:0};
  return home;
 }
 return {count,start,advance,behind,slide,record,limbTarget,limbChoice,limbPose};
})();
SurvivorEffectBlocks.trialMoves=SurvivorTrialBlocks;
Survivor.engine['trial-blocks']={rules:SurvivorTrialBlocks};

function trialUsesBlocks(def){return def.moves.some(m=>{const e=m.blocks.moves[0].effect;return e.sequence||e.relocate||e.projectiles||e.slide||e.limb;});}
function updateTrialBlockActor(dt){
 const t=state.trial,b=state.boss,def=t.definition;
 if(!state.bossMoves.length){
  b.recoveryLeft=0;state.bossRest=countdown(state.bossRest,dt);
  Object.assign(b,SurvivorTrialRules.pursue(b,state.player,def.speed*def.phases[state.bossPhase-1].speed*(b.slowTimer>0?BUILD_TUNING.slowMultiplier:1),dt,140));clampToMap(b);
  if(state.bossRest>0)return;
  const distance=Math.hypot(state.player.x-b.x,state.player.y-b.y),hasLimbs=def.moves.some(m=>m.blocks.moves[0].effect.limb);
  const sample=Math.random(),id=hasLimbs?SurvivorTrialBlocks.limbChoice(def,state.bossPhase,b.lastLimb,distance,sample):SurvivorGalleryRules.choose(def,b.role,state.bossPhase,b.previous||[],sample,distance);
  if(!id){state.bossRest=.3;return;}
  const s=def.moves.find(m=>m.id===id).blocks.moves[0];
  state.bossMoves.push({id,kind:id,owner:b.actorId,ai:SurvivorTrialBlocks.start(s.timing,s.effect,state.bossPhase),angle:Math.atan2(state.player.y-b.y,state.player.x-b.x),dodged:false,teleported:false,slideSide:(b.slideCount||0)%2?-1:1});
  if(s.effect.limb){const m=state.bossMoves[0];m.target=SurvivorTrialBlocks.limbTarget(b,state.player,s.effect.limb.reach,t.arena);t.events.push({type:'limb-warning',id:b.actorId,side:s.effect.limb.side,target:{...m.target}});}
  b.previous=[id];if(s.effect.slide)b.slideCount=(b.slideCount||0)+1;
  b.vanished=!!s.effect.relocate;playSound('warning');return;
 }
 const m=state.bossMoves[0],s=def.moves.find(move=>move.id===m.id).blocks.moves[0],e=s.effect;
 const result=SurvivorTrialBlocks.advance(m.ai,s.timing,dt);
 for(const event of result.timeline){
  if(event.type==='segment'){
   if(event.phase==='windup'&&e.relocate&&!m.teleported&&s.timing.windup-event.left+event.dt>=e.relocate.vanish-1e-8){
    Object.assign(b,SurvivorTrialBlocks.behind(state.player,{x:state.faceX,y:state.faceY},e.relocate.distance,b.r,t.arena));
    m.angle=Math.atan2(state.player.y-b.y,state.player.x-b.x);m.teleported=true;b.vanished=false;
    t.events.push({type:'relocated',id:b.actorId,x:b.x,y:b.y});
   }
   if(event.phase==='active'&&e.slide)Object.assign(b,SurvivorTrialBlocks.slide(b,m.angle+m.slideSide*Math.PI/2,e.slide.speed,event.dt,t.arena));
   if(event.phase==='cooldown')Object.assign(b,SurvivorTrialRules.pursue(b,state.player,def.speed*def.phases[state.bossPhase-1].speed,event.dt,140));
   continue;
  }
  t.events.push({...event,id:b.actorId,moveId:m.id});
  if(event.phase==='windup'){m.dodged=false;m.angle=Math.atan2(state.player.y-b.y,state.player.x-b.x);playSound('warning');}
  if(event.type==='strike'){
   if(e.projectiles){for(const shot of SurvivorGalleryRules.volley(b,m.angle,e.projectiles.count,s.shape.angle*Math.PI/180,e.projectiles.speed))trialField(b,shot,{...shot,kind:'kunai',projectile:true,artId:e.projectiles.artId,radius:e.projectiles.radius,life:e.projectiles.life,damage:e.damage});}
   else {
    if(e.limb){b.lastLimb=e.limb.side;t.events.push({type:'limb-slam',id:b.actorId,side:e.limb.side,target:{...m.target}});}
    if(SurvivorTrialRules.contains(s.shape,e.limb?m.target:b,m.angle,state.player))bossHurtPlayer(e.damage,s.feedback);
   }
   if(state.trial!==t||!state.bossMoves.includes(m))return;
  }
  if(event.phase==='recovery')noteBossRecovery(b,m.id,s.timing.recovery);
 }
 m.ai=result.state;
 // 方向以弧度獨立傳入，不能覆蓋 shape.angle 的扇形度數。
 m.warning=m.ai.phase==='windup'?m.ai.left:0;m.active=m.ai.phase==='active';m.recovery=m.ai.phase==='recovery'?m.ai.left:0;b.recoveryLeft=m.recovery;
 if(m.ai.phase==='select'){clearBossMoves();state.bossRest=.4;}
}
