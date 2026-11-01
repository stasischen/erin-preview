// 純規則：輸入事件、持有能力、數值與抽樣值；輸出新計數和可序列化事件。
globalThis.SurvivorNeutral = (() => {
  const block=(id,trigger,rules,context={})=>SurvivorEffectBlocks.event('item-'+id,trigger,{neutralRules:rules},context);
  function reward(current, type, powers, rules, draw, cardId) {
    const next = {kills:current.kills, gems:current.gems}, events = [];
    if (type === 'death') {
      if (powers.cookie) { const rule=block('cookie','onDeath',rules);next.kills+=rule.actions[0].amount; if (SurvivorEffectBlocks.matches(rule.conditions[0],{number:next.kills})) events.push({type:'heal', amount:rule.actions[1].amount}); }
      if (powers.candy && SurvivorEffectBlocks.matches(block('candy','onDeath',rules).conditions[0],{draw})) events.push({type:'bomb-dropped'});
    }
    if (type === 'pickup' && powers.bank) {
      next.gems+=block('bank','onPickup',rules,{gems:next.gems}).actions[0].amount;
      const rule=block('bank','onPickup',rules,{gems:next.gems});
      if (SurvivorEffectBlocks.matches(rule.conditions[0],{number:next.gems})) events.push({type:'bank-grown', bonus:rule.actions[0].bonus});
    }
    if (type === 'acquire') events.push({type:'item-acquired',cardId,rerolls:SurvivorEffectBlocks.matches(block('clover','onAcquire',rules).conditions[0],powers)?block('clover','onAcquire',rules).actions[0].amount:0});
    return {next, events};
  }
  function damage(gems, powers, rules) {
    return SurvivorEffectBlocks.modify('neutralDamageMultiplier', (powers.bank ? block('bank','onDamage',rules,{gems}).actions[0].multiplier : 1), {'item-crown':powers.crown}, {neutralRules:rules});
  }
  // 掃過的圓形路徑：固定輸入 → 第一個撞到的索引；使用相對世界座標。
  function collision(dx,dy,radius,targets) {
    const length=Math.hypot(dx,dy);
    if (!length) return -1;
    let first=-1, nearest=Infinity;
    targets.forEach((t,i)=>{
      const along=(t.x*dx+t.y*dy)/length;
      if (along<=0 || along>length+radius+t.r) return;
      if (SurvivorSchools.segmentDistance(t.x,t.y,dx,dy)<=radius+t.r && along<nearest) {first=i;nearest=along;}
    });
    return first;
  }
  return {reward,damage,collision};
})();
function neutralPowers() {
  return Object.fromEntries(['cookie','candy','bank','crown'].map(id=>[id,!!effectLevel('item-'+id)]));
}
function neutralDamageMultiplier() { return SurvivorNeutral.damage(state.neutral ? state.neutral.gems : 0,neutralPowers(),GAME_DATA.neutralRules); }
function neutralEvent(type,x,y,cardId) {
  if (!state.neutral) return;
  const result = SurvivorNeutral.reward(state.neutral,type,{...neutralPowers(),cloverAcquired:type==='acquire' && state.upgrades[cardId]===1 && UPGRADES.some(c=>c.id===cardId && c.effects.some(e=>e.feature==='item-clover'))},GAME_DATA.neutralRules,Math.random(),cardId);
  Object.assign(state.neutral,result.next);
  for (const event of result.events) {
    if (event.type==='bomb-dropped') {const bomb=cardBlock('item-candy','onDeath').actions[0];if(state.neutral.bombs.length<bomb.limit)state.neutral.bombs.push({x,y,timer:bomb.delay});}
    if (event.type==='heal') { state.player.health=Math.min(maxPlayerHealth(),state.player.health+event.amount);addHealEffect();updateHud(); }
    if (event.type==='bank-grown') skillVisual('card',state.player.x,state.player.y-25,{text:'item-bank',color:'#ffd879',life:.6});
    if (event.type==='item-acquired') { state.rerollsRemaining+=event.rerolls; }
  }
}
function neutralCopyShot(source,angle,damage,fragment) {
  if (state.projectiles.length>=PROJECTILE_LIMIT) return;
  const speed = Math.hypot(source.vx,source.vy);
  state.projectiles.push(takeFromPool(state.projectilePool,{...source,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,damage,hitList:source.hitList.slice(),alive:true,bigBubble:fragment?false:source.bigBubble,fragment}));
}
function prepareNeutralShots(angle) {
  const volley=state.projectiles.filter(s=>s.alive && !s.maker && s.x===state.player.x && s.y===state.player.y);
  const rule=cardBlock('item-rear','onShot');
  if (effectLevel('item-rear') && SurvivorEffectBlocks.matches(rule.conditions[0],{count:volley.length})) for(let i=0;i<rule.actions[0].count;i++) neutralCopyShot(volley[0],angle+rule.actions[0].angle,volley[0].damage*rule.actions[0].multiplier,false);
}
// 碰撞不遞迴、不跳電；兩隻共用短冷卻。死亡仍由正式傷害入口結算。
function waveNeutralHit(target,vx,vy) {
  if (!effectLevel('item-wall')) return;
  const rule=cardBlock('item-wall','onWaveHit'), collision=rule.actions[1];
  if (!SurvivorEffectBlocks.matches(rule.conditions[0],{boss:target===state.boss,alive:target.alive,attackable:canAttackTarget(target),length:Math.hypot(vx,vy)})) return;
  const x=target.x,y=target.y;
  shiftTarget(target,x-vx,y-vy,rule.actions[0].distance);
  skillVisual('splash',target.x,target.y,{radius:24,color:'#71d9f2',life:.3});
  target.slideWave=true;
}
function splitNeutralShot(shot) {
  const rule=cardBlock('item-split','onShotHit'),action=rule.actions[0];
  if (!effectLevel('item-split') || !SurvivorEffectBlocks.matches(rule.conditions[0],shot)) return;
  // 同一顆穿透水球最多分裂一次；碎片不繼續分裂。
  shot.fragment=true;
  const angle=Math.atan2(shot.vy,shot.vx);
  for (let i=0;i<action.count;i++) neutralCopyShot(shot,angle+(i===0?-1:1)*action.angle,shot.damage*action.multiplier,true);
  skillVisual('sparkle',shot.x,shot.y,{radius:25,color:'#fff0a0',life:.3});
}
function neutralBirdPosition() {
  const a=state.neutral.birdAngle,r=cardBlock('item-bird','onBirdTick').actions[0].radius;
  return {x:state.player.x+Math.cos(a)*r,y:state.player.y+Math.sin(a)*r};
}
function updateNeutralItems(dt) {
  const n=state.neutral;if(!n) return;
  const bird=cardBlock('item-bird','onBirdTick'),bombRule=cardBlock('item-candy','onBombDue');
  n.birdAngle=(n.birdAngle+dt*bird.actions[0].speed)%(Math.PI*2);n.birdTimer=Math.max(0,n.birdTimer-dt);
  if (effectLevel('item-bird') && n.birdTimer<=0) {
    const pos=neutralBirdPosition(),target=combatTargets().filter(t=>SurvivorEffectBlocks.matches(bird.conditions[0],{dx:deltaX(t.x,pos.x),dy:deltaY(t.y,pos.y),r:t.r})).sort((a,b)=>Math.hypot(deltaX(a.x,pos.x),deltaY(a.y,pos.y))-Math.hypot(deltaX(b.x,pos.x),deltaY(b.y,pos.y)))[0];
    if (target) { n.birdTimer=bird.interval;skillVisual('gust',pos.x,pos.y,{x2:target.x,y2:target.y,color:'#ffd879',life:.2});hitBuildTarget(target,bird.actions[1].amount,{source:pos}); }
  }
  if (state.mode!=='playing') return;
  // 先移除到期炸彈，再處理傷害；連鎖掉落只在下次更新倒數。
  const due=[];
  for(let i=n.bombs.length-1;i>=0;i--) {n.bombs[i].timer-=dt;if(n.bombs[i].timer<=0) due.push(n.bombs.splice(i,1)[0]);}
  for(const bomb of due) {
    skillVisual('splash',bomb.x,bomb.y,{radius:bombRule.conditions[0].radius,color:'#ffc269',life:.4});playSound('explosion');
    for(const t of combatTargets()) { if(SurvivorEffectBlocks.matches(bombRule.conditions[0],{dx:deltaX(t.x,bomb.x),dy:deltaY(t.y,bomb.y),r:t.r})) hitBuildTarget(t,bombRule.actions[0].amount,{source:bomb});if(state.mode!=='playing') return; }
  }
}
function drawNeutralItems() {
  return SurvivorArt.paint('layer/draw-neutral-items', null, () => drawNeutralItemsPlaceholder.apply(this, arguments));
}
function drawNeutralItemsPlaceholder() {
  if (!state.neutral) return;
  const p=state.player;
  if (effectLevel('item-bird')) {const pos=neutralBirdPosition();SurvivorIcons.draw(ctx,'item-bird',pos.x-12,pos.y-12,24);}
  for(const bomb of state.neutral.bombs) SurvivorIcons.draw(ctx,'item-candy',bomb.x-12,bomb.y-12,24+Math.sin(bomb.timer*20)*2);
  if (effectLevel('item-magnet')) {
    const radius=GEM_PULL_RADIUS*cardBlock('item-magnet','onPickup').actions[0].multiplier*cardBlock('wind-light','onPickup').actions[0].multiplier*cardBlock('gem-magnet','onPickup').actions[0].multiplier;
    ctx.save();ctx.globalAlpha=.25;ctx.strokeStyle='#e5c77d';ctx.lineWidth=1;ctx.beginPath();ctx.arc(p.x,p.y,radius,0,Math.PI*2);ctx.stroke();ctx.restore();
  }
  ['crown','bank','clover','cookie'].filter(id=>effectLevel('item-'+id)).forEach((id,i)=>{
    SurvivorIcons.draw(ctx,'item-'+id,p.x-28+i*18,p.y-p.r-30,16);
    if(id==='bank'||id==='cookie') {ctx.fillStyle='#fff1b9';ctx.font='10px sans-serif';ctx.fillText(String(id==='bank'?Math.round(cardBlock('item-bank','onPickup',{gems:state.neutral.gems}).actions[0].bonus*100)+'%':state.neutral.kills%cardBlock('item-cookie','onDeath').conditions[0].every),p.x-28+i*18,p.y-p.r-32);}
  });
}
