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
  if(state.trial) {globalThis.Survivor.render.gallery.drawTrialMoves();return;}
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
      const progress=move.active?1:1-move.warning/Math.max(.001,bossDefinition(move).warning);SurvivorNeon.warning(ctx,x,y,point.r,progress,move.active);
      if(move.recovery) {ctx.fillStyle='#ffcf49';ctx.font='bold 25px system-ui';ctx.fillText('★ ★',state.boss.x-25,state.boss.y-65);}
    } else if(bossKind(move)==='sniper') {
      ctx.lineWidth=2;ctx.strokeStyle='#e3394e';ctx.beginPath();ctx.moveTo(move.x,move.y);ctx.lineTo(move.x+Math.cos(move.angle)*1400,move.y+Math.sin(move.angle)*1400);SurvivorNeon.stroke(ctx,'orange');
    } else if(bossKind(move)==='barriers') {
      ctx.lineWidth=16;ctx.strokeStyle=move.active?'#31595a':'#e35c6d';
      for(const sign of [-1,1]) {ctx.beginPath();ctx.moveTo(move.x+sign*move.wallWidth,move.y-move.radius);ctx.lineTo(move.x+sign*move.wallWidth,move.y+move.radius);SurvivorNeon.stroke(ctx,'orange');}
    } else if (bossKind(move) === "wall") {
      const x = wallX(move); ctx.lineWidth = 20;
      ctx.strokeStyle = move.active ? "#fff5dd" : "rgba(235,83,101,.55)";
      ctx.beginPath(); ctx.moveTo(x,move.y);ctx.lineTo(x,move.y+move.wallHeight);SurvivorNeon.stroke(ctx,'orange');
      ctx.lineWidth = 2; ctx.strokeStyle = "#d64c65";ctx.strokeRect(move.x,move.y,move.wallWidth,move.wallHeight);
    } else if (["dash","combo"].includes(bossKind(move))) {
      const endX = move.x + deltaX(move.endX, move.x), endY = move.y + deltaY(move.endY, move.y);
      const duration = Math.hypot(deltaX(move.endX, move.x), deltaY(move.endY, move.y)) / bossDefinition(move).speed;
      drawLandingShadow(endX, endY + state.boss.r * .85, state.boss.r, move.active ? 1 - move.life / Math.max(.001, duration) : 0);
      ctx.lineWidth = state.boss.r * 2; ctx.strokeStyle = "rgba(220,65,83,.18)";
      ctx.beginPath(); ctx.moveTo(move.x, move.y); ctx.lineTo(endX, endY); SurvivorNeon.stroke(ctx,'orange');
      ctx.lineWidth = 4; ctx.strokeStyle = "#c8354b"; ctx.beginPath(); ctx.moveTo(move.x, move.y); ctx.lineTo(endX, endY); SurvivorNeon.stroke(ctx,'orange');
    } else if (bossKind(move) === "rain" || bossKind(move) === "call") {
      for (const rawPoint of move.points) {
        const point = { ...rawPoint, x: move.x + deltaX(rawPoint.x, move.x), y: move.y + deltaY(rawPoint.y, move.y) };
        if (bossKind(move) === "rain") drawLandingShadow(point.x, point.y, 16, move.active ? 1 : 1 - move.warning / bossDefinition(move).warning);
        const progress=move.active?1:1-move.warning/Math.max(.001,bossDefinition(move).warning);SurvivorNeon.warning(ctx,point.x,point.y,point.r,progress,move.active);
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
        ctx.beginPath();ctx.arc(move.x,move.y,radius,0,Math.PI*2);ctx.fill();SurvivorNeon.stroke(ctx,'orange');
      }
      for (const point of ringPoints(move.active ? move : { ...move, life: bossDefinition(move).duration })) {
        ctx.font = "bold 20px system-ui"; ctx.textAlign = "center"; ctx.fillStyle = move.active ? "#b42f54" : "#78626b"; ctx.fillText("字", point.x, point.y + 7);
      }
      if (bossKind(move) === "ring") {
        const radius = move.active ? Math.hypot(deltaX(ringPoints(move)[0].x, move.x), deltaY(ringPoints(move)[0].y, move.y)) : move.radius;
        ctx.strokeStyle = "#16804b"; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(move.x, move.y, radius, move.angle - bossDefinition(move).gap / 2, move.angle + bossDefinition(move).gap / 2); SurvivorNeon.stroke(ctx,'orange');
      }
    } else if (bossKind(move) === "words" || bossKind(move) === "chalk") {
      const spread = bossDefinition(move).spread;
      for (let n = 0; n < move.count; n++) {
        const angle = move.angle + (n - (move.count - 1) / 2) * spread;
        ctx.beginPath(); ctx.moveTo(move.x, move.y); ctx.lineTo(move.x + Math.cos(angle) * 170, move.y + Math.sin(angle) * 170); SurvivorNeon.stroke(ctx,'orange');
      }
    } else { ctx.beginPath(); ctx.arc(move.x, move.y, 50, 0, Math.PI * 2); ctx.fill(); SurvivorNeon.stroke(ctx,'orange'); }
    if(!moveFeedback(bossDefinition(move),'move').hint){ctx.restore();continue;}
    const name = BOSS_MOVES.find(row => row.id === move.id).name;
    ctx.font = "bold 17px system-ui"; ctx.textAlign = "center"; ctx.strokeStyle = "#fff"; ctx.lineWidth = 4;
    ctx.strokeText(name + (move.active ? "！" : "…"), move.x, move.y - 44); ctx.fillStyle = "#9e253c"; ctx.fillText(name + (move.active ? "！" : "…"), move.x, move.y - 44);
    ctx.restore();
  }
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


// Module accessors; legacy global functions and world facade remain unchanged.
globalThis.Survivor.render = globalThis.Survivor.render || {};
globalThis.Survivor.render['boss-effects'] = globalThis.Survivor.render['boss-effects'] || {};
Object.defineProperties(globalThis.Survivor.render['boss-effects'], {
  bossAirHeight: { enumerable: true, get: () => bossAirHeight },
  drawBossMoves: { enumerable: true, get: () => drawBossMoves },
  bossArtShapes: { enumerable: true, get: () => bossArtShapes },
  drawBossMovesPlaceholder: { enumerable: true, get: () => drawBossMovesPlaceholder },
  bossGuide: { enumerable: true, get: () => bossGuide },
  drawBossGuide: { enumerable: true, get: () => drawBossGuide },
  drawBossGuidePlaceholder: { enumerable: true, get: () => drawBossGuidePlaceholder },
  drawBossZone: { enumerable: true, get: () => drawBossZone },
  drawBossZonePlaceholder: { enumerable: true, get: () => drawBossZonePlaceholder },
  bossZoneGuide: { enumerable: true, get: () => bossZoneGuide },
  drawBossZoneGuide: { enumerable: true, get: () => drawBossZoneGuide },
  drawBossZoneGuidePlaceholder: { enumerable: true, get: () => drawBossZoneGuidePlaceholder }
});
