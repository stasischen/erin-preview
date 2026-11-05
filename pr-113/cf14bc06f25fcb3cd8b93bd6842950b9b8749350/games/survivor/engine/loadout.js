// Only survival owns multiple weapons. Each slot has independent cadence, combo and charge.
globalThis.SurvivorLoadout=(()=>{
  const keys=['weaponId','shotTimer','weaponAttack','swingCount','attackRecovery','lastWeaponAttack'];
  function initialize(){SurvivorAbilities.initialize();state.loadout=[];state.weaponEffects=[];acquire('water-ball');}
  function owned(id){return state.loadout?.find(w=>w.weaponId===id);}
  function acquire(id){const slot=owned(id);if(slot){slot.level=Math.min(5,slot.level+1);return;}if(!state.loadout||state.loadout.length>=3)return;state.loadout.push({weaponId:id,level:1,shotTimer:0,weaponAttack:null,swingCount:0,attackRecovery:0,lastWeaponAttack:null});}
  function withWeapon(slot,fn){
    const previous=Object.fromEntries(keys.map(k=>[k,state[k]])), context=state.weaponContext,stage=state.stageIndex;
    for(const key of keys)state[key]=slot[key];state.weaponContext=slot;
    try{return fn();}finally{if(state.stageIndex===stage){for(const key of keys)slot[key]=state[key];Object.assign(state,previous);}state.weaponContext=context;}
  }
  function config(){return state.weaponContext?SurvivorWeaponCatalog.level(state.weaponContext.weaponId,state.weaponContext.level):null;}
  function interval(){const row=config();if(!row)return null;const w=activeWeapon();return row.interval*(w.kind==='melee'?w.interval/SurvivorWeaponCatalog.level(w.id,1).interval:SHOT_INTERVAL/SURVIVOR_DEFAULTS.tuning.shotInterval);}
  function definition(id){const original=GAME_DATA.weapons.find(w=>w.id===id);return original || {...GAME_DATA.weapons[0],...SurvivorWeaponCatalog.get(id),kind:'ranged'};}
  function choices(){return state.loadout?SurvivorWeaponCatalog.all.filter(w=>owned(w.id)?owned(w.id).level<5:state.loadout.length<3).map(w=>({id:w.id,weaponId:w.id,name:w.name,icon:w.icon,description:w.note,rarity:'common',slot:'weapon'})):[];}
  function charge(dt){for(const slot of state.loadout)if(SurvivorWeaponCatalog.get(slot.weaponId).handler==='original')withWeapon(slot,()=>{state.weaponAttack=SurvivorEffectBlocks.attackTick(state.weaponAttack,activeWeapon(),dt,state.player.moving,teacherBonuses().charge);});}
  function tick(dt){
    SurvivorWeaponAttacks.tick(dt);if(state.mode!=='playing')return;
    for(const slot of state.loadout){
      slot.shotTimer-=dt;if(slot.shotTimer>0||state.player.feedbackFrozen)continue;
      withWeapon(slot,()=>{const w=SurvivorWeaponCatalog.get(slot.weaponId);if(w.handler==='original')fireAtNearest();else SurvivorWeaponAttacks.fire(slot);state.shotTimer=effectiveShotInterval()+(state.attackRecovery||0);state.attackRecovery=0;});
      if(state.mode!=='playing')return;
    }
  }
  function guarantee(cards,excluded=[]){
    const legal=choices().filter(c=>!(state.rewardPicking&&state.rewardPicked.includes(c.id))), fresh=legal.filter(c=>!excluded.includes(c.id)), pool=fresh.length?fresh:legal;
    if(!pool.length)return cards;
    const weapon=pool[Math.floor(Math.random()*pool.length)], result=[weapon,...cards.filter(c=>c.id!==weapon.id)].slice(0,3);
    for(const c of pool)if(result.length<3&&!result.some(x=>x.id===c.id))result.push(c);return result;
  }
  function wave(event){
    const row=config(), innate=row?.wave||0, level=effectLevel('splash-water');if(!innate&&!level)return;
    if(!event.heavy && (activeWeapon().comboEnabled||activeWeapon().chargeEnabled))return;
    const block=cardBlock('splash-water','onShotHit',{damage:event.damage}), sword=activeWeapon().id==='candy-sword';
    const radius=event.radius+Math.max(innate,level?block.conditions[0].radius:0), count=sword?(row?.branches||1):1;
    const waves=Array.from({length:count},(_,i)=>({...event,thrust:sword,arc:Math.PI*2,radius,angle:event.angle+(i-(count-1)/2)*.35}));
    for(const w of waves)skillVisual('weapon-wave',state.player.x,state.player.y,{angle:w.angle,radius,width:w.width,thrust:sword,life:.35});
    for(const t of combatTargets())if(waves.some(w=>SurvivorWeapons.intersects(deltaX(t.x,state.player.x),deltaY(t.y,state.player.y),t.r,w))){hitBuildTarget(t,block.actions[0].amount,{source:state.player});if(state.mode!=='playing')return;}
  }
  return {initialize,owned,acquire,withWeapon,config,interval,definition,choices,charge,tick,guarantee,wave};
})();

Survivor.engine=Survivor.engine||{};Survivor.engine.loadout=SurvivorLoadout;
