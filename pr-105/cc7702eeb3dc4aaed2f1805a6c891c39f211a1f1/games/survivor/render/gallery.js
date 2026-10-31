// 僅呈現規則輸出的世界座標；可替換的角色／招式皆透過美術清單。
function drawTrialArena() {
  const t=state.trial,a=t.arena;
  SurvivorArt.paint('scene/trial-arena',null,()=>{
    ctx.save();ctx.fillStyle='#52626d';ctx.fillRect(state.cameraX,state.cameraY,state.width,state.height);
    // 牆外石柱作背景裝飾，競技場仍鋪滿全畫面。
    for(let i=0;i<24;i++){const angle=i*Math.PI/12;ctx.fillStyle=i%2?'#647781':'#374d5a';ctx.fillRect(a.x+Math.cos(angle)*(a.radius+85)-15,a.y+Math.sin(angle)*(a.radius+85)-18,30,36);}
    ctx.beginPath();ctx.arc(a.x,a.y,a.radius,0,Math.PI*2);ctx.fillStyle='#d2bba1';ctx.fill();ctx.strokeStyle='#3b4659';ctx.lineWidth=24;ctx.stroke();
    ctx.beginPath();ctx.arc(a.x,a.y,a.radius-12,0,Math.PI*2);ctx.strokeStyle='#f4dfb6';ctx.lineWidth=3;ctx.stroke();
    for(let r=160;r<a.radius;r+=160){ctx.beginPath();ctx.arc(a.x,a.y,r,0,Math.PI*2);ctx.strokeStyle='#baa68e';ctx.lineWidth=2;ctx.stroke();}
    if(t.entry>0)for(const b of trialBodies()){ctx.beginPath();ctx.arc(b.x,b.y,b.r+25+Math.sin(state.elapsed*8)*5,0,Math.PI*2);ctx.fillStyle='rgba(255,90,70,.3)';ctx.fill();ctx.strokeStyle='#ff614d';ctx.lineWidth=5;ctx.stroke();}
    ctx.restore();
  });
}
function drawTrialShape(shape,origin,angle,active) {
  ctx.save();ctx.translate(origin.x,origin.y);ctx.rotate(angle);ctx.beginPath();
  if(shape.type==='line')ctx.rect(0,-shape.radius,shape.length,shape.radius*2);
  else if(shape.type==='sector'){ctx.moveTo(0,0);ctx.arc(0,0,shape.radius,-shape.angle*Math.PI/360,shape.angle*Math.PI/360);ctx.closePath();}
  else ctx.arc(0,0,shape.radius,0,Math.PI*2);
  ctx.fillStyle=active?'rgba(255,98,45,.55)':'rgba(229,42,74,.24)';ctx.strokeStyle=active?'#ffe391':'#d32c4d';ctx.lineWidth=3;ctx.fill();ctx.stroke();ctx.restore();
}
function drawTrialMoves() {
  if(state.trial.actors){drawTrialEncounter();return;}
  const t=state.trial,b=state.boss;
  for(const f of t.hazards){ctx.save();ctx.globalAlpha=Math.min(1,f.life);drawTrialShape({type:'circle',radius:f.radius},f,0,true);ctx.restore();}
  for(const enemy of state.enemies)if(enemy.emergeTimer>0){ctx.save();ctx.beginPath();ctx.arc(enemy.x,enemy.y,enemy.r*(1-enemy.emergeTimer/.6)+8,0,Math.PI*2);ctx.strokeStyle='#ffe1a0';ctx.lineWidth=4;ctx.stroke();ctx.restore();}
  if(!b)return;
  if(t.entry>0) return;
  for(const m of state.bossMoves) {
    if(!['windup','active'].includes(m.ai.phase))continue;
    const def=t.definition.moves.find(d=>d.id===m.id),shape={...def.blocks.moves[0].shape};
    if(m.id==='charge')shape.length=SurvivorTrialRules.rayLength(b,m.angle,t.arena);
    const origin=m.id==='leap'?m.target:b;
    SurvivorArt.paint('move/gatekeeper-'+m.id,{context:ctx,...SurvivorArt.shapeOptions(shape,origin,m.angle),animation:m.ai.phase==='windup'?'windup':'active',time:state.elapsed,angle:m.angle,...SurvivorArt.phaseContext(m.ai,def.blocks.moves[0].timing)},()=>{
      ctx.save();drawTrialShape(shape,origin,m.angle,m.ai.phase==='active');
      // 舉盾／舉斧、旋轉武器：圖形動作與地面範圍同時蓄力，無文字橫幅。
      ctx.translate(b.x,b.y);ctx.rotate(m.angle+(m.id==='spin'?state.elapsed*10:0));
      const lift=m.ai.phase==='windup'?-22:0;
      ctx.fillStyle='#4a5268';ctx.fillRect(18,-24+lift,12,38);ctx.fillStyle='#e9e5d7';
      if(['shield','charge'].includes(m.id))ctx.fillRect(22,-20+lift,18,32);
      else {ctx.fillRect(24,-34+lift,7,48);ctx.fillRect(12,-38+lift,30,17);}
      ctx.restore();
    });
  }
}

const trialPlaceholders={};
function trialPicture() {
  if(trialGridSpec(state.trial.definition))return trialEyePicture(state.boss);
  const id=state.boss.artId||state.trial.definition.artId,m=state.bossMoves[0],timing=m&&state.trial.definition.moves.find(d=>d.id===m.id).blocks.moves[0].timing;
  const context=actorArtContext(state.boss,m&&{...m.ai,angle:m.angle},timing);
  if(state.boss.impactFlash||state.boss.flash>0||m&&m.ai.phase==='windup'&&m.teleported&&state.trial.definition.moves.find(d=>d.id===m.id).blocks.moves[0].effect.relocate&&m.ai.left<=state.trial.definition.moves.find(d=>d.id===m.id).blocks.moves[0].effect.relocate.flash)context.tint='#ffffff';
  const animation=state.trial.entry>0?'spawn':!m&&state.bossPhase===2?'phase2':m&&m.ai.phase==='cooldown'?'idle':trialAnimation();
  const frame=SurvivorArt.picture(id,animation,state.elapsed,context);
  if(frame)return frame;
  let trialPlaceholder=trialPlaceholders[id];
  if(!trialPlaceholder) {
    const art=SurvivorArt.lookup(id);trialPlaceholder=document.createElement('canvas');trialPlaceholder.width=art.frameSize[0];trialPlaceholder.height=art.frameSize[1];
    const colors=SurvivorArtManifest.assets[id].placeholder;const g=trialPlaceholder.getContext('2d');g.fillStyle=colors.outline;g.fillRect(4,1,8,14);g.fillStyle=colors.body;g.fillRect(5,2,6,5);g.fillRect(3,8,10,4);g.fillStyle=colors.eyes;g.fillRect(6,5,4,1);
    trialPlaceholders[id]=trialPlaceholder;
  }return trialPlaceholder;
}
Survivor.render.gallery={drawTrialArena,drawTrialMoves};

function drawTrialEncounter(){
 const t=state.trial;
 for(const f of t.fields){
   const owner=t.actors.find(b=>b.actorId===f.owner);if(!owner)continue;
   SurvivorArt.paint(f.artId||'move/'+f.kind,{context:ctx,...SurvivorArt.shapeOptions({type:'circle',radius:f.radius},f,Math.atan2(f.vy||0,f.vx||1)),animation:f.warning>0?'windup':'active',time:state.elapsed,angle:Math.atan2(f.vy||0,f.vx||1)},()=>{
     ctx.save();ctx.translate(f.x,f.y);
     if(f.kind==='feather'||f.projectile){
       ctx.rotate(Math.atan2(f.vy,f.vx));
       if(f.projectile){const palette=SurvivorArt.lookup(f.artId).palette;ctx.fillStyle=palette[2];ctx.fillRect(-8,-4,16,8);ctx.fillStyle=palette[0];ctx.beginPath();ctx.moveTo(9,0);ctx.lineTo(-1,-3);ctx.lineTo(-1,3);ctx.closePath();ctx.fill();}
       else {ctx.fillStyle='#fff4d1';ctx.fillRect(-10,-3,20,6);ctx.fillStyle='#7155a0';ctx.fillRect(-7,3,10,3);}
     }else {
       ctx.beginPath();ctx.arc(0,0,f.radius,0,Math.PI*2);ctx.fillStyle=f.warning>0?'rgba(229,42,74,.22)':f.kind==='ice'?'rgba(98,213,255,.55)':'rgba(173,141,223,.55)';ctx.fill();ctx.lineWidth=3;ctx.strokeStyle=f.warning>0?'#d32c4d':f.kind==='ice'?'#d8fcff':'#66518a';ctx.stroke();
       if(f.kind==='tornado')for(let i=0;i<3;i++){ctx.beginPath();ctx.ellipse(0,-i*8,f.radius*(1-i*.2),8,state.elapsed*3,0,Math.PI*2);ctx.stroke();}
       if(f.kind==='ice'&&f.warning<=0){ctx.fillStyle='#d8fcff';ctx.fillRect(-5,-18,10,30);ctx.fillRect(-12,-6,24,6);}
     }ctx.restore();
   });
 }
 if(t.entry>0)return;
 for(const b of trialBodies())for(const m of b.moves){
   if(!['windup','active'].includes(m.ai.phase))continue;
   const s=t.definition.moves.find(d=>d.id===m.id).blocks.moves[0],active=m.ai.phase==='active';
   if(s.effect.gridRoll||s.effect.beam){drawTrialGridMove(b,m,s);continue;}
   if(s.effect.relocate&&m.teleported&&m.ai.phase==='windup'&&m.ai.left<=s.effect.relocate.flash)SurvivorArt.paint('move/white-flash',{context:ctx,x:b.x-30,y:b.y-60,width:60,height:60,time:state.elapsed},()=>{const palette=SurvivorArt.lookup('move/white-flash').palette;ctx.save();ctx.fillStyle=palette[0];ctx.fillRect(b.x-24,b.y-34,48,6);ctx.fillRect(b.x-3,b.y-55,6,48);ctx.restore();});
   const origin=s.effect.limb||['dive','icefall','meteor'].includes(m.id)?m.target:b,shape=trialUsesBlocks(t.definition)?{...s.shape}:encounterShape(m,s.shape);
   if(m.id==='frost-dash'||s.effect.charge)shape.length=SurvivorTrialRules.rayLength(b,m.angle,t.arena);
   const angle=['ring','cross'].includes(shape.type)?shape.angle:m.angle;
   const rays=m.id==='spiral'?SurvivorGalleryRules.volley(b,m.angle+(active?m.elapsed*s.effect.rotation:0),s.effect.count,Math.PI*2,1,s.shape.angle*Math.PI/180):null;
   const regions=rays?rays.map(shot=>SurvivorArt.shapeOptions({type:'line',radius:active?3:1,length:s.shape.radius},b,Math.atan2(shot.vy,shot.vx))):undefined;
   SurvivorArt.paint('move/'+m.id,{context:ctx,...SurvivorArt.shapeOptions(shape,origin,angle),regions,animation:m.ai.phase,time:state.elapsed,...SurvivorArt.phaseContext(m.ai,s.timing)},()=>{
     if(['nova','cross'].includes(m.id)){
       ctx.save();ctx.translate(b.x,b.y);ctx.rotate(shape.angle);ctx.strokeStyle=active?'#ffe391':'#d32c4d';ctx.fillStyle=active?'rgba(255,98,45,.55)':'rgba(229,42,74,.15)';
       if(m.id==='nova'){
         ctx.beginPath();ctx.arc(0,0,Math.max(1,shape.radius),shape.gap/2,Math.PI*2-shape.gap/2);ctx.lineWidth=active?shape.thickness*2:3;ctx.stroke();
         // 細同心弧預告火環會擴散，缺口方向整招固定。
         if(!active)for(let radius=45;radius<shape.radius;radius+=45){ctx.beginPath();ctx.arc(0,0,radius,shape.gap/2,Math.PI*2-shape.gap/2);ctx.lineWidth=1;ctx.stroke();}
       }else {for(let i=0;i<2;i++){ctx.rotate(i*Math.PI/2);if(active)ctx.fillRect(-shape.radius,-shape.thickness,shape.radius*2,shape.thickness*2);else {ctx.beginPath();ctx.moveTo(-shape.radius,0);ctx.lineTo(shape.radius,0);ctx.lineWidth=2;ctx.stroke();}}}
       ctx.restore();
     }else if(m.id==='spiral'){
       for(const shot of rays)drawTrialShape({type:'line',radius:active?3:1,length:s.shape.radius},b,Math.atan2(shot.vy,shot.vx),active);
     }else if(s.effect.charge){
       drawTrialShape({type:'line',radius:active?s.shape.radius:5,length:shape.length},b,m.angle,active);
       ctx.save();ctx.translate(b.x,b.y);ctx.rotate(m.angle);ctx.fillStyle=active?'#ffe391':'#d32c4d';ctx.beginPath();ctx.moveTo(shape.length,0);ctx.lineTo(shape.length-18,-11);ctx.lineTo(shape.length-18,11);ctx.closePath();ctx.fill();ctx.restore();
     }else {
       if(s.effect.limb){ctx.save();ctx.fillStyle='rgba(30,26,40,.35)';ctx.beginPath();ctx.ellipse(origin.x,origin.y,shape.radius,shape.radius*.6,0,0,Math.PI*2);ctx.fill();ctx.restore();}
       drawTrialShape(shape,origin,m.angle,active);
     }
     if(['dive','icefall','meteor'].includes(m.id)){
       ctx.save();ctx.fillStyle='rgba(42,38,56,.35)';ctx.beginPath();ctx.ellipse(m.target.x,m.target.y,s.shape.radius*.65,18,0,0,Math.PI*2);ctx.fill();
       if(active&&m.id!=='dive'){ctx.fillStyle=m.id==='icefall'?'#c9faff':'#ffb65f';const height=100*m.ai.left/s.timing.active;ctx.fillRect(m.target.x-12,m.target.y-height-32,24,32);}ctx.restore();
     }
   });
 }
}
function drawTrialBodies(){
 for(const body of trialBodies())withTrialBody(body,()=>{
   if(body.vanished)return;
   const m=body.moves[0],air=m&&m.id==='dive'&&['windup','active'].includes(m.ai.phase)?m.ai.phase==='windup'?60:60*m.ai.left/m.duration:0;
   const exposure=trialCoreExposure(body),limbed=state.trial.definition.moves.some(d=>d.blocks.moves[0].effect.limb);
   const x=body.x,y=body.y,scale=body.r/32*(!limbed&&!trialGridSpec(state.trial.definition)&&m&&m.ai.phase==='windup'?1+Math.sin(state.elapsed*12)*.05:1);
   drawGroundShadow(x,y,body.r,air);
   // Exposed torso is in front of the floor-plane attacking hand, not merely its marker.
   if(exposure)drawTrialLimbs(body,exposure);
   ctx.save();if(trialGridSpec(state.trial.definition)){
    const pose=SurvivorTrialBlocks.gridRenderPose(body.gridOrientation,body.gridTransit);
    // Rotate around the actual central eye anchor, preserving beam/hit world geometry.
    const anchor=bossWeakpointPoints(body,bossWeakpointConfig(body)).weakpoint;
    ctx.translate(anchor.x,anchor.y);ctx.rotate(pose.angle);ctx.translate(-anchor.x,-anchor.y);
   }
   drawOutlinedSprite(ctx,trialPicture(),...SurvivorArt.bounds(body.artId,x-32*scale,y-air-36*scale,64*scale,64*scale,{displayScale:scale}),undefined,SurvivorArt.lookup(body.artId).outline);ctx.restore();
   if(!exposure)drawTrialLimbs(body);
   drawBossWeakpoints(body,air);
   const weak=body.posture.stun>0;
   if(weak||body.posture.value>=GAME_DATA.boss.posture.maximum*.75){ctx.fillStyle=weak?'#fff0a5':'#ffb95c';ctx.fillRect(x-16,y-air-70,32,32);SurvivorIcons.draw(ctx,weak?'weakpoint':'posture',x-12,y-air-66,24);}
   ctx.fillStyle='#fff0a5';ctx.fillRect(x-34,y+49,68*body.posture.value/GAME_DATA.boss.posture.maximum,3);
 });
}

// Match the shared critical-enabled phases, including closing after interruption with no move.
function trialCoreExposure(body){
 if(!state.trial.definition.moves.some(d=>d.blocks.moves[0].effect.limb))return null;
 const config=bossWeakpointConfig(body),part=config&&config.parts.find(p=>p.id==='core');
 if(!part||!['open','closing'].includes(body.weakpoints?.[part.id]?.phase))return null;
 const point=bossWeakpointPoints(body,config)[part.anchor];
 return point?{...point,radius:Math.max(8,body.r*part.radiusScale)}:null;
}
// Nonattacking guards move aside; attacking hand keeps its immutable target and floor-plane layer.
function drawTrialLimbs(body,exposure=null){
 const def=state.trial.definition,move=body.moves&&body.moves[0];
 for(const side of [-1,1]){
  const definition=def.moves.find(d=>d.blocks.moves[0].effect.limb?.side===side);if(!definition)continue;
  const spec=definition.blocks.moves[0],current=move&&move.id===definition.id?move:null;
  const pose=SurvivorTrialBlocks.limbPose(body,side,current,spec,exposure),id=side<0?'character/stone-hand-left':'character/stone-hand-right';
  const size=spec.shape.radius*1.2,animation=current?current.ai.phase:'idle';
  SurvivorArt.paint(id,{context:ctx,x:pose.x-size/2,y:pose.y-pose.height-size/2,width:size,height:size,animation,time:state.elapsed},()=>{
   const a=SurvivorArt.lookup(id),colors=a.palette;ctx.save();ctx.fillStyle=colors[0];ctx.fillRect(pose.x-size/2,pose.y-pose.height-size/2,size,size);
   ctx.strokeStyle=colors[1];ctx.lineWidth=3;ctx.strokeRect(pose.x-size/2,pose.y-pose.height-size/2,size,size);ctx.restore();
  });
 }
}

// Closed orientation frames and actual open iris use the same fixed central anchor.
function trialEyePicture(body){
 const open=trialGridExposure(body),pose=SurvivorTrialBlocks.gridRenderPose(body.gridOrientation,body.gridTransit),animation=open?'eye_open':'face'+pose.face;
 const image=SurvivorArt.picture(body.artId,animation,0);if(image)return image;
 // Loading fallback depicts the same eye state, not a misleading weakpoint marker.
 const key='eye-'+animation;if(trialPlaceholders[key])return trialPlaceholders[key];
 const canvas=document.createElement('canvas');canvas.width=16;canvas.height=16;
 const g=canvas.getContext('2d'),art=SurvivorArt.lookup(body.artId),palette=art.palette;
 g.fillStyle=palette[0];g.fillRect(2,2,12,12);g.fillStyle=palette[1];g.fillRect(3,3,10,10);
 g.fillStyle=palette[2];if(open){g.fillRect(5,5,6,6);g.fillStyle=palette[0];g.fillRect(7,6,2,4);}
 else if(pose.face===3)g.fillRect(5,7,6,2);
 else if(pose.face===1)g.fillRect(11,5,1,6);
 else if(pose.face===2)g.fillRect(5,3,6,1);
 else if(pose.face===4)g.fillRect(3,5,1,6);
 else if(pose.face===5)g.fillRect(5,11,6,1);
 else {g.fillRect(5,5,2,2);g.fillRect(9,9,2,2);}
 trialPlaceholders[key]=canvas;return canvas;
}
function drawTrialGridMove(b,m,s){
 const region=trialGridRegion(b,m,s),active=m.ai.phase==='active';
 SurvivorArt.paint('move/'+m.id,{context:ctx,...SurvivorArt.shapeOptions(region.shape,region.origin,region.angle),animation:m.ai.phase,time:state.elapsed},()=>{
  ctx.save();ctx.translate(region.origin.x,region.origin.y);ctx.rotate(region.angle);
  ctx.beginPath();ctx.rect(0,-region.shape.radius,region.shape.length,region.shape.radius*2);
  ctx.strokeStyle=active?'#ffe391':'#d32c4d';ctx.lineWidth=2;ctx.stroke();
  if(active){ctx.fillStyle='rgba(255,98,45,.55)';ctx.fill();}ctx.restore();
  if(s.effect.gridRoll){
   ctx.save();ctx.beginPath();ctx.arc(state.trial.arena.x,state.trial.arena.y,state.trial.arena.radius,0,Math.PI*2);ctx.clip();
   const cell=s.effect.gridRoll.cell;ctx.fillStyle='rgba(229,42,74,.22)';ctx.fillRect(m.target.x-cell/2,m.target.y-cell/2,cell,cell);
   ctx.strokeStyle='#d32c4d';ctx.lineWidth=2;ctx.strokeRect(m.target.x-cell/2,m.target.y-cell/2,cell,cell);ctx.restore();
  }
 });
}
