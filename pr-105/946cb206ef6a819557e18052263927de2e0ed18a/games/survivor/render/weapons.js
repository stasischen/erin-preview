// 只讀揮擊事件畫圖，碰撞與傷害在 engine/weapons.js。
function drawHammerSwing(v, progress) {
  return SurvivorArt.paint('layer/draw-hammer-swing', null, () => drawHammerSwingPlaceholder.apply(this, arguments));
}
function drawHammerSwingPlaceholder(v, progress) {
  const heavy=v.heavy || v.boosted, sword=v.weaponId==='candy-sword', width=sword?(heavy?12:7):(heavy?24:14);
  if(v.slash===false && !(state.practiceHitboxes)) return;
  ctx.save();ctx.translate(v.x,v.y);ctx.rotate(v.angle);
  const alpha=ctx.globalAlpha;
  if(v.slash===false) ctx.globalAlpha=0;
  const palette=SurvivorArtManifest.assets['layer/draw-hammer-swing'].schoolPalette;
  const schools=v.elementCharged?['thunder']:(v.colors||['water']);
  const ink=palette[schools[0]]||palette.water, color=ink.body;
  if(v.thrust) {
    // 尖細突刺光，沿出手方向伸長；不畫矩形判定區。
    const tip=v.radius*(.65+.35*progress), bladeWidth=Math.max(width*.4,v.width*.35);
    ctx.fillStyle=SurvivorMaterials.gradient(ctx,SurvivorMaterials.ink(schools[0]),tip);ctx.beginPath();ctx.moveTo(12,-bladeWidth);ctx.lineTo(tip,0);ctx.lineTo(12,bladeWidth);ctx.closePath();ctx.fill();
    ctx.strokeStyle='#fff9de';ctx.lineWidth=heavy?4:2;ctx.beginPath();ctx.moveTo(18,0);ctx.lineTo(tip,0);SurvivorNeon.stroke(ctx,ink.neon);
  } else {
    const direction=v.reverse?-1:1, head=-v.arc/2+v.arc*(v.reverse?1-(.2+.8*progress):(.2+.8*progress));
    const tail=head-direction*Math.min(v.arc*(.2+.8*progress),1.8), outer=v.radius, inner=Math.max(1,outer-width);
    // 多片漸細的新月殘影，只有弧線邊緣發光，中心保持透明。
    for(let i=0;i<8;i++) {
      const a=tail+(head-tail)*i/8,b=tail+(head-tail)*(i+1)/8;
      ctx.fillStyle=SurvivorMaterials.gradient(ctx,SurvivorMaterials.ink(schools[0]),outer);ctx.globalAlpha=alpha*(i+1)/8;
      ctx.beginPath();ctx.arc(0,0,outer,a,b,direction<0);
      ctx.arc(0,0,outer-(outer-inner)*(i+1)/8,b,a,direction>0);ctx.closePath();ctx.fill();
    }
    ctx.globalAlpha=alpha*.65;ctx.lineWidth=heavy?3:1.5;
    ctx.beginPath();ctx.arc(0,0,outer,tail,head,direction<0);SurvivorNeon.stroke(ctx,ink.neon);
  }
  if(!sword && !v.thrust) {
    ctx.globalAlpha=alpha*(1-progress);ctx.lineWidth=heavy?4:2;
    ctx.beginPath();ctx.arc(0,0,v.radius*.7,-v.arc/2,v.arc/2);SurvivorNeon.stroke(ctx,ink.neon);
  }
  if(schools.length>1 || v.elementCharged) {
    ctx.globalAlpha=alpha*.8;ctx.lineWidth=2;ctx.beginPath();
    const second=palette[schools[1]]||ink;
    ctx.moveTo(v.radius*.35,-5);ctx.lineTo(v.radius*.58,4);ctx.lineTo(v.radius*.72,-5);ctx.lineTo(v.radius*.9,0);
    SurvivorNeon.stroke(ctx,second.neon);
  }
  ctx.restore();
  if(state.practiceHitboxes) {
    ctx.save();ctx.translate(v.x,v.y);ctx.rotate(v.angle);ctx.strokeStyle='#fff3a0';ctx.lineWidth=1;ctx.beginPath();
    if(v.thrust) ctx.rect(0,-v.width,v.radius,2*v.width);
    else {ctx.moveTo(0,0);ctx.arc(0,0,v.radius,-v.arc/2,v.arc/2);ctx.closePath();}
    ctx.stroke();ctx.restore();
  }
}

// Smooth, pre-painted toy weapons. UI icons remain separate from world objects.
const CLAY_WEAPON_IMAGES={};
function clayWeaponImage(id) {
  if(CLAY_WEAPON_IMAGES[id])return CLAY_WEAPON_IMAGES[id];
  const image=document.createElement('canvas');image.width=192;image.height=112;
  const g=image.getContext('2d'), palette=SurvivorArtManifest.assets['layer/draw-held-weapon'].clayPalette;
  g.scale(2,2);g.translate(12,28);g.lineJoin='round';g.lineCap='round';
  const fill=(colors,y=-18,h=36)=>{
    const grad=g.createLinearGradient?.(0,y,0,y+h);
    if(!grad?.addColorStop)return colors[1];
    colors.forEach((c,i)=>grad.addColorStop(i/(colors.length-1),c));return grad;
  };
  const pill=(x1,y1,x2,y2,width,colors)=>{
    g.beginPath();g.moveTo(x1,y1);g.lineTo(x2,y2);g.lineWidth=width+2;g.strokeStyle=colors[2];g.stroke();
    g.lineWidth=width;g.strokeStyle=fill(colors,-width/2,width);g.stroke();
  };
  pill(-3,0,31,0,9,palette.handle);
  if(id==='candy-hammer') {
    pill(37,-12,37,12,25,palette.hammer);
    pill(27,-11,27,11,7,palette.trim);pill(48,-11,48,11,7,palette.trim);
    g.fillStyle='rgba(255,255,255,.55)';g.beginPath();g.ellipse(35,-12,7,3,-.12,0,Math.PI*2);g.fill();
  } else {
    g.beginPath();g.moveTo(13,-8);g.quadraticCurveTo(38,-12,62,-3);g.quadraticCurveTo(69,0,62,3);
    g.quadraticCurveTo(38,12,13,8);g.closePath();g.fillStyle=fill(palette.blade,-10,20);g.fill();
    g.strokeStyle=palette.blade[2];g.lineWidth=1.5;g.stroke();
    g.beginPath();g.moveTo(19,-4);g.quadraticCurveTo(39,-6,60,-1);g.strokeStyle='#edfbff';g.lineWidth=3;g.stroke();
    pill(12,-12,12,12,6,palette.trim);
    g.fillStyle=palette.hammer[1];g.beginPath();g.arc(12,0,4,0,Math.PI*2);g.fill();
  }
  // A soft clay mitten closes around the grip, attaching the prop to the character.
  g.fillStyle=fill(['#fff0d9','#ecc79e','#bc8c69'],-5,10);g.beginPath();g.ellipse(1,0,6,6,0,0,Math.PI*2);g.fill();
  CLAY_WEAPON_IMAGES[id]=image;return image;
}
function drawClayHeldWeapon(weapon) {
  const p=state.player, hop=(p.moving?Math.abs(Math.sin(p.walkPhase))*2:0)+(p.airHeight||0);
  const scale=SurvivorArtManifest.assets['character/player'].worldScale||1;
  const swing=state.vfx.slice().reverse().find(v=>v.kind==='hammer-swing' && v.weaponId===weapon.id && v.life>0);
  const charge=weapon.chargeSeconds?Math.min(1,(state.weaponAttack?.charge||0)/weapon.chargeSeconds):0;
  let angle=-1.05-charge*.65, side=p.facing||1, extension=0;
  if(swing) {
    const progress=1-swing.life/swing.maxLife;
    angle=swing.thrust?swing.angle:swing.angle-swing.arc/2+swing.arc*(swing.reverse?1-progress:progress);
    side=Math.cos(swing.angle)<0?-1:1;extension=swing.thrust?Math.sin(progress*Math.PI)*14:0;
  }
  ctx.save();ctx.imageSmoothingEnabled=true;
  ctx.translate(p.x+side*22*scale+(swing?Math.cos(swing.angle)*extension:0),p.y-23*scale-hop+(swing?Math.sin(swing.angle)*extension:0));
  ctx.scale(scale,scale);
  if(!swing)ctx.scale(side,1);
  ctx.rotate(angle);ctx.drawImage(clayWeaponImage(weapon.id),-12,-28,96,56);ctx.restore();
}

function drawHeldWeapon() {
  return SurvivorArt.paint('layer/draw-held-weapon', null, () => drawHeldWeaponPlaceholder.apply(this, arguments));
}
function drawHeldWeaponPlaceholder() {
  const weapon=activeWeapon(), a=state.weaponAttack;
  if(a) {
    ctx.save();ctx.strokeStyle=a.charge>=weapon.chargeSeconds?'#ffe28a':'#8bdcff';ctx.lineWidth=3;
    if(weapon.chargeEnabled && a.charge>0 && moveFeedback(weapon,'charge').hint) {ctx.beginPath();ctx.arc(state.player.x,state.player.y,state.player.r+9,-Math.PI/2,-Math.PI/2+Math.PI*2*a.charge/weapon.chargeSeconds);SurvivorNeon.stroke(ctx,'blue');}
    if(weapon.comboEnabled && a.number && moveFeedback(weapon,'combo').hint) {ctx.fillStyle='#fff';ctx.font='bold 12px sans-serif';ctx.fillText(String(a.number)+' / '+weapon.comboEvery,state.player.x-12,state.player.y-94-(state.player.airHeight||0));}
    ctx.restore();
  }
  if(typeof drawManualAim === 'function') drawManualAim();
  if(weapon.kind!=='melee') return;
  drawClayHeldWeapon(weapon);
}
Survivor.render = Survivor.render || {};
Survivor.render.weapons = {drawHammerSwing,drawHeldWeapon};
