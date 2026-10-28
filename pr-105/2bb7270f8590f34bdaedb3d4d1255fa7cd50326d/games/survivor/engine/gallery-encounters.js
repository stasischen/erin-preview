// 引擎無關：第二批試煉的幾何、階段、彈幕與追蹤，單位為世界距離／秒。
globalThis.SurvivorGalleryRules=(()=>{
 const tau=Math.PI*2,wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
 function stage(hp,maxHp,threshold,partnerDown=false){return partnerDown||hp/maxHp<threshold?2:1;}
 function roster(def,role){return {...def,moves:def.moves.filter(m=>!role||(role==='frost'?!['nova','meteor'].includes(m.id):!['frost-dash','icefall'].includes(m.id)))};}
 function choose(def,role,phase,previous,sample,distance=0){return SurvivorTrialRules.choose(roster(def,role),phase,distance,previous,sample);}
 function geometry(id,shape,progress,angle){
   if(id==='nova')return {...shape,radius:shape.radius*progress,thickness:shape.thickness||12,gap:shape.angle*Math.PI/180,angle};
   if(id==='cross')return {...shape,angle:angle+progress*(shape.rotation===undefined?Math.PI/2:shape.rotation),thickness:shape.thickness||12};
   return {...shape,angle};
 }
 function contains(shape,origin,target){
   const dx=target.x-origin.x,dy=target.y-origin.y,d=Math.hypot(dx,dy),r=target.r||0;
   if(shape.type==='ring')return Math.abs(d-shape.radius)<=shape.thickness+r&&Math.abs(wrap(Math.atan2(dy,dx)-shape.angle))>shape.gap/2-Math.asin(Math.min(1,r/Math.max(1,d)));
   if(shape.type==='cross'){const x=dx*Math.cos(shape.angle)+dy*Math.sin(shape.angle),y=-dx*Math.sin(shape.angle)+dy*Math.cos(shape.angle);return d<=shape.radius+r&&Math.min(Math.abs(x),Math.abs(y))<=shape.thickness+r;}
   return SurvivorTrialRules.contains(shape,origin,shape.angle,target);
 }
 function volley(origin,angle,count,spread,speed,gap=0){
   return Array.from({length:count},(_,i)=>angle+(count===1?0:(i/(count-1)-.5)*spread)).filter(a=>!gap||Math.abs(wrap(a-angle))>gap/2).map(a=>({x:origin.x,y:origin.y,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed}));
 }
 function field(previous,target,dt){
   const f={...previous},events=[];const wait=f.warning||0;
   f.warning=Math.max(0,wait-dt);const activeDt=Math.max(0,dt-wait);
   if(activeDt>0){
     f.life=Math.max(0,f.life-activeDt);
     if(f.kind==='tornado'){const dx=target.x-f.x,dy=target.y-f.y,d=Math.max(1,Math.hypot(dx,dy));f.x+=dx/d*f.speed*activeDt;f.y+=dy/d*f.speed*activeDt;}
     else {f.x+=(f.vx||0)*activeDt;f.y+=(f.vy||0)*activeDt;}
     f.pulse=(f.pulse||0)-activeDt;
     if(previous.life>0&&f.pulse<=0&&Math.hypot(target.x-f.x,target.y-f.y)<=f.radius+(target.r||0)) {events.push({type:'trial-hit',owner:f.owner,damage:f.damage});f.pulse=.6;}
   }
   return {state:f,events};
 }
 function transition(hp,maxHp,threshold,partnerDown,oldPhase){const phase=stage(hp,maxHp,threshold,partnerDown);return {phase,events:phase>oldPhase?[{type:'phase-changed',phase,enraged:partnerDown}]:[]};}
 return {stage,roster,choose,geometry,contains,volley,field,transition};
})();
Survivor.engine.gallery.encounters=SurvivorGalleryRules;
Survivor.engine['gallery-encounters']={rules:SurvivorGalleryRules};
function trialBodies(){return state.trial&&state.trial.actors?state.trial.actors.filter(b=>b.hp>0):state.boss?[state.boss]:[];}
// 既有單王戰鬥接合的暫時 context；每隻保有獨立 AI、架勢、收招與血量。
function withTrialBody(body,action){
 const t=state.trial,old={boss:state.boss,moves:state.bossMoves,phase:state.bossPhase,rest:state.bossRest};
 if(!t||!t.actors)return action();
 state.boss=body;state.bossMoves=body.moves;state.bossPhase=body.phase;state.bossRest=body.rest;
 try{return action();}finally{
   if(state.boss===body){body.moves=state.bossMoves;body.phase=state.bossPhase;body.rest=state.bossRest;}
   if(state.trial===t){state.boss=old.boss&&old.boss.hp>0?old.boss:trialBodies()[0]||null;state.bossMoves=state.boss?state.boss.moves:[];state.bossPhase=state.boss?state.boss.phase:1;state.bossRest=state.boss?state.boss.rest:0;}
 }
}
function initTrialEncounter(){
 const t=state.trial;if(t.definition.id==='gatekeeper')return;
 const make=(role,index)=>({...state.boss,...SurvivorTrialRules.entry(t.arena,state.boss.r,index,t.definition.id==='frostfire'?2:1),posture:SurvivorPosture.initial(),role,trialActor:true,alive:true,actorId:role||t.definition.id,artId:role==='fire'?'character/fire-twin':t.definition.artId,moves:[],phase:1,rest:index?.95:.4});
 t.actors=t.definition.id==='frostfire'?[make('frost',0),make('fire',1)]:[make(null,0)];t.actors.forEach(b=>Object.assign(b,SurvivorTrialRules.boundary(b,t.arena).position));t.fields=[];state.boss=t.actors[0];state.bossMoves=state.boss.moves;
}
function trialBossDefeated(body){
 const t=state.trial;if(!t||!t.actors){state.boss=null;finishRun(true);return;}
 body.alive=false;body.hp=0;body.moves=[];t.fields=t.fields.filter(f=>f.owner!==body.actorId);
 t.events.push({type:'boss-defeated',id:body.actorId});
 const living=trialBodies();if(!living.length){state.boss=null;finishRun(true);return;}
 state.boss=living[0];state.bossMoves=state.boss.moves;
}
function trialField(body,position,options){
 const t=state.trial;if(t.fields.length>=96)return;
 t.fields.push({x:position.x,y:position.y,radius:12,life:4,warning:0,pulse:0,damage:12,owner:body.actorId,...options});
}
function encounterShape(m,s){const def=state.trial.definition.moves.find(d=>d.id===m.id);return SurvivorGalleryRules.geometry(m.id,{...s,rotation:def.blocks.moves[0].effect.rotation},m.ai.phase==='windup'?(m.id==='nova'?1:0):Math.max(0,Math.min(1,1-m.ai.left/m.duration)),m.angle);}
function encounterDodgeThreat(){
 const t=state.trial,p=state.player,window=GAME_DATA.boss.posture.window;
 for(const f of t.fields){
   const owner=trialBodies().find(b=>b.actorId===f.owner);if(!owner||owner.posture.stun>0||f.dodged)continue;
   const dx=p.x-f.x,dy=p.y-f.y,d=Math.max(1,Math.hypot(dx,dy)),vx=f.kind==='tornado'?dx/d*f.speed:f.vx||0,vy=f.kind==='tornado'?dy/d*f.speed:f.vy||0;
   const time=(f.warning||0)+Math.max(f.kind==='feather'||f.projectile?0:f.pulse||0,SurvivorPosture.contact(f.x-p.x,f.y-p.y,vx,vy,f.radius+p.r));
   if(SurvivorPosture.perfect(time,window)&&time<=f.life+(f.warning||0))return f;
 }
 for(const b of trialBodies().filter(b=>b.posture.stun<=0&&!(b.stunTimer>0)))for(const m of b.moves){
   if(m.dodged||!['windup','active'].includes(m.ai.phase)||trialUsesBlocks(t.definition)&&m.ai.phase!=='windup')continue;
   const s=t.definition.moves.find(d=>d.id===m.id).blocks.moves[0];let time=m.ai.phase==='windup'?m.ai.left:0;
   const origin=['dive','icefall','meteor'].includes(m.id)?m.target:b;
   let shape=encounterShape(m,s.shape),near=SurvivorGalleryRules.contains(shape,origin,p);
   if(trialUsesBlocks(t.definition)){
    if(s.effect.projectiles){
     const q=s.effect.projectiles;
     const contact=Math.min(...SurvivorGalleryRules.volley(b,m.angle,q.count,s.shape.angle*Math.PI/180,q.speed).map(shot=>SurvivorPosture.contact(shot.x-p.x,shot.y-p.y,shot.vx,shot.vy,q.radius+p.r)));
     time+=contact;near=contact<=q.life;
    }else near=SurvivorTrialRules.contains(s.shape,s.effect.limb?m.target:b,m.angle,p);
   }
   if(['dive','icefall','meteor'].includes(m.id))time+=m.ai.phase==='windup'?s.timing.active:m.ai.left;
   if(m.id==='frost-dash'){const hit=SurvivorPosture.contact(b.x-p.x,b.y-p.y,Math.cos(m.angle)*s.effect.speed,Math.sin(m.angle)*s.effect.speed,b.r+p.r);time+=hit;near=hit<=(m.ai.phase==='active'?m.ai.left:s.timing.active);}
   if(m.id==='nova'){const dist=Math.hypot(p.x-b.x,p.y-b.y);const progress=m.ai.phase==='active'?1-m.ai.left/s.timing.active:0;shape=SurvivorGalleryRules.geometry(m.id,s.shape,dist/s.shape.radius,m.angle);near=SurvivorGalleryRules.contains(shape,b,p);time+=Math.max(0,(dist-s.shape.radius*progress)/s.shape.radius*s.timing.active);}
   if(near&&SurvivorPosture.perfect(time,window))return m;
 }return null;
}
function updateTrialEncounter(dt){
 const t=state.trial;t.events=[];t.slow=1;
 if(t.entry>0){t.entry=countdown(t.entry,dt);state.bossIntro=t.entry;return;}
 t.fields=t.fields.flatMap(f=>{
   const result=SurvivorGalleryRules.field(f,state.player,dt),owner=t.actors.find(b=>b.actorId===f.owner);
   if(owner&&owner.hp>0)for(const e of result.events)withTrialBody(owner,()=>bossHurtPlayer(e.damage));
   if(state.trial!==t)return [];
   if(result.state.kind==='ice'&&!result.state.warning&&Math.hypot(result.state.x-state.player.x,result.state.y-state.player.y)<result.state.radius+state.player.r)t.slow=Math.min(t.slow,result.state.slow||1);
   return result.state.life>0&&!SurvivorTrialRules.boundary({...result.state,r:0},t.arena).hit?[result.state]:[];
 });
 if(state.trial!==t)return;
 for(const b of trialBodies()){
   if(b.feedbackFrozen)continue;
   withTrialBody(b,()=>updateTrialActor(dt));if(state.trial!==t)return;
 }
 updateHud();
}
function updateTrialActor(dt){
 const t=state.trial,b=state.boss,def=t.definition;
 b.flash=countdown(b.flash||0,dt);b.wobble+=dt*3;b.stunTimer=countdown(b.stunTimer||0,dt);b.slowTimer=countdown(b.slowTimer||0,dt);
 b.posture=SurvivorPosture.step(b.posture,null,GAME_DATA.boss.posture,dt).state;
 const transition=SurvivorGalleryRules.transition(b.hp,b.maxHp,def.phases[1].threshold,t.actors.some(a=>a.hp<=0),state.bossPhase);
 const repeated=state.bossMoves[0],defer=trialUsesBlocks(def)&&(b.posture.stun>0||repeated&&def.moves.find(move=>move.id===repeated.id).blocks.moves[0].effect.sequence&&['windup','active'].includes(repeated.ai.phase));
 if(transition.events.length&&!defer){state.bossPhase=transition.phase;clearBossMoves();state.bossRest=1;t.events.push(...transition.events.map(e=>({...e,id:b.actorId})));burst(b.x,b.y,'#ffca72',16);}
 if(b.posture.stun>0||b.stunTimer>0){clearBossMoves();b.recoveryLeft=0;return;}
 if(trialUsesBlocks(def)){updateTrialBlockActor(dt);return;}
 if(!state.bossMoves.length){
   b.recoveryLeft=0;state.bossRest=countdown(state.bossRest,dt);
   const dx=state.player.x-b.x,dy=state.player.y-b.y,d=Math.max(1,Math.hypot(dx,dy));
   if(d>140){const speed=def.speed*def.phases[state.bossPhase-1].speed*(b.slowTimer>0?BUILD_TUNING.slowMultiplier:1);b.x+=dx/d*speed*dt;b.y+=dy/d*speed*dt;clampToMap(b);}
   if(state.bossRest>0)return;
   const id=SurvivorGalleryRules.choose(def,b.role,state.bossPhase,b.previous||[],Math.random(),d);if(!id){state.bossRest=.3;return;}
   const s=def.moves.find(m=>m.id===id).blocks.moves[0];
   state.bossMoves.push({id,kind:id,owner:b.actorId,ai:SurvivorBossAI.start(s.timing),angle:Math.atan2(dy,dx),origin:{x:b.x,y:b.y},target:SurvivorTrialRules.boundary({...state.player,r:b.r},t.arena).position,duration:s.timing.active,elapsed:0,pulse:0,dodged:false});b.previous=[id];playSound('warning');return;
 }
 const m=state.bossMoves[0],s=def.moves.find(d=>d.id===m.id).blocks.moves[0];
 if(m.ai.phase==='cooldown'){const dx=state.player.x-b.x,dy=state.player.y-b.y,d=Math.hypot(dx,dy);if(d>140){const speed=def.speed*def.phases[state.bossPhase-1].speed*(b.slowTimer>0?BUILD_TUNING.slowMultiplier:1);b.x+=dx/d*Math.min(d-140,speed*dt);b.y+=dy/d*Math.min(d-140,speed*dt);clampToMap(b);}}
 m.warning=m.ai.phase==='windup'?m.ai.left:0;m.active=m.ai.phase==='active';m.recovery=m.ai.phase==='recovery'?m.ai.left:0;b.recoveryLeft=m.recovery;
 if(m.active){
   const before=m.elapsed;m.elapsed+=dt;m.pulse-=dt;
   if(m.id==='frost-dash'){
     b.x+=Math.cos(m.angle)*s.effect.speed*dt;b.y+=Math.sin(m.angle)*s.effect.speed*dt;
     const wall=SurvivorTrialRules.boundary(b,t.arena);Object.assign(b,wall.position);
     if(wall.hit){b.posture={value:0,stun:t.config.wallStun};clearBossMoves();t.events.push(...SurvivorTrialRules.wallStun(true,t.config.wallStun));return;}
     if(m.pulse<=0){trialField(b,b,{kind:'ice',radius:30,life:s.effect.duration,warning:.6,slow:s.effect.slow,damage:s.effect.damage});m.pulse=s.effect.interval;}
     if(Math.hypot(b.x-state.player.x,b.y-state.player.y)<b.r+state.player.r)bossHurtPlayer(s.effect.damage,s.feedback);
   }else if(m.id==='dive'){
     const p=Math.min(1,m.elapsed/s.timing.active);b.x=m.origin.x+(m.target.x-m.origin.x)*p;b.y=m.origin.y+(m.target.y-m.origin.y)*p;
   }else if(['nova','cross'].includes(m.id)){
     if(SurvivorGalleryRules.contains(encounterShape(m,s.shape),b,state.player))bossHurtPlayer(s.effect.damage,s.feedback);
   }else if(['feathers','spiral','tornado'].includes(m.id)&&m.pulse<=0){
     if(m.id==='tornado')trialField(b,b,{kind:'tornado',radius:s.shape.radius,speed:s.effect.speed,life:s.effect.duration,warning:.8,damage:s.effect.damage});
     else {
       const spiral=m.id==='spiral',angle=m.angle+(spiral?before*s.effect.rotation:0);
       for(const shot of SurvivorGalleryRules.volley(b,angle,s.effect.count,spiral?Math.PI*2:s.shape.angle*Math.PI/180,s.effect.speed,spiral?s.shape.angle*Math.PI/180:0))trialField(b,shot,{...shot,kind:'feather',radius:8,life:s.effect.duration,damage:s.effect.damage});
     }m.pulse=m.id==='spiral'?s.effect.interval:99;
   }
   if(state.trial!==t)return;
 }
 const old=m.ai.phase,result=SurvivorBossAI.advance(m.ai,s.timing,dt);m.ai=result.state;
 if(old!==m.ai.phase){
   t.events.push({type:'move-phase',id:b.actorId,moveId:m.id,phase:m.ai.phase});
   if(m.ai.phase==='recovery'&&['dive','icefall','meteor'].includes(m.id)&&SurvivorGalleryRules.contains({...s.shape,angle:0},m.target,state.player))bossHurtPlayer(s.effect.damage,s.feedback);
   if(state.trial!==t)return;
   if(m.ai.phase==='select'){clearBossMoves();state.bossRest=.4;b.recoveryLeft=.4;}
 }
 m.warning=m.ai.phase==='windup'?m.ai.left:0;m.active=m.ai.phase==='active';m.recovery=m.ai.phase==='recovery'?m.ai.left:0;b.recoveryLeft=m.recovery;
}
