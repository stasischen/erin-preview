// Deterministic world chunks. Camera motion never re-randomizes marks; waves add a separate tint.
globalThis.SurvivorEnvironment=(()=>{
  const cache=new Map(),capacity=32;
  const hash=(x,y,seed)=>{let n=Math.imul(x+17,374761393)^Math.imul(y+31,668265263)^seed;n=Math.imul(n^(n>>>13),1274126177);return (n^(n>>>16))>>>0;};
  function chunk(stageId,cx,cy){
    const stage=STAGES.find(s=>s.id===stageId)||currentStage();
    const theme=SurvivorRoutes.theme(Math.max(0,STAGES.findIndex(s=>s.id===stage.id)));
    const cols=Math.max(1,Math.ceil(state.worldWidth/336)),rows=Math.max(1,Math.ceil(state.worldHeight/252));
    cx=((cx%cols)+cols)%cols;cy=((cy%rows)+rows)%rows;
    const width=state.worldWidth/cols,height=state.worldHeight/rows,key=[theme.id,cx,cy,width,height].join(':');
    if(cache.has(key))return cache.get(key);
    const seed=hash(cx,cy,theme.seed),colors=SurvivorArtManifest.environment[theme.id]||SurvivorArtManifest.environment['candy-forest'];
    const canvas=document.createElement('canvas');canvas.width=Math.ceil(width);canvas.height=Math.ceil(height);
    const g=canvas.getContext('2d');g.fillStyle=colors.base;g.fillRect(0,0,canvas.width,canvas.height);
    const ellipse=(x,y,rx,ry,color,angle=0)=>{g.fillStyle=color;g.beginPath();g.ellipse(x,y,rx,ry,angle,0,Math.PI*2);g.fill();};
    if(!['candy-forest','cookie-forest'].includes(theme.id))paintTheme(g,theme.id,colors,width,height,seed);
    else {
    // Broad organic islands, never a checkerboard or dense lines that shimmer while moving.
    for(let i=0;i<4;i++){const n=hash(cx*7+i,cy,seed);const margin=75;ellipse(margin+n%Math.max(1,Math.floor(width-margin*2)),margin+(n>>>9)%Math.max(1,Math.floor(height-margin*2)),35+n%35,18+n%20,colors.patch,(n%10)/10);}
    // A flat trail continues through each chunk at the same edge coordinate.
    g.strokeStyle=colors.path;g.lineWidth=24;g.lineCap='round';g.beginPath();g.moveTo(0,height*.5);g.bezierCurveTo(width*.2,height*.5,width*.25,height*.38,width*.5,height*.5);g.bezierCurveTo(width*.75,height*.62,width*.8,height*.5,width,height*.5);g.stroke();
    for(let i=0;i<9;i++){const n=hash(cx,cy*13+i,seed);const x=18+n%Math.max(1,Math.floor(width-36)),y=18+(n>>>11)%Math.max(1,Math.floor(height-36));
      if(theme.id==='cookie-forest'){
        ellipse(x,y,8+n%8,5+n%5,colors.leaf,n%3);ellipse(x-2,y-1,3,2,colors.light);
      }else{ellipse(x,y,11,4,colors.leaf,(n%6)-3);ellipse(x+5,y+3,9,3,colors.edge,(n%6)-3);}
    }
    // Large engraved ground emblems are landmarks, not fake blocking trees/rocks.
    const landmark=seed%5;
    if(landmark<3){const x=width*.5,y=height*.5;
      ellipse(x,y,43,32,colors.edge);ellipse(x,y,37,27,colors.patch);
      if(theme.id==='cookie-forest'){
        for(let i=0;i<6;i++){const a=i*Math.PI/3;ellipse(x+Math.cos(a)*22,y+Math.sin(a)*16,6,4,colors.landmark);}
        ellipse(x,y,11,8,colors.light);
      }else{
        for(let i=0;i<5;i++){const a=i*Math.PI*2/5;ellipse(x+Math.cos(a)*17,y+Math.sin(a)*13,19,7,colors.landmark,a);}
        ellipse(x,y,8,6,colors.light);
      }
    }
    }
    const result={canvas,width,height,cx,cy,seed,landmark:seed%5,themeId:theme.id,stageId:stage.id};
    cache.set(key,result);if(cache.size>capacity)cache.delete(cache.keys().next().value);
    return result;
  }
  // Low, traversable reliefs. Each theme has its own silhouette and path, not a palette swap.
  function paintTheme(g,id,c,w,h,seed){
    const oval=(x,y,rx,ry,color,angle=0)=>{
      g.fillStyle=color;g.beginPath();g.ellipse(x,y,rx,ry,angle,0,Math.PI*2);g.fill();
      if(id==='soda-coast'||id==='icecream-snow'){
        const sheen=g.createLinearGradient(x-rx,y-ry,x+rx,y+ry);
        if(sheen?.addColorStop){sheen.addColorStop(0,c.light);sheen.addColorStop(1,color);g.save();g.globalAlpha=.12;g.fillStyle=sheen;g.fill();g.restore();}
      }
    };
    const curve=(y,width,color,amplitude)=>{
      g.strokeStyle=color;g.lineWidth=width;g.beginPath();g.moveTo(0,y);
      g.bezierCurveTo(w*.2,y,w*.25,y-amplitude,w*.5,y);g.bezierCurveTo(w*.75,y+amplitude,w*.8,y,w,y);g.stroke();
    };
    if(id==='soda-coast'){
      // Flat tidal shelves cross the whole scene; round foam deposits identify this shore.
      curve(h*.35,64,c.patch,18);curve(h*.38,20,c.path,18);curve(h*.68,30,c.edge,-15);
      for(let i=0;i<8;i++){const n=hash(i,seed,17),x=22+n%Math.floor(w-44),y=28+(n>>>9)%Math.floor(h-56);oval(x,y,9+n%8,4+n%4,c.leaf);oval(x-2,y-1,4,2,c.light);}
      const x=w*.5,y=h*.72;for(let i=0;i<4;i++)oval(x+(i-1.5)*15,y+(i%2)*7,17,8,c.landmark);
    }else if(id==='icecream-snow'){
      // Snow pillows with pressed crystalline seams; the trail travels vertically.
      for(let i=0;i<4;i++){const n=hash(i,seed,23);oval(65+n%Math.floor(w-130),55+(n>>>8)%Math.floor(h-110),38+n%20,20+n%10,c.patch);}
      g.strokeStyle=c.path;g.lineWidth=18;g.beginPath();g.moveTo(w*.5,0);g.bezierCurveTo(w*.5,h*.25,w*.65,h*.25,w*.5,h*.5);g.bezierCurveTo(w*.35,h*.75,w*.5,h*.75,w*.5,h);g.stroke();
      for(let i=0;i<5;i++){const n=hash(i,seed,41),x=30+n%Math.floor(w-60),y=30+(n>>>10)%Math.floor(h-60);g.save();g.translate(x,y);g.fillStyle=c.landmark;g.beginPath();for(let j=0;j<12;j++){const a=j*Math.PI/6,r=j%2?7:17;if(j)g.lineTo(Math.cos(a)*r,Math.sin(a)*r);else g.moveTo(Math.cos(a)*r,Math.sin(a)*r);}g.closePath();g.fill();g.restore();}
    }else if(id==='jam-garden'){
      // Curled garden beds and flat berry rosettes, rather than solid hedges.
      curve(h*.5,20,c.path,30);
      for(let i=0;i<3;i++){
        const n=hash(i,seed,53),x=62+n%Math.floor(w-124),y=52+(n>>>8)%Math.floor(h-104);
        oval(x,y,45,28,c.patch);
        for(let j=0;j<5;j++){const a=j*Math.PI*2/5;oval(x+Math.cos(a)*21,y+Math.sin(a)*16,17,10,c.landmark,a);}
        oval(x,y,9,6,c.light);oval(x+34,y+20,17,5,c.leaf,.5);oval(x-30,y+18,15,5,c.leaf,-.5);
      }
    }else{
      // Muted caramel streams are decoration, not orange hazard telegraphs.
      g.strokeStyle=c.path;g.lineWidth=19;g.lineCap='round';g.beginPath();g.moveTo(w*.5,h*.48);g.bezierCurveTo(w*.7,h*.5,w*.55,h*.77,w*.75,h*.8);g.stroke();
      curve(h*.48,42,c.path,24);curve(h*.48,13,c.landmark,24);
      for(let i=0;i<7;i++){const n=hash(i,seed,67),x=24+n%Math.floor(w-48),y=24+(n>>>8)%Math.floor(h-48);oval(x,y,11+n%9,7+n%5,c.patch);oval(x,y,7+n%6,3,c.edge);}
      const x=w*.25,y=h*.73;oval(x,y,31,20,c.edge);oval(x,y,24,14,c.landmark);oval(x+5,y-1,16,9,c.patch);oval(x+3,y-1,7,4,c.light);
    }
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
      const phase=Math.min(4,SurvivorWaves.current().index),ink=SurvivorArtManifest.environment[SurvivorRoutes.theme().id];
      if(phase&&ink){ctx.globalAlpha=phase*.035;ctx.fillStyle=ink.late;ctx.fillRect(x,y,width,height);ctx.globalAlpha=1;
        for(let i=0;i<phase;i++){const n=hash(tile.cx+i,tile.cy,tile.seed);ctx.fillStyle=ink.landmark;ctx.globalAlpha=.18;ctx.beginPath();ctx.ellipse(cx*w+30+n%Math.max(1,Math.floor(w-60)),cy*h+25+(n>>>8)%Math.max(1,Math.floor(h-50)),12+i*3,4,0,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;}
      }
    }
    ctx.restore();
  }
  return {chunk,draw,cache,capacity};
})();
Survivor.render=Survivor.render||{};Survivor.render.environment=SurvivorEnvironment;
