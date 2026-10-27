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
function bossAirHeight() {
  const leap=state.bossMoves.find(m=>bossKind(m)==='leap' && m.active && !m.recovery);
  if(leap)return Math.sin(Math.PI*Math.max(0,Math.min(1,1-leap.life/bossDefinition(leap).duration)))*100;
  const move = state.bossMoves.find(m => ['dash','combo'].includes(bossKind(m)) && m.active);
  if (!move) return 0;
  const duration = Math.hypot(deltaX(move.endX, move.x), deltaY(move.endY, move.y)) / bossDefinition(move).speed;
  return Math.sin(Math.PI * Math.max(0, Math.min(1, 1 - move.life / Math.max(.001, duration)))) * 28;
}

function drawBossMoves() {
  return SurvivorArt.paint('layer/draw-boss-moves', null, () => drawBossMovesPlaceholder.apply(this, arguments));
}
function bossArtShapes(move) {
  const kind=bossKind(move),d=bossDefinition(move),shape=SurvivorArt.shapeOptions;
  if(['leap','tracking','rain','call'].includes(kind))return move.points.map(p=>shape({type:'circle',radius:p.r},{x:move.x+deltaX(p.x,move.x),y:move.y+deltaY(p.y,move.y)},move.angle));
  if(['ring','cage'].includes(kind)) {
    const radius=!move.active?move.radius:kind==='cage'?move.radius*Math.max(0,move.life/d.duration):Math.hypot(deltaX(ringPoints(move)[0].x,move.x),deltaY(ringPoints(move)[0].y,move.y));
    return [shape({type:kind==='ring'?'ring':'circle',radius,thickness:10,gap:kind==='ring'?d.gap:0},move,move.angle)];
  }
  if(['dash','combo'].includes(kind))return [shape({type:'line',radius:state.boss.r,length:Math.hypot(deltaX(move.endX,move.x),deltaY(move.endY,move.y))},move,move.angle)];
  if(kind==='sniper')return [shape({type:'line',radius:1,length:1400},move,move.angle)];
  if(kind==='barriers')return [-1,1].map(sign=>shape({type:'line',radius:8,length:move.radius*2},{x:move.x+sign*move.wallWidth,y:move.y-move.radius},Math.PI/2));
  if(kind==='wall')return [shape({type:'line',radius:10,length:move.wallHeight},{x:wallX(move),y:move.y},Math.PI/2)];
  if(['words','chalk'].includes(kind))return Array.from({length:move.count},(_,i)=>shape({type:'line',radius:1.5,length:170},move,move.angle+(i-(move.count-1)/2)*d.spread));
  return [shape({type:'circle',radius:50},move,move.angle)];
}
function drawBossMovesPlaceholder() {
  if(state.trial) {drawTrialMoves();return;}
  for (const move of state.bossMoves) {
    // 美術是附加層；判定預警仍依原幾何畫出。
    for(const skin of bossArtShapes(move))SurvivorArt.draw('move/boss-'+move.id,{context:ctx,...skin,animation:move.recovery>0?'recovery':move.active?'active':'windup',time:state.elapsed,...bossArtContext(move)});
    if(move.recovery>0) {
      // 收招時移除危險區，只用像素亮點提示反擊機會。
      ctx.save();ctx.fillStyle='#ffcf49';
      const x=state.boss.x,y=state.boss.y-state.boss.r-20;
      ctx.fillRect(x-2,y,4,14);ctx.fillRect(x-7,y+5,14,4);ctx.restore();continue;
    }
    ctx.save(); ctx.strokeStyle = "#c8354b"; ctx.fillStyle = move.active ? "rgba(220,65,83,.38)" : "rgba(220,65,83,.15)"; ctx.lineWidth = 3;
    if(!move.active)warningFeedback(moveFeedback(bossDefinition(move),'move'),move.warning);
    if(bossKind(move)==='leap' || bossKind(move)==='tracking') {
      const point=move.points[0],x=move.x+deltaX(point.x,move.x),y=move.y+deltaY(point.y,move.y);
      ctx.beginPath();ctx.arc(x,y,point.r,0,Math.PI*2);ctx.fill();ctx.stroke();
      if(move.recovery) {ctx.fillStyle='#ffcf49';ctx.font='bold 25px system-ui';ctx.fillText('★ ★',state.boss.x-25,state.boss.y-65);}
    } else if(bossKind(move)==='sniper') {
      ctx.lineWidth=2;ctx.strokeStyle='#e3394e';ctx.beginPath();ctx.moveTo(move.x,move.y);ctx.lineTo(move.x+Math.cos(move.angle)*1400,move.y+Math.sin(move.angle)*1400);ctx.stroke();
    } else if(bossKind(move)==='barriers') {
      ctx.lineWidth=16;ctx.strokeStyle=move.active?'#31595a':'#e35c6d';
      for(const sign of [-1,1]) {ctx.beginPath();ctx.moveTo(move.x+sign*move.wallWidth,move.y-move.radius);ctx.lineTo(move.x+sign*move.wallWidth,move.y+move.radius);ctx.stroke();}
    } else if (bossKind(move) === "wall") {
      const x = wallX(move); ctx.lineWidth = 20;
      ctx.strokeStyle = move.active ? "#fff5dd" : "rgba(235,83,101,.55)";
      ctx.beginPath(); ctx.moveTo(x,move.y);ctx.lineTo(x,move.y+move.wallHeight);ctx.stroke();
      ctx.lineWidth = 2; ctx.strokeStyle = "#d64c65";ctx.strokeRect(move.x,move.y,move.wallWidth,move.wallHeight);
    } else if (["dash","combo"].includes(bossKind(move))) {
      const endX = move.x + deltaX(move.endX, move.x), endY = move.y + deltaY(move.endY, move.y);
      const duration = Math.hypot(deltaX(move.endX, move.x), deltaY(move.endY, move.y)) / bossDefinition(move).speed;
      drawLandingShadow(endX, endY + state.boss.r * .85, state.boss.r, move.active ? 1 - move.life / Math.max(.001, duration) : 0);
      ctx.lineWidth = state.boss.r * 2; ctx.strokeStyle = "rgba(220,65,83,.18)";
      ctx.beginPath(); ctx.moveTo(move.x, move.y); ctx.lineTo(endX, endY); ctx.stroke();
      ctx.lineWidth = 4; ctx.strokeStyle = "#c8354b"; ctx.beginPath(); ctx.moveTo(move.x, move.y); ctx.lineTo(endX, endY); ctx.stroke();
    } else if (bossKind(move) === "rain" || bossKind(move) === "call") {
      for (const rawPoint of move.points) {
        const point = { ...rawPoint, x: move.x + deltaX(rawPoint.x, move.x), y: move.y + deltaY(rawPoint.y, move.y) };
        if (bossKind(move) === "rain") drawLandingShadow(point.x, point.y, 16, move.active ? 1 : 1 - move.warning / bossDefinition(move).warning);
        ctx.beginPath(); ctx.arc(point.x, point.y, point.r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        if (bossKind(move) === "rain") {
          const height = move.active ? 0 : move.warning / bossDefinition(move).warning * 70;
          ctx.fillStyle = "#fff8dd"; ctx.fillRect(point.x - 12, point.y - height - 16, 24, 30); ctx.strokeRect(point.x - 12, point.y - height - 16, 24, 30);
          ctx.fillStyle = "#713809"; ctx.font = "bold 16px system-ui"; ctx.textAlign = "center"; ctx.fillText("考", point.x, point.y - height + 5);
          ctx.fillStyle = move.active ? "rgba(220,65,83,.38)" : "rgba(220,65,83,.15)";
        }
      }
    } else if (bossKind(move) === "ring" || bossKind(move) === "cage") {
      if (bossKind(move) === "cage") {
        const radius=move.active ? move.radius*Math.max(0,move.life/bossDefinition(move).duration) : move.radius;
        ctx.beginPath();ctx.arc(move.x,move.y,radius,0,Math.PI*2);ctx.fill();ctx.stroke();
      }
      for (const point of ringPoints(move.active ? move : { ...move, life: bossDefinition(move).duration })) {
        ctx.font = "bold 20px system-ui"; ctx.textAlign = "center"; ctx.fillStyle = move.active ? "#b42f54" : "#78626b"; ctx.fillText("字", point.x, point.y + 7);
      }
      if (bossKind(move) === "ring") {
        const radius = move.active ? Math.hypot(deltaX(ringPoints(move)[0].x, move.x), deltaY(ringPoints(move)[0].y, move.y)) : move.radius;
        ctx.strokeStyle = "#16804b"; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(move.x, move.y, radius, move.angle - bossDefinition(move).gap / 2, move.angle + bossDefinition(move).gap / 2); ctx.stroke();
      }
    } else if (bossKind(move) === "words" || bossKind(move) === "chalk") {
      const spread = bossDefinition(move).spread;
      for (let n = 0; n < move.count; n++) {
        const angle = move.angle + (n - (move.count - 1) / 2) * spread;
        ctx.beginPath(); ctx.moveTo(move.x, move.y); ctx.lineTo(move.x + Math.cos(angle) * 170, move.y + Math.sin(angle) * 170); ctx.stroke();
      }
    } else { ctx.beginPath(); ctx.arc(move.x, move.y, 50, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
    if(!moveFeedback(bossDefinition(move),'move').hint){ctx.restore();continue;}
    const name = BOSS_MOVES.find(row => row.id === move.id).name;
    ctx.font = "bold 17px system-ui"; ctx.textAlign = "center"; ctx.strokeStyle = "#fff"; ctx.lineWidth = 4;
    ctx.strokeText(name + (move.active ? "！" : "…"), move.x, move.y - 44); ctx.fillStyle = "#9e253c"; ctx.fillText(name + (move.active ? "！" : "…"), move.x, move.y - 44);
    ctx.restore();
  }
}


const BACKGROUND_TILES = {};
// 84px 大地磚、三個相近色；裝飾是扁平地面刻紋，沒有臉、眼睛或亮點。
function backgroundTile(kind, density) {
  const replacement = SurvivorArt.picture('background/'+kind);
  if (replacement) return replacement;
  if (density === undefined) density = .25;
  const key = density === .25 ? kind : kind + ":" + density;
  if (BACKGROUND_TILES[key]) return BACKGROUND_TILES[key];
  const tile = document.createElement("canvas"); tile.width = 336; tile.height = 252;
  const g = tile.getContext("2d"); g.imageSmoothingEnabled = false;
  const cookie = kind === "cookie-forest" || kind === "playground";
  const colors = cookie ? ["#bcb3a3", "#b7ae9e", "#b2a999"] : ["#a5b1a1", "#a0ac9c", "#9ba797"];
  g.fillStyle = colors[0]; g.fillRect(0, 0, 336, 252);
  // 84 整除四邊；圖案遠離邊緣，拼接線兩側都是同一底色。
  for (let y = 0; y < 252; y += 84) for (let x = 0; x < 336; x += 84) {
    g.fillStyle = colors[1]; g.fillRect(x + 3, y + 3, 78, 78);
  }
  const marks = [[42,42], [210,126], [294,210], [126,42]];
  g.fillStyle = colors[2];
  marks.slice(0, Math.round(density * marks.length)).forEach(([x,y]) => {
    // 只有 12×6 的落葉／餅乾碎屑，遠小於怪物，也不使用寶石的圓形輪廓。
    g.fillRect(x - 6, y - 2, 8, 2); g.fillRect(x - 2, y, 8, 2);
    if (cookie) g.fillRect(x + 3, y + 3, 3, 1);
  });
  BACKGROUND_TILES[key] = tile; return tile;
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

function drawClassroom() {
  return SurvivorArt.paint('layer/draw-classroom', null, () => drawClassroomPlaceholder.apply(this, arguments));
}
function drawClassroomPlaceholder() {
  const tile = backgroundTile(currentStage().background, currentStage().decorationDensity);
  const left = Math.floor(state.cameraX / 336) * 336;
  const top = Math.floor(state.cameraY / 252) * 252;
  for (let y = top; y < state.cameraY + state.height + 16; y += 252)
    for (let x = left; x < state.cameraX + state.width + 16; x += 336) ctx.drawImage(tile, x, y);
}

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
  const animation = hurt ? 'hurt' : state.dashTimer>0?'dodge':action&&['windup','active','recovery'].includes(action.phase)?action.phase:p.moving ? 'run' : 'idle';
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
  const hop = Math.abs(Math.sin(bounce)) * 2 + height;
  drawGroundShadow(x, y, r, hop, size, drawingContext);
  drawingContext.save(); drawingContext.translate(x, y - hop);
  const sprite = spriteId ? null : SPRITES[enemyId];
  if (sprite) {
    drawOutlinedSprite(drawingContext, sprite, -r, -r, r * 2, r * 2, flash ? "#ffffff" : tint); drawingContext.restore(); return;
  }
  const artId='character/'+(spriteId || (ENEMY_TYPES.find(e => e.id === enemyId) || {}).spriteId);
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

// 只用舊版 iPad 也支援的 Canvas API；線寬至少 3px，避免手機上看不見。
function strokeRing(x, y, radius, color, width = 3) {
  return SurvivorArt.paint('layer/stroke-ring', null, () => strokeRingPlaceholder.apply(this, arguments));
}
function strokeRingPlaceholder(x, y, radius, color, width = 3) {
  ctx.strokeStyle = color; ctx.lineWidth = width; ctx.beginPath(); ctx.arc(x, y, Math.max(1, radius), 0, Math.PI * 2); ctx.stroke();
}
function drawBolt(x, y, x2, y2) {
  return SurvivorArt.paint('layer/draw-bolt', null, () => drawBoltPlaceholder.apply(this, arguments));
}
function drawBoltPlaceholder(x, y, x2, y2) {
  const dx = deltaX(x2, x), dy = deltaY(y2, y), length = Math.max(1, Math.hypot(dx, dy));
  x2 = x + dx; y2 = y + dy;
  // 固定折線，不每幀亂跳；暫停時畫面也會完全停住。
  for (const [color, width] of [["#69309b", 7], ["#fff6a0", 3]]) {
    ctx.strokeStyle = color; ctx.lineWidth = width; ctx.beginPath(); ctx.moveTo(x, y);
    for (let i = 1; i < 6; i++) { const offset = (i % 2 ? 1 : -1) * Math.min(12, length * .18); ctx.lineTo(x + dx * i / 6 - dy / length * offset, y + dy * i / 6 + dx / length * offset); }
    ctx.lineTo(x2, y2); ctx.stroke();
  }
}
function drawSwirl(x, y, radius, phase) {
  return SurvivorArt.paint('layer/draw-swirl', null, () => drawSwirlPlaceholder.apply(this, arguments));
}
function drawSwirlPlaceholder(x, y, radius, phase) {
  ctx.strokeStyle = "#23815e"; ctx.lineWidth = 4;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath(); ctx.arc(x, y, radius * (1 - i * .23), phase + i, phase + i + Math.PI * 1.5); ctx.stroke();
  }
}
function drawFields() {
  return SurvivorArt.paint('layer/draw-fields', null, () => drawFieldsPlaceholder.apply(this, arguments));
}
function drawFieldsPlaceholder() {
  for (const field of state.fields) {
    ctx.save();
    ctx.globalAlpha = Math.min(.3, field.life * .6); ctx.fillStyle = BUILD_TUNING[field.school].color;
    ctx.beginPath(); ctx.arc(field.x, field.y, field.radius, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = Math.min(1, field.life * 3);
    if (field.school === "water") {
      strokeRing(field.x, field.y, field.radius, "#237bc2");
      for (let i = -1; i <= 1; i++) { ctx.strokeStyle = "#e5faff"; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(field.x, field.y + i * field.radius * .35, field.radius * .65, 4, 0, 0, Math.PI); ctx.stroke(); }
      if (effectLevel("fusion-puddle")) drawBolt(field.x - field.radius * .5, field.y, field.x + field.radius * .5, field.y);
    } else if (field.school === "wind") drawSwirl(field.x, field.y, field.radius, state.elapsed * 5);
    else {
      strokeRing(field.x, field.y, field.radius, "#23815e"); // 閃電衝刺：風＋雷。
      drawBolt(field.x - field.radius * .6, field.y + 8, field.x + field.radius * .6, field.y - 8);
    }
    ctx.restore();
  }
}
function drawTargetStatus(target) {
  return SurvivorArt.paint('layer/draw-target-status', null, () => drawTargetStatusPlaceholder.apply(this, arguments));
}
function drawTargetStatusPlaceholder(target) {
  ctx.save();
  if (target.slowTimer > 0) {
    ctx.fillStyle = "rgba(45,166,255,.32)"; ctx.beginPath(); ctx.arc(target.x, target.y, target.r + 3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#126fc0";
    for (let i = -1; i <= 1; i++) {
      const y = target.y + target.r + 4 + ((state.elapsed * 18 + i * 4) % 9);
      ctx.beginPath(); ctx.moveTo(target.x + i * 10, y - 5); ctx.lineTo(target.x + i * 10 - 3, y); ctx.arc(target.x + i * 10, y, 3, 0, Math.PI); ctx.fill();
    }
  }
  if (target.stunTimer > 0) {
    ctx.font = "bold 19px system-ui"; ctx.textAlign = "center"; ctx.strokeStyle = "#765013"; ctx.lineWidth = 3; ctx.fillStyle = "#ffe84a";
    for (let i = 0; i < 3; i++) { const a = state.elapsed * 4 + i * Math.PI * 2 / 3, x = target.x + Math.cos(a) * 19, y = target.y - target.r - 17 + Math.sin(a) * 5; ctx.strokeText("★", x, y); ctx.fillText("★", x, y); }
  }
  ctx.restore();
}
function drawSupportVisuals() {
  return SurvivorArt.paint('layer/draw-support-visuals', null, () => drawSupportVisualsPlaceholder.apply(this, arguments));
}
function drawSupportVisualsPlaceholder() {
  const p = state.player;
  ctx.save();
  if (effectLevel("bubble-shield")) { ctx.globalAlpha = .65; strokeRing(p.x, p.y, p.r + 9, "#267dbe"); ctx.globalAlpha = 1; }
  if (effectLevel("gem-magnet")) {
    // 三段吸力弧標示真正的吸取半徑，不用整片光圈遮住敵人。
    const radius = GEM_PULL_RADIUS * (1 + effectLevel("gem-magnet") * UPGRADE_TUNING.magnetPerLevel);
    ctx.strokeStyle = "rgba(130,69,163,.5)"; ctx.lineWidth = 3;
    for (let i = 0; i < 3; i++) { const a = state.elapsed + i * Math.PI * 2 / 3; ctx.beginPath(); ctx.arc(p.x, p.y, radius, a, a + .35); ctx.stroke(); }
  }
  if (p.moving && (effectLevel("onion-dash") || effectLevel("wind-speed"))) {
    ctx.strokeStyle = effectLevel("wind-speed") ? "#23815e" : "#8754ad"; ctx.lineWidth = 3;
    for (const offset of [-10, 0, 10]) { ctx.beginPath(); ctx.moveTo(p.x - state.faceX * 20 - state.faceY * offset, p.y - state.faceY * 20 + state.faceX * offset); ctx.lineTo(p.x - state.faceX * 42 - state.faceY * offset, p.y - state.faceY * 42 + state.faceX * offset); ctx.stroke(); }
  }
  ctx.restore();
}
function drawSkillVisuals(layer) {
  return SurvivorArt.paint('layer/draw-skill-visuals', null, () => drawSkillVisualsPlaceholder.apply(this, arguments));
}
function drawSkillVisualsPlaceholder(layer) {
  for (const v of state.vfx) {
    const art=SurvivorArt.lookup('effect/'+v.kind);
    if(layer&&((art&&art.vfx.zLayer)||'actor')!==layer)continue;
    ctx.save(); ctx.globalAlpha = Math.min(1, v.life / v.maxLife * 2);
    const progress = 1 - v.life / v.maxLife;
    if (SurvivorArt.draw('effect/'+v.kind, {context:ctx,x:v.x-(v.radius||24),y:v.y-(v.radius||24),width:2*(v.radius||24),height:2*(v.radius||24),animation:'active',time:v.maxLife-v.life,phaseElapsed:v.maxLife-v.life,phaseDuration:v.maxLife,radius:v.radius,angle:v.angle||0,origin:{x:v.x,y:v.y},target:Number.isFinite(v.x2)?{x:v.x2,y:v.y2}:undefined})) {ctx.restore();continue;}
    if (v.kind === "hammer-swing") drawHammerSwing(v, progress);
    else if (v.kind === "maker-ring") {
      ctx.lineWidth=5; ctx.strokeStyle="#7b54be"; ctx.beginPath(); ctx.arc(v.x,v.y,v.radius,v.gap/2,Math.PI*2-v.gap/2); ctx.stroke();
      ctx.strokeStyle="#16804b";ctx.beginPath();ctx.arc(v.x,v.y,v.radius,-v.gap/2,v.gap/2);ctx.stroke();
    } else if (v.kind === "lightning") drawBolt(v.x, v.y, v.x2, v.y2);
    else if (v.kind === "gust") {
      const angle = Math.atan2(deltaY(v.y2, v.y), deltaX(v.x2, v.x));
      ctx.translate(v.x, v.y); ctx.rotate(angle); ctx.strokeStyle = v.color; ctx.lineWidth = 4;
      for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(-15 + progress * 20, i * 9); ctx.lineTo(20 + progress * 25, i * 12); ctx.lineTo(13 + progress * 25, i * 12 - 5); ctx.stroke(); }
    } else if (v.kind === "card") {
      strokeRing(v.x, v.y + 38, 22 + progress * 25, v.color);
      SurvivorIcons.draw(ctx, v.text, v.x - 12, v.y - 24 - progress * 20, 24);
    } else if (v.kind === "sparkle") {
      ctx.strokeStyle = "#7737b0"; ctx.lineWidth = 5;
      for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; ctx.beginPath(); ctx.moveTo(v.x + Math.cos(a) * 5, v.y + Math.sin(a) * 5); ctx.lineTo(v.x + Math.cos(a) * v.radius, v.y + Math.sin(a) * v.radius); ctx.stroke(); }
      strokeRing(v.x, v.y, 5, v.color, 4);
    } else {
      strokeRing(v.x, v.y, v.radius * (.25 + progress * .75), v.color, 4);
      if (v.kind === "discharge") {
        for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; drawBolt(v.x + Math.cos(a) * v.radius * .5, v.y + Math.sin(a) * v.radius * .5, v.x + Math.cos(a) * v.radius, v.y + Math.sin(a) * v.radius); }
      } else {
        ctx.fillStyle = "#168cff";
        for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, r = v.radius * progress; ctx.beginPath(); ctx.arc(v.x + Math.cos(a) * r, v.y + Math.sin(a) * r, 4, 0, Math.PI * 2); ctx.fill(); }
      }
    }
    ctx.restore();
  }
}
function drawUltimate() {
  return SurvivorArt.paint('layer/draw-ultimate', null, () => drawUltimatePlaceholder.apply(this, arguments));
}
function drawUltimatePlaceholder() {
  const schools = GAME_DATA.schools.filter(s => effectLevel(s.id+'-ultimate'));
  if (schools.length > 1) { for (const s of schools) drawOneUltimate(state.ultimateVisuals[s.id]); }
  else drawOneUltimate(state.ultimateVisual);
}
function drawOneUltimate(v) {
  return SurvivorArt.paint('layer/draw-one-ultimate', null, () => drawOneUltimatePlaceholder.apply(this, arguments));
}
function drawOneUltimatePlaceholder(v) {
  if (!v) return;
  ctx.save(); ctx.globalAlpha = Math.min(1, v.life * 4);
  if (v.school === "water") {
    // 浪的位置依整張世界地圖前進；移動鏡頭不會把浪黏在螢幕上。
    const x = v.worldWidth * (1 - v.life / 1.2);
    ctx.fillStyle = "rgba(35,123,194,.38)"; ctx.fillRect(x - 130, 0, 150, v.worldHeight);
    ctx.strokeStyle = "#ecfdff"; ctx.lineWidth = 8; ctx.beginPath();
    for (let y = 0; y <= v.worldHeight; y += 14) { const edge = x + Math.sin(y / 24) * 17; if (!y) ctx.moveTo(edge, y); else ctx.lineTo(edge, y); } ctx.stroke();
  } else if (v.school === "wind") {
    // 倒錐形、四層旋轉風圈，和地上小旋風容易區分。
    ctx.fillStyle = "rgba(92,205,158,.35)"; ctx.beginPath(); ctx.moveTo(v.x, v.y + 18); ctx.lineTo(v.x - 45, v.y - 75); ctx.lineTo(v.x + 45, v.y - 75); ctx.closePath(); ctx.fill();
    for (let i = 0; i < 4; i++) drawSwirl(v.x, v.y - i * 22, 14 + i * 10, state.elapsed * 7 + i);
  } else {
    ctx.fillStyle = "#64557e"; ctx.strokeStyle = "#e8dcff"; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.ellipse(v.x, v.y - 94, 46, 23, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.arc(v.x + i * 23, v.y - 102, 18, 0, Math.PI * 2); ctx.fill(); }
    drawBolt(v.x, v.y - 80, v.x, v.y); strokeRing(v.x, v.y, 22, "#9755bb", 4);
  }
  ctx.restore();
}

function render() {
  SurvivorArt.lookup("scene/world");
  updateCamera();
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
  if(state.trial)drawTrialArena();
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
      drawGemArt(gem);
    }
    for (const shot of state.enemyShots) {
      drawEnemyShotArt(shot);
    }
    if(state.trial&&state.trial.actors)drawTrialBodies();
    if (state.boss && !(state.trial&&state.trial.actors)) {
      const b = state.boss, x = b.x, y = b.y;
      const hop = Math.abs(Math.sin(b.wobble)) * 2 + bossAirHeight();
      if(b.pursuing) {ctx.fillStyle='#54bfff';for(const side of [-1,1]) {ctx.beginPath();ctx.ellipse(x+side*39,y-35+Math.sin(b.wobble)*4,3,7,.3*side,0,Math.PI*2);ctx.fill();}}
      drawGroundShadow(x, y, b.r, hop);
      const scale = b.r / 32;
      drawOutlinedSprite(ctx, teacherPicture(b.impactFlash || b.flash && !b.meleeFlash || state.bossShout > 0), ...SurvivorArt.bounds(state.trial?state.trial.definition.artId:'character/teacher',x - 26 * scale, y - hop - 34 * scale, 52 * scale, 68 * scale,{displayScale:scale}),undefined,SurvivorArt.lookup(state.trial?state.trial.definition.artId:'character/teacher').outline);
      drawBossWeakpoints(b,hop);
      if(b.posture && (b.posture.stun>0 || b.posture.value>=GAME_DATA.boss.posture.maximum*.75)) {
        const weak=b.posture.stun>0;ctx.fillStyle=weak?'#fff0a5':'#ffb95c';
        ctx.fillRect(x-18,y-hop-66,36,36);SurvivorIcons.draw(ctx,weak?'weakpoint':'posture',x-14,y-hop-62,28);
      }
      ctx.fillStyle = "#293d51"; ctx.font = "bold 13px system-ui"; ctx.textAlign = "center"; ctx.fillText(state.bossShout > 0 ? "安靜！" : b.pursuing ? "快走追上！" : `${state.trial?state.trial.definition.name:GAME_DATA.boss.name} · ${state.bossPhase}階段`, x, y + 52);
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
      drawBlob(enemy.x, enemy.y, enemy.r, enemy.color, enemy.wobble, !!enemy.impactFlash || enemy.flash>0 && !enemy.meleeFlash, enemy.typeId, ctx, enemy.shadowSize, enemy.airHeight || 0, enemy.spriteId,tint,enemy.stunTimer>0?'stun':enemy.impactFlash?'hurt':phase || 'run',state.elapsed,{...actorArtContext(enemy,a),displayScale:enemy.r/((ENEMY_TYPES.find(e=>e.id===enemy.typeId)||{}).radius||enemy.r)});
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
      ctx.beginPath(); ctx.arc(bubble.x, bubble.y, radius, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      if (state.bomb) { ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(bubble.x, bubble.y, bubble.radius, 0, Math.PI * 2); ctx.stroke(); }
    }
    if (state.dashTimer > 0) { ctx.strokeStyle = "#83eaff"; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(state.player.x, state.player.y); ctx.lineTo(state.player.x - state.dashX * 45, state.player.y - state.dashY * 45); ctx.stroke(); }
    if (state.bombBlast && state.bombBlast.schools) for (const [index, school] of state.bombBlast.schools.entries()) {
      ctx.strokeStyle = BUILD_TUNING[school].color; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(state.bombBlast.x, state.bombBlast.y, state.bombBlast.radius * (1 - state.bombBlast.life / .35) + 8 + index * 9, 0, Math.PI * 2); ctx.stroke();
    }
    drawUltimate();
    drawSkillVisuals('actor');
    for (const shot of state.projectiles) if (shot.boosted) {
      ctx.strokeStyle="#fff4a0";ctx.lineWidth=4;ctx.beginPath();ctx.arc(shot.x,shot.y,shot.r+5,0,Math.PI*2);ctx.stroke();
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
    ctx.fillText(`第${state.stageIndex + 1}關：${currentStage().name}`, state.width/2, state.height/2);
  }
  ctx.restore();
  ctx.save();
  if(state.zoom)ctx.setTransform(state.pixelRatio,0,0,state.pixelRatio,0,0);
  if (state.joy) {
    const radius = GAME_DATA.joystick.radius;
    const inset = joystickBounds(state.screenWidth||state.width, state.screenHeight||state.height, radius).minX;
    const scale = Math.min(1, inset / (radius + 19));
    ctx.globalAlpha = .42; ctx.strokeStyle = "#173f62"; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(state.joy.baseX, state.joy.baseY, (radius + 11) * scale, 0, Math.PI * 2); ctx.stroke(); ctx.fillStyle = "#4186be"; ctx.beginPath(); ctx.arc(state.joy.baseX + state.joy.x * radius * scale, state.joy.baseY + state.joy.y * radius * scale, 19 * scale, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
  }
  ctx.restore();
  for(const e of [state.player,...combatTargets()]) e.impactFlash=0;
}

// 使用螢幕座標，跟著鏡頭及橫向畫面尺寸定位；現階段只有老師，未加入新菁英。
function bossGuide() {
  if (!state.boss || targetVisible(state.boss)) return null;
  const dx = deltaX(state.boss.x, state.cameraX + state.width / 2);
  const dy = deltaY(state.boss.y, state.cameraY + state.height / 2);
  const halfW = Math.max(1, state.width / 2 - 30/(state.zoom||1)), halfH = Math.max(1, state.height / 2 - 30/(state.zoom||1));
  const scale = 1 / Math.max(Math.abs(dx) / halfW, Math.abs(dy) / halfH, 1);
  return { x: state.width / 2 + dx * scale, y: state.height / 2 + dy * scale, angle: Math.atan2(dy, dx) };
}
function drawBossGuide() {
  if(state.trial&&state.trial.actors){for(const body of trialBodies())withTrialBody(body,()=>SurvivorArt.paint('layer/draw-boss-guide',null,()=>drawBossGuidePlaceholder()));return;}
  return SurvivorArt.paint('layer/draw-boss-guide', null, () => drawBossGuidePlaceholder.apply(this, arguments));
}
function drawBossGuidePlaceholder() {
  if (state.mode !== "playing" && state.mode !== "paused" && state.mode !== "levelup") return;
  const guide = bossGuide();
  if (guide) {
    ctx.save(); ctx.translate(guide.x, guide.y);ctx.scale(1/(state.zoom||1),1/(state.zoom||1));
    ctx.fillStyle = "#fff3cc"; ctx.strokeStyle = "#713809"; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(0, 0, 19, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    SurvivorIcons.draw(ctx, "boss", -16, -16, 32);
    ctx.rotate(guide.angle); ctx.fillStyle = "#713809";
    ctx.beginPath(); ctx.moveTo(29, 0); ctx.lineTo(20, -7); ctx.lineTo(20, 7); ctx.closePath(); ctx.fill();
    if(state.boss.pursuing) {ctx.rotate(-guide.angle);ctx.font='bold 12px system-ui';ctx.textAlign='center';ctx.fillText('快走追上',0,40);}
    ctx.restore();
  }
  if (!state.trial && state.boss && state.bossIntro > 0) {
    ctx.save();ctx.translate(state.width/2,state.height/2-50/(state.zoom||1));ctx.scale(1/(state.zoom||1),1/(state.zoom||1)); ctx.font = "bold 24px system-ui"; ctx.textAlign = "center";
    ctx.strokeStyle = "#fff3cc"; ctx.lineWidth = 6; ctx.strokeText(GAME_DATA.boss.name + "來了！", 0, 0);
    ctx.fillStyle = "#713809"; ctx.fillText(GAME_DATA.boss.name + "來了！", 0, 0); ctx.restore();
  }
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

// 同一個環狀圓的可見副本：紫霧、圈線及扣血判定都以最短距離為準。
function drawBossZone() {
  return SurvivorArt.paint('layer/draw-boss-zone', null, () => drawBossZonePlaceholder.apply(this, arguments));
}
function drawBossZonePlaceholder() {
  const z = state.bossZone;
  if (!state.boss || !z) return;
  const x = state.player.x + deltaX(z.x, state.player.x), y = state.player.y + deltaY(z.y, state.player.y);
  ctx.save(); ctx.beginPath(); ctx.rect(state.cameraX, state.cameraY, state.width, state.height);
  for (const ox of [-state.worldWidth, 0, state.worldWidth]) for (const oy of [-state.worldHeight, 0, state.worldHeight]) {
    ctx.moveTo(x + ox + z.radius, y + oy); ctx.arc(x + ox, y + oy, z.radius, 0, Math.PI * 2);
  }
  ctx.fillStyle = "rgba(116,57,155,.28)"; ctx.fill("evenodd");
  ctx.lineWidth = 4; ctx.strokeStyle = "#b986db";
  ctx.beginPath(); ctx.arc(x, y, z.radius, 0, Math.PI * 2); ctx.stroke();
  if (z.warning > 0 || z.shrinking) {
    ctx.setLineDash([12, 10]); ctx.lineWidth = 3; ctx.strokeStyle = "#ffe49a";
    ctx.beginPath(); ctx.arc(x, y, z.target, 0, Math.PI * 2); ctx.stroke();
  }
  ctx.restore();
}
function bossZoneGuide() {
  const z = state.bossZone;
  if (!state.boss || !z || bossZoneDistance(state.player) < z.radius - 100) return null;
  const dx = deltaX(z.x, state.player.x), dy = deltaY(z.y, state.player.y), length = Math.max(1, Math.hypot(dx,dy));
  // 指示放在靠近紫霧的那側邊緣，箭頭朝內。
  const ux = -dx / length, uy = -dy / length;
  const distance = Math.min((state.width/2-58/(state.zoom||1))/Math.max(.001,Math.abs(ux)), (state.height/2-58/(state.zoom||1))/Math.max(.001,Math.abs(uy)));
  return { x: state.width/2 + ux * distance, y: state.height/2 + uy * distance, angle: Math.atan2(dy,dx) };
}
function drawBossZoneGuide() {
  return SurvivorArt.paint('layer/draw-boss-zone-guide', null, () => drawBossZoneGuidePlaceholder.apply(this, arguments));
}
function drawBossZoneGuidePlaceholder() {
  if (!["playing", "paused", "levelup"].includes(state.mode) || !state.bossZone || !state.boss) return;
  const z = state.bossZone, guide = bossZoneGuide();
  ctx.save();
  if (guide) {
    ctx.translate(guide.x,guide.y);ctx.scale(1/(state.zoom||1),1/(state.zoom||1)); ctx.fillStyle = "#fff6d6"; ctx.strokeStyle = "#77419c"; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(0,0,22,0,Math.PI*2); ctx.fill(); ctx.stroke();
    ctx.rotate(guide.angle); ctx.fillStyle = "#77419c";
    ctx.beginPath(); ctx.moveTo(14,0); ctx.lineTo(-8,-11); ctx.lineTo(-3,0); ctx.lineTo(-8,11); ctx.closePath(); ctx.fill();
  }
  ctx.restore();
  const text = z.warning > 0 ? `安全圈 ${Math.ceil(z.warning)} 秒後縮小！` : outsideBossZone() ? "回安全圈！紫霧會慢慢扣血" : z.shrinking ? "安全圈縮小中" : "";
  if (text) {
    ctx.save();ctx.translate(state.width/2,(110-(state.viewTop||0))/(state.zoom||1));ctx.scale(1/(state.zoom||1),1/(state.zoom||1)); ctx.font = "bold 18px system-ui"; ctx.textAlign = "center";
    ctx.lineWidth = 5; ctx.strokeStyle = "#fff6e8"; ctx.strokeText(text,0,0);
    ctx.fillStyle = "#77419c"; ctx.fillText(text,0,0); ctx.restore();
  }
}

// 只讀行為狀態，預警與規則分開；世界接縫由既有世界繪圖處理。
function drawPacingWarnings() {
  return SurvivorArt.paint('layer/draw-pacing-warnings', null, () => drawPacingWarningsPlaceholder.apply(this, arguments));
}
function drawPacingWarningsPlaceholder() {
  for(const e of state.enemies) {
    if(!e.alive) continue;
    const a=e.action, shooting=e.shotWarning>0;
    if(!a && !shooting) continue;
    ctx.save();ctx.strokeStyle=a && a.kind==='shield'?'#b4ecff':'#ff9a83';
    ctx.fillStyle=a && a.kind==='blast' ? 'rgba(255,65,65,'+(.12+.2*Math.abs(Math.sin(a.warning*16)))+')' : 'rgba(255,110,90,.12)';ctx.lineWidth=3;
    const feedback=enemyFeedback(e,'legacy');warningFeedback(feedback,(a&&a.warning)||e.shotWarning||0);
    const r=a && a.kind==='blast'?GAME_DATA.pacing.blastRadius:a && a.kind==='shield'?GAME_DATA.pacing.shieldRadius:e.r+10;
    ctx.beginPath();ctx.arc(e.x,e.y,r,0,Math.PI*2);ctx.fill();ctx.stroke();
    if(a && a.kind==='charge') {
      ctx.beginPath();ctx.moveTo(e.x,e.y);ctx.lineTo(e.x+Math.cos(a.angle)*GAME_DATA.pacing.chargeSpeed*GAME_DATA.pacing.chargeSeconds,e.y+Math.sin(a.angle)*GAME_DATA.pacing.chargeSpeed*GAME_DATA.pacing.chargeSeconds);ctx.stroke();
    }
    ctx.font='bold 13px system-ui';ctx.textAlign='center';ctx.fillStyle='#fff0cf';
    if(feedback.hint) ctx.fillText(a && a.kind==='blast'?'自爆 '+Math.ceil(a.warning):shooting?'準備射擊':a.kind==='shield'?'準備護盾':'準備衝撞',e.x,e.y-e.r-12);
    ctx.restore();
  }
}

// 與命中共用 config／鎖定原點及方向，不從畫面尺寸推算攻擊規則。
// 地面預警是招式表現；精確碰撞範圍只供練習場開關使用。
function drawAttackMarker(e,kind) {
  return SurvivorArt.paint('layer/draw-attack-marker', null, () => drawAttackMarkerPlaceholder.apply(this, arguments));
}
function drawAttackMarkerPlaceholder(e,kind) {
  if(!enemyFeedback(e).hint) return;
  const x=Math.round(e.x),y=Math.round(e.y-e.r-24);
  ctx.save();ctx.fillStyle=kind==='!'?'#ffe2a0':'#fff2b3';
  if(kind==='!') {ctx.fillRect(x-2,y,4,10);ctx.fillRect(x-2,y+13,4,4);}
  else {ctx.fillRect(x-2,y,4,14);ctx.fillRect(x-7,y+5,14,4);ctx.fillRect(x-5,y+3,10,8);}
  ctx.restore();
}
function drawPhasedAttacks() {
  return SurvivorArt.paint('layer/draw-phased-attacks', null, () => drawPhasedAttacksPlaceholder.apply(this, arguments));
}
function drawPhasedAttacksPlaceholder() {
  for(const e of state.enemies) {
    const a=e.phaseAttack;
    if(!e.alive || !a || !['windup','active'].includes(a.phase)) continue;
    if(a.phase==='active' && !enemyFeedback(e).slash && !state.practiceHitboxes)continue;
    SurvivorArt.draw('move/enemy-'+e.typeId,{context:ctx,x:a.x-24,y:a.y-24,width:48,height:48,animation:a.phase,time:state.elapsed,angle:a.angle,...SurvivorArt.phaseContext(a)});
    const c=a.config,warning=a.phase==='windup',progress=warning?Math.max(0,Math.min(1,1-a.left/Math.max(.001,SurvivorTiming.segments(c)[0].seconds))):1;
    ctx.save();ctx.translate(a.x,a.y);ctx.rotate(a.angle);
    ctx.strokeStyle='#ed7e89';ctx.fillStyle=warning?'rgba(240,65,85,.32)':'rgba(245,87,93,.72)';ctx.lineWidth=2;
    const feedback=enemyFeedback(e);if(warning)warningFeedback(feedback,a.left);
    if(c.shape==='projectiles') {
      if(warning) for(const angle of SurvivorPacing.attackAngles(c,0)) {
        ctx.save();ctx.rotate(angle);const length=Math.min(c.length,c.speed*c.active);
        ctx.globalAlpha=.18;ctx.lineWidth=2*c.radius;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(length,0);ctx.stroke();
        ctx.globalAlpha=.55;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(length*progress,0);ctx.stroke();
        if(state.practiceHitboxes) {ctx.strokeStyle='#fff5ae';ctx.globalAlpha=.2;ctx.lineWidth=2*(c.radius+state.player.r);ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(length,0);ctx.stroke();}
        ctx.restore();
      }
    } else {
      const path=(p)=>{
        ctx.beginPath();
        if(c.shape==='line') ctx.rect(0,-c.radius,c.length*p,c.radius*2);
        else if(c.shape==='sector') {const h=c.angle*Math.PI/360;ctx.moveTo(0,0);ctx.arc(0,0,c.radius*p,-h,h);ctx.closePath();}
        else {const radius=c.shape==='ring'?c.innerRadius+(c.radius-c.innerRadius)*p:c.radius*p;ctx.arc(0,0,radius,0,Math.PI*2);if(c.shape==='ring'){ctx.moveTo(c.innerRadius,0);ctx.arc(0,0,c.innerRadius,0,Math.PI*2,true);}}
      };
      path(1);ctx.save();ctx.globalAlpha=.2;ctx.fill();ctx.restore();ctx.stroke();
      path(progress);ctx.fill();
      if(state.practiceHitboxes) {path(1);ctx.strokeStyle='#fff5ae';ctx.lineWidth=1;ctx.stroke();}
    }
    ctx.restore();
  }
}

// 螢幕座標的非文字預警，與出怪共用倒數；不跟著鏡頭捲走。
function drawWaveEventWarning() {
  return SurvivorArt.paint('layer/draw-wave-event-warning', null, () => drawWaveEventWarningPlaceholder.apply(this, arguments));
}
function drawWaveEventWarningPlaceholder() {
  const run=state.pacing;
  if(PREVIEW_MODE || state.boss || state.bossIntro>0 || !run || !(run.warning>0)) return;
  const kind=run.queue.length && run.queue[0].kind;
  const effect=GAME_DATA.waveEvents && GAME_DATA.waveEvents[kind];
  const position=effect ? effect.position : kind==='tide' ? 'left' : 'sides';
  const side=SurvivorPacing.side(position);
  const sides=side===undefined || position==='sides' ? [0,1,2,3] : [side];
  const edge=12/(state.zoom||1), w=state.width, h=state.height;
  ctx.save();
  ctx.fillStyle='#ed7e89';
  ctx.globalAlpha=.25+.4*(.5+.5*Math.cos(run.warning*Math.PI*4));
  for(const s of sides) {
    if(s===0) ctx.fillRect(0,0,edge,h);
    if(s===1) ctx.fillRect(w-edge,0,edge,h);
    if(s===2) ctx.fillRect(0,0,w,edge);
    if(s===3) ctx.fillRect(0,h-edge,w,edge);
  }
  ctx.restore();
}

function drawProjectileArt(shot) {
  return SurvivorArt.paint('projectile/water', {context:ctx,...{x:shot.x-shot.r,y:shot.y-shot.r,width:shot.r*2,height:shot.r*2,time:state.elapsed,animation:'active',aim:{x:shot.vx,y:shot.vy}}}, () => {
      const colors = shot.colors || ['water'];
      ctx.fillStyle = BUILD_TUNING[colors[0]].color;
      if (colors.length > 1) { const gradient=ctx.createLinearGradient(shot.x-shot.r,shot.y,shot.x+shot.r,shot.y);gradient.addColorStop(0,BUILD_TUNING[colors[0]].color);gradient.addColorStop(1,BUILD_TUNING[colors[1]].color);ctx.fillStyle=gradient; } ctx.strokeStyle = "#0759a8"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(shot.x, shot.y, shot.r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      if (shot.schools && shot.schools.includes("wind")) {
        const speed = Math.max(1, Math.hypot(shot.vx, shot.vy));
        ctx.strokeStyle = "#23815e"; ctx.lineWidth = 3;
        for (const offset of [-6, 6]) { ctx.beginPath(); ctx.moveTo(shot.x, shot.y + offset); ctx.lineTo(shot.x - shot.vx / speed * 30, shot.y - shot.vy / speed * 30 + offset); ctx.stroke(); }
      }
      if ((shot.colors || shot.schools || []).includes("thunder") || shot.charged) drawBolt(shot.x - 5, shot.y - 12, shot.x + 5, shot.y + 12);
      if (shot.transformed) { ctx.strokeStyle='#e7ffef';ctx.lineWidth=2;ctx.beginPath();ctx.arc(shot.x,shot.y,shot.r+7,0,Math.PI*2);ctx.stroke(); }
      if (shot.piercing) {
        ctx.strokeStyle = "#fff"; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(shot.x, shot.y, shot.r + 4, 0, Math.PI * 2); ctx.stroke();
        const speed = Math.max(1, Math.hypot(shot.vx, shot.vy));
        ctx.beginPath(); ctx.moveTo(shot.x - shot.vx / speed * (shot.r + 5), shot.y - shot.vy / speed * (shot.r + 5));
        ctx.lineTo(shot.x - shot.vx / speed * (shot.r + 15), shot.y - shot.vy / speed * (shot.r + 15)); ctx.stroke();
      }
  });
}

function drawGemArt(gem) {
  return SurvivorArt.paint('pickup/gem', {context:ctx,...{x:gem.x-7,y:gem.y-7,width:14,height:14,time:state.elapsed}}, () => {
      ctx.save(); ctx.translate(gem.x, gem.y + Math.sin(gem.wobble) * 2); ctx.rotate(Math.PI / 4);
      ctx.fillStyle = GEM_COLOR; ctx.strokeStyle = "#a65300"; ctx.lineWidth = 2; ctx.fillRect(-7, -7, 14, 14); ctx.strokeRect(-7, -7, 14, 14);
      ctx.fillStyle = "rgba(255,255,255,.72)"; ctx.fillRect(-4, -4, 3, 3); ctx.restore();
  });
}

function drawEnemyShotArt(shot) {
  return SurvivorArt.paint('projectile/enemy', {context:ctx,...{x:shot.x-shot.r,y:shot.y-shot.r,width:shot.r*2,height:shot.r*2,time:state.elapsed,animation:'active',aim:{x:shot.vx,y:shot.vy}}}, () => {
      ctx.save(); ctx.textAlign = "center";
      if(shot.phaseShot) {
        ctx.fillStyle=shot.candy?'#ffb8da':'#ed8d79';ctx.strokeStyle='#913d62';ctx.lineWidth=2;
        ctx.beginPath();ctx.arc(shot.x,shot.y,shot.r,0,Math.PI*2);ctx.fill();ctx.stroke();
        ctx.fillStyle='#fff3d9';ctx.fillRect(shot.x-shot.r*.45,shot.y-shot.r*.45,shot.r*.4,shot.r*.4);
      } else if (shot.source === "book") {
        // 小兵是橘色方紙上的單字；老師仍是粉紅色詞句。
        ctx.fillStyle = "#fff3cc"; ctx.strokeStyle = "#a85c13"; ctx.lineWidth = 2;
        ctx.fillRect(shot.x - 12, shot.y - 12, 24, 24); ctx.strokeRect(shot.x - 12, shot.y - 12, 24, 24);
        ctx.font = "bold 20px system-ui"; ctx.textBaseline = "middle"; ctx.fillStyle = "#713809"; ctx.fillText(shot.text, shot.x, shot.y);
      } else if (shot.text === "粉筆") {
        ctx.translate(shot.x, shot.y); ctx.rotate(Math.atan2(shot.vy, shot.vx));
        ctx.fillStyle = "#fff"; ctx.strokeStyle = "#b42f54"; ctx.lineWidth = 2;
        ctx.fillRect(-10, -4, 20, 8); ctx.strokeRect(-10, -4, 20, 8);
      } else {
        ctx.font = "bold 16px system-ui"; ctx.fillStyle = "#b42f54"; ctx.strokeStyle = "#fff"; ctx.lineWidth = 4; ctx.strokeText(shot.text, shot.x, shot.y); ctx.fillText(shot.text, shot.x, shot.y);
      }
      ctx.restore();
  });
}

function drawParticleArt(effect) {
  return SurvivorArt.paint(SurvivorArt.lookup('effect/'+effect.kind)?'effect/'+effect.kind:'effect/particle', {context:ctx,...{x:effect.x-16,y:effect.y-16,width:32,height:32,time:effect.maxLife-effect.life,animation:'active',phaseElapsed:effect.maxLife-effect.life,phaseDuration:effect.maxLife}}, () => {
      const alpha = Math.max(0, effect.life / effect.maxLife); ctx.globalAlpha = alpha; ctx.fillStyle = effect.color;
      if (effect.kind === "water-hit") {
        ctx.strokeStyle = effect.color; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(effect.x, effect.y, 5 + (1 - alpha) * 15, 0, Math.PI * 2); ctx.stroke();
        ctx.font = "bold 16px system-ui"; ctx.textAlign = "center"; ctx.strokeStyle = "#2458a4"; ctx.lineWidth = 3; ctx.strokeText(effect.text, effect.x, effect.y - 14); ctx.fillText(effect.text, effect.x, effect.y - 14);
      }
      else if (effect.kind === "number") { ctx.font = `bold ${15*(effect.numberScale||1)}px system-ui`; ctx.textAlign = "center"; ctx.strokeStyle = "#355066"; ctx.lineWidth = 3; ctx.strokeText(effect.text, effect.x, effect.y); ctx.fillText(effect.text, effect.x, effect.y); }
      else if (effect.kind === "heal") { ctx.font = "bold 13px system-ui"; ctx.textAlign = "center"; ctx.fillText(effect.text, effect.x, effect.y); }
      else if (effect.kind === "evaporate") { ctx.beginPath(); ctx.ellipse(effect.x, effect.y, 13 * (1.5 - alpha), 18 * alpha, 0, 0, Math.PI * 2); ctx.fill(); }
      else { ctx.fillRect(effect.x - 2, effect.y - 2, 4, 4); }
      ctx.globalAlpha = 1;
  });
}
