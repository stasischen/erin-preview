// 高度只影響繪圖，地面座標仍供碰撞、鏡頭和預警使用。
// Erin 可以改：影子寬度是身體半徑的倍率；越高，影子越小、越淡。
function drawGroundShadow(x, y, r, height = 0, size = .9, drawingContext = ctx) {
  return SurvivorArt.paint('layer/draw-ground-shadow', null, () => drawGroundShadowPlaceholder.apply(this, arguments));
}
function drawGroundShadowPlaceholder(x, y, r, height = 0, size = .9, drawingContext = ctx) {
  const air = Math.max(0, Math.min(1, height / 70));
  drawingContext.save();
  drawingContext.fillStyle = "rgba(25,34,43," + (.24 - air * .14) + ")";
  drawingContext.beginPath();
  drawingContext.ellipse(x, y + r * .85, r * size * (1 - air * .45), r * .27 * (1 - air * .45), 0, 0, Math.PI * 2);
  drawingContext.fill(); drawingContext.restore();
}
// progress 從 0 到 1：落地前逐漸擴大。紅色預警另外畫，仍表示真正傷害範圍。
function drawLandingShadow(x, y, r, progress, drawingContext = ctx) {
  return SurvivorArt.paint('layer/draw-landing-shadow', null, () => drawLandingShadowPlaceholder.apply(this, arguments));
}
function drawLandingShadowPlaceholder(x, y, r, progress, drawingContext = ctx) {
  const remainingHeight = 70 * (1 - Math.max(0, Math.min(1, progress)));
  drawGroundShadow(x, y - r * .85, r, remainingHeight, .9, drawingContext);
}
// 把不透明輪廓染成深色後快取；每幀只畫四個偏移，不讀取像素或使用濾鏡。
const OUTLINE_MASKS = new WeakMap();
const SPRITE_TINTS = new WeakMap();
function drawOutlinedSprite(g, sprite, x, y, w, h, tint, outline) {
  return SurvivorArt.paint('layer/draw-outlined-sprite', null, () => drawOutlinedSpritePlaceholder.apply(this, arguments));
}
function drawOutlinedSpritePlaceholder(g, sprite, x, y, w, h, tint, outline) {
  if(tint) {
    let colors=SPRITE_TINTS.get(sprite);
    if(!colors) {colors={};SPRITE_TINTS.set(sprite,colors);}
    if(!colors[tint]) {
      const mask=document.createElement('canvas');mask.width=sprite.width;mask.height=sprite.height;
      const ink=mask.getContext('2d');ink.drawImage(sprite,0,0);ink.globalCompositeOperation='source-in';ink.fillStyle=tint;ink.fillRect(0,0,mask.width,mask.height);colors[tint]=mask;
    }
    sprite=colors[tint];
  }
  if (GAME_DATA.visuals.spriteOutline && outline!==false) {
    const color=outline&&outline.color||"#26313c",width=outline&&outline.width!==undefined?outline.width:1;
    let masks=OUTLINE_MASKS.get(sprite);if(!masks){masks={};OUTLINE_MASKS.set(sprite,masks);}
    let mask = masks[color];
    if (!mask) {
      mask = document.createElement("canvas"); mask.width = sprite.width; mask.height = sprite.height;
      const ink = mask.getContext("2d"); ink.drawImage(sprite, 0, 0);
      ink.globalCompositeOperation = "source-in"; ink.fillStyle = color;
      ink.fillRect(0, 0, mask.width, mask.height); masks[color]=mask;
    }
    for (const [dx,dy] of [[-1,0],[1,0],[0,-1],[0,1]]) if(width>0)g.drawImage(mask, x+dx*width, y+dy*width, w, h);
  }
  g.drawImage(sprite, x, y, w, h);
}
function actorArtContext(body,action,timing) {
  const aim=body===state.player?{x:state.faceX,y:state.faceY}:action&&Number.isFinite(action.angle)?{x:Math.cos(action.angle),y:Math.sin(action.angle)}:Number.isFinite(body.facingAngle)?{x:Math.cos(body.facingAngle),y:Math.sin(body.facingAngle)}:{x:deltaX(state.player.x,body.x),y:deltaY(state.player.y,body.y)};
  return {aim,...SurvivorArt.phaseContext(action,timing)};
}
function bossArtContext(move) {
  const d=bossDefinition(move),kind=bossKind(move),phase=move.recovery>0?'recovery':move.active?'active':'windup';
  const active=['dash','combo'].includes(kind)?Math.hypot(deltaX(move.endX,move.x),deltaY(move.endY,move.y))/d.speed:move.wallDuration||d.duration;
  const timing={windup:kind==='tracking'?GAME_DATA.boss.combat.trackingSeconds+GAME_DATA.boss.combat.lockSeconds:Math.max(.6,d.warning),active,recovery:kind==='leap'?Math.max(GAME_DATA.boss.combat.leapRecovery,d.recovery||0):d.recovery};
  return actorArtContext(state.boss||state.player,{phase,left:phase==='windup'?move.warning:phase==='recovery'?move.recovery:move.life,angle:move.angle},timing);
}
const TEACHER_PICTURES = {};
function teacherPicture(flash) {
  if(state.trial)return trialPicture();
  const move=state.bossMoves[0];
  const animation=flash?'hurt':state.boss && state.boss.posture && state.boss.posture.stun>0?'stun':move?(move.recovery>0?'recovery':move.active?'active':'windup'):'idle';
  const context=move?bossArtContext(move):actorArtContext(state.boss||state.player);
  if(flash)context.tint='#ffffff';
  const replacement = SurvivorArt.picture('character/teacher', animation, state.elapsed,context);
  if (replacement) return replacement;
  const key = flash ? "flash" : "normal";
  if (TEACHER_PICTURES[key]) return TEACHER_PICTURES[key];
  const picture = document.createElement("canvas"); picture.width = 52; picture.height = 68;
  const g = picture.getContext("2d");
  g.fillStyle = "#3e2e35"; g.fillRect(6,1,40,10); g.fillRect(1,11,8,19);
  g.fillStyle = flash ? "#fff" : "#ffd7ad"; g.fillRect(7,12,38,29);
  g.fillStyle = "#263c5b"; g.fillRect(2,41,48,25);
  g.fillRect(9,22,13,9); g.fillRect(30,22,13,9); g.fillRect(22,25,8,3);
  g.fillStyle = "#fff"; g.fillRect(1,48,15,11); g.fillRect(36,48,15,11);
  TEACHER_PICTURES[key] = picture; return picture;
}

function drawHero() {
  return SurvivorArt.paint('layer/draw-hero', null, () => drawHeroPlaceholder.apply(this, arguments));
}
function drawHeroPlaceholder() {
  const p = state.player;
  // 遊戲時間暫停時，彈跳與受傷閃爍也一起停下來。
  const hurt = p.invincible > 0;
  const hop = (p.moving ? Math.abs(Math.sin(p.walkPhase)) * 2 : 0) + (p.airHeight || 0);
  const sway = p.moving ? Math.sin(p.walkPhase) * 0.055 : 0;
  drawGroundShadow(p.x, p.y, p.r, hop);
  ctx.save(); ctx.translate(Math.round(p.x), Math.round(p.y));
  if(p.perfectFlash>0) {ctx.fillStyle='#fff5a3';for(const [dx,dy] of [[-22,0],[22,0],[0,-24],[0,24]])ctx.fillRect(dx-3,dy-3,6,6);ctx.strokeStyle='#fff5a3';ctx.lineWidth=4;ctx.beginPath();ctx.arc(0,0,p.r+8,0,Math.PI*2);ctx.stroke();}
  if (hurt && p.hitFlash <= 0 && Math.floor(state.elapsed / 0.09) % 2 === 0) ctx.globalAlpha = 0.45;
  ctx.translate(0, -Math.round(hop)); ctx.rotate(sway); ctx.scale(SurvivorArt.lookup('character/player').directions>1?1:p.facing, 1);
  const look = buildAppearance(), color = BUILD_TUNING[look.main].color;
  if (look.forms.length || state.schoolCombat && state.schoolCombat.bubble || schoolWindWall()) {
    ctx.strokeStyle = state.schoolCombat && state.schoolCombat.bubble ? '#b4efff' : color; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(0,0,schoolWindWall() ? cardBlock('wind-eye','onStill').actions[0].radius : p.r+9,0,Math.PI*2); ctx.stroke();
  }
  if (look.forms.includes('wind')) {
    ctx.fillStyle=BUILD_TUNING.wind.color;
    for (const side of [-1,1]) { ctx.beginPath();ctx.moveTo(side*14,-5);ctx.lineTo(side*32,-18);ctx.lineTo(side*27,5);ctx.closePath();ctx.fill(); }
  }
  if (look.forms.includes('thunder')) {
    ctx.fillStyle='#f8eea8';for(let i=0;i<4;i++){const a=state.elapsed*3+i*Math.PI/2;ctx.fillRect(Math.cos(a)*29,Math.sin(a)*29,4,4);}
  }
  if (look.forms.includes('water')) ctx.globalAlpha *= .65;
  const action=state.manualTiming,context=actorArtContext(p,action);
  const stunned=p.stunTimer>0||p.posture&&p.posture.stun>0;
  const animation = stunned ? 'stun' : hurt ? 'hurt' : state.dashTimer>0?'dodge':action&&['windup','active','recovery'].includes(action.phase)?action.phase:p.moving ? 'run' : 'idle';
  if (!SurvivorArt.drawCharacter('character/player',{context:ctx,x:-20,y:-30,width:40,height:48,animation,elapsed:state.elapsed,...context,worldScale:SurvivorArtManifest.assets['character/player'].worldScale,groundOffset:p.r*.85,flash:!!p.impactFlash})) {
    const art = SurvivorArt.picture('character/player', animation, state.elapsed,context);
    const sprite = SPRITES.player;
    if (art) {
      const box=SurvivorArt.bounds('character/player',-20,-30,40,48);
      drawOutlinedSprite(ctx,art,...box,p.impactFlash?'#ffffff':undefined,SurvivorArt.lookup('character/player').outline);
    }
    else if (sprite) drawOutlinedSprite(ctx, sprite, -p.r, -p.r, p.r * 2, p.r * 2,p.impactFlash?'#ffffff':undefined);
    else {
      // 原生 20×24、放大兩倍：尖葉在上，身體仍以碰撞圓為中心。
      ctx.imageSmoothingEnabled = false;
      drawOutlinedSprite(ctx, heroSchoolPicture(hurt, look.bodyColors), -20, -30, 40, 48,p.impactFlash?'#ffffff':undefined);
    }
  }
  if (look.bodyColors.includes('thunder')) {
    // 第一張雷卡就帶火花；變身後原有的環繞光點仍保留。
    ctx.fillStyle=BUILD_TUNING.thunder.color;
    for (const side of [-1,1]) {
      const y=Math.round(Math.sin(state.elapsed*6+side)*5);
      ctx.fillRect(side*24-1,y-2,2,6);ctx.fillRect(side*24-3,y,6,2);
    }
  }
  ctx.restore();
}

function drawBlob(x, y, r, color, bounce, flash, enemyId = "jaben", drawingContext = ctx, shadowSize, height = 0, spriteId, tint, animation = 'idle', seconds = 0, artContext = {}) {
  return SurvivorArt.paint('layer/draw-blob', null, () => drawBlobPlaceholder.apply(this, arguments));
}
function drawBlobPlaceholder(x, y, r, color, bounce, flash, enemyId = "jaben", drawingContext = ctx, shadowSize, height = 0, spriteId, tint, animation = 'idle', seconds = 0, artContext = {}) {
  const size = shadowSize === undefined ? ((ENEMY_TYPES.find(e => e.id === enemyId) || {}).shadowSize || .9) : shadowSize;
  const hop = Math.abs(Math.sin(bounce)) * (artContext.heavy?.6:2) + height;
  drawGroundShadow(x, y, r, hop, size, drawingContext);
  drawingContext.save(); drawingContext.translate(x, y - hop);
  if(artContext.heavy){const squash=Math.max(0,Math.cos(bounce))* .075+(flash?.035:0);drawingContext.scale(1+squash,1-squash);}
  const artId='character/'+(spriteId || (ENEMY_TYPES.find(e => e.id === enemyId) || {}).spriteId);
  if(SurvivorArt.drawCharacter(artId,{context:drawingContext,x:-r,y:-r,width:r*2,height:r*2,animation,elapsed:seconds,...artContext,flash,tint})) {drawingContext.restore();return;}
  const sprite = spriteId ? null : SPRITES[enemyId];
  if (sprite) {
    drawOutlinedSprite(drawingContext, sprite, -r, -r, r * 2, r * 2, flash ? "#ffffff" : tint); drawingContext.restore(); return;
  }
  const skin = SurvivorMonsters.picture(artId.slice(10), animation, seconds, artContext);
  if (skin) {
    drawingContext.imageSmoothingEnabled = false;
    drawOutlinedSprite(drawingContext, skin, ...SurvivorArt.bounds(artId,-r,-r,r*2,r*2,artContext), flash ? "#ffffff" : tint,SurvivorArt.lookup(artId)&&SurvivorArt.lookup(artId).outline); drawingContext.restore(); return;
  }
  if (flash) drawingContext.globalAlpha = 0.55 + Math.abs(Math.sin(performance.now() / 25)) * 0.45;
  drawingContext.fillStyle = flash ? "#fff" : tint || color; drawingContext.strokeStyle = "#87522f"; drawingContext.lineWidth = 3;
  drawingContext.beginPath();
  drawingContext.rect(-r * .82, -r * .8, r * 1.64, r * 1.6); drawingContext.fill(); drawingContext.stroke();
  drawingContext.fillStyle = "#f0bb80"; drawingContext.fillRect(-r * .5, -r * .55, r, r * .28);
  drawingContext.globalAlpha = 1;
  drawingContext.fillStyle = "#fff"; drawingContext.beginPath(); drawingContext.arc(-r * .3, -r * .12, r * .23, 0, Math.PI * 2); drawingContext.arc(r * .3, -r * .12, r * .23, 0, Math.PI * 2); drawingContext.fill();
  drawingContext.fillStyle = "#243746"; drawingContext.beginPath(); drawingContext.arc(-r * .27, -r * .1, r * .1, 0, Math.PI * 2); drawingContext.arc(r * .33, -r * .1, r * .1, 0, Math.PI * 2); drawingContext.fill();
  drawingContext.strokeStyle = "#243746"; drawingContext.lineWidth = 1.7; drawingContext.beginPath(); drawingContext.arc(0, r * .17, r * .16, .15, Math.PI - .15); drawingContext.stroke();
  drawingContext.restore();
}



// Module accessors; legacy global functions and world facade remain unchanged.
globalThis.Survivor.render = globalThis.Survivor.render || {};
globalThis.Survivor.render['actors'] = globalThis.Survivor.render['actors'] || {};
Object.defineProperties(globalThis.Survivor.render['actors'], {
  drawGroundShadow: { enumerable: true, get: () => drawGroundShadow },
  drawGroundShadowPlaceholder: { enumerable: true, get: () => drawGroundShadowPlaceholder },
  drawLandingShadow: { enumerable: true, get: () => drawLandingShadow },
  drawLandingShadowPlaceholder: { enumerable: true, get: () => drawLandingShadowPlaceholder },
  drawOutlinedSprite: { enumerable: true, get: () => drawOutlinedSprite },
  drawOutlinedSpritePlaceholder: { enumerable: true, get: () => drawOutlinedSpritePlaceholder },
  actorArtContext: { enumerable: true, get: () => actorArtContext },
  bossArtContext: { enumerable: true, get: () => bossArtContext },
  teacherPicture: { enumerable: true, get: () => teacherPicture },
  drawHero: { enumerable: true, get: () => drawHero },
  drawHeroPlaceholder: { enumerable: true, get: () => drawHeroPlaceholder },
  drawBlob: { enumerable: true, get: () => drawBlob },
  drawBlobPlaceholder: { enumerable: true, get: () => drawBlobPlaceholder },
  OUTLINE_MASKS: { enumerable: true, get: () => OUTLINE_MASKS },
  SPRITE_TINTS: { enumerable: true, get: () => SPRITE_TINTS },
  TEACHER_PICTURES: { enumerable: true, get: () => TEACHER_PICTURES }
});
