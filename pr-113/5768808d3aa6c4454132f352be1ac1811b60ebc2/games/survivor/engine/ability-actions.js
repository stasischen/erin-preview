// World effects own their hit sets. Secondary/periodic hits never trigger hit-card chains.
globalThis.SurvivorAbilityActions=(()=>{
  const distance=(a,b)=>Math.hypot(deltaX(a.x,b.x),deltaY(a.y,b.y));
  const targets=()=>combatTargets();
  const ordinary=t=>t!==state.boss&&!t.trialActor&&!t.miniboss&&!t.elite;
  const effects=()=>state.abilities.effects;
  function add(base,kind,extra={}){if(state.mode!=='playing'||!state.abilities||effects().length>=48)return;const e={...base,kind,age:0,clock:0,hits:new Set(),...extra};effects().push(e);return e;}
  function slow(t,seconds=.8){t.slowTimer=Math.max(t.slowTimer||0,seconds);t.makerSlow=BUILD_TUNING.slowMultiplier;}
  function area(e,damage=e.damage,push=0,seen=new Set()){
    for(const t of targets())if(!seen.has(t)&&distance(t,e)<=e.radius+t.r){seen.add(t);if(damage)hitBuildTarget(t,damage,{source:e});if(state.mode!=='playing')return;if(push)shiftTarget(t,e.x,e.y,push,true);}
  }
  function ring(e,extra={}){return add(e,'ring',{duration:.45,...extra});}
  function burstArea(e,damage=e.damage,push=0){area(e,damage,push);ring(e);}
  function attackAll(){for(const slot of state.loadout||[]){SurvivorLoadout.withWeapon(slot,()=>{if(SurvivorWeaponCatalog.get(slot.weaponId).handler==='original')fireAtNearest();else SurvivorWeaponAttacks.fire(slot);});if(state.mode!=='playing')return;}}
  function strongest(e){return targets().filter(t=>distance(t,e)<=e.radius+t.r).sort((a,b)=>(b.maxHp||b.hp)-(a.maxHp||a.hp));}
  function start(id,level){
    const c=SurvivorAbilityCatalog.get(id),s=SurvivorAbilities.settings(id,level),p=state.player;
    const b={...s,id,school:c.school,x:p.x,y:p.y,angle:Math.atan2(state.faceY||0,state.faceX||1)};
    const list=strongest({...b,radius:Math.max(300,b.radius)}),target=list[0]||p;
    if(c.kind==='wave'){const phases={out:new Set(),back:new Set()};for(let i=0;i<(level>=3?2:1);i++)add(b,'wave',{angle:b.angle+i*Math.PI,duration:1.3,returning:level>=5,phases});}
    else if(c.kind==='orbit')add(b,'orbit',{count:level>=5?3:level>=3?2:1});
    else if(c.kind==='cloud'||c.kind==='judgment'){
      const chosen=list.slice(0,c.kind==='cloud'?(level>=3?2:1):1),jumped=new Set(chosen);
      for(const t of chosen){add({...b,x:t.x,y:t.y},'strike',{target:t,delay:.25,duration:.7,jump:level>= (c.kind==='cloud'?5:3),reserved:chosen,jumped});}
      if(c.kind==='judgment'&&level>=5&&chosen[0])add({...b,x:chosen[0].x,y:chosen[0].y},'strike',{target:chosen[0],delay:1,duration:1.5,jump:true,reserved:chosen});
    }else if(c.kind==='ice'||c.kind==='meteor'){
      const count=level>=3?3:1;
      for(let i=0;i<count;i++){const t=list[i]||target,a=i*Math.PI*2/count;
        add({...b,x:t.x+(i&&list.length<count?Math.cos(a)*b.radius:0),y:t.y+(i&&list.length<count?Math.sin(a)*b.radius:0)},c.kind,{delay:c.kind==='meteor'?.55+i*.5:0,duration:c.kind==='meteor'?1+i*.5:b.duration,shatter:level>=5});}
      if(c.kind==='meteor'&&level>=5)add({...b,x:target.x,y:target.y,radius:b.radius*1.6,damage:b.damage*1.6},'meteor',{delay:2.2,duration:2.8});
    }else if(c.kind==='shield'||c.kind==='fortress'){
      // A stronger fresh shield replaces a weaker one; shields never stack into permanent immunity.
      const e=add(b,c.kind,{remaining:b.shield});
      if(c.kind==='fortress'&&level>=3)burstArea(b,0,gameSettings.bombKnockback);
      if(e&&(!state.abilities.shield||state.abilities.shield.remaining<e.remaining))state.abilities.shield=e;
    }else if(c.kind==='magnet'||c.kind==='clone'){
      for(let i=0;i<(level>=5?2:1);i++)add({...b,x:p.x+Math.cos(b.angle+i*Math.PI)*80,y:p.y+Math.sin(b.angle+i*Math.PI)*80},c.kind,{phase:i});
    }else if(c.kind==='garden')add(b,'garden');
    else if(c.kind==='tide'){
      burstArea(b,b.damage,gameSettings.bombKnockback);
      for(let i=1;i<(level>=5?3:level>=3?2:1);i++)add({...b,radius:b.radius*(1+i*.45)},'tide',{delay:i*.45,duration:i*.45+.5});
    }else if(c.kind==='corridor'){
      add(b,'corridor');
      const seen=new Set();for(const t of targets())if(inCorridor(t,b)){seen.add(t);hitBuildTarget(t,b.damage,{source:b});if(state.mode!=='playing')return;shiftTarget(t,p.x,p.y,gameSettings.bombKnockback,true);}
    }else if(c.kind==='freeze'){
      add(b,'freeze');for(const t of targets())if(distance(t,b)<=b.radius+t.r){if(ordinary(t))t.stunTimer=Math.max(t.stunTimer||0,b.duration);else slow(t,b.duration);hitBuildTarget(t,b.damage,{source:b});if(state.mode!=='playing')return;}
    }else if(c.kind==='frenzy'){add(b,'frenzy');if(level>=3)attackAll();}
  }
  function inCorridor(t,e){return SurvivorSchools.segmentDistance(deltaX(t.x,e.x),deltaY(t.y,e.y),Math.cos(e.angle)*e.range,Math.sin(e.angle)*e.range)<=e.radius+(t.r||0);}
  function shieldEnded(e,broken){
    if(e.ended)return;e.ended=true;
    if(state.abilities.shield===e)state.abilities.shield=null;
    if(e.kind==='shield'&&broken){if(e.level>=3)burstArea({...e,x:state.player.x,y:state.player.y},0,gameSettings.bombKnockback);if(e.level>=5)add({...e,x:state.player.x,y:state.player.y},'slow',{duration:3});}
    if(e.kind==='fortress'&&e.level>=5)burstArea({...e,x:state.player.x,y:state.player.y},e.damage+Math.max(0,e.remaining));
  }
  function absorb(damage){if(damage<=0)return damage;const s=state.abilities.shield;if(!s||s.ended)return damage;const taken=Math.min(damage,s.remaining);s.remaining-=taken;if(s.remaining<=0){shieldEnded(s,true);s.age=s.duration;}return damage-taken;}
  function speed(){return effects().some(e=>e.kind==='corridor'&&e.level>=3&&inCorridor(state.player,e))?1.35:1;}
  function lure(enemy){return effects().find(e=>e.kind==='clone'&&ordinary(enemy)&&distance(enemy,e)<=e.radius&&(e.level<5||Math.floor(e.age)%2===e.phase))||state.player;}
  function finish(e){
    if(e.kind==='ice'&&e.shatter||e.kind==='magnet'&&e.level>=3||e.kind==='clone'&&e.level>=3)burstArea(e);
    if(e.kind==='shield'||e.kind==='fortress')shieldEnded(e,false);
    if(e.kind==='freeze'){if(e.level>=3)burstArea(e);if(e.level>=5)add(e,'slow',{duration:3});}
    if(e.kind==='frenzy'&&e.level>=5)attackAll();
  }
  function tick(dt){
    const a=state.abilities;let inGarden=false;
    for(const e of [...effects()]){
      e.age+=dt;e.clock-=dt;
      if(e.kind==='wave'){
        const phase=e.age/e.duration,travel=260*(e.returning&&phase>.5?(1-phase)*2:phase*(e.returning?2:1));
        e.hits=e.returning&&phase>.5?e.phases.back:e.phases.out;
        const q={...e,x:e.x+Math.cos(e.angle)*travel,y:e.y+Math.sin(e.angle)*travel,radius:e.radius*.55};e.drawX=q.x;e.drawY=q.y;area(q,e.damage,12,e.hits);
      }else if(e.kind==='strike'&&e.age>=e.delay&&!e.fired){
        e.fired=true;const t=e.target;if(t&&canAttackTarget(t)&&(t.alive!==false)&&distance(t,e)<e.radius){e.x=t.x;e.y=t.y;hitBuildTarget(t,e.damage,{source:e});if(state.mode!=='playing')return;
          if(e.jump){const other=targets().find(o=>o!==t&&!e.reserved.includes(o)&&!e.jumped?.has(o)&&distance(o,t)<140);if(other){e.jumped?.add(other);hitBuildTarget(other,e.damage*.55,{source:e});ring({...e,x:other.x,y:other.y,radius:28});}}}
      }else if((e.kind==='meteor'||e.kind==='tide')&&e.age>=e.delay&&!e.fired){e.fired=true;burstArea(e,e.damage,e.kind==='tide'?gameSettings.bombKnockback:0);}
      else if(e.kind==='orbit'){
        const radius=70+(e.level>=5?(1-Math.cos(e.age*2))*35:0);e.points=Array.from({length:e.count},(_,i)=>({x:state.player.x+Math.cos(e.age*2+i*Math.PI*2/e.count)*radius,y:state.player.y+Math.sin(e.age*2+i*Math.PI*2/e.count)*radius}));
        if(e.clock<=0){e.clock+=e.pulse;const seen=new Set();for(const q of e.points)area({...e,...q},e.damage,0,seen);}
      }else if(['ice','slow','magnet','garden','corridor'].includes(e.kind)){
        const inZone=t=>e.kind==='corridor'?inCorridor(t,e):distance(t,e)<=e.radius+t.r;
        for(const t of targets())if(inZone(t)){
          if(['ice','slow'].includes(e.kind)||e.kind==='garden'&&e.level>=3)slow(t);
          if(e.kind==='magnet'&&ordinary(t)&&(e.level<5||Math.floor(e.age)%2===e.phase))shiftTarget(t,e.x,e.y,-40*dt);
          if(e.kind==='corridor'&&e.level>=5)shiftTarget(t,t.x-Math.sin(e.angle),t.y+Math.cos(e.angle),35*dt,true);
        }
        if(e.kind==='garden'&&inZone(state.player)){inGarden=true;state.player.health=Math.min(maxPlayerHealth(),state.player.health+e.heal*dt);if(e.level>=5){a.linger=2;a.lingerHeal=e.heal;}}
        if(e.clock<=0&&['ice','magnet'].includes(e.kind)){e.clock+=e.pulse;area(e,e.damage*.35);}
      }
      if(state.mode!=='playing')return;
      if(e.age>=e.duration){effects().splice(effects().indexOf(e),1);finish(e);if(state.mode!=='playing')return;}
    }
    if(!inGarden&&a.linger>0){state.player.health=Math.min(maxPlayerHealth(),state.player.health+a.lingerHeal*Math.min(dt,a.linger));a.linger=Math.max(0,a.linger-dt);}
  }
  return {start,tick,absorb,speed,lure};
})();
Survivor.engine['ability-actions']=SurvivorAbilityActions;
