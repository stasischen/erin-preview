// 弱點提示經美術清單；規則與命中不依賴此 Canvas 表現。
function drawBossWeakpoints(body, hop = 0) {
  const config = bossWeakpointConfig(body); if (!config || !body.weakpoints) return;
  const points = bossWeakpointPoints(body, config);
  for (const part of config.parts) {
    const value = body.weakpoints[part.id], point = points[part.anchor];
    if (!value || value.phase === 'closed' || !point) continue;
    const closing = value.phase === 'closing', warning = value.phase === 'warning';
    const artId=config.artId||'effect/weakpoint',palette=SurvivorArt.lookup(artId).palette||['#7dffdc','#fff0a5','#ffb85b'];
    const color = palette[closing?2:warning?1:0];
    const radius = Math.max(8, body.r * part.radiusScale), x = point.x, y = point.y - hop;
    SurvivorArt.paint(artId, {context: ctx, x: x-radius, y: y-radius, width:radius*2, height:radius*2, time:state.elapsed}, () => {
      ctx.save();ctx.globalAlpha = .5 + .5 * Math.abs(Math.sin(state.elapsed * (closing ? 26 : 12)));
      ctx.strokeStyle=color;ctx.lineWidth=3;ctx.fillStyle=config.artId?color+'26':warning?'rgba(255,240,165,.12)':closing?'rgba(255,184,91,.15)':'rgba(125,255,220,.15)';
      const angle=(body.facingAngle||0)+part.angleDegrees*Math.PI/180,half=part.arcDegrees*Math.PI/360;
      ctx.beginPath();if(part.arcDegrees<360)ctx.moveTo(x,y);ctx.arc(x,y,radius,angle-half,angle+half);if(part.arcDegrees<360)ctx.closePath();ctx.fill();ctx.stroke();
      ctx.strokeRect(x-5,y-5,10,10);ctx.restore();
    });
  }
}
Survivor.render.weakpoint={drawBossWeakpoints};
