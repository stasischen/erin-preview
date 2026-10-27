// 只供 iframe 沙盒使用，工具狀態不寫入作品或玩家設定。
globalThis.SurvivorDebugTools = (()=>{
  let options={speed:1,frozen:false,bodies:false,arrows:false,compare:false},trail=[],before=[];
  function step(dt) {return options.frozen?0:dt*options.speed;}
  function capture() {if(trail.length)before=trail.map(p=>({...p}));trail=[];return before;}
  function sample() {
    if(!options.compare)return;
    trail.push({x:state.player.x,y:state.player.y,r:state.player.r});
    for(const e of state.enemies.slice(0,20))trail.push({x:e.x,y:e.y,r:e.r});
    if(trail.length>600)trail.splice(0,trail.length-600);
  }
  function draw() {
    ctx.save();ctx.beginPath();ctx.rect(0,0,state.width,state.height);ctx.clip();ctx.translate(-state.cameraX,-state.cameraY);
    const circle=(p,color)=>{ctx.strokeStyle=color;ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.stroke();};
    if(options.compare) {ctx.globalAlpha=.25;for(const p of before)circle(p,'#ffc271');for(const p of trail)circle(p,'#7effe1');ctx.globalAlpha=1;}
    if(options.bodies)for(const p of [state.player,...state.enemies])circle(p,'#7effe1');
    if(state.practiceHitboxes) {
      for(const p of [...state.projectiles,...state.enemyShots,...state.enemyHazards])circle(p,'#fff29c');
    }
    if(options.arrows)for(const e of [state.player,...state.enemies,...(state.boss?[state.boss]:[])])if(e.slide) {
      const end=slidePrediction(e),a=Math.atan2(end.dy,end.dx),x=e.x+end.dx,y=e.y+end.dy;
      ctx.strokeStyle='#ffc271';ctx.beginPath();ctx.moveTo(e.x,e.y);ctx.lineTo(x,y);ctx.lineTo(x-Math.cos(a-.5)*8,y-Math.sin(a-.5)*8);ctx.moveTo(x,y);ctx.lineTo(x-Math.cos(a+.5)*8,y-Math.sin(a+.5)*8);ctx.stroke();
    }
    ctx.restore();
  }
  function spawn(count) {
    // 使用正式生成規則、作品怪物與上限；工具只把成功生成者搬到可見位置。
    const id=typeof practiceId!=='undefined' && GAME_DATA.enemies.some(e=>e.id===practiceId)?practiceId:GAME_DATA.enemies[0].id;
    for(let i=0;i<count;i++) {
      const e=spawnEnemy({typeId:id});if(!e)break;
      const a=i/count*Math.PI*2,r=Math.min(state.width,state.height)*.3;
      e.x=Math.max(state.cameraX+e.r,Math.min(state.cameraX+state.width-e.r,state.player.x+Math.cos(a)*r));
      e.y=Math.max(state.cameraY+e.r,Math.min(state.cameraY+state.height-e.r,state.player.y+Math.sin(a)*r));
    }
  }
  function mount() {
    if(!document.body)return; // 無 DOM 的純引擎測試不需要工具列。
    if(frameElement._debugOptions)options={...options,...frameElement._debugOptions};
    before=frameElement._debugBefore||[];
    const host=document.createElement('details');host.className='sandbox-tools';
    host.style.cssText='position:fixed;z-index:30;bottom:4px;left:4px;max-width:85%;max-height:70%;overflow:auto;background:#142331ed;color:#fff;padding:6px;font:13px system-ui;border:1px solid #8bdcff;border-radius:8px';
    const title=document.createElement('summary');title.textContent='觀察工具';host.appendChild(title);
    const controls=document.createElement('div');controls.style.cssText='display:flex;flex-wrap:wrap;gap:6px;max-width:400px';host.appendChild(controls);
    function button(label,action) {const b=document.createElement('button');b.type='button';b.textContent=label;b.style.cssText='min-height:36px;color:#fff;background:#31485b;border:1px solid #9ab7ca;border-radius:5px';b.addEventListener('click',()=>{action(b);frameElement._debugOptions={...options,hitboxes:!!state.practiceHitboxes};draw();});controls.appendChild(b);return b;}
    function toggle(label,key) {const b=button(label,()=>{options[key]=!options[key];b.setAttribute('aria-pressed',String(options[key]));});b.setAttribute('aria-pressed',String(options[key]));}
    button('速度 1×／0.25×',b=>{options.speed=options.speed===1?.25:1;b.textContent='速度 '+options.speed+'×';});
    toggle('凍結','frozen');toggle('身體','bodies');toggle('擊退箭頭','arrows');toggle('前後殘影','compare');
    state.practiceHitboxes=!!options.hitboxes;
    const boxes=button('判定框',b=>{state.practiceHitboxes=!state.practiceHitboxes;b.setAttribute('aria-pressed',String(state.practiceHitboxes));});
    boxes.setAttribute('aria-pressed',String(state.practiceHitboxes));
    button('保留調整前殘影',()=>capture());button('清除殘影',()=>{before=[];trail=[];frameElement._debugBefore=[];});
    for(const count of [1,5,20])button('生怪 '+count,()=>spawn(count));
    const note=document.createElement('small');note.textContent='橘：調整前　綠：調整後；開啟殘影並播放後，保留再改數值。工具只用於此場景。';host.appendChild(note);
    document.body.appendChild(host);
    window.captureDebugBefore=()=>{frameElement._debugBefore=capture();};
  }
  return {step,sample,draw,spawn,capture,mount,get options(){return options;}};
})();
Survivor.engine['debug-tools']={tools:SurvivorDebugTools};
