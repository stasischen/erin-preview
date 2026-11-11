// 只讀行為狀態，預警與規則分開；世界接縫由既有世界繪圖處理。
function drawPacingWarnings() {
  return SurvivorArt.paint('layer/draw-pacing-warnings', null, () => drawPacingWarningsPlaceholder.apply(this, arguments));
}
function drawPacingWarningsPlaceholder() {
  for(const e of state.enemies) {
    if(!e.alive) continue;
    const a=e.action, shooting=e.shotWarning>0;
    if(!a && !shooting) continue;
    const feedback=enemyFeedback(e,'legacy');warningFeedback(feedback,(a&&a.warning)||e.shotWarning||0);
    const r=a && a.kind==='blast'?GAME_DATA.pacing.blastRadius:a && a.kind==='shield'?GAME_DATA.pacing.shieldRadius:e.r+10;
    const remaining=(a&&a.warning)||e.shotWarning||0;SurvivorNeon.warning(ctx,e.x,e.y,r,1/(1+Math.max(0,remaining)));ctx.save();ctx.strokeStyle='#ff6a3d';ctx.lineWidth=3;
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
      if(c.shape==='circle'){SurvivorNeon.warning(ctx,a.x,a.y,c.radius,progress);path(progress);ctx.strokeStyle=a.phase==='active'?'#fff':'#ffa94d';ctx.lineWidth=2;ctx.stroke();}
      else {ctx.strokeStyle='#ff6a3d';ctx.fillStyle=warning?'rgba(255,106,61,.12)':'rgba(255,106,61,.25)';path(1);ctx.save();ctx.globalAlpha=.2;ctx.fill();ctx.restore();ctx.stroke();path(progress);ctx.fill();}
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


// Module accessors; legacy global functions and world facade remain unchanged.
globalThis.Survivor.render = globalThis.Survivor.render || {};
globalThis.Survivor.render['enemy-warnings'] = globalThis.Survivor.render['enemy-warnings'] || {};
Object.defineProperties(globalThis.Survivor.render['enemy-warnings'], {
  drawPacingWarnings: { enumerable: true, get: () => drawPacingWarnings },
  drawPacingWarningsPlaceholder: { enumerable: true, get: () => drawPacingWarningsPlaceholder },
  drawAttackMarker: { enumerable: true, get: () => drawAttackMarker },
  drawAttackMarkerPlaceholder: { enumerable: true, get: () => drawAttackMarkerPlaceholder },
  drawPhasedAttacks: { enumerable: true, get: () => drawPhasedAttacks },
  drawPhasedAttacksPlaceholder: { enumerable: true, get: () => drawPhasedAttacksPlaceholder },
  drawWaveEventWarning: { enumerable: true, get: () => drawWaveEventWarning },
  drawWaveEventWarningPlaceholder: { enumerable: true, get: () => drawWaveEventWarningPlaceholder }
});
