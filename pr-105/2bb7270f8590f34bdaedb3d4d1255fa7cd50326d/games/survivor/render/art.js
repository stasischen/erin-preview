// 純查詢不讀時鐘／DOM，也不回寫戰鬥；圖片／Canvas 僅在下半部接合。
(function(root) {
  'use strict';
  const owns=(o,k)=>!!o&&typeof k==='string'&&Object.prototype.hasOwnProperty.call(o,k);
  const copy=value=>value===undefined?undefined:JSON.parse(JSON.stringify(value));
  const positive=n=>Number.isFinite(n)&&n>0;
  const pair=(a,test)=>Array.isArray(a)&&a.length===2&&a.every(test);
  const compass=['E','SE','S','SW','W','NW','N','NE'];
  const orders={1:['S'],4:['S','E','N','W'],8:['S','SE','E','NE','N','NW','W','SW']};
  const pathOK=p=>p===null||typeof p==='string'&&/^art\/(?:[a-z0-9-]+\/)*[a-z0-9-]+\.png$/.test(p);
  const arrayOK=a=>Array.isArray(a)&&a.length>0&&a.every(n=>Number.isInteger(n)&&n>=0);
  const colorOK=c=>typeof c==='string'&&/^#(?:[a-f\d]{3}|[a-f\d]{6}|[a-f\d]{8})$/i.test(c);
  function direction(aim,count=4) {
    if(count===1)return 'S';
    if(typeof aim==='string'&&compass.includes(aim)) {
      if(count===8||['S','E','N','W'].includes(aim))return aim;
      aim=compass.indexOf(aim)*Math.PI/4;
    }
    const angle=typeof aim==='number'&&Number.isFinite(aim)?aim:aim&&Number.isFinite(aim.x)&&Number.isFinite(aim.y)&&(aim.x||aim.y)?Math.atan2(aim.y,aim.x):Math.PI/2;
    const step=count===8?Math.PI/4:Math.PI/2;
    return compass[((Math.round(angle/step)*(count===8?1:2))%8+8)%8];
  }
  function resolveDirection(asset,aim) {
    const count=asset.directions||1, requested=direction(aim,count), mirrors=asset.mirror||{};
    let source=requested,flipX=false;const seen=new Set();
    while(owns(mirrors,source)) {
      if(seen.has(source))return null;
      seen.add(source);source=mirrors[source];flipX=!flipX;
    }
    return {direction:requested,sourceDirection:source,flipX,row:count===1?0:(asset.directionOrder||orders[count]).indexOf(source)};
  }
  function animationName(asset,requested) {
    if(owns(asset.animations,requested))return requested;
    const base=String(requested).split('_')[0];
    if(owns(asset.animations,base))return base;
    const near={spawn:'idle',death:'hurt',phase2:'idle',dodge:'run',stun:'hurt',windup:'idle',active:'idle',recovery:'idle'}[base];
    return near&&owns(asset.animations,near)?near:'idle';
  }
  function selectFrame(frames,clip,elapsed,phaseDuration,sync) {
    if(!clip.frameDurations&&!(sync&&positive(phaseDuration))){const step=Math.floor(elapsed*(clip.fps||0));return frames[clip.loop?step%frames.length:Math.min(frames.length-1,step)];}
    const durations=clip.frameDurations||frames.map(()=>clip.fps>0?1/clip.fps:1);
    const total=durations.reduce((a,b)=>a+b,0);
    let clock=elapsed;
    if(sync&&positive(phaseDuration))clock=Math.min(1,elapsed/phaseDuration)*total;
    else if(clip.loop)clock=((elapsed%total)+total)%total;
    else clock=Math.min(clock,total);
    if(!clip.frameDurations&&!(clip.fps>0)&&!(sync&&positive(phaseDuration)))return frames[0];
    let index=0;
    while(index<frames.length-1&&clock>=durations[index]-1e-12){clock-=durations[index];index++;}
    return frames[index];
  }
  function lookup(id,animation='idle',seconds=0,manifest=root.SurvivorArtManifest,context={}) {
    if(!manifest||!owns(manifest.assets,id))return null;
    const a=manifest.assets[id],name=animationName(a,animation),clip=a.animations[name];if(!clip)return null;
    const facing=resolveDirection(a,context.direction!==undefined?context.direction:Number.isFinite(context.angle)?context.angle:context.aim);
    if(!facing||facing.row<0)return null;
    const mapped=!Array.isArray(clip.frames),frames=mapped?clip.frames[facing.sourceDirection]:clip.frames;
    if(!arrayOK(frames))return null;
    const time=Number.isFinite(context.phaseElapsed)?Math.max(0,context.phaseElapsed):Number.isFinite(seconds)?Math.max(0,seconds):0;
    const sync=clip.syncToPhase===undefined?['windup','active','recovery'].includes(name.split('_')[0]):clip.syncToPhase;
    const effectiveClip={fps:0,loop:['idle','run'].includes(name.split('_')[0]),...clip};
    const frame=selectFrame(frames,effectiveClip,time,context.phaseDuration,sync||!!(a.vfx&&a.vfx.progressMode==='phase'));
    return {id,animation:name,sheet:clip.sheet===undefined?a.sheet:clip.sheet,mode:a.mode,frame,
      frameSize:a.frameSize.slice(),pivot:a.pivot.slice(),hitboxAnchor:a.hitboxAnchor.slice(),anchors:copy(a.anchors||{}),
      directions:a.directions||1,...facing,row:mapped?0:facing.row,layout:copy(clip.layout||a.layout),
      displaySize:copy(a.displaySize),scale:a.scale===undefined?1:a.scale,outline:copy(a.outline),
      palette:copy(a.palette),source:copy(a.source),syncToPhase:sync,
      vfx:{fitTo:'bounds',rotateWithAim:false,zLayer:'actor',blend:'source-over',alpha:1,progressMode:'time',...copy(a.vfx||{})}};
  }
  function validateLayout(value) {
    return value===undefined||value&&['cols','rows'].every(k=>Number.isInteger(value[k])&&value[k]>0&&value[k]<=256)&&['margin','spacing'].every(k=>value[k]===undefined||Number.isInteger(value[k])&&value[k]>=0&&value[k]<=4096);
  }
  function validate(manifest) {
    if(!manifest||![1,2].includes(manifest.schemaVersion)||!manifest.assets||Array.isArray(manifest.assets))return false;
    return Object.entries(manifest.assets).every(([id,a])=>{
      if(!a||!/^[a-z-]+\/[a-z][a-z0-9-]*$/.test(id)||!pathOK(a.sheet)||!['sprite','procedural'].includes(a.mode)||a.mode==='procedural'&&a.sheet!==null)return false;
      if(!pair(a.frameSize,n=>Number.isInteger(n)&&n>0&&n<=4096)||![a.pivot,a.hitboxAnchor].every(v=>pair(v,n=>Number.isFinite(n)&&n>=0&&n<=1)))return false;
      if(a.anchors!==undefined&&(!a.anchors||typeof a.anchors!=='object'||Array.isArray(a.anchors)||Object.entries(a.anchors).some(([name,value])=>!/^[a-z][a-z0-9-]*$/.test(name)||!pair(value,n=>Number.isFinite(n)&&n>=0&&n<=1))))return false;
      if(a.directions!==undefined&&![1,4,8].includes(a.directions)||!validateLayout(a.layout))return false;
      const dirs=orders[a.directions||1],order=a.directionOrder||dirs,mirror=a.mirror||{};
      if(!Array.isArray(order)||!order.length||new Set(order).size!==order.length||order.some(d=>!dirs.includes(d)))return false;
      if(!mirror||Array.isArray(mirror)||Object.entries(mirror).some(([d,v])=>!dirs.includes(d)||!dirs.includes(v)))return false;
      if(dirs.some(d=>{const f=resolveDirection(a,d);return !f||f.row<0;}))return false;
      if(a.displaySize!==undefined&&!pair(a.displaySize,n=>positive(n)&&n<=4096)||a.scale!==undefined&&(!positive(a.scale)||a.scale>16))return false;
      if(a.outline!==undefined&&typeof a.outline!=='boolean'&&!(a.outline&&colorOK(a.outline.color)&&Number.isFinite(a.outline.width)&&a.outline.width>=0&&a.outline.width<=8))return false;
      if(a.palette!==undefined&&!(a.palette&&typeof a.palette==='object'&&Object.values(a.palette).every(colorOK)))return false;
      if(a.source!==undefined&&!(typeof a.source==='string'||a.source&&typeof a.source==='object'&&!Array.isArray(a.source)&&Object.values(a.source).every(v=>typeof v==='string')))return false;
      if(a.vfx!==undefined){const v=a.vfx;if(!v||Array.isArray(v)||v.fitTo!==undefined&&!['bounds','radius','path','native'].includes(v.fitTo)||v.rotateWithAim!==undefined&&typeof v.rotateWithAim!=='boolean'||v.zLayer!==undefined&&!['ground','actor','overlay'].includes(v.zLayer)||v.blend!==undefined&&!['source-over','lighter','multiply','screen'].includes(v.blend)||v.alpha!==undefined&&(!Number.isFinite(v.alpha)||v.alpha<0||v.alpha>1)||v.progressMode!==undefined&&!['time','phase','grow','fade'].includes(v.progressMode))return false;}
      if(!a.animations||!['idle','run','hurt'].every(k=>owns(a.animations,k)))return false;
      return Object.entries(a.animations).every(([name,c])=>{
        if(!/^[a-z][a-z0-9]*(?:_[a-z0-9]+)*$/.test(name)||!c||c.sheet!==undefined&&!pathOK(c.sheet)||a.mode==='procedural'&&c.sheet!=null||!validateLayout(c.layout))return false;
        if(c.fps!==undefined&&(!Number.isFinite(c.fps)||c.fps<0)||c.loop!==undefined&&typeof c.loop!=='boolean'||c.syncToPhase!==undefined&&typeof c.syncToPhase!=='boolean')return false;
        const lists=Array.isArray(c.frames)?[c.frames]:c.frames&&typeof c.frames==='object'&&!Array.isArray(c.frames)?Object.values(c.frames):[];
        if(!lists.length||!lists.every(arrayOK))return false;
        if(!Array.isArray(c.frames)&&order.some(d=>!owns(c.frames,d)))return false;
        return c.frameDurations===undefined||Array.isArray(c.frameDurations)&&c.frameDurations.every(positive)&&lists.every(list=>list.length===c.frameDurations.length);
      });
    });
  }
  function phaseContext(state,source) {
    if(!state)return {};
    const timing=source||state.config||{},c=timing.timing||timing,duration=c[state.phase];
    return positive(duration)?{phaseDuration:duration,phaseElapsed:Math.max(0,Math.min(duration,duration-(Number.isFinite(state.left)?state.left:duration)))}:{};
  }
  function frameRect(art,width,height) {
    const [w,h]=art.frameSize,l=art.layout||{},margin=l.margin||0,spacing=l.spacing||0;
    const availableCols=Math.floor((width-margin*2+spacing)/(w+spacing)),availableRows=Math.floor((height-margin*2+spacing)/(h+spacing));
    const cols=l.cols||availableCols,rows=l.rows||availableRows,index=art.frame+art.row*cols;
    if(cols<=0||rows<=0||cols>availableCols||rows>availableRows||index>=cols*rows)return null;
    return [margin+(index%cols)*(w+spacing),margin+Math.floor(index/cols)*(h+spacing),w,h];
  }
  function sheetPaths(manifest=root.SurvivorArtManifest) {
    return [...new Set(Object.values(manifest.assets).flatMap(a=>[a.sheet,...Object.values(a.animations).map(c=>c.sheet)]).filter(Boolean))];
  }
  function bounds(id,x,y,width,height,context={}) {
    const art=lookup(id,'idle',0,root.SurvivorArtManifest,context);if(!art)return [x,y,width,height];
    const scale=art.scale*(art.displaySize&&positive(context.displayScale)?context.displayScale:1);
    const w=(art.displaySize?art.displaySize[0]:width)*scale,h=(art.displaySize?art.displaySize[1]:height)*scale;
    return [x+width*art.hitboxAnchor[0]-w*art.pivot[0],y+height*art.hitboxAnchor[1]-h*art.pivot[1],w,h];
  }
  function shapeOptions(shape,origin,angle=0) {
    const radius=Math.max(0,shape.radius||0),outer=radius+(shape.type==='ring'?(shape.thickness||0):0);
    return {x:origin.x-outer,y:origin.y-outer,width:outer*2,height:outer*2,radius:outer,angle,
      ...(shape.type==='line'?{x:origin.x,y:origin.y-radius,width:shape.length,height:radius*2}:{}),
      origin:{x:origin.x,y:origin.y},target:{x:origin.x+Math.cos(angle)*(shape.length||radius),y:origin.y+Math.sin(angle)*(shape.length||radius)},shape:copy(shape)};
  }
  function clipShape(g,options) {
    const s=options.shape,o=options.origin;if(!s||!o)return;
    g.save();g.translate(o.x,o.y);g.rotate(options.angle||0);g.beginPath();
    if(s.type==='line')g.rect(0,-s.radius,s.length,s.radius*2);
    else if(s.type==='sector'){g.moveTo(0,0);g.arc(0,0,s.radius,-s.angle*Math.PI/360,s.angle*Math.PI/360);g.closePath();}
    else if(s.type==='ring'){
      const start=(s.gap||0)/2,end=Math.PI*2-start,outer=s.radius+(s.thickness||0),inner=Math.max(0,s.radius-(s.thickness||0));
      g.arc(0,0,outer,start,end);g.arc(0,0,inner,end,start,true);g.closePath();
    }else if(s.type==='cross'){g.rect(-s.radius,-s.thickness,s.radius*2,s.thickness*2);g.rect(-s.thickness,-s.radius,s.thickness*2,s.radius*2);}
    else g.arc(0,0,s.radius,0,Math.PI*2);
    g.restore();g.clip();
    if(s.type==='cross'){g.beginPath();g.arc(o.x,o.y,s.radius,0,Math.PI*2);g.clip();}
  }
  function vfxPlan(art,options) {
    const v=art.vfx,progress=positive(options.phaseDuration)?Math.max(0,Math.min(1,(options.phaseElapsed===undefined?options.time||0:options.phaseElapsed)/options.phaseDuration)):0;
    let box=options.box||[options.x,options.y,options.width,options.height],angle=options.angle||0;
    if(v.fitTo==='native')box=[options.x,options.y,art.frameSize[0]*art.scale,art.frameSize[1]*art.scale];
    if(v.fitTo==='radius'&&positive(options.radius))box=[options.x+options.width/2-options.radius,options.y+options.height/2-options.radius,options.radius*2,options.radius*2];
    if(v.fitTo==='path'&&options.origin&&options.target){const dx=options.target.x-options.origin.x,dy=options.target.y-options.origin.y;angle=Math.atan2(dy,dx);box=[options.origin.x,options.origin.y-(options.radius||8),Math.hypot(dx,dy),(options.radius||8)*2];}
    if(v.progressMode==='grow'){const f=Math.max(.001,progress);box=[box[0]+box[2]*(1-f)/2,box[1]+box[3]*(1-f)/2,box[2]*f,box[3]*f];}
    return {box,angle:v.rotateWithAim?angle:0,alpha:v.alpha*(v.progressMode==='fade'?1-progress:1),blend:v.blend,zLayer:v.zLayer,progress};
  }
  if(!validate(root.SurvivorArtManifest))throw Error('Invalid Survivor art manifest');
  const images=new Map(),frames=new Map();
  const version=typeof document!=='undefined'&&document.currentScript?new URL(document.currentScript.src).search:'';
  function image(path) {
    if(!images.has(path)) {
      if(typeof Image==='undefined')return null;
      const record={ready:false,value:new Image()};images.set(path,record);
      record.value.onload=()=>{record.ready=true;if(typeof document!=='undefined'&&document.querySelectorAll)for(const node of document.querySelectorAll('[data-survivor-art]')){const frame=picture(node.dataset.survivorArt);if(frame)node.src=frame.toDataURL();}};
      record.value.onerror=()=>{record.ready=false;};record.value.src=path+version;
    }
    const record=images.get(path);return record.ready?record.value:null;
  }
  function picture(id,animation='idle',seconds=0,context={}) {
    const art=lookup(id,animation,seconds,root.SurvivorArtManifest,context);if(!art||!art.sheet||art.mode!=='sprite')return null;
    const sheet=image(art.sheet);if(!sheet)return null;
    const rect=frameRect(art,sheet.width,sheet.height);if(!rect)return null;
    const [w,h]=art.frameSize,key=JSON.stringify([art.sheet,rect,art.flipX,context.tint||null]);
    if(!frames.has(key)) {
      const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
      const g=canvas.getContext('2d');g.imageSmoothingEnabled=false;
      if(art.flipX){g.translate(w,0);g.scale(-1,1);}
      g.drawImage(sheet,...rect,0,0,w,h);
      if(context.tint){g.globalCompositeOperation='source-in';g.fillStyle=context.tint;g.fillRect(0,0,w,h);}
      frames.set(key,canvas);
    }
    return frames.get(key);
  }
  function draw(id,options) {
    if(!options)return false;
    const art=lookup(id,options.animation,options.time,root.SurvivorArtManifest,options);if(!art||art.mode!=='sprite')return false;
    const frame=picture(id,options.animation,options.time,options);if(!frame)return false;
    const g=options.context,box=bounds(id,options.x,options.y,options.width,options.height,options),plan=vfxPlan(art,{...options,box});
    g.save();g.imageSmoothingEnabled=false;clipShape(g,options);
    if(art.vfx.alpha!==1||art.vfx.progressMode==='fade')g.globalAlpha*=plan.alpha;
    if(plan.blend!=='source-over')g.globalCompositeOperation=plan.blend;
    let rect=plan.box;
    if(plan.angle){const cx=(art.vfx.fitTo==='path'||options.shape&&options.shape.type==='line')&&options.origin?options.origin.x:rect[0]+rect[2]/2,cy=(art.vfx.fitTo==='path'||options.shape&&options.shape.type==='line')&&options.origin?options.origin.y:rect[1]+rect[3]/2;g.translate(cx,cy);g.rotate(plan.angle);rect=[rect[0]-cx,rect[1]-cy,rect[2],rect[3]];}
    g.drawImage(frame,...rect);g.restore();return true;
  }
  function paint(id,options,fallback) {
    // 招式換皮不能移除地面範圍／缺口等判讀資訊。
    if(options&&id.startsWith('move/')){for(const region of options.regions||[{}])draw(id,{...options,...region});fallback();return;}
    if(draw(id,options))return;return fallback();
  }
  function iconHtml(id) {
    const art=lookup(id);if(!art||!art.sheet)return null;
    const frame=picture(id);if(!frame)return null;
    return '<img class="pixel-icon" data-survivor-art="'+id+'" src="'+frame.toDataURL()+'" alt="" aria-hidden="true" draggable="false">';
  }
  root.SurvivorArt={lookup,validate,bounds,picture,draw,paint,iconHtml,direction,resolveDirection,frameRect,sheetPaths,vfxPlan,phaseContext,shapeOptions};
  root.Survivor=root.Survivor||{};if(typeof window!=='undefined')window.Survivor=root.Survivor;
  root.Survivor.render=root.Survivor.render||{};root.Survivor.render.art=root.SurvivorArt;root.Survivor['art-manifest']={data:root.SurvivorArtManifest};
})(globalThis);
