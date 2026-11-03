// Survival catalog art shares clay materials; all positions/radii come from attack objects.
function survivalMaterial(name,r){
  const colors=SurvivorArtManifest.survivalMaterials[name], gradient=ctx.createLinearGradient(-r,-r,r,r);
  if(!gradient?.addColorStop)return colors[1];
  gradient.addColorStop(0,colors[0]);gradient.addColorStop(.48,colors[1]);gradient.addColorStop(1,colors[2]);return gradient;
}
function drawSurvivalBody(kind,x,y,r,angle=0) {
  const ink=SurvivorArtManifest.elements, clay=SurvivorArtManifest.survivalMaterials;ctx.save();ctx.translate(x,y);
  ctx.fillStyle=clay.shadow;ctx.beginPath();ctx.ellipse(1,r*.75,r*1.05,r*.4,0,0,Math.PI*2);ctx.fill();ctx.rotate(angle);
  ctx.lineWidth=1.3;ctx.strokeStyle=clay.dough[2];
  if(kind==='return'){
    ctx.fillStyle=survivalMaterial('dough',r);ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.fill();ctx.stroke();
    ctx.strokeStyle=survivalMaterial('icing',r);ctx.lineWidth=r*.45;ctx.beginPath();ctx.arc(0,0,r*.66,.15,Math.PI*1.8);ctx.stroke();
    ctx.fillStyle=clay.hole;ctx.beginPath();ctx.arc(0,0,r*.28,0,Math.PI*2);ctx.fill();
  }else if(kind==='fan'){
    ctx.fillStyle=survivalMaterial('ice',r);ctx.beginPath();ctx.moveTo(r*1.8,0);ctx.quadraticCurveTo(-r,r*1.2,-r,-r*.6);ctx.quadraticCurveTo(r*.2,-r*.8,r*1.8,0);ctx.fill();ctx.strokeStyle=ink.blue.light;ctx.beginPath();ctx.moveTo(-r*.4,-r*.3);ctx.lineTo(r,0);ctx.stroke();
  }else if(kind==='seek'){
    ctx.fillStyle=clay.wings;for(const y of [-r*.7,r*.7]){ctx.beginPath();ctx.ellipse(-r*.3,y,r*.7,r*.4,0,0,Math.PI*2);ctx.fill();}
    ctx.fillStyle=survivalMaterial('honey',r);ctx.beginPath();ctx.ellipse(0,0,r,r*.62,0,0,Math.PI*2);ctx.fill();ctx.strokeStyle=clay.honey[2];ctx.beginPath();ctx.moveTo(-r*.2,-r*.55);ctx.lineTo(-r*.2,r*.55);ctx.stroke();ctx.fillStyle=clay.hole;ctx.beginPath();ctx.arc(r*.55,-r*.15,2,0,Math.PI*2);ctx.fill();
  }else if(kind==='orbit'){
    ctx.fillStyle=survivalMaterial('dough',r);ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.fillStyle=clay.chips;
    for(let i=0;i<5;i++){const a=i*Math.PI*2/5;ctx.beginPath();ctx.ellipse(Math.cos(a)*r*.55,Math.sin(a)*r*.55,2.5,2,0,0,Math.PI*2);ctx.fill();}
  }else{
    ctx.fillStyle=survivalMaterial('bean',r);ctx.beginPath();ctx.ellipse(0,0,r*1.2,r*.8,.3,0,Math.PI*2);ctx.fill();ctx.strokeStyle=clay.bean[0];ctx.beginPath();ctx.ellipse(-r*.25,-r*.25,r*.45,r*.2,.3,0,Math.PI);ctx.stroke();
  }
  ctx.globalAlpha*=.5;ctx.strokeStyle=clay.highlight;ctx.lineWidth=1.8;ctx.beginPath();ctx.arc(-r*.15,-r*.1,r*.65,Math.PI*1.05,Math.PI*1.4);ctx.stroke();
  ctx.restore();
}
function drawSurvivalWeapons() {
  if(!state.loadout)return;
  for(const g of state.weaponEffects||[]){
    ctx.save();ctx.globalAlpha=Math.min(1,g.life*5);
    if(g.kind==='beam'){
      ctx.globalAlpha*=SurvivorArtManifest.survivalMaterials.beamAlpha;
      for(const q of g.parts){ctx.lineWidth=g.beamWidth*2;ctx.beginPath();ctx.moveTo(g.x,g.y);ctx.lineTo(q.x,q.y);SurvivorNeon.stroke(ctx,'blue');
        ctx.lineWidth=g.beamWidth*.6;ctx.beginPath();ctx.moveTo(g.x,g.y);ctx.lineTo(q.x,q.y);SurvivorNeon.stroke(ctx,'thunder');}
    }else if(g.kind==='zap'){
      for(const q of g.parts){ctx.fillStyle='#e7d4e8';for(let i=-1;i<=1;i++){ctx.beginPath();ctx.ellipse(q.x+i*12,q.y-52-(i===0?5:0),16,12,0,0,Math.PI*2);ctx.fill();}drawBolt(q.x,q.y-42,q.x,q.y);}
    }else if(g.kind==='field'||g.kind==='bomb'){
      for(const q of g.parts){
        const waiting=g.age<g.delay;ctx.globalAlpha=waiting?.35:Math.min(.7,g.life*2);ctx.fillStyle=g.kind==='bomb'?'#ecd190':'#8ecbdf';ctx.beginPath();ctx.arc(q.x,q.y,g.radius,0,Math.PI*2);ctx.fill();ctx.globalAlpha=.85;
        if(waiting){ctx.lineWidth=2;ctx.strokeStyle='#d9bc7b';ctx.beginPath();ctx.arc(q.x,q.y,g.radius*g.age/g.delay,0,Math.PI*2);ctx.stroke();}
        else if(g.kind==='field'){drawWaterLobe(q.x,q.y,g.radius);for(let i=-1;i<=1;i++)drawWaterDrop(q.x+i*g.radius*.45,q.y-18-Math.sin(g.age*9+i)*10,6,0);}
        else{for(let i=0;i<6;i++){const a=i*Math.PI/3;ctx.fillStyle='#fff0c4';ctx.beginPath();ctx.arc(q.x+Math.cos(a)*g.radius*.65,q.y+Math.sin(a)*g.radius*.65,5,0,Math.PI*2);ctx.fill();}}
      }
    }else for(const q of g.parts)if(q.alive!==false)drawSurvivalBody(g.kind,q.x,q.y,g.radius,q.angle||0);
    ctx.restore();
  }
  const bees=SurvivorLoadout.owned('honey-bees');
  if(bees){const count=SurvivorWeaponCatalog.level('honey-bees',bees.level).count,active=(state.weaponEffects||[]).filter(g=>g.kind==='seek').reduce((n,g)=>n+g.parts.filter(p=>p.alive).length,0);for(let i=active;i<count;i++){const a=state.elapsed*1.4+i*2.4;drawSurvivalBody('seek',state.player.x+Math.cos(a)*38,state.player.y-18+Math.sin(a)*18,8,a+.5);}}
}

Survivor.render['weapons-survival']={drawSurvivalWeapons,drawSurvivalBody,survivalMaterial};
