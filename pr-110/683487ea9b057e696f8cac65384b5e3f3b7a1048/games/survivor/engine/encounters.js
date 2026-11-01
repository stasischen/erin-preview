// 精英與小頭目共用普通怪的攻擊、碰撞、影子與環形世界。
function resetEncounters() {
  state.eliteTimer = GAME_DATA.elites.interval;
  state.bearSpawned = false; state.miniboss = null;
  state.syrup = []; state.splitQueue = []; state.jellyQueue=[]; resetPacing();
  state.rewardChoices = 0; state.rewardPicking = false; state.rewardPicked = [];
}
function encounterDistance(a, b) { return Math.hypot(deltaX(a.x,b.x),deltaY(a.y,b.y)); }
function eliteSpeed(enemy) {
  return state.enemies.some(e => e.alive && e.elite === 'haste' && encounterDistance(e,enemy) < GAME_DATA.elites.auraRadius) ? GAME_DATA.elites.auraSpeed : 1;
}
function syrupSpeed() {
  return state.syrup.some(s => s.warning <= 0 && encounterDistance(s,state.player) < s.r + state.player.r) ? GAME_DATA.elites.syrupSlow : 1;
}
function makeElite(enemy) {
  const cfg = GAME_DATA.elites;
  enemy.elite = cfg.abilities[Math.floor(Math.random()*cfg.abilities.length)];
  enemy.hp *= cfg.healthScale; enemy.maxHp = enemy.hp;
  enemy.shield = enemy.elite === 'shield' ? cfg.shieldHits : 0;
  enemy.abilityTimer = enemy.elite === 'teleport' ? cfg.teleportInterval : cfg.syrupInterval;
  enemy.teleport = null;
}
function spawnChocobear() {
  if (state.enemies.length >= ENEMY_LIMIT) return false;
  const b = GAME_DATA.chocobear, position = b.position==='zone'?bossZoneSpawn(b.radius+16):offscreenSpawn(b.radius + 16,SurvivorPacing.side(b.position));
  if (!position) return false;
  const hp = b.hp * currentStage().enemyHealthScale;
  const bear = { ...position, miniboss:true, typeId:ENEMY_TYPES[0].id, spriteId:'chocolate-bear',
    r:b.radius, speed:b.speed, damage:b.damage, hp, maxHp:hp, armor:b.armor,
    maxArmor:b.armor, alive:true, flash:0, wobble:0, shadowSize:1.1,
    shotCooldown:Infinity, slamTimer:b.slamInterval, behavior:'chase' };
  state.enemies.push(bear); state.miniboss = bear; state.bearSpawned = true;
  if(b.sound!=='none') playSound('warning');if(b.hint) {enemyNotice.textContent=b.name+'來了！';enemyNotice.hidden=false;state.bookNoticeTimer=4;} updateHud(); return true;
}
// 回傳 true 代表這下被護盾／盔甲擋住；破甲這下不穿透到本體。
function encounterShield(enemy, damage) {
  if (enemy.fairyShield > 0) { enemy.fairyShield--; enemy.flash=HIT_FLASH_SECONDS; return true; }
  if (enemy.shield > 0) {
    enemy.shield--; enemy.flash = HIT_FLASH_SECONDS;
    burst(enemy.x,enemy.y,enemy.shield ? '#d9f9ff' : '#fff0c8',enemy.shield ? 3 : 18);
    return true;
  }
  if (enemy.armor > 0) {
    const absorbed = Math.min(enemy.armor,damage); enemy.armor = Math.max(0,enemy.armor-damage);
    enemy.flash = HIT_FLASH_SECONDS; damageNumber(enemy,absorbed);
    if (!enemy.armor) burst(enemy.x,enemy.y,'#fff0c8',22);
    updateHud(); return true;
  }
  return false;
}
function encounterDefeated(enemy) {
  splitJelly(enemy);
  if (enemy.elite) {
    // 直接給經驗獎勵，不受寶石數量上限影響；在安全的 tick 邊界開選卡。
    state.xp += GAME_DATA.elites.rewardXp;
    skillVisual("sparkle",enemy.x,enemy.y,{radius:28,color:"#ffe19a",life:.5});
    if (enemy.elite === 'split') for (let i=0;i<3 && state.splitQueue.length<18;i++) state.splitQueue.push(enemy.typeId);
  }
  if (enemy.miniboss) {
    state.miniboss = null; state.rewardChoices += 2;
    state.enemyHazards = state.enemyHazards.filter(h => h.owner !== enemy);
    updateHud();
  }
}
function updateEncounters(dt) {
  const c = GAME_DATA.elites, b = GAME_DATA.chocobear;
  while(state.jellyQueue.length && state.enemies.filter(e=>e.alive).length<ENEMY_LIMIT) {
    const child=state.jellyQueue.shift();spawnEnemy({small:true,typeId:child.typeId,position:child});
  }
  if (!PREVIEW_MODE && c.enabled && !state.boss) {
    state.eliteTimer = countdown(state.eliteTimer,dt);
    if (!state.eliteTimer) {
      state.eliteTimer = c.interval;
      if (state.enemies.filter(e => e.alive && e.elite).length < c.limit && Math.random() < c.chance) {for(let i=0;i<(c.count||1);i++) spawnEnemy({elite:true,typeId:c.typeId==='pacing'?undefined:c.typeId,side:SurvivorPacing.side(c.position,i),offscreen:c.position==='random'});if(c.sound==='warning') playSound('warning');if(c.hint) {enemyNotice.textContent='精英怪靠近了！';enemyNotice.hidden=false;state.bookNoticeTimer=2;}}
    }
  }
  // 分裂的小怪也在畫面外進場；滿額／無安全位置時保留佇列。
  while (state.splitQueue.length && state.enemies.length < ENEMY_LIMIT) {
    if (!spawnEnemy({small:true,typeId:state.splitQueue[0]})) break;
    state.splitQueue.shift();
  }
  if (!PREVIEW_MODE && b.enabled && !state.bearSpawned && !state.boss && state.stageElapsed >= gameSettings.waveSeconds*b.stageFraction) spawnChocobear();
  state.syrup = state.syrup.filter(s => (s.life -= dt) > 0);
  for (const s of state.syrup) s.warning = countdown(s.warning,dt);
  for (const enemy of state.enemies) {
    if (!enemy.alive) continue;
    if (enemy.miniboss) {
      // 畫面外不攻擊；回到畫面內至少休息一次，重擊不會突然落下。
      if (!targetVisible(enemy) || state.bossIntro > 0) {
        enemy.slamTimer = b.slamInterval;
        state.enemyHazards = state.enemyHazards.filter(h => h.owner !== enemy);
      } else {
        enemy.slamTimer = countdown(enemy.slamTimer,dt);
        if (!enemy.slamTimer && !(enemy.stunTimer > 0) && state.enemyHazards.length < 8) {
          const h = {x:state.player.x,y:state.player.y,r:b.slamRadius,warning:b.slamWarning,damage:b.slamDamage,owner:enemy,dodged:false};
          state.enemyHazards.push(h); enemy.slamTimer = b.slamInterval + b.slamWarning; playSound('warning');
        }
      }
    }
    if (!enemy.elite || enemy.stunTimer > 0) continue;
    enemy.abilityTimer = countdown(enemy.abilityTimer,dt);
    if (enemy.elite === 'syrup' && !enemy.abilityTimer) {
      if (state.syrup.length >= 48) state.syrup.shift();
      state.syrup.push({x:enemy.x,y:enemy.y,r:c.syrupRadius,warning:.6,life:c.syrupSeconds+.6});
      enemy.abilityTimer = c.syrupInterval;
    }
    if (enemy.elite === 'teleport') {
      if (!targetVisible(enemy)) { enemy.teleport = null; enemy.abilityTimer = c.teleportInterval; continue; }
      if (enemy.teleport) {
        enemy.teleport.warning = countdown(enemy.teleport.warning,dt);
        if (!enemy.teleport.warning) {
          // 玩家可能走向落點；太近就取消，不能直接貼臉碰撞。
          if (encounterDistance(enemy.teleport,state.player) > enemy.r + state.player.r + 40) {
            enemy.x = enemy.teleport.x; enemy.y = enemy.teleport.y; clampToMap(enemy);
            burst(enemy.x,enemy.y,'#dfc9ff',12);
          }
          enemy.teleport = null; enemy.abilityTimer = c.teleportInterval;
        }
      } else if (!enemy.abilityTimer) {
        const angle = Math.random()*Math.PI*2;
        const point = {x:state.player.x+Math.cos(angle)*c.teleportDistance,y:state.player.y+Math.sin(angle)*c.teleportDistance,r:enemy.r,warning:c.teleportWarning};
        clampToMap(point);
        if (targetVisible(point)) { enemy.teleport = point; playSound('warning'); }
        else enemy.abilityTimer = c.teleportInterval;
      }
    }
  }
}
function openEncounterReward() {
  if (state.rewardChoices > 0) { state.rewardPicking = true; chooseUpgradeCards(); return true; }
  if (state.xp >= experienceNeeded()) { grantExperience(0); return true; }
  return false;
}
function drawEncounterGround() {
  return SurvivorArt.paint('layer/draw-encounter-ground', null, () => drawEncounterGroundPlaceholder.apply(this, arguments));
}
function drawEncounterGroundPlaceholder() {
  for (const s of state.syrup) {
    ctx.fillStyle = s.warning > 0 ? 'rgba(192,134,62,.15)' : 'rgba(167,103,49,.48)';
    ctx.strokeStyle = '#bc843e'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(s.x,s.y,s.r,s.r*.7,0,0,Math.PI*2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#fff1c1'; ctx.fillRect(s.x-5,s.y-3,6,3);
  }
  for (const e of state.enemies) {
    if (!e.alive || !e.elite) continue;
    ctx.fillStyle = e.shotWarning > 0 ? '#b84958' : '#72512c';
    ctx.font = 'bold 12px system-ui'; ctx.textAlign = 'center';
    ctx.fillText(e.shotWarning > 0 ? '準備出招' : SurvivorData.ELITE_ABILITIES[e.elite],e.x,e.y-e.r-22);
    const haste = e.elite === 'haste';
    ctx.strokeStyle = haste ? 'rgba(92,190,128,.6)' : 'rgba(255,222,117,.8)';
    ctx.lineWidth = 3+Math.sin(state.elapsed*5);
    ctx.beginPath(); ctx.arc(e.x,e.y,haste ? GAME_DATA.elites.auraRadius : e.r+7,0,Math.PI*2); ctx.stroke();
    if (e.teleport) {
      ctx.globalAlpha = .4+.6*Math.abs(Math.sin(e.teleport.warning*18));
      ctx.strokeStyle = '#8e55b1'; ctx.lineWidth = 4;
      for (const point of [e,e.teleport]) { ctx.beginPath(); ctx.arc(point.x,point.y,e.r+12,0,Math.PI*2); ctx.stroke(); }
      ctx.globalAlpha = 1;
    }
  }
}
function drawEncounterArmor(e) {
  return SurvivorArt.paint('layer/draw-encounter-armor', null, () => drawEncounterArmorPlaceholder.apply(this, arguments));
}
function drawEncounterArmorPlaceholder(e) {
  if (!(e.shield > 0 || e.armor > 0 || e.fairyShield > 0)) return;
  ctx.strokeStyle = '#d7f9ff'; ctx.lineWidth = e.miniboss ? 5 : 3;
  ctx.beginPath(); ctx.arc(e.x,e.y,e.r+3,0,Math.PI*2); ctx.stroke();
  ctx.fillStyle = '#fff0c8';
  const count = e.miniboss ? Math.ceil(6*e.armor/e.maxArmor) : (e.shield || e.fairyShield);
  for(let i=0;i<count;i++) ctx.fillRect(e.x-e.r+i*8,e.y-e.r-8,5,5);
}
globalThis.Survivor.engine.encounters = {resetEncounters,updateEncounters,spawnChocobear,makeElite,encounterShield,encounterDefeated,openEncounterReward,eliteSpeed,syrupSpeed,drawEncounterGround,drawEncounterArmor};

resetEncounters();
