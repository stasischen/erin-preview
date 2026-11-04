// Survival slots, offers and lifecycle. Legacy Maker and manual trials keep their old abilities.
globalThis.SurvivorAbilities=(()=>{
  function enabled(){return !!state.loadout&&!!state.abilities&&!state.trial;}
  function initialize(){state.abilities={secrets:[],active:null,misses:0,effects:[],shield:null,linger:0};}
  function level(id){const a=state.abilities;return a?(a.active?.id===id?a.active.level:a.secrets.find(s=>s.id===id)?.level||0):0;}
  function counts(){return SurvivorSchools.counts(UPGRADES.filter(c=>c.tier!=='ultimate'),state.upgrades);}
  function eligible(id){const c=SurvivorAbilityCatalog.get(id),a=state.abilities;if(!enabled()||!a||!c||level(id)>=5)return false;
    if(c.ability==='active')return !a.active||a.active.id===id;
    return level(id)>0 || a.secrets.length<2&&(counts()[c.school]||0)>=3&&(!state.schoolRun||state.schoolRun.schools.includes(c.school));
  }
  function choices(){return SurvivorAbilityCatalog.all.filter(c=>eligible(c.id)).map(c=>({...c,description:c.shape.join('；'),rarity:c.ability==='secret'?'epic':'rare',maxLevel:5}));}
  function acquire(id){if(!eligible(id))return false;const c=SurvivorAbilityCatalog.get(id),a=state.abilities;
    if(c.ability==='active'){if(a.active)a.active.level++;else a.active={id,level:1};}
    else {const slot=a.secrets.find(s=>s.id===id);if(slot)slot.level++;else a.secrets.push({id,level:1,timer:.3});}
    return true;
  }
  function guarantee(cards,excluded){
    if(!enabled())return cards;
    const a=state.abilities;
    if(!excluded.length)a.guaranteed=a.misses>=2;
    const legal=choices().filter(c=>!(state.rewardPicking&&state.rewardPicked.includes(c.id))),fresh=legal.filter(c=>!excluded.includes(c.id)),pool=fresh.length?fresh:legal;
    if(a.guaranteed&&pool.length&&!cards.some(c=>c.ability)){
      const chosen=pool[Math.floor(Math.random()*pool.length)],index=cards.some(c=>!c.weaponId)?cards.findIndex(c=>!c.weaponId):cards.length-1;
      if(index>=0)cards[index]=chosen;else if(cards.length<3)cards.push(chosen);
    }
    // Only a new upgrade screen counts. Reroll neither advances nor clears the guarantee.
    if(!excluded.length)a.misses=cards.some(c=>c.ability)?0:a.misses+1;
    return cards;
  }
  function settings(id,n){const c=SurvivorAbilityCatalog.get(id),row=SurvivorAbilityCatalog.level(id,n);
    return {...row,damage:row.damage*(c.ability==='active'?gameSettings.bombDamage:PROJECTILE_DAMAGE),radius:row.radius*(c.ability==='active'?gameSettings.bombRadius/SURVIVOR_DEFAULTS.tuning.bombRadius:BUILD_TUNING.fieldRadius/SURVIVOR_DEFAULTS.build.fieldRadius),cooldown:row.cooldown*(c.ability==='active'?gameSettings.bombCooldown:BUILD_TUNING.ultimateSeconds/10)};
  }
  function cooldown(){const a=state.abilities?.active;return a?settings(a.id,a.level).cooldown:gameSettings.bombCooldown;}
  function name(){const a=state.abilities?.active;return a?SurvivorAbilityCatalog.get(a.id).name:'泡泡炸彈';}
  function cast(){const a=state.abilities?.active;if(!enabled()||!a)return false;if(state.mode!=='playing'||state.skillCooldown>0)return true;
    state.skillCooldown=cooldown();SurvivorAbilityActions.start(a.id,a.level);triggerMakerEffects('skill',state.player.x,state.player.y);playSound('water');updateActionControls();return true;
  }
  function tick(dt){if(!enabled()||!state.abilities)return;
    for(const s of state.abilities.secrets){s.timer-=dt;if(s.timer<=0){s.timer+=settings(s.id,s.level).cooldown;SurvivorAbilityActions.start(s.id,s.level);}if(state.mode!=='playing')return;}
    SurvivorAbilityActions.tick(dt);
  }
  function absorb(damage){return enabled()?SurvivorAbilityActions.absorb(damage):damage;}
  function haste(){return enabled()?Math.max(1,...state.abilities.effects.filter(e=>e.kind==='frenzy').map(e=>e.haste)):1;}
  function speed(){return enabled()?SurvivorAbilityActions.speed():1;}
  function lure(enemy){return enabled()?SurvivorAbilityActions.lure(enemy):state.player;}
  function summary(id,current){const c=SurvivorAbilityCatalog.get(id),next=settings(id,current+1),old=current?settings(id,current):null;
    const n=v=>Math.round(v*10)/10,parts=[next.shape];
    const damaging=!['shield','garden','frenzy'].includes(c.kind)&&(c.kind!=='clone'||next.level>=3)&&(c.kind!=='fortress'||next.level>=5);
    const amount=row=>['ice','magnet'].includes(c.kind)?row.damage*.35:row.damage;
    if(damaging)parts.push(`${['ice','magnet','orbit'].includes(c.kind)?'每次脈衝':'基礎傷害'} ${old?n(amount(old))+' → ':''}${n(amount(next))}`);
    if(c.kind==='fortress'&&next.level>=5)parts.push('結束爆破另加剩餘盾量');
    if(['ice','magnet'].includes(c.kind)&&next.level>=(c.kind==='ice'?5:3))parts.push(`結束爆破 ${n(next.damage)}`);
    if(next.shield)parts.push(`承傷量 ${old?n(old.shield)+' → ':''}${n(next.shield)}`);
    if(next.heal)parts.push(`每秒回復 ${old?n(old.heal)+' → ':''}${n(next.heal)}`);
    if(next.haste>1)parts.push(`攻擊節奏 ${old?n(old.haste)+' → ':''}${n(next.haste)}倍`);
    parts.push(`間隔 ${old?n(old.cooldown)+' → ':''}${n(next.cooldown)}秒`);
    return parts.join('；')+(c.ability==='active'?'。首次選擇後，本局固定這條大招路線。':'。佔用 1 個秘技槽。');
  }
  return {enabled,initialize,level,counts,eligible,choices,acquire,guarantee,settings,cooldown,name,cast,tick,absorb,haste,speed,lure,summary};
})();
Survivor.engine.abilities=SurvivorAbilities;
