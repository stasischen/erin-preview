// Shared survival attacks: moving bodies, zones and instantaneous shapes.
// One hit-card proc per cast/pulse. Secondary damage never calls this module again.
globalThis.SurvivorWeaponAttacks=(()=>{
  const cap=48;
  const distance=(a,b)=>Math.hypot(deltaX(a.x,b.x),deltaY(a.y,b.y));
  const angleTo=(a,b)=>Math.atan2(deltaY(b.y,a.y),deltaX(b.x,a.x));
  function targets(origin=state.player){return combatTargets().sort((a,b)=>distance(a,origin)-distance(b,origin));}
  function settings(slot){
    const row=SurvivorWeaponCatalog.level(slot.weaponId,slot.level), spread=cardBlock('multi-water','onShot').actions[0], pierce=cardBlock('piercing-water','onShot').actions[0];
    const radius=row.radius*(BUILD_TUNING.fieldRadius/SURVIVOR_DEFAULTS.build.fieldRadius)*cardBlock('big-water','onShot').actions[0].multiplier;
    return {...row,damage:effectiveDamage(),radius,speed:row.speed?row.speed*(PROJECTILE_SPEED/SURVIVOR_DEFAULTS.tuning.projectileSpeed):row.speed,range:row.range*(BUILD_TUNING.shotRange/SURVIVOR_DEFAULTS.build.shotRange)*pierce.size*cardBlock('wind-attack','onShot').actions[0].multiplier,
      count:Math.min(12,row.count+spread.count-1),pierce:(row.pierce||0)+pierce.count,beamWidth:radius*(1+spread.extraArc)};
  }
  function proc(g,t){
    if(g.proc)return;g.proc=true;
    if(effectLevel('splash-water')){
      const block=cardBlock('splash-water','onShotHit',{damage:g.damage});skillVisual('splash',t.x,t.y,{radius:block.conditions[0].radius,life:.25});
      for(const other of combatTargets())if(other!==t&&cardBlockMatches(block.conditions[0],other,t.x,t.y)){hitBuildTarget(other,block.actions[0].amount,{source:t});if(state.mode!=='playing')return;}
    }
    for(const school of ['water','thunder'])if(effectLevel(school+'-attack') || school==='water'&&(effectLevel('water-skill')||effectLevel('fusion-puddle'))){schoolEffect(school,t,t.x,t.y,g.damage,[t]);if(state.mode!=='playing')return;}
    if(effectLevel('wind-blade')){const other=targets(t).find(e=>e!==t&&distance(e,t)<=GAME_DATA.schoolRules.windBladeRange);if(other){hitBuildTarget(other,g.damage*GAME_DATA.schoolRules.windBladeDamage,{source:t});skillVisual('gust',t.x,t.y,{x2:other.x,y2:other.y});}}
    if(state.mode==='playing')triggerMakerEffects('hit',t.x,t.y);
  }
  function hit(g,t,seen){
    if(seen.has(t)||!canAttackTarget(t))return;seen.add(t);
    hitBuildTarget(t,g.damage,{source:g});if(state.mode!=='playing')return;
    if(g.slow)applyCardTargetActions({actions:[{type:'slow',duration:BUILD_TUNING.slowSeconds*g.slow,multiplier:BUILD_TUNING.slowMultiplier}]},t);
    proc(g,t);
  }
  function pulse(g){
    const seen=new Set();g.proc=false;
    for(const t of combatTargets())if(g.parts.some(p=>distance(t,p)<=g.radius+t.r)){hit(g,t,seen);if(state.mode!=='playing')return;}
  }
  function fire(slot){
    const weapon=SurvivorWeaponCatalog.get(slot.weaponId), cfg=settings(slot), list=targets().filter(t=>distance(t,state.player)<=cfg.range+t.r);
    if(!list.length && weapon.handler!=='orbit')return;
    if(state.weaponEffects.length>=cap)return;
    const p=state.player, target=list[0], angle=target?angleTo(p,target):Math.atan2(state.faceY,state.faceX);
    const g={...cfg,ownerId:slot.weaponId,kind:weapon.handler,age:0,life:4,clock:0,proc:false,x:p.x,y:p.y,angle,parts:[],seekHits:new Set()};
    if(g.kind==='zap'){
      g.life=.32;g.parts=list.sort((a,b)=>(b.maxHp||b.hp)-(a.maxHp||a.hp)).slice(0,g.count).map(t=>({x:t.x,y:t.y,target:t}));
      const seen=new Set();for(const q of g.parts){hit(g,q.target,seen);if(state.mode!=='playing')return;}
    }else if(g.kind==='beam'){
      g.life=.3;const base=cfg.count===1?[0]:cfg.count===2?[0,Math.PI]:[0,Math.PI/2,Math.PI,Math.PI*1.5];
      // Extra multishot widens the beams, preserving the weapon's 1/2/4 cardinal pattern.
      const native=SurvivorWeaponCatalog.level(slot.weaponId,slot.level).count;
      const directions=native===1?[0]:native===2?[0,Math.PI]:base;
      g.parts=directions.map(a=>({x:p.x+Math.cos(angle+a)*g.range,y:p.y+Math.sin(angle+a)*g.range}));
      const seen=new Set();for(const t of list)if(g.parts.some(q=>SurvivorSchools.segmentDistance(deltaX(t.x,p.x),deltaY(t.y,p.y),deltaX(q.x,p.x),deltaY(q.y,p.y))<=g.beamWidth+t.r)){hit(g,t,seen);if(state.mode!=='playing')return;}
    }else if(g.kind==='field'||g.kind==='bomb'){
      g.life=g.delay+g.seconds;
      g.parts=Array.from({length:g.count},(_,i)=>{const a=i*Math.PI*2/g.count,offset=g.count===1?0:g.radius*.85;return {x:target.x+Math.cos(a)*offset,y:target.y+Math.sin(a)*offset};});
    }else if(g.kind==='orbit'){
      g.life=effectiveShotInterval()+.01;
      g.parts=Array.from({length:g.count},(_,i)=>({x:p.x,y:p.y,angle:i*Math.PI*2/g.count}));
    }else{
      const count=g.kind==='seek'?Math.min(g.count,list.length):g.count;
      g.parts=Array.from({length:count},(_,i)=>({x:p.x,y:p.y,angle:angle+(i-(count-1)/2)*(g.spread||.24),travel:0,hits:new Set(),returning:false,alive:true,target:g.kind==='seek'?list[i]:target,left:g.kind==='bounce'?g.bounces+g.pierce:1+g.pierce}));
    }
    state.weaponEffects.push(g);
  }
  function movePart(g,q,dt){
    if(!q.alive)return;
    if(g.kind==='return'&&q.travel>=g.range&&!q.returning){q.returning=true;q.hits.clear();}
    if(q.returning){q.angle=angleTo(q,state.player);if(distance(q,state.player)<g.speed*dt+10){q.alive=false;return;}}
    else if(['seek','bounce'].includes(g.kind)){
      if(!q.target||!canAttackTarget(q.target)||(q.target!==state.boss&&!q.target.alive)||q.hits.has(q.target)){
        q.target=targets(q).find(t=>!q.hits.has(t)&&distance(t,q)<=g.range && (g.kind!=='seek'||!g.seekHits.has(t)&&!g.parts.some(other=>other!==q&&other.alive&&!other.returning&&other.target===t)));
      }
      if(!q.target){if(g.kind==='seek')q.returning=true;else q.alive=false;return;}
      q.angle=angleTo(q,q.target);
    }
    const dx=Math.cos(q.angle)*g.speed*dt,dy=Math.sin(q.angle)*g.speed*dt,old={x:q.x,y:q.y};q.x+=dx;q.y+=dy;q.travel+=Math.hypot(dx,dy);
    for(const t of combatTargets()){
      if(g.kind==='seek'&&q.returning)break;
      if(g.kind==='seek'&&(t!==q.target||g.seekHits.has(t)))continue;
      if(SurvivorSchools.segmentDistance(deltaX(t.x,old.x),deltaY(t.y,old.y),dx,dy)>g.radius+t.r||q.hits.has(t))continue;
      hit(g,t,q.hits);if(state.mode!=='playing')return;
      if(g.kind==='seek'){g.seekHits.add(t);q.returning=true;break;}
      if(g.kind==='bounce'){if(--q.left<=0)q.alive=false;q.target=null;break;}
      if(g.kind==='fan'&&--q.left<=0){q.alive=false;break;}
    }
    if(g.kind==='fan'&&q.travel>=g.range)q.alive=false;
  }
  function tick(dt){
    for(const g of state.weaponEffects||[]){
      g.age+=dt;g.life-=dt;if(g.life<=0)continue;
      if(g.kind==='orbit'){
        for(const q of g.parts){const a=state.elapsed*g.speed+q.angle;q.x=state.player.x+Math.cos(a)*g.range;q.y=state.player.y+Math.sin(a)*g.range;}
        if(g.clock<=0){pulse(g);g.clock=g.interval;}g.clock-=dt;
      }else if(g.kind==='field'||g.kind==='bomb'){
        if(g.age>=g.delay){g.clock-=dt;if(g.clock<=0){pulse(g);g.clock=g.pulse;}}
      }else if(!['beam','zap'].includes(g.kind)){
        for(const q of g.parts){movePart(g,q,dt);if(state.mode!=='playing')return;}
        if(g.parts.every(q=>!q.alive))g.life=0;
      }
      if(state.mode!=='playing')return;
    }
    state.weaponEffects=(state.weaponEffects||[]).filter(g=>g.life>0);
  }
  return {fire,tick,settings};
})();

Survivor.engine=Survivor.engine||{};Survivor.engine['weapon-attacks']=SurvivorWeaponAttacks;
