// 只繪製鏡頭可能看見的相鄰世界；包含影子、落點、粒子和招式。
// 每邊大於可見範圍 2.5 倍，同一個身體不會同時出現在畫面兩側。
function visibleWorldOffsets() {
  if(state.trial)return [{x:0,y:0}];
  const axis = (camera, visible, size) => {
    const offsets = [0], margin = 1024;
    if (camera < margin) offsets.push(-size);
    if (camera + visible > size - margin) offsets.push(size);
    return offsets;
  };
  const result = [];
  for (const x of axis(state.cameraX, state.width, state.worldWidth))
    for (const y of axis(state.cameraY, state.height, state.worldHeight)) result.push({ x, y });
  return result;
}

function render() {
  if(document.body)document.body.classList.toggle('boss-trial',!!state.trial);
  SurvivorArt.lookup("scene/world");
  updateCamera();
  const glowGems=state.gems.filter(item=>item.alive).length<=80;
  ctx.save();
  if(state.zoom) {
    ctx.setTransform(state.pixelRatio*state.zoom,0,0,state.pixelRatio*state.zoom,state.viewLeft*state.pixelRatio,state.viewTop*state.pixelRatio);
  }
  ctx.clearRect(0, 0, state.width, state.height);
  ctx.save();
  const camera=SurvivorFeedback.camera(state.trauma,state.juiceClock||state.elapsed,gameSettings.vibration);
  if(camera.rotation){ctx.translate(state.width/2,state.height/2);ctx.rotate(camera.rotation);ctx.translate(-state.width/2,-state.height/2);}
  ctx.translate(-state.cameraX+camera.x,-state.cameraY+camera.y);
  drawClassroom();
  if(state.trial)globalThis.Survivor.render.gallery.drawTrialArena();
  drawBossZone();
  for (const offset of visibleWorldOffsets()) {
  ctx.save(); ctx.translate(offset.x, offset.y);
    drawBossMoves();
    drawFields();
    drawSkillVisuals('ground');
    if (state.schoolCombat) {
      for (const rod of state.schoolCombat.rods) { ctx.fillStyle='#d8b7ff';ctx.fillRect(rod.x-2,rod.y-25,4,25);drawBolt(rod.x-6,rod.y-27,rod.x+6,rod.y-15); }
      if (state.schoolCombat.rain > 0) { ctx.strokeStyle='#75d7ff';ctx.lineWidth=2;for(let i=0;i<24;i++){const x=state.cameraX+(i*73)%state.width,y=state.cameraY+(state.elapsed*180+i*51)%state.height;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-3,y+10);ctx.stroke();} }
    }
    drawEncounterGround();
    drawPacingWarnings();
    drawPhasedAttacks();
    drawSupportVisuals();
    drawNeutralItems();
    for (const shot of state.projectiles) {
      if (!shot.alive) continue;
      drawProjectileArt(shot);
    }
    for (const gem of state.gems) {
      drawGemArt(gem,glowGems);
    }
    for (const shot of state.enemyShots) {
      drawEnemyShotArt(shot);
    }
    if(state.trial&&state.trial.actors)globalThis.Survivor.render.gallery.drawTrialBodies();
    if (state.boss && !(state.trial&&state.trial.actors)) {
      const b = state.boss, x = b.x, y = b.y;
      const hop = Math.abs(Math.sin(b.wobble)) * 2 + bossAirHeight();
      if(b.pursuing) {ctx.fillStyle='#54bfff';for(const side of [-1,1]) {ctx.beginPath();ctx.ellipse(x+side*39,y-35+Math.sin(b.wobble)*4,3,7,.3*side,0,Math.PI*2);ctx.fill();}}
      drawGroundShadow(x, y, b.r, hop);
      const scale = b.r / 32,trialArt=state.trial&&state.trial.definition.artId;
      if(trialArt&&SurvivorArt.lookup(trialArt).renderId){
        const move=state.bossMoves[0],animation=b.impactFlash?'hurt':move?move.ai.phase:'idle',fit=Math.min(1/(state.zoom||1),Math.max(.1,(state.height/2-14)/(116*2.5)));
        ctx.save();ctx.translate(x,y-hop);ctx.scale(fit*2.5,fit*2.5);SurvivorArt.drawCharacter(trialArt,{context:ctx,animation,elapsed:state.elapsed,flash:!!b.impactFlash});ctx.restore();
      }else drawOutlinedSprite(ctx, teacherPicture(b.impactFlash || b.flash && !b.meleeFlash || state.bossShout > 0), ...SurvivorArt.bounds(trialArt||'character/teacher',x - 26 * scale, y - hop - 34 * scale, 52 * scale, 68 * scale,{displayScale:scale}),undefined,SurvivorArt.lookup(trialArt||'character/teacher').outline);
      drawBossWeakpoints(b,hop);
      if(b.posture && (b.posture.stun>0 || b.posture.value>=GAME_DATA.boss.posture.maximum*.75)) {
        const weak=b.posture.stun>0;ctx.fillStyle=weak?'#fff0a5':'#ffb95c';
        ctx.fillRect(x-18,y-hop-66,36,36);SurvivorIcons.draw(ctx,weak?'weakpoint':'posture',x-14,y-hop-62,28);
      }
      if(!state.trial){ctx.fillStyle = "#293d51"; ctx.font = "bold 13px system-ui"; ctx.textAlign = "center"; ctx.fillText(state.bossShout > 0 ? "安靜！" : b.pursuing ? "快走追上！" : `${GAME_DATA.boss.name} · ${state.bossPhase}階段`, x, y + 52);}
    }
    for (const hazard of state.enemyHazards) {
      if (hazard.owner) { ctx.fillStyle='rgba(74,46,39,.22)'; ctx.beginPath(); ctx.arc(hazard.x,hazard.y,hazard.r,0,Math.PI*2); ctx.fill(); }
      ctx.strokeStyle = "#c8354b"; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(hazard.x, hazard.y, hazard.r, 0, Math.PI * 2); ctx.stroke();
      ctx.font = "18px system-ui"; ctx.fillStyle = "#c8354b"; ctx.fillText("注意！", hazard.x - 24, hazard.y);
    }
    for (const field of state.makerFields) { ctx.strokeStyle = "#7b54be"; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(field.x, field.y, field.effect.radius, 0, Math.PI * 2); ctx.stroke(); }
    for (const enemy of state.enemies) {
      const a=enemy.phaseAttack,phase=a&&a.phase;
      const windup=phase==='windup' || !!(enemy.action && enemy.action.warning>0) || enemy.shotWarning>0, recovery=phase==='recovery';
      const progress=phase==='windup'?1-a.left/Math.max(.001,SurvivorTiming.segments(a.config)[0].seconds):windup?1-(enemy.shotWarning || enemy.action.warning)/Math.max(.001,enemy.action&&enemy.action.kind==='blast'?GAME_DATA.pacing.fuseSeconds:GAME_DATA.pacing.warning):0;
      const squash=enemy.impactSquash>0?Math.min(.3,enemy.impactSquash*2):windup?.18*progress:0;
      const jitter=windup?Math.sin(state.elapsed*85)*2*progress:0;
      const tint=enemy.impactFlash?'#ffffff':phase==='active'&&a.entered?'#ffffff':windup?'#ef8890':recovery?'#939da7':undefined;
      ctx.save();ctx.translate(enemy.x+jitter,enemy.y);ctx.scale(1+squash,1-squash);ctx.translate(-enemy.x,-enemy.y);
      drawBlob(enemy.x, enemy.y, enemy.r, enemy.color, enemy.wobble, !!enemy.impactFlash || enemy.flash>0 && !enemy.meleeFlash, enemy.typeId, ctx, enemy.shadowSize, enemy.airHeight || 0, enemy.spriteId,tint,enemy.stunTimer>0?'stun':enemy.impactFlash?'hurt':phase || 'run',state.elapsed*(enemy.weightStep||1),{...actorArtContext(enemy,a),heavy:enemy.heavy,displayScale:enemy.r/((ENEMY_TYPES.find(e=>e.id===enemy.typeId)||{}).radius||enemy.r)});
      ctx.restore();
      if(windup || recovery) drawAttackMarker(enemy,windup?'!':'star');
      drawEncounterArmor(enemy);
      if (enemy.hp < enemy.maxHp) { ctx.fillStyle = "#fff"; ctx.fillRect(enemy.x - 15, enemy.y - enemy.r - 10, 30, 4); ctx.fillStyle = "#f16b68"; ctx.fillRect(enemy.x - 15, enemy.y - enemy.r - 10, 30 * enemy.hp / enemy.maxHp, 4); }
    }
    for (const target of combatTargets()) drawTargetStatus(target);
    if (state.bomb || state.bombBlast) {
      const bubble = state.bomb || state.bombBlast;
      const radius = state.bomb ? 24 + (1 - bubble.timer / bubble.delay) * 12 : bubble.radius * (1 - bubble.life / 0.35);
      ctx.fillStyle = "rgba(110,225,255,.25)"; ctx.strokeStyle = "#43aee9"; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(bubble.x, bubble.y, radius, 0, Math.PI * 2); ctx.fill(); SurvivorNeon.stroke(ctx,'blue');
      if (state.bomb) { ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(bubble.x, bubble.y, bubble.radius, 0, Math.PI * 2); SurvivorNeon.stroke(ctx,'blue'); }
    }
    if (state.dashTimer > 0) { ctx.strokeStyle = "#83eaff"; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(state.player.x, state.player.y); ctx.lineTo(state.player.x - state.dashX * 45, state.player.y - state.dashY * 45); SurvivorNeon.stroke(ctx,'blue'); }
    if (state.bombBlast && state.bombBlast.schools) for (const [index, school] of state.bombBlast.schools.entries()) {
      ctx.strokeStyle = BUILD_TUNING[school].color; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(state.bombBlast.x, state.bombBlast.y, state.bombBlast.radius * (1 - state.bombBlast.life / .35) + 8 + index * 9, 0, Math.PI * 2); SurvivorNeon.stroke(ctx,'blue');
    }
    drawUltimate();
    drawSkillVisuals('actor');drawSurvivalWeapons();drawSurvivalAbilities();
    for (const shot of state.projectiles) if (shot.boosted) {
      ctx.strokeStyle="#fff4a0";ctx.lineWidth=4;ctx.beginPath();ctx.arc(shot.x,shot.y,shot.r+5,0,Math.PI*2);SurvivorNeon.stroke(ctx,'blue');
    }
    for (const g of state.dashGhosts) {
      ctx.save(); ctx.globalAlpha = g.life / .22 * .25;
      ctx.translate(g.x-state.player.x,g.y-state.player.y); drawHero();ctx.restore();
    }
    drawHero(); drawHeldWeapon();
    for (const effect of state.effects) {
      drawParticleArt(effect);
    }
    drawSkillVisuals('overlay');
  ctx.restore();
  }
  ctx.restore(); // 搖桿是螢幕座標，不跟著鏡頭捲動。
  drawWaveEventWarning();
  drawBossGuide();
  drawBossZoneGuide();
  if (state.mode === "transition") {
    ctx.fillStyle = "rgba(20,35,49,.78)"; ctx.fillRect(0, 0, state.width, state.height);
    ctx.fillStyle = "#fff3cc"; ctx.font = "bold 28px system-ui"; ctx.textAlign = "center";
    ctx.fillText(`第${state.stageIndex + 1}關：${SurvivorRoutes.name()}`, state.width/2, state.height/2);
  }
  ctx.restore();
  ctx.save();
  if(state.zoom)ctx.setTransform(state.pixelRatio,0,0,state.pixelRatio,0,0);
  if(state.trial&&globalThis.Survivor.render.gallery.drawTrialHud)globalThis.Survivor.render.gallery.drawTrialHud();
  if (state.joy) {
    const radius = GAME_DATA.joystick.radius;
    const inset = joystickBounds(state.screenWidth||state.width, state.screenHeight||state.height, radius).minX;
    const scale = Math.min(1, inset / (radius + 19));
    ctx.globalAlpha = .42; ctx.strokeStyle = "#173f62"; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(state.joy.baseX, state.joy.baseY, (radius + 11) * scale, 0, Math.PI * 2); ctx.stroke(); ctx.fillStyle = "#4186be"; ctx.beginPath(); ctx.arc(state.joy.baseX + state.joy.x * radius * scale, state.joy.baseY + state.joy.y * radius * scale, 19 * scale, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
  }
  ctx.restore();
  for(const e of [state.player,...combatTargets()]) e.impactFlash=0;
}

// Live accessors preserve shared state and the legacy globals used by preview/VM callers.
globalThis.Survivor.render = globalThis.Survivor.render || {};
globalThis.Survivor.render.world = globalThis.Survivor.render.world || {};
Object.defineProperties(globalThis.Survivor.render.world, {
  drawBossZone: { enumerable: true, get: () => drawBossZone },
  bossZoneGuide: { enumerable: true, get: () => bossZoneGuide },
  drawBossZoneGuide: { enumerable: true, get: () => drawBossZoneGuide },
  drawGroundShadow: { enumerable: true, get: () => drawGroundShadow },
  drawLandingShadow: { enumerable: true, get: () => drawLandingShadow },
  bossAirHeight: { enumerable: true, get: () => bossAirHeight },
  drawBossMoves: { enumerable: true, get: () => drawBossMoves },
  BACKGROUND_TILES: { enumerable: true, get: () => BACKGROUND_TILES },
  backgroundTile: { enumerable: true, get: () => backgroundTile },
  drawClassroom: { enumerable: true, get: () => drawClassroom },
  drawHero: { enumerable: true, get: () => drawHero },
  drawBlob: { enumerable: true, get: () => drawBlob },
  strokeRing: { enumerable: true, get: () => strokeRing },
  drawBolt: { enumerable: true, get: () => drawBolt },
  drawSwirl: { enumerable: true, get: () => drawSwirl },
  drawFields: { enumerable: true, get: () => drawFields },
  drawTargetStatus: { enumerable: true, get: () => drawTargetStatus },
  drawSupportVisuals: { enumerable: true, get: () => drawSupportVisuals },
  drawSkillVisuals: { enumerable: true, get: () => drawSkillVisuals },
  drawUltimate: { enumerable: true, get: () => drawUltimate },
  visibleWorldOffsets: { enumerable: true, get: () => visibleWorldOffsets },
  render: { enumerable: true, get: () => render },
  bossGuide: { enumerable: true, get: () => bossGuide },
  drawBossGuide: { enumerable: true, get: () => drawBossGuide }
});
