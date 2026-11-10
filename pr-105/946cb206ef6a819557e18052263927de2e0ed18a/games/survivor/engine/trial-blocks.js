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
 function gridCells(arena,radius,cell){
  const n=Math.floor((arena.radius-radius)/cell),out=[];
  for(let row=-n;row<=n;row++)for(let col=-n;col<=n;col++){
   const x=arena.x+col*cell,y=arena.y+row*cell;
   if(Math.hypot(x-arena.x,y-arena.y)+radius<=arena.radius+1e-8)out.push({x,y,col,row});
  }
  return out;
 }
 function gridEntry(body,arena,cell){
  return gridCells(arena,body.r,cell).sort((a,b)=>Math.hypot(a.x-body.x,a.y-body.y)-Math.hypot(b.x-body.x,b.y-body.y)||a.row-b.row||a.col-b.col)[0];
 }
 function gridTarget(body,target,arena,cell){
  const col=Math.round((body.x-arena.x)/cell),row=Math.round((body.y-arena.y)/cell);
  const choices=gridCells(arena,body.r,cell).filter(p=>Math.abs(p.col-col)+Math.abs(p.row-row)===1);
  return choices.sort((a,b)=>Math.hypot(a.x-target.x,a.y-target.y)-Math.hypot(b.x-target.x,b.y-target.y)||a.row-b.row||a.col-b.col)[0]||null;
 }
 function gridPose(origin,target,progress){
  const f=Math.max(0,Math.min(1,progress));
  return {x:origin.x+(target.x-origin.x)*f,y:origin.y+(target.y-origin.y)*f};
 }
 function sweepRegion(origin,target,radius){
  return {origin:{x:origin.x,y:origin.y},angle:Math.atan2(target.y-origin.y,target.x-origin.x),shape:{type:'line',radius,length:Math.hypot(target.x-origin.x,target.y-origin.y)}};
 }
 function boundedBeam(origin,target,width,maxRange,arena){
  const angle=Math.atan2(target.y-origin.y,target.x-origin.x);
  return {origin:{x:origin.x,y:origin.y},angle,shape:{type:'line',radius:width,length:Math.min(maxRange,SurvivorTrialRules.rayLength(origin,angle,arena))}};
 }
 function gridOrientation(face){
  const normals=[{x:0,y:0,z:-1},{x:1,y:0,z:0},{x:0,y:-1,z:0},{x:0,y:0,z:1},{x:-1,y:0,z:0},{x:0,y:1,z:0}];
  if(!normals[face])throw new RangeError('grid face');return {...normals[face]};
 }
 function gridState(value=0){
  const face=typeof value==='number'?value:value.face,n=gridOrientation(face);
  const reference=face===2?{x:0,y:0,z:1}:face===5?{x:0,y:0,z:-1}:{x:0,y:-1,z:0};
  const up=typeof value==='number'?reference:value.up;
  if(!up||![up.x,up.y,up.z].every(v=>[-1,0,1].includes(v))||Math.abs(up.x)+Math.abs(up.y)+Math.abs(up.z)!==1||n.x*up.x+n.y*up.y+n.z*up.z!==0)throw new RangeError('orthogonal cardinal cube up required');
  return {face,up:{...up}};
 }
 function gridTwist(value){
  const pose=gridState(value),n=gridOrientation(pose.face),base=gridState(pose.face).up;
  const right={x:base.y*n.z-base.z*n.y,y:base.z*n.x-base.x*n.z,z:base.x*n.y-base.y*n.x};
  const dot=(a,b)=>a.x*b.x+a.y*b.y+a.z*b.z;
  return Math.atan2(dot(pose.up,right),dot(pose.up,base));
 }
 function gridOutward(value){return gridOrientation(gridState(value).face).z===1;}
 function gridRenderPose(value,transit){
  const pose=gridState(value),start=gridTwist(pose);
  if(!transit)return {face:pose.face,angle:start};
  const progress=Math.max(0,Math.min(1,transit.elapsed/transit.duration));
  const end=gridTwist(transit.turn.orientation),raw=end-start;
  const delta=Math.atan2(Math.sin(raw),Math.cos(raw));
  // The signed-step tumble is transient; endpoints use the full persistent pose.
  return {face:progress<.5?pose.face:transit.turn.orientation.face,
   angle:start+delta*progress+Math.sin(Math.PI*progress)*transit.turn.angle*.5};
 }
 function gridTurn(face,origin,target){
  const dx=Math.sign(target.x-origin.x),dy=Math.sign(target.y-origin.y);
  if(Math.abs(dx)+Math.abs(dy)!==1)throw new RangeError('one cardinal grid step required');
  const before=gridState(face),n=gridOrientation(before.face),next=dx?{x:-dx*n.z,y:n.y,z:dx*n.x}:{x:n.x,y:-dy*n.z,z:dy*n.y};
  const faceNext=Array.from({length:6},(_,i)=>i).find(i=>{const v=gridOrientation(i);return v.x===next.x&&v.y===next.y&&v.z===next.z;});
  const u=before.up,up=dx?{x:-dx*u.z,y:u.y,z:dx*u.x}:{x:u.x,y:-dy*u.z,z:dy*u.y};
  const orientation=gridState({face:faceNext,up});
  return {face:faceNext,normal:next,orientation,step:{x:dx,y:dy},axis:dx?'horizontal':'vertical',angle:(dx-dy)*Math.PI/2};
 }
 return {count,start,advance,behind,slide,record,limbTarget,limbChoice,limbPose,gridCells,gridEntry,gridTarget,gridPose,sweepRegion,boundedBeam,gridOrientation,gridOutward,gridTurn,gridState,gridTwist,gridRenderPose};
})();
SurvivorEffectBlocks.trialMoves=SurvivorTrialBlocks;
Survivor.engine['trial-blocks']={rules:SurvivorTrialBlocks};

function trialUsesBlocks(def){return def.moves.some(m=>{const e=m.blocks.moves[0].effect;return e.sequence||e.relocate||e.projectiles||e.slide||e.limb||e.gridRoll||e.beam||e.charge;});}
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
   if(event.phase==='active'&&e.charge){
    b.x+=Math.cos(m.angle)*s.effect.speed*event.dt;b.y+=Math.sin(m.angle)*s.effect.speed*event.dt;
    const wall=SurvivorTrialRules.boundary(b,t.arena);Object.assign(b,wall.position);
    if(wall.hit&&e.charge.wallStun){b.posture={value:0,stun:t.config.wallStun};b.previous=[];triggerBossWeakpoint(b,'wall-stun',t.config.wallStun);clearBossMoves();t.events.push(...SurvivorTrialRules.wallStun(true,t.config.wallStun));updateHud();return;}
    if(Math.hypot(b.x-state.player.x,b.y-state.player.y)<b.r+state.player.r)bossHurtPlayer(e.damage,s.feedback);
    if(state.trial!==t)return;
   }
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

function trialGridSpec(def){return def.moves.find(m=>m.blocks.moves[0].effect.gridRoll)?.blocks.moves[0];}
function trialGridRegion(b,m,s){
 if(s.effect.beam)return m.region;
 return SurvivorTrialBlocks.sweepRegion(m.origin,m.target,b.r);
}
function trialGridExposure(b){return Object.values(b.weakpoints||{}).some(p=>p.phase==='open'||p.phase==='closing');}
function updateTrialGridActor(dt){
 const t=state.trial,b=state.boss,def=t.definition,step=Math.min(.05,Math.max(0,dt));
 // A cancelled in-flight roll finishes the previously warned route without damage.
 // It never teleports to a new origin or starts a second attack from an off-grid position.
 const transit=b.gridTransit;
 if(transit&&!state.bossMoves.includes(transit.move)){
  transit.elapsed=Math.min(transit.duration,transit.elapsed+step);
  Object.assign(b,SurvivorTrialBlocks.gridPose(transit.origin,transit.target,transit.elapsed/transit.duration));
  if(transit.elapsed>=transit.duration){b.gridOrientation=transit.turn.orientation;b.gridBeamSpent=false;delete b.gridTransit;}
  return;
 }
 if(b.posture.stun>0||b.stunTimer>0){clearBossMoves();b.recoveryLeft=0;return;}
 if(!state.bossMoves.length){
  b.recoveryLeft=0;state.bossRest=countdown(state.bossRest,step);
  if(state.bossRest>0||trialGridExposure(b))return;
  const beam=def.moves.find(m=>m.blocks.moves[0].effect.beam),roll=def.moves.find(m=>m.blocks.moves[0].effect.gridRoll);
  const distance=Math.hypot(state.player.x-b.x,state.player.y-b.y);
  const eligible=move=>move.weight>0&&move.minPhase<=state.bossPhase&&distance>=move.ai.minDistance&&distance<=move.ai.maxDistance;
  // Disabled/ineligible beam falls back to the required roll without falsifying orientation.
  const selected=SurvivorTrialBlocks.gridOutward(b.gridOrientation)&&!b.gridBeamSpent&&eligible(beam)?beam:roll;
  if(!eligible(selected))return;
  const s=selected.blocks.moves[0],origin={x:b.x,y:b.y};
  const m={id:selected.id,kind:selected.id,owner:b.actorId,origin,ai:SurvivorBossAI.start(s.timing),dodged:false};
  if(s.effect.gridRoll){
   m.target=SurvivorTrialBlocks.gridTarget(b,state.player,t.arena,s.effect.gridRoll.cell);
   if(!m.target){state.bossRest=.4;return;}
   m.angle=Math.atan2(m.target.y-b.y,m.target.x-b.x);m.turn=SurvivorTrialBlocks.gridTurn(b.gridOrientation,m.origin,m.target);
  }else{
   const config=bossWeakpointConfig(b),point=config&&bossWeakpointPoints(b,config).weakpoint;
   if(!point)return; // schema requires the eye anchor and live exposure configuration
   m.region=SurvivorTrialBlocks.boundedBeam(point,state.player,s.effect.beam.width,s.effect.beam.range,t.arena);
   m.angle=m.region.angle;
  }
  m.warning=s.timing.windup;m.active=false;m.recovery=0;
  state.bossMoves.push(m);t.events.push({type:s.effect.gridRoll?'grid-warning':'beam-warning',id:b.actorId,moveId:m.id,region:trialGridRegion(b,m,s)});playSound('warning');return;
 }
 const m=state.bossMoves[0],s=def.moves.find(d=>d.id===m.id).blocks.moves[0],phase=m.ai.phase;
 // One bounded phase step per render tick. Excess dt is deliberately not consumed
 // across warning/exposure boundaries, so a stalled frame cannot hide all warning.
 const used=Math.min(step,m.ai.left);
 if(phase==='active'){
  if(s.effect.gridRoll){
   const tr=b.gridTransit,before={x:b.x,y:b.y};
   tr.elapsed=Math.min(tr.duration,tr.elapsed+used);
   Object.assign(b,SurvivorTrialBlocks.gridPose(tr.origin,tr.target,tr.elapsed/tr.duration));
   const region=SurvivorTrialBlocks.sweepRegion(before,b,b.r);
   if(SurvivorTrialRules.contains(region.shape,region.origin,region.angle,state.player))bossHurtPlayer(s.effect.damage,s.feedback);
  }else if(trialGridExposure(b)&&SurvivorTrialRules.contains(m.region.shape,m.region.origin,m.region.angle,state.player))bossHurtPlayer(s.effect.damage,s.feedback);
  if(state.trial!==t||!state.bossMoves.includes(m))return;
 }
 m.ai.left=Math.max(0,m.ai.left-used);
 if(m.ai.left<=1e-8){
  const next=SurvivorBossAI.advance(m.ai,s.timing,0).state;
  m.ai=next;t.events.push({type:'move-phase',id:b.actorId,moveId:m.id,phase:next.phase});
  if(next.phase==='active'&&s.effect.gridRoll)b.gridTransit={move:m,origin:{...m.origin},target:{...m.target},duration:s.timing.active,elapsed:0,turn:m.turn};
  if(next.phase==='recovery'){
   if(s.effect.gridRoll){Object.assign(b,m.target);delete b.gridTransit;b.gridOrientation=m.turn.orientation;b.gridBeamSpent=false;}
   noteBossRecovery(b,m.id,s.timing.recovery);
  }
  if(next.phase==='select'){if(s.effect.beam)b.gridBeamSpent=true;clearBossMoves();state.bossRest=.4;return;}
 }
 m.warning=m.ai.phase==='windup'?m.ai.left:0;m.active=m.ai.phase==='active';m.recovery=m.ai.phase==='recovery'?m.ai.left:0;b.recoveryLeft=m.recovery;
}
