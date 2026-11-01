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
    const radius = 24, x = point.x, y = point.y - hop, pulse=.65+.35*Math.abs(Math.sin(state.elapsed*(closing?26:12)));
    SurvivorArt.paint(artId, {context: ctx, x: x-radius, y: y-radius, width:radius*2, height:radius*2, time:state.elapsed}, () => {
      ctx.save();ctx.globalAlpha=pulse;SurvivorNeon.glowAt(ctx,'pink',x,y,64,.9);
      ctx.strokeStyle=color;ctx.lineWidth=3;ctx.beginPath();ctx.arc(x,y,24,0,Math.PI*2);ctx.stroke();
      ctx.fillStyle=warning?'#ffa94d':closing?'#ff6a3d':'#f5a1bc';ctx.beginPath();ctx.arc(x,y,12,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#fff0f5';ctx.beginPath();ctx.arc(x-3,y-3,4,0,Math.PI*2);ctx.fill();
      if(!warning&&!closing){ctx.fillStyle='#7dffdc';ctx.beginPath();ctx.arc(x,y,2,0,Math.PI*2);ctx.fill();}
      ctx.font='800 13px "M PLUS Rounded 1c",system-ui';ctx.textAlign='left';ctx.textBaseline='middle';ctx.lineWidth=3;ctx.strokeStyle='#120f24';ctx.strokeText('弱點',x+31,y);ctx.fillStyle='#ffd3df';ctx.fillText('弱點',x+31,y);ctx.restore();
    });
    if(body.impactFlash>0&&body.feedbackNumberScale>1.35&&['open','closing'].includes(value.phase))SurvivorArt.paint(artId,{context:ctx,x:x-34,y:y-34,width:68,height:68,time:state.elapsed},()=>SurvivorNeon.weakpointBurst(ctx,x,y,body.impactFlash));
  }
}
Survivor.render.weakpoint={drawBossWeakpoints};
