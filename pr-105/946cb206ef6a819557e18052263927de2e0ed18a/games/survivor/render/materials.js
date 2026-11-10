// Filled clay volumes, layered ribbons and soft highlights, shared by all friendly effects.
globalThis.SurvivorMaterials=(()=>{
  const ink=school=>SurvivorArtManifest.elements[school==='water'?'blue':school==='wind'?'green':school]||SurvivorArtManifest.elements.blue;
  function gradient(g,c,r){const fill=g.createLinearGradient(-r,-r,r,r);if(!fill?.addColorStop)return c.body;fill.addColorStop(0,c.light);fill.addColorStop(.45,c.body);fill.addColorStop(1,c.edge);return fill;}
  function volume(x,y,r,school,alpha=.55,squash=1){
    const c=ink(school);ctx.save();ctx.translate(x,y);ctx.globalAlpha*=alpha;
    ctx.fillStyle=SurvivorArtManifest.effectMaterials.shadow;ctx.beginPath();ctx.ellipse(2,r*.4,r,r*.45,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle=gradient(ctx,c,r);ctx.beginPath();ctx.ellipse(0,0,r,r*squash,0,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle=c.light;ctx.globalAlpha*=.6;ctx.lineWidth=Math.max(2,r*.09);ctx.beginPath();ctx.ellipse(-r*.12,-r*.12,r*.65,r*squash*.65,-.2,Math.PI,Math.PI*1.65);ctx.stroke();ctx.restore();
  }
  function ribbon(x,y,r,school,phase=0){
    const c=ink(school);ctx.save();ctx.translate(x,y);ctx.rotate(phase);
    ctx.fillStyle=gradient(ctx,c,r);ctx.globalAlpha*=SurvivorArtManifest.effectMaterials.ribbonAlpha;
    ctx.beginPath();ctx.ellipse(0,0,r,r*.72,0,0,Math.PI*1.55);ctx.ellipse(0,0,r*.62,r*.42,0,Math.PI*1.55,0,true);ctx.closePath();ctx.fill();
    ctx.strokeStyle=c.light;ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(0,-r*.03,r*.84,r*.58,0,.15,Math.PI*.95);ctx.stroke();ctx.restore();
  }
  function vortex(x,y,r,phase=0,school='wind'){
    ctx.save();ctx.globalAlpha*=.85;
    volume(x,y,r,school,.13,.75);
    for(let i=0;i<3;i++)ribbon(x,y-r*i*.13,r*(1-i*.23),school,phase+i*1.9);
    volume(x,y-r*.15,r*.2,school,.45);ctx.restore();
  }
  function burst(x,y,r,school,progress=.5){
    const c=ink(school);ctx.save();ctx.globalAlpha*=Math.min(1,(1-progress)*2);
    volume(x,y,r,school,SurvivorArtManifest.effectMaterials.surfaceAlpha);
    for(let i=0;i<6;i++){const a=i*Math.PI/3,d=r*(.45+.35*progress);volume(x+Math.cos(a)*d,y+Math.sin(a)*d,r*(.14-.06*progress),school,.65,.8);}
    ctx.strokeStyle=c.light;ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y,r*.88,0,Math.PI*2);ctx.stroke();ctx.restore();
  }
  function bolt(x,y,x2,y2,width=9){
    const dx=deltaX(x2,x),dy=deltaY(y2,y),length=Math.max(1,Math.hypot(dx,dy)),c=ink('thunder');
    ctx.save();ctx.translate(x,y);ctx.rotate(Math.atan2(dy,dx));ctx.fillStyle=gradient(ctx,c,length);
    // A branching filled lightning shard, with opaque body and a narrow highlight.
    ctx.beginPath();ctx.moveTo(0,-width*.35);ctx.lineTo(length*.3,-width);ctx.lineTo(length*.47,width*.15);ctx.lineTo(length*.68,-width*.55);ctx.lineTo(length,0);ctx.lineTo(length*.64,width*.4);ctx.lineTo(length*.45,width);ctx.lineTo(length*.28,width*.1);ctx.closePath();ctx.fill();
    ctx.strokeStyle=c.light;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(2,0);ctx.quadraticCurveTo(length*.3,-width*.4,length*.47,width*.3);ctx.lineTo(length*.7,0);ctx.lineTo(length,0);ctx.stroke();ctx.restore();
    volume(x2,y2,width*1.2,'thunder',.45);
  }
  function beam(x,y,x2,y2,width,phase=0){
    const dx=deltaX(x2,x),dy=deltaY(y2,y),length=Math.hypot(dx,dy),c=ink('water');
    ctx.save();ctx.translate(x,y);ctx.rotate(Math.atan2(dy,dx));ctx.globalAlpha*=.62;
    ctx.fillStyle=gradient(ctx,c,width);ctx.beginPath();ctx.moveTo(0,-width);ctx.lineTo(length,-width);
    ctx.arc(length,0,width,-Math.PI/2,Math.PI/2);ctx.lineTo(0,width);ctx.arc(0,0,width,Math.PI/2,Math.PI*1.5);ctx.closePath();ctx.fill();
    // Two twisted sugar ribbons flow inside the true capsule, tapering into its ends.
    for(let strand=0;strand<2;strand++){
      ctx.fillStyle=ink(strand?'thunder':'water').light;ctx.globalAlpha*=.85;ctx.beginPath();
      for(let side=0;side<2;side++)for(let n=0;n<=16;n++){
        const t=(side?16-n:n)/16,x=t*length,taper=Math.sin(t*Math.PI),center=Math.sin(t*Math.PI*3-phase*7+strand*Math.PI)*width*.48*taper;
        const y=center+(side?-1:1)*width*.17*taper;if(!side&&!n)ctx.moveTo(x,y);else ctx.lineTo(x,y);
      }ctx.closePath();ctx.fill();
    }
    volume(length,0,width*.7,'water',.35,.8);
    ctx.restore();
  }
  function cloud(x,y,r){for(let i=-1;i<=1;i++)volume(x+i*r*.6,y-(i===0?r*.2:0),r,'thunder',.85,.7);}
  return {ink,gradient,volume,ribbon,vortex,burst,bolt,beam,cloud};
})();
Survivor.render=Survivor.render||{};Survivor.render.materials=SurvivorMaterials;
