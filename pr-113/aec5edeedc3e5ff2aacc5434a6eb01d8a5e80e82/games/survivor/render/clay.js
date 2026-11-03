// D1 主角黏土造型：所有漸層與姿勢只在載入時預繪，遊戲逐幀只貼圖。
(function(root) {
  'use strict';
  const W=64,H=80,PAD=20,VPAD=10,CW=W+PAD*2,CH=H+VPAD*2,S=2;
  const colors={hood:['#ffffff','#d6f6ff','#78cfff','#388de6','#2464bb'],body:['#78cfff','#388de6','#2464bb','#183b70'],skin:['#fff6ea','#f0cfa4','#c9936b'],limb:['#d6f6ff','#78cfff','#388de6'],leg:['#c9936b','#936246','#5a3a2b']};
  const cache={};
  const clamp=n=>Math.max(0,Math.min(1,n));
  let supported=false;
  try {
    const probe=document.createElement('canvas').getContext('2d').createRadialGradient(0,0,0,1,1,1);
    supported=!!probe&&typeof probe.addColorStop==='function';
  } catch {}
  function gradient(g,x,y,w,h,palette) {
    const r=Math.max(w,h)*.78,fill=g.createRadialGradient(x+w*.3,y+h*.26,1,x+w*.42,y+h*.48,r);
    const stops=palette.length===5?[0,.05,.32,.58,1]:palette.length===4?[0,.05,.38,1]:palette.length===3?[0,.42,1]:palette.length===2?[0,1]:[0];
    palette.forEach((color,i)=>fill.addColorStop(stops[i],color));return fill;
  }
  function oval(g,x,y,w,h,palette,outline=false) {
    g.beginPath();g.ellipse(x+w/2,y+h/2,w/2,h/2,0,0,Math.PI*2);
    g.fillStyle=gradient(g,x,y,w,h,palette);g.fill();
    if(outline){g.strokeStyle='#78cfff';g.lineWidth=1.3;g.stroke();}
  }
  function limb(g,x,y,angle) {
    g.save();g.translate(x,y);g.rotate(angle);oval(g,-5,-2,10,19,colors.limb,true);g.restore();
  }
  function foot(g,x,y,lift) { oval(g,x,y-lift,12,8,colors.leg,true); }
  function star(g,x,y,r) {
    g.beginPath();for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,rad=i%2?r*.45:r,px=x+Math.cos(a)*rad,py=y+Math.sin(a)*rad;i?g.lineTo(px,py):g.moveTo(px,py);}
    g.closePath();g.fillStyle='#ffe08a';g.fill();g.strokeStyle='#fff6c5';g.lineWidth=.8;g.stroke();
  }
  function makePose(name,step=0) {
    const canvas=document.createElement('canvas');canvas.width=CW*S;canvas.height=CH*S;
    const g=canvas.getContext('2d');g.scale(S,S);g.translate(PAD,VPAD);
    let shiftX=0,tilt=0,sx=1,sy=1,armL=12*Math.PI/180,armR=-12*Math.PI/180,liftL=0,liftR=0,closed=false;
    if(name==='run'){tilt=step?-5:5;shiftX=0;sx=1.02;sy=.98;armL=(step?25:-25)*Math.PI/180;armR=-armL;liftL=step?0:4.5;liftR=step?4.5:0;}
    if(name==='windup'){sx=1.12;sy=.86;armL=140*Math.PI/180;armR=-140*Math.PI/180;}
    if(name==='active'){sx=.90;sy=1.14;armL=8*Math.PI/180;armR=-60*Math.PI/180;}
    if(name==='hurt'||name==='stun'){shiftX=3.2;tilt=10;sx=1.04;sy=.94;armL=-70*Math.PI/180;armR=70*Math.PI/180;closed=true;}
    if(name==='recovery'){const t=step/4;sx=1.12-(.22*t);sy=.86+(.28*t);armL=(140*(1-t)+12*t)*Math.PI/180;armR=(-140*(1-t)-12*t)*Math.PI/180;}
    g.translate(W/2+shiftX,H);g.rotate(tilt*Math.PI/180);g.scale(sx,sy);g.translate(-W/2,-H);
    foot(g,19,68.5,liftL);foot(g,34,68.5,liftR);
    oval(g,16,46,32,28,colors.body,true);
    limb(g,13,47,armL);limb(g,51,47,armR);
    oval(g,0,0,64,55,colors.hood,true);
    oval(g,11,17,42,34,colors.skin);
    // 高光只存在於預繪圖，不在遊戲每幀建立漸層。
    g.beginPath();g.ellipse(20,20,7,3,-.35,0,Math.PI*2);g.fillStyle='rgba(255,255,255,.62)';g.fill();
    if(closed){
      g.strokeStyle='#383349';g.lineWidth=1.8;
      for(const x of [22,42]){g.beginPath();g.moveTo(x-3,33);g.lineTo(x+3,36);g.stroke();}
    }else{
    for(const x of [21,38]){oval(g,x,28,5.8,9,['#383349']);g.fillStyle='#9a95b0';g.beginPath();g.arc(x+1.3,30,1.05,0,Math.PI*2);g.fill();}
    }
    oval(g,15,39,7,4,['#f5a1bc']);oval(g,42,39,7,4,['#f5a1bc']);
    if(name==='stun'){star(g,12,5,5);star(g,32,3,5);star(g,53,5,5);}
    return canvas;
  }
  if(supported){
    cache.idle=makePose('idle');cache.run=[makePose('run',0),makePose('run',1)];
    cache.windup=makePose('windup');cache.active=makePose('active');cache.hurt=makePose('hurt');cache.stun=makePose('stun');
    cache.recovery=Array.from({length:5},(_,i)=>makePose('recovery',i));
    cache.flash={};
    for(const [name,frames] of Object.entries(cache)){
      if(name==='flash')continue;
      const list=Array.isArray(frames)?frames:[frames];
      cache.flash[name]=list.map(source=>{
        const image=document.createElement('canvas');image.width=source.width;image.height=source.height;
        const ink=image.getContext('2d');ink.drawImage(source,0,0);ink.globalCompositeOperation='source-in';ink.fillStyle='#fff';ink.fillRect(0,0,image.width,image.height);return image;
      });
    }
  }
  function drawPlayer(g,options={}) {
    if(!supported)return false;
    let name=options.animation||'idle';if(name==='dodge')name='run';
    let index=0,frames=cache[name];
    if(name==='run'){frames=cache.run;index=Math.floor((options.elapsed||0)/.18)%2;}
    if(name==='recovery'){frames=cache.recovery;index=Math.round(4*clamp((options.phaseElapsed||0)/Math.max(.15,options.phaseDuration||.15)));}
    if(!Array.isArray(frames))frames=[frames];
    const sprite=frames[index]||cache.idle;
    const y=-H-VPAD+(options.groundOffset||0);
    g.save();
    if(name==='idle')g.scale(1,1+.03*Math.sin((options.elapsed||0)*Math.PI*2/.8));
    if(name==='run')g.translate(0,-2);
    g.drawImage(sprite,-W/2-PAD,y,CW,CH);
    if(options.flash){const flashFrames=cache.flash[name]||cache.flash.idle;g.globalCompositeOperation='lighter';g.globalAlpha=.72;g.drawImage(flashFrames[index]||flashFrames[0],-W/2-PAD,y,CW,CH);}
    g.restore();return true;
  }
  const monsterCache={},tintedCache=new WeakMap();
  const styles={
    'jelly-slime':['slime',['#ffffff','#ffd3df','#c2607f'],'#bf83ff'],pudding:['pudding',['#fffbe6','#ffe08a','#ffa94d'],'#bf83ff'],
    'chocolate-bear':['bear',['#f0cfa4','#c9936b','#5a3a2b'],'#ff6a3d'],'gummy-bear':['bear',['#fff0c4','#e99c51','#a94f58'],'#bf83ff'],
    'marshmallow-rabbit':['rabbit',['#ffffff','#d6f6ff','#78cfff'],'#bf83ff'],'marshmallow-fairy':['fairy',['#ffffff','#bce3ec','#789cae'],'#bf83ff'],
    'pop-candy':['candy',['#ffe5b8','#e87994','#a74765'],'#bf83ff'],'soda-bubble':['bubble',['#ffffff','#70c9de','#347b9a'],'#78cfff'],
    'macaron-knight':['macaron',['#fff0fb','#b9a2e1','#776398'],'#bf83ff'],'donut-spinner':['donut',['#fff0e3','#d89561','#a85553'],'#bf83ff'],
    'mushroom-hopper':['mushroom',['#fff3d1','#df788a','#a54f67'],'#bf83ff'],'hedgehog-ball':['hedgehog',['#eed4b0','#a48270','#604c48'],'#bf83ff'],
    dandelion:['flower',['#ffffff','#f4dc7b','#79aa5e'],'#bf83ff'],'moss-rock':['rock',['#dce3cb','#87958e','#52645f'],'#bf83ff'],
    'firefly-lantern':['lantern',['#fff8bf','#e9c968','#a77b3d'],'#bf83ff'],'little-cloud':['cloud',['#ffffff','#d9eef5','#8bb9cb'],'#bf83ff'],
    gatekeeper:['gatekeeper',['#fff0d0','#9b9aab','#4b536e'],'#78cfff'],
    'frost-twin':['frost',['#ffffff','#9ee8ff','#4c86c4'],'#78cfff'],
    'fire-twin':['fire',['#fff2bd','#ff9d48','#c94839'],'#ff6a3d'],
    winged:['winged',['#fff1ff','#bea7e7','#66528d'],'#bf83ff'],
    assassin:['assassin',['#f4e8ff','#9d83b9','#39354d'],'#ff6a3d']
  };
  const monsterIds=Object.keys(styles);
  function monsterOval(g,x,y,w,h,palette,outline) {
    g.beginPath();g.ellipse(x+w/2,y+h/2,w/2,h/2,0,0,Math.PI*2);g.fillStyle=gradient(g,x,y,w,h,palette);g.fill();
    if(outline){g.strokeStyle=outline;g.lineWidth=2;g.stroke();}
  }
  function monsterFace(g,x,y,closed=false) {
    if(closed){g.strokeStyle='#383349';g.lineWidth=2;for(const dx of [-8,8]){g.beginPath();g.moveTo(x+dx-3,y);g.lineTo(x+dx+3,y+2);g.stroke();}}
    else for(const dx of [-8,8]){monsterOval(g,x+dx-3,y-5,6,10,['#383349']);g.fillStyle='#fff';g.fillRect(x+dx-2,y-4,2,2);}
    monsterOval(g,x-19,y+5,7,4,['#f5a1bc']);monsterOval(g,x+12,y+5,7,4,['#f5a1bc']);
  }
  function monsterPath(g,points,palette,outline) {
    g.beginPath();g.moveTo(points[0][0],points[0][1]);for(const p of points.slice(1))g.lineTo(p[0],p[1]);g.closePath();
    g.fillStyle=gradient(g,18,24,60,64,palette);g.fill();g.strokeStyle=outline;g.lineWidth=2;g.stroke();
  }
  function paintMonster(g,id,pose,step) {
    const [kind,c,glow]=styles[id],closed=pose==='hurt'||pose==='stun';
    let sx=1,sy=1,tilt=0,dx=0;
    if(pose==='run'){sx=1.03;sy=.97;tilt=step?5:-5;}
    if(pose==='windup'){sx=1.10;sy=.88;}
    if(pose==='active'){sx=.91;sy=1.12;tilt=-3;}
    if(pose==='hurt'||pose==='stun'){sx=1.04;sy=.94;tilt=9;dx=3;}
    if(pose==='recovery'){const t=step/4;sx=1.10-.19*t;sy=.88+.24*t;}
    g.save();g.translate(48+dx,88);g.rotate(tilt*Math.PI/180);g.scale(sx,sy);g.translate(-48,-88);
    const outline=glow;
    if(kind==='slime'){
      g.beginPath();g.moveTo(20,83);g.quadraticCurveTo(17,48,30,40);g.quadraticCurveTo(48,27,66,40);g.quadraticCurveTo(81,51,76,83);g.quadraticCurveTo(48,94,20,83);g.fillStyle=gradient(g,20,38,56,53,c);g.fill();g.strokeStyle=outline;g.lineWidth=2;g.stroke();monsterFace(g,48,62,closed);
    }else if(kind==='pudding'){
      monsterOval(g,21,53,54,36,c,outline);monsterOval(g,26,43,44,24,['#5a3a2b','#936246','#c9936b'],outline);monsterOval(g,29,55,38,28,c);monsterFace(g,48,66,closed);
    }else if(kind==='bear'){
      monsterOval(g,21,25,20,21,c,outline);monsterOval(g,55,25,20,21,c,outline);monsterOval(g,17,56,17,26,c,outline);monsterOval(g,62,56,17,26,c,outline);
      monsterOval(g,27,65,18,20,c,outline);monsterOval(g,51,65,18,20,c,outline);monsterOval(g,22,39,52,45,c,outline);monsterOval(g,29,26,38,39,c,outline);
      monsterOval(g,35,58,26,23,['#fff6ea','#f0cfa4','#c9936b']);monsterFace(g,48,47,closed);monsterOval(g,45,59,6,4,['#383349']);
    }else if(kind==='rabbit'){
      monsterOval(g,27,10,17,39,c,outline);monsterOval(g,52,10,17,39,c,outline);monsterOval(g,32,14,7,27,['#f5a1bc']);monsterOval(g,57,14,7,27,['#f5a1bc']);
      monsterOval(g,22,53,52,35,c,outline);monsterOval(g,27,31,42,41,c,outline);monsterFace(g,48,51,closed);
    }else if(kind==='fairy'){
      monsterOval(g,7,48,34,28,c,outline);monsterOval(g,55,48,34,28,c,outline);monsterOval(g,27,48,42,39,c,outline);monsterOval(g,34,26,28,29,c,outline);
      monsterFace(g,48,39,closed);monsterOval(g,42,14,12,13,['#fff0a5','#f4dc7b','#c9936b']);
    }else if(kind==='candy'){
      monsterPath(g,[[14,43],[22,35],[32,40],[48,32],[64,40],[75,35],[82,44],[73,53],[79,63],[67,70],[48,66],[29,72],[19,63],[24,53]],c,outline);monsterOval(g,23,43,50,40,c,outline);monsterFace(g,48,56,closed);
    }else if(kind==='bubble'){
      monsterOval(g,20,39,56,50,c,outline);monsterOval(g,61,20,18,18,c,outline);monsterOval(g,29,45,9,7,['#ffffff','#d6f6ff','#78cfff']);monsterFace(g,48,59,closed);
    }else if(kind==='macaron'){
      monsterOval(g,20,42,56,18,c,outline);monsterOval(g,23,55,50,30,['#fff6ea','#f0cfa4','#c9936b'],outline);monsterOval(g,20,70,56,18,c,outline);monsterFace(g,48,62,closed);monsterOval(g,70,58,10,25,['#d6f6ff','#78cfff','#388de6'],outline);
    }else if(kind==='donut'){
      monsterOval(g,17,29,62,59,c,outline);monsterOval(g,37,49,22,22,['#d8b8a1','#a97759','#704938']);monsterFace(g,48,58,closed);monsterOval(g,27,29,9,8,['#fff0a5','#f5a1bc','#78cfff']);
    }else if(kind==='mushroom'){
      monsterOval(g,31,48,34,40,['#fff6ea','#f0cfa4','#c9936b'],outline);monsterOval(g,14,28,68,39,c,outline);monsterOval(g,28,29,13,13,['#fff6ea']);monsterOval(g,58,25,13,13,['#fff6ea']);monsterFace(g,48,61,closed);
    }else if(kind==='hedgehog'){
      for(let i=0;i<7;i++){const x=18+i*10;monsterOval(g,x,28+(i%2)*5,14,28,['#c8b39b','#8e7563','#604c48'],outline);}
      monsterOval(g,20,46,58,42,c,outline);monsterOval(g,39,51,37,32,['#fff6ea','#f0cfa4','#c9936b']);monsterFace(g,55,62,closed);
    }else if(kind==='flower'){
      monsterOval(g,44,57,9,32,['#d6f6a8','#79aa5e','#476f43']);monsterOval(g,29,75,24,9,['#d6f6a8','#79aa5e','#476f43']);monsterOval(g,50,71,22,9,['#d6f6a8','#79aa5e','#476f43']);
      for(let i=0;i<8;i++){const a=i*Math.PI/4;monsterOval(g,48+Math.cos(a)*14-8,32+Math.sin(a)*14-8,16,16,c,outline);}monsterOval(g,37,21,22,22,['#ffe08a','#ffa94d','#c9936b'],outline);monsterFace(g,48,34,closed);
    }else if(kind==='rock'){
      monsterPath(g,[[20,82],[17,60],[28,41],[38,33],[61,36],[78,57],[72,82]],c,outline);monsterOval(g,24,39,31,9,['#d6f6a8','#79aa5e','#476f43']);monsterOval(g,52,48,21,8,['#d6f6a8','#79aa5e','#476f43']);monsterFace(g,48,61,closed);
    }else if(kind==='lantern'){
      monsterOval(g,28,32,40,57,c,outline);monsterOval(g,22,44,10,30,c,outline);monsterOval(g,64,44,10,30,c,outline);monsterOval(g,39,51,18,25,['#fff8bf','#fff3a4','#e9c968']);monsterFace(g,48,46,closed);
    }else if(kind==='gatekeeper'){
      monsterOval(g,12,52,25,31,c,outline);monsterPath(g,[[19,57],[31,43],[65,43],[78,57],[71,83],[25,83]],c,outline);
      monsterOval(g,28,19,40,37,c,outline);monsterPath(g,[[24,34],[27,17],[39,22],[48,10],[57,22],[70,17],[73,36],[62,31],[35,31]],['#fff0d0','#9b9aab','#4b536e'],outline);
      monsterOval(g,34,34,28,13,['#303248','#4b536e']);monsterOval(g,39,39,6,3,['#ffe08a']);monsterOval(g,52,39,6,3,['#ffe08a']);
      monsterOval(g,8,48,18,31,['#ffffff','#8ee5ff','#507eaa'],outline);monsterPath(g,[[76,61],[82,48],[87,52],[84,65],[77,67]],['#ffffff','#d6f6ff','#78cfff'],outline);
      g.strokeStyle='#d6f6ff';g.lineWidth=4;g.beginPath();g.moveTo(80,46);g.lineTo(80,24);g.stroke();monsterPath(g,[[80,20],[72,29],[79,31],[87,27]],['#ffffff','#9ee8ff','#4c86c4'],outline);
    }else if(kind==='frost'){
      monsterPath(g,[[21,81],[25,52],[32,44],[28,29],[38,36],[48,16],[57,37],[69,28],[64,47],[76,57],[75,82]],c,outline);
      monsterOval(g,31,42,34,36,c,outline);monsterFace(g,48,59,closed);
      for(const [x,y,w,h] of [[22,38,12,23],[62,35,13,25],[40,17,8,20]])monsterPath(g,[[x,y+h],[x+w/2,y],[x+w,y+h]],['#ffffff','#d6f6ff','#78cfff'],outline);
      monsterOval(g,37,71,22,7,['#ffffff','#d6f6ff','#78cfff'],outline);
    }else if(kind==='fire'){
      monsterPath(g,[[20,81],[25,61],[16,50],[31,47],[28,31],[40,39],[48,15],[57,39],[69,25],[66,48],[81,54],[69,64],[75,82]],c,outline);
      monsterPath(g,[[36,77],[39,58],[34,49],[44,51],[48,34],[54,52],[63,46],[58,62],[63,77]],['#fff8d4','#ffe08a','#ff8c45'],outline);
      monsterFace(g,48,58,closed);monsterOval(g,20,53,9,18,c,outline);monsterOval(g,67,53,9,18,c,outline);
    }else if(kind==='winged'){
      monsterPath(g,[[43,53],[31,35],[8,23],[13,48],[29,65],[45,70]],c,outline);monsterPath(g,[[53,53],[65,35],[88,23],[83,48],[67,65],[51,70]],c,outline);
      for(let i=0;i<3;i++){monsterOval(g,14+i*8,38+i*5,23,9,['#fff1ff','#d9c5f5','#9279b7'],outline);monsterOval(g,82-i*8,38+i*5,23,9,['#fff1ff','#d9c5f5','#9279b7'],outline);}
      monsterOval(g,29,51,38,33,c,outline);monsterOval(g,34,24,28,31,c,outline);monsterFace(g,48,39,closed);
      monsterPath(g,[[38,27],[40,11],[48,22],[56,11],[58,27]],['#fff0a5','#f4dc7b','#c9936b'],outline);
    }else if(kind==='assassin'){
      monsterPath(g,[[22,83],[27,54],[35,45],[31,29],[39,34],[48,14],[57,34],[65,29],[61,47],[70,56],[74,83]],c,outline);
      monsterPath(g,[[27,34],[31,19],[48,10],[65,19],[69,35],[57,28],[39,28]],['#f4e8ff','#9d83b9','#39354d'],outline);
      monsterOval(g,35,34,26,13,['#303248','#39354d']);monsterOval(g,39,39,6,3,['#ff6a3d']);monsterOval(g,52,39,6,3,['#ff6a3d']);
      monsterOval(g,11,49,8,30,['#ffffff','#d6f6ff','#78cfff'],outline);monsterOval(g,77,49,8,30,['#ffffff','#d6f6ff','#78cfff'],outline);
      g.strokeStyle='#ff6a3d';g.lineWidth=3;g.beginPath();g.moveTo(15,47);g.lineTo(8,24);g.moveTo(81,47);g.lineTo(88,24);g.stroke();
    }else{
      monsterOval(g,20,51,40,38,c,outline);monsterOval(g,38,36,40,50,c,outline);monsterOval(g,9,66,37,24,c,outline);monsterFace(g,48,59,closed);
    }
    if(pose==='stun')for(let i=0;i<3;i++)star(g,30+i*18,18+(i%2)*4,5);
    g.restore();
  }
  function monsterFrames(id) {
    if(monsterCache[id])return monsterCache[id];
    if(!styles[id]||!supported)return null;
    const make=(pose,step=0)=>{const canvas=document.createElement('canvas');canvas.width=canvas.height=96;paintMonster(canvas.getContext('2d'),id,pose,step);return canvas;};
    const frames={idle:make('idle'),run:[make('run',0),make('run',1)],windup:make('windup'),active:make('active'),recovery:Array.from({length:5},(_,i)=>make('recovery',i)),hurt:make('hurt'),stun:make('stun')};
    monsterCache[id]=frames;return frames;
  }
  function drawMonster(g,id,options={}) {
    let name=options.animation||'run';if(name==='dodge')name='run';const frames=monsterFrames(id);if(!frames)return false;
    let list=frames[name]||frames.idle,index=name==='run'?Math.floor((options.elapsed||0)/.18)%2:name==='recovery'?Math.round(4*clamp((options.phaseElapsed||0)/Math.max(.15,options.phaseDuration||.15))):0;
    if(!Array.isArray(list))list=[list];let image=list[index]||frames.idle;
    if(options.tint){let map=tintedCache.get(image);if(!map){map={};tintedCache.set(image,map);}if(!map[options.tint]){const tint=document.createElement('canvas');tint.width=image.width;tint.height=image.height;const tg=tint.getContext('2d');tg.drawImage(image,0,0);tg.globalCompositeOperation='source-in';tg.fillStyle=options.tint;tg.fillRect(0,0,tint.width,tint.height);map[options.tint]=tint;}image=map[options.tint];}
    const kind=styles[id][0],boss=['gatekeeper','frost-twin','fire-twin','winged','assassin'].includes(id),sizes={slime:[46,42],pudding:[48,48],bear:id==='chocolate-bear'||boss?[96,126]:[46,54],gatekeeper:[96,126],frost:[96,126],fire:[96,126],winged:[96,126],assassin:[96,126],rabbit:[40,54],fairy:[48,44],candy:[46,46],bubble:[48,48],macaron:[48,46],donut:[48,48],mushroom:[52,50],hedgehog:[52,48],flower:[46,50],rock:[52,46],lantern:[46,52],cloud:[52,44]}[kind];
    const scale=id==='chocolate-bear'||boss?1:Number.isFinite(options.displayScale)?options.displayScale:1,w=sizes[0]*scale,h=sizes[1]*scale,x=-w/2,y=-h*.92;
    g.save();if(name==='idle')g.scale(1,1+.025*Math.sin((options.elapsed||0)*Math.PI*2/.8));g.drawImage(image,x,y,w,h);
    if(options.flash){g.globalCompositeOperation='lighter';g.globalAlpha=.72;g.drawImage(frames.hurt,x,y,w,h);}g.restore();return true;
  }
  const api=Object.freeze({drawPlayer,drawMonster,poses:Object.freeze(['idle','run','windup','active','recovery','hurt','stun'])});
  root.SurvivorClay=api;root.Survivor=root.Survivor||{};root.Survivor.render=root.Survivor.render||{};root.Survivor.render.clay=api;
})(globalThis);
