// 只讀揮擊事件畫圖，碰撞與傷害在 engine/weapons.js。
function drawHammerSwing(v, progress) {
  return SurvivorArt.paint('layer/draw-hammer-swing', null, () => drawHammerSwingPlaceholder.apply(this, arguments));
}
function drawHammerSwingPlaceholder(v, progress) {
  const heavy=v.heavy || v.boosted, width=heavy?20:11;
  if(v.slash===false && !(state.practiceHitboxes)) return;
  ctx.save();ctx.translate(v.x,v.y);ctx.rotate(v.angle);
  const alpha=ctx.globalAlpha;
  if(v.slash===false) ctx.globalAlpha=0;
  const color=BUILD_TUNING[(v.colors||['water'])[0]].color;
  if(v.thrust) {
    // 尖細突刺光，沿出手方向伸長；不畫矩形判定區。
    const tip=v.radius*(.65+.35*progress);
    ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(12,-width*.4);ctx.lineTo(tip,0);ctx.lineTo(12,width*.4);ctx.closePath();ctx.fill();
    ctx.strokeStyle='#fff9de';ctx.lineWidth=heavy?4:2;ctx.beginPath();ctx.moveTo(18,0);ctx.lineTo(tip,0);ctx.stroke();
  } else {
    const direction=v.reverse?-1:1, head=-v.arc/2+v.arc*(v.reverse?1-(.2+.8*progress):(.2+.8*progress));
    const tail=head-direction*Math.min(v.arc*(.2+.8*progress),1.8), outer=v.radius, inner=Math.max(1,outer-width);
    // 多片漸細的新月殘影，只有弧線邊緣發光，中心保持透明。
    for(let i=0;i<8;i++) {
      const a=tail+(head-tail)*i/8,b=tail+(head-tail)*(i+1)/8;
      ctx.fillStyle=i===7?'#fff9de':color;ctx.globalAlpha=alpha*(i+1)/8;
      ctx.beginPath();ctx.arc(0,0,outer,a,b,direction<0);
      ctx.arc(0,0,outer-(outer-inner)*(i+1)/8,b,a,direction>0);ctx.closePath();ctx.fill();
    }
  }
  ctx.restore();
  if(state.practiceHitboxes) {
    ctx.save();ctx.translate(v.x,v.y);ctx.rotate(v.angle);ctx.strokeStyle='#fff3a0';ctx.lineWidth=1;ctx.beginPath();
    if(v.thrust) ctx.rect(0,-v.width,v.radius,2*v.width);
    else {ctx.moveTo(0,0);ctx.arc(0,0,v.radius,-v.arc/2,v.arc/2);ctx.closePath();}
    ctx.stroke();ctx.restore();
  }
}

function drawHeldWeapon() {
  return SurvivorArt.paint('layer/draw-held-weapon', null, () => drawHeldWeaponPlaceholder.apply(this, arguments));
}
function drawHeldWeaponPlaceholder() {
  const weapon=activeWeapon(), a=state.weaponAttack;
  if(a) {
    ctx.save();ctx.strokeStyle=a.charge>=weapon.chargeSeconds?'#ffe28a':'#8bdcff';ctx.lineWidth=3;
    if(weapon.chargeEnabled && a.charge>0 && moveFeedback(weapon,'charge').hint) {ctx.beginPath();ctx.arc(state.player.x,state.player.y,state.player.r+9,-Math.PI/2,-Math.PI/2+Math.PI*2*a.charge/weapon.chargeSeconds);ctx.stroke();}
    if(weapon.comboEnabled && a.number && moveFeedback(weapon,'combo').hint) {ctx.fillStyle='#fff';ctx.font='bold 12px sans-serif';ctx.fillText(String(a.number)+' / '+weapon.comboEvery,state.player.x-12,state.player.y-state.player.r-14);}
    ctx.restore();
  }
  if(typeof drawManualAim === 'function') drawManualAim();
  if(weapon.kind!=='melee') return;
  SurvivorIcons.draw(ctx,weapon.icon,state.player.x+state.player.facing*20-10,state.player.y-5,24);
}
Survivor.render = Survivor.render || {};
Survivor.render.weapons = {drawHammerSwing,drawHeldWeapon};
