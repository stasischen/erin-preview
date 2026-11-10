function drawProjectileArt(shot) {
  return SurvivorArt.paint('projectile/water', {context:ctx,...{x:shot.x-shot.r,y:shot.y-shot.r,width:shot.r*2,height:shot.r*2,time:state.elapsed,animation:'active',aim:{x:shot.vx,y:shot.vy}}}, () => {
      SurvivorNeon.projectile(ctx,shot,state.projectiles.length<=60);
      if (shot.schools && shot.schools.includes("wind")) {const speed=Math.max(1,Math.hypot(shot.vx,shot.vy));ctx.strokeStyle='#70e7ba';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(shot.x,shot.y);ctx.lineTo(shot.x-shot.vx/speed*20,shot.y-shot.vy/speed*20);ctx.stroke();}
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

function drawGemArt(gem,glowEnabled=true) {
  return SurvivorArt.paint('pickup/gem', {context:ctx,...{x:gem.x-7,y:gem.y-7,width:14,height:14,time:state.elapsed}}, () => {
      SurvivorNeon.gem(ctx,gem,glowEnabled);
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
        SurvivorNeon.hit(ctx,effect,Math.min(alpha,effect.life/.12));ctx.font='800 16px "M PLUS Rounded 1c",system-ui';ctx.textAlign='center';ctx.strokeStyle='#35b9ff';ctx.lineWidth=3;ctx.strokeText(effect.text,effect.x,effect.y-14);ctx.fillStyle='#fff';ctx.fillText(effect.text,effect.x,effect.y-14);
      }
      else if (effect.kind === "number") SurvivorNeon.damageNumber(ctx,effect,alpha);
      else if (effect.kind === "spark") {SurvivorNeon.hit(ctx,effect,Math.min(alpha,effect.life/.12));}
      else if (effect.kind === "heal") { ctx.font = "bold 13px system-ui"; ctx.textAlign = "center"; ctx.fillText(effect.text, effect.x, effect.y); }
      else if (effect.kind === "evaporate") { ctx.beginPath(); ctx.ellipse(effect.x, effect.y, 13 * (1.5 - alpha), 18 * alpha, 0, 0, Math.PI * 2); ctx.fill(); }
      else { ctx.fillRect(effect.x - 2, effect.y - 2, 4, 4); }
      ctx.globalAlpha = 1;
  });
}

// Module accessors; legacy global functions and world facade remain unchanged.
globalThis.Survivor.render = globalThis.Survivor.render || {};
globalThis.Survivor.render['projectiles'] = globalThis.Survivor.render['projectiles'] || {};
Object.defineProperties(globalThis.Survivor.render['projectiles'], {
  drawProjectileArt: { enumerable: true, get: () => drawProjectileArt },
  drawGemArt: { enumerable: true, get: () => drawGemArt },
  drawEnemyShotArt: { enumerable: true, get: () => drawEnemyShotArt },
  drawParticleArt: { enumerable: true, get: () => drawParticleArt }
});
