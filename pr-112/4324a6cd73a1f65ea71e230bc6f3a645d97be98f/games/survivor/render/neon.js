// Pre-rendered neon accents for the D art direction. No per-frame blur or gradients.
globalThis.SurvivorNeon=(()=>{
  const sprites={};
  const colors={blue:'#35b9ff',green:'#70e7ba',orange:'#ff6a3d',white:'#78cfff',pink:'#f5a1bc'};
  function glow(name){
    if(Object.prototype.hasOwnProperty.call(sprites,name))return sprites[name];
    const c=document.createElement('canvas');c.width=c.height=96;const g=c.getContext('2d');
    if(!g||typeof g.createRadialGradient!=='function'){sprites[name]=null;return null;}
    const grad=g.createRadialGradient(48,48,2,48,48,48);if(!grad||typeof grad.addColorStop!=='function'){sprites[name]=null;return null;}grad.addColorStop(0,'rgba(255,255,255,.78)');grad.addColorStop(.18,colors[name]);grad.addColorStop(.58,colors[name]+'66');grad.addColorStop(1,colors[name]+'00');
    g.fillStyle=grad;g.fillRect(0,0,96,96);sprites[name]=c;return c;
  }
  function glowAt(g,name,x,y,size,alpha=1){const image=glow(name);if(!image)return;g.save();g.globalCompositeOperation='lighter';g.globalAlpha=alpha;g.drawImage(image,x-size/2,y-size/2,size,size);g.restore();}
  function bullet(){
    if(Object.prototype.hasOwnProperty.call(sprites,'bullet'))return sprites.bullet;
    const c=document.createElement('canvas');c.width=48;c.height=14;const g=c.getContext('2d'),grad=g&&g.createLinearGradient(3,7,45,7);
    if(!g||!grad||typeof grad.addColorStop!=='function'){sprites.bullet=null;return null;}
    grad.addColorStop(0,'rgba(120,207,255,0)');grad.addColorStop(.32,'#78cfff');grad.addColorStop(.78,'#d6f6ff');grad.addColorStop(1,'#ffffff');
    g.fillStyle=grad;g.beginPath();g.moveTo(7,3);g.quadraticCurveTo(3,3,3,7);g.quadraticCurveTo(3,11,7,11);g.lineTo(41,11);g.quadraticCurveTo(45,11,45,7);g.quadraticCurveTo(45,3,41,3);g.closePath();g.fill();sprites.bullet=c;return c;
  }
  function projectile(g,shot,enabled=true){
    const dx=shot.vx||1,dy=shot.vy||0,a=Math.atan2(dy,dx);g.save();g.translate(shot.x,shot.y);g.rotate(a);
    if(enabled)glowAt(g,'blue',0,0,48,.9);const image=bullet();
    if(image)g.drawImage(image,-24,-7,48,14);else{g.fillStyle='#78cfff';g.fillRect(-21,-4,42,8);}g.restore();
  }
  function gem(g,item,enabled=true){const x=item.x,y=item.y+Math.sin(item.wobble)*2;if(enabled)glowAt(g,'green',x,y,34,.85);g.save();g.translate(x,y);g.rotate(Math.PI/4);g.fillStyle='#70e7ba';g.fillRect(-5.5,-5.5,11,11);g.fillStyle='rgba(255,255,255,.72)';g.fillRect(-3,-3,2.5,2.5);g.restore();}
  function warning(g,x,y,r,progress=1){const alpha=.25+.75*Math.max(0,Math.min(1,progress));glowAt(g,'orange',x,y,r*2.5,alpha*.7);g.save();g.globalAlpha=alpha;g.fillStyle='rgba(255,106,61,.12)';g.strokeStyle='#ff6a3d';g.lineWidth=3;g.beginPath();g.arc(x,y,r,0,Math.PI*2);g.fill();g.stroke();if(g.ellipse&&g.setLineDash){g.setLineDash([5,5]);g.strokeStyle='#ffa94d';g.lineWidth=2;g.beginPath();g.ellipse(x,y,Math.max(1,r-6),Math.max(1,r-6),0,0,Math.PI*2);g.stroke();g.setLineDash([]);}g.restore();}
  function hit(g,e,alpha){const p=1-alpha;glowAt(g,'white',e.x,e.y,46,alpha);g.save();g.globalCompositeOperation='lighter';g.globalAlpha=alpha;g.strokeStyle='#d6f6ff';g.lineWidth=2;g.beginPath();g.arc(e.x,e.y,6+p*16,0,Math.PI*2);g.stroke();for(let i=0;i<8;i++){const a=i*Math.PI/4,len=9+p*14;g.beginPath();g.moveTo(e.x+Math.cos(a)*4,e.y+Math.sin(a)*4);g.lineTo(e.x+Math.cos(a)*len,e.y+Math.sin(a)*len);g.stroke();}g.restore();}
  function damageNumber(g,e,alpha){const critical=(e.numberScale||1)>1.35,size=critical?34:15*(e.numberScale||1);g.save();g.globalAlpha=alpha;g.textAlign='center';g.font=`800 ${size}px "M PLUS Rounded 1c",system-ui`;g.lineWidth=critical?4:3;g.strokeStyle=critical?'#ff6a3d':'#35b9ff';g.fillStyle=critical?'#ffe08a':'#fff';g.strokeText(critical?e.text+'!':e.text,e.x,e.y);g.fillText(critical?e.text+'!':e.text,e.x,e.y);g.restore();}
  function weakpointBurst(g,x,y,alpha=1){
    g.save();g.globalCompositeOperation='lighter';g.globalAlpha=Math.min(1,alpha);glowAt(g,'pink',x,y,76,.9);g.strokeStyle='#ffd3df';g.lineWidth=3;
    for(let i=0;i<10;i++){const a=i*Math.PI/5,inner=9+(i%2)*3,outer=24+(i%3)*5;g.beginPath();g.moveTo(x+Math.cos(a)*inner,y+Math.sin(a)*inner);g.lineTo(x+Math.cos(a)*outer,y+Math.sin(a)*outer);g.stroke();}
    g.restore();
  }
  const api={projectile,gem,warning,hit,damageNumber,glowAt,weakpointBurst};globalThis.Survivor=globalThis.Survivor||{};globalThis.Survivor.render=globalThis.Survivor.render||{};globalThis.Survivor.render.neon=api;return api;
})();
