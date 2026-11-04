// Element fields, status and attack cues. Rendering never changes combat.
// 只用舊版 iPad 也支援的 Canvas API；線寬至少 3px，避免手機上看不見。
function strokeRing(x, y, radius, color, width = 3) {
  return SurvivorArt.paint('layer/stroke-ring', null, () => strokeRingPlaceholder.apply(this, arguments));
}
function strokeRingPlaceholder(x, y, radius, color, width = 3) {
  SurvivorMaterials.volume(x,y,Math.max(1,radius),'water',.12);
  SurvivorMaterials.ribbon(x,y,Math.max(1,radius),'water',-.6);
}
function drawBolt(x, y, x2, y2) {
  return SurvivorArt.paint('layer/draw-bolt', null, () => drawBoltPlaceholder.apply(this, arguments));
}
function drawBoltPlaceholder(x, y, x2, y2) {
  SurvivorMaterials.bolt(x,y,x2,y2);
}
function drawSwirl(x, y, radius, phase) {
  return SurvivorArt.paint('layer/draw-swirl', null, () => drawSwirlPlaceholder.apply(this, arguments));
}
function drawSwirlPlaceholder(x, y, radius, phase) {
  SurvivorMaterials.vortex(x,y,radius,phase,'wind');
}
function drawWaterLobe(x,y,radius) {
  SurvivorMaterials.burst(x,y,radius,'water',.4);
}
function drawWaterDrop(x,y,size,angle) {
  ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.fillStyle=SurvivorArtManifest.elements.blue.body;
  ctx.beginPath();ctx.moveTo(0,-size*1.4);ctx.quadraticCurveTo(size*1.3,size,0,size);ctx.quadraticCurveTo(-size*1.3,size,0,-size*1.4);ctx.fill();ctx.restore();
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
      drawWaterLobe(field.x,field.y,field.radius);
      for (let i = -1; i <= 1; i++) { ctx.strokeStyle = "#e5faff"; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(field.x, field.y + i * field.radius * .35, field.radius * .65, 4, 0, 0, Math.PI); SurvivorNeon.stroke(ctx,'blue'); }
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
    for (let i = 0; i < 3; i++) { const a = state.elapsed + i * Math.PI * 2 / 3; ctx.beginPath(); ctx.arc(p.x, p.y, radius, a, a + .35); SurvivorNeon.stroke(ctx,'blue'); }
  }
  if (p.moving && (effectLevel("onion-dash") || effectLevel("wind-speed"))) {
    ctx.strokeStyle = effectLevel("wind-speed") ? "#23815e" : "#8754ad"; ctx.lineWidth = 3;
    for (const offset of [-10, 0, 10]) { ctx.beginPath(); ctx.moveTo(p.x - state.faceX * 20 - state.faceY * offset, p.y - state.faceY * 20 + state.faceX * offset); ctx.lineTo(p.x - state.faceX * 42 - state.faceY * offset, p.y - state.faceY * 42 + state.faceX * offset); SurvivorNeon.stroke(ctx,'blue'); }
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
    else if(v.kind==='weapon-wave') {
      ctx.translate(v.x,v.y);ctx.rotate(v.angle);ctx.globalAlpha*=1-progress;
      if(v.thrust)SurvivorMaterials.ribbon(v.radius*progress,0,v.width,'water',Math.PI/2);
      else SurvivorMaterials.burst(0,0,v.radius*(.35+.65*progress),'water',progress);
    }
    else if (v.kind === "maker-ring") {
      ctx.lineWidth=5; ctx.strokeStyle="#7b54be"; ctx.beginPath(); ctx.arc(v.x,v.y,v.radius,v.gap/2,Math.PI*2-v.gap/2); SurvivorNeon.stroke(ctx,'blue');
      ctx.strokeStyle="#16804b";ctx.beginPath();ctx.arc(v.x,v.y,v.radius,-v.gap/2,v.gap/2);SurvivorNeon.stroke(ctx,'blue');
    } else if (v.kind === "lightning") drawBolt(v.x, v.y, v.x2, v.y2);
    else if (v.kind === "gust") {
      const angle = Math.atan2(deltaY(v.y2, v.y), deltaX(v.x2, v.x));
      ctx.translate(v.x,v.y);ctx.rotate(angle);ctx.globalAlpha*=1-progress;
      for(let i=0;i<2;i++)SurvivorMaterials.ribbon(8+progress*20,i?7:-7,12-i*3,'wind',i?-.4:.4);
    } else if (v.kind === "card") {
      strokeRing(v.x, v.y + 38, 22 + progress * 25, v.color);
      SurvivorIcons.draw(ctx, v.text, v.x - 12, v.y - 24 - progress * 20, 24);
    } else if (v.kind === "sparkle") {
      const light=SurvivorArtManifest.assets['effect/sparkle'].light;ctx.globalAlpha*=light.alpha;
      for(let i=0;i<3;i++){const a=i*Math.PI*2/3,r=4+progress*Math.min(14,v.radius);SurvivorMaterials.volume(v.x+Math.cos(a)*r,v.y+Math.sin(a)*r,3.5*(1-progress*.5),'water',.7,.7);}
    } else {
      strokeRing(v.x, v.y, v.radius * (.25 + progress * .75), v.color, 4);
      if (v.kind === "discharge") {
        for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; drawBolt(v.x + Math.cos(a) * v.radius * .5, v.y + Math.sin(a) * v.radius * .5, v.x + Math.cos(a) * v.radius, v.y + Math.sin(a) * v.radius); }
      } else {
        ctx.fillStyle = "#168cff";
        for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, r = v.radius * progress; drawWaterDrop(v.x+Math.cos(a)*r,v.y+Math.sin(a)*r,4,a+Math.PI/2); }
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
    for (let y = 0; y <= v.worldHeight; y += 14) { const edge = x + Math.sin(y / 24) * 17; if (!y) ctx.moveTo(edge, y); else ctx.lineTo(edge, y); } SurvivorNeon.stroke(ctx,'blue');
  } else if (v.school === "wind") {
    for(const p of v.orbits||[v]) {
      ctx.fillStyle=SurvivorArtManifest.elements.green.body;ctx.globalAlpha*=.65;
      ctx.beginPath();ctx.ellipse(p.x,p.y-18,20,30,-.15,0,Math.PI*2);ctx.fill();ctx.globalAlpha/=.65;
      for(let i=0;i<3;i++)drawSwirl(p.x,p.y-i*16,14+i*9,state.elapsed*4+i);
    }
  } else {
    for(const p of v.targets||[v]) {
      ctx.fillStyle=SurvivorArtManifest.elements.thunder.body;
      for(let i=-1;i<=1;i++){ctx.beginPath();ctx.ellipse(p.x+i*14,p.y-65+(i===0?-6:0),17,13,0,0,Math.PI*2);ctx.fill();}
      drawBolt(p.x,p.y-52,p.x,p.y);
    }
  }
  ctx.restore();
}


Survivor.render.effects={strokeRing,drawBolt,drawSwirl,drawFields,drawTargetStatus,drawSupportVisuals,drawSkillVisuals,drawUltimate,drawOneUltimate};
