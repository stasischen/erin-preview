// Deterministic world chunks. Camera motion never re-randomizes marks; waves add a separate tint.
globalThis.SurvivorEnvironment=(()=>{
  const cache=new Map(),capacity=32;
  const hash=(x,y,seed)=>{let n=Math.imul(x+17,374761393)^Math.imul(y+31,668265263)^seed;n=Math.imul(n^(n>>>13),1274126177);return (n^(n>>>16))>>>0;};
  function chunk(stageId,cx,cy){
    const stage=STAGES.find(s=>s.id===stageId)||currentStage();
    const cols=Math.max(1,Math.ceil(state.worldWidth/336)),rows=Math.max(1,Math.ceil(state.worldHeight/252));
    cx=((cx%cols)+cols)%cols;cy=((cy%rows)+rows)%rows;
    const width=state.worldWidth/cols,height=state.worldHeight/rows,key=[stage.background,cx,cy,width,height].join(':');
    if(cache.has(key))return cache.get(key);
    const seed=hash(cx,cy,stage.background==='cookie-forest'?79:23),colors=SurvivorArtManifest.environment[stage.background]||SurvivorArtManifest.environment['candy-forest'];
    const canvas=document.createElement('canvas');canvas.width=Math.ceil(width);canvas.height=Math.ceil(height);
    const g=canvas.getContext('2d');g.fillStyle=colors.base;g.fillRect(0,0,canvas.width,canvas.height);
    const ellipse=(x,y,rx,ry,color,angle=0)=>{g.fillStyle=color;g.beginPath();g.ellipse(x,y,rx,ry,angle,0,Math.PI*2);g.fill();};
    // Broad organic islands, never a checkerboard or dense lines that shimmer while moving.
    for(let i=0;i<4;i++){const n=hash(cx*7+i,cy,seed);const margin=75;ellipse(margin+n%Math.max(1,Math.floor(width-margin*2)),margin+(n>>>9)%Math.max(1,Math.floor(height-margin*2)),35+n%35,18+n%20,colors.patch,(n%10)/10);}
    // A flat trail continues through each chunk at the same edge coordinate.
    g.strokeStyle=colors.path;g.lineWidth=24;g.lineCap='round';g.beginPath();g.moveTo(0,height*.5);g.bezierCurveTo(width*.2,height*.5,width*.25,height*.38,width*.5,height*.5);g.bezierCurveTo(width*.75,height*.62,width*.8,height*.5,width,height*.5);g.stroke();
    for(let i=0;i<9;i++){const n=hash(cx,cy*13+i,seed);const x=18+n%Math.max(1,Math.floor(width-36)),y=18+(n>>>11)%Math.max(1,Math.floor(height-36));
      if(stage.background==='cookie-forest'){
        ellipse(x,y,8+n%8,5+n%5,colors.leaf,n%3);ellipse(x-2,y-1,3,2,colors.light);
      }else{ellipse(x,y,11,4,colors.leaf,(n%6)-3);ellipse(x+5,y+3,9,3,colors.edge,(n%6)-3);}
    }
    // Large engraved ground emblems are landmarks, not fake blocking trees/rocks.
    const landmark=seed%5;
    if(landmark<3){const x=width*.5,y=height*.5;
      ellipse(x,y,43,32,colors.edge);ellipse(x,y,37,27,colors.patch);
      if(stage.background==='cookie-forest'){
        for(let i=0;i<6;i++){const a=i*Math.PI/3;ellipse(x+Math.cos(a)*22,y+Math.sin(a)*16,6,4,colors.landmark);}
        ellipse(x,y,11,8,colors.light);
      }else{
        for(let i=0;i<5;i++){const a=i*Math.PI*2/5;ellipse(x+Math.cos(a)*17,y+Math.sin(a)*13,19,7,colors.landmark,a);}
        ellipse(x,y,8,6,colors.light);
      }
    }
    const result={canvas,width,height,cx,cy,seed,landmark,stageId:stage.id};
    cache.set(key,result);if(cache.size>capacity)cache.delete(cache.keys().next().value);
    return result;
  }
  function draw(){
    const cols=Math.max(1,Math.ceil(state.worldWidth/336)),rows=Math.max(1,Math.ceil(state.worldHeight/252));
    const w=state.worldWidth/cols,h=state.worldHeight/rows;if(!w||!h)return;
    ctx.save();ctx.imageSmoothingEnabled=true;
    // Share device-pixel edges so fractional camera motion cannot expose chunk seams.
    const transform=ctx.getTransform();
    const snapX=x=>(Math.round(x*transform.a+transform.e)-transform.e)/transform.a;
    const snapY=y=>(Math.round(y*transform.d+transform.f)-transform.f)/transform.d;
    for(let cy=Math.floor(state.cameraY/h);cy*h<state.cameraY+state.height;cy++)for(let cx=Math.floor(state.cameraX/w);cx*w<state.cameraX+state.width;cx++){
      const tile=chunk(currentStage().id,cx,cy);
      const x=snapX(cx*w),y=snapY(cy*h),width=snapX((cx+1)*w)-x,height=snapY((cy+1)*h)-y;
      ctx.drawImage(tile.canvas,x,y,width,height);
      // Stable clusters deepen as waves progress; no random redraw or full-world cache invalidation.
      const phase=Math.min(4,SurvivorWaves.current().index),ink=SurvivorArtManifest.environment[currentStage().background];
      if(phase&&ink){ctx.globalAlpha=phase*.035;ctx.fillStyle=ink.late;ctx.fillRect(x,y,width,height);ctx.globalAlpha=1;
        for(let i=0;i<phase;i++){const n=hash(tile.cx+i,tile.cy,tile.seed);ctx.fillStyle=ink.landmark;ctx.globalAlpha=.18;ctx.beginPath();ctx.ellipse(cx*w+30+n%Math.max(1,Math.floor(w-60)),cy*h+25+(n>>>8)%Math.max(1,Math.floor(h-50)),12+i*3,4,0,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;}
      }
    }
    ctx.restore();
  }
  return {chunk,draw,cache,capacity};
})();
Survivor.render=Survivor.render||{};Survivor.render.environment=SurvivorEnvironment;
