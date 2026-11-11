// Editor controls share the shell's single live draft through ctx.
globalThis.SurvivorMakerModules = globalThis.SurvivorMakerModules || {};
SurvivorMakerModules['stages'] = function (ctx) {
  'use strict';
  function drawEncounters(key, title) {
    const p = ctx.panel(title), cfg = ctx.draft[key]; drawWaveBlocks(p,key); ctx.wavePreview=key;drawWavePreview(key); p.className += ' maker-encounters';
    const bound=ctx.waveBinding(key); for(const field of Object.keys(bound)) if(field in cfg) Object.defineProperty(cfg,field,{enumerable:true,configurable:true,get:()=>bound[field],set:value=>{bound[field]=value;}});
    const toggle = (parent, label, value, action) => {
      const row = ctx.el('div',undefined,parent); row.className='encounter-toggle';
      ctx.el('span',label,row);
      const b = ctx.button(row,'',action); b.innerHTML=SurvivorIcons.html(value ? 'confirm' : 'pause');
      b.setAttribute('aria-label',label + (value ? '：開' : '：關')); b.title=label;
      b.setAttribute('role','switch'); b.setAttribute('aria-checked',String(value));
    };

    if (key==='elites') {
      for (const [id,name] of Object.entries(ctx.api.ELITE_ABILITIES)) toggle(p,name,cfg.abilities.includes(id),()=>{
        if (cfg.abilities.includes(id) && cfg.abilities.length===1) { ctx.message('至少保留一種能力；可用總開關停用精英。'); return; }
        cfg.abilities=cfg.abilities.includes(id)?cfg.abilities.filter(a=>a!==id):cfg.abilities.concat(id); ctx.changed();ctx.render();
      });
      ctx.el('p','每隔一段時間抽一次精英。分裂的三隻小怪也從畫面外進場。擊敗精英立即得到經驗獎勵。',p);
    } else {
      ctx.text(p,'小頭目名稱',cfg,'name');
      ctx.el('p','每關出現一次；時間比例乘上老師出場秒數。打破糖衣後才能傷害本體；擊敗後依序選兩張不同的升級卡。',p);
    }
    const names={interval:'精英抽選間隔秒數',chance:'每次抽選出現機率',limit:'同時精英上限',sizeScale:'精英身體倍率',healthScale:'精英血量倍率',rewardXp:'擊敗精英獎勵經驗',shieldHits:'糖霜擋住幾下',auraRadius:'加速光環範圍',auraSpeed:'光環速度倍率',syrupInterval:'留下糖漿間隔秒數',syrupSeconds:'糖漿持續秒數',syrupRadius:'糖漿範圍',syrupSlow:'糖漿內剩餘速度',teleportInterval:'傳送休息秒數',teleportWarning:'傳送預警秒數',teleportDistance:'傳送落點離主角距離',stageFraction:'每關出場時間比例',hp:'本體血量',armor:'糖衣盔甲血量',radius:'身體大小',speed:'移動速度',damage:'碰撞傷害',slamInterval:'重擊休息秒數',slamWarning:'重擊預警秒數',slamRadius:'重擊範圍',slamDamage:'重擊傷害'};
    const fields=ctx.grid(p);
    for (const [field,bounds] of Object.entries(ctx.api.ENCOUNTER_BOUNDS[key])) {if(!(field in bound)) ctx.range(fields,cfg,field,bounds,names[field],true);}
  }

  function drawBodyRules() {
    const body=ctx.grid(ctx.panel('怪物身體碰撞'));
    const toggle=(parent,label,obj,key)=>{const b=ctx.button(parent,label+'：'+(obj[key]?'開':'關'),()=>{obj[key]=!obj[key];ctx.changed();ctx.render();});b.setAttribute('role','switch');b.setAttribute('aria-checked',String(obj[key]));};
    toggle(body,'碰撞只會推開，不會受傷',ctx.draft.bodyContact,'pushOnly');
    ctx.range(body,ctx.draft.bodyContact,'damageScale',[0,1,.05],'身體傷害倍率（所有小怪，Boss 除外）');
    toggle(body,'身體柔性分離',ctx.draft.bodySeparation,'enabled');
    ctx.range(body,ctx.draft.bodySeparation,'radiusScale',[.5,1.5,.05],'身體半徑倍率');
    ctx.range(body,ctx.draft.bodySeparation,'playerForce',[0,1,.05],'主角與怪物推力');
    ctx.range(body,ctx.draft.bodySeparation,'enemyForce',[0,1,.05],'怪物之間推力');
    ctx.el('p','衝刺及衝刺保護期間可以穿過怪物；大怪會擋路。分離逐幀推開，怪群推動主角有共同上限。',body);
    const weight=ctx.grid(ctx.panel('擊退與吸引重量'));
    ctx.range(weight,ctx.draft.knockback,'slideSeconds',[.15,.25,.01],'擊退滑動秒數');
    toggle(weight,'重量影響推拉',ctx.draft.knockback,'enabled');
    ctx.range(weight,ctx.draft.knockback,'strength',[0,5,.1],'重量影響（越大越難推動大怪）');
    ctx.range(weight,ctx.draft.knockback,'minibossMass',[1,100,1],'小頭目重量');
    ctx.range(weight,ctx.draft.knockback,'bossMass',[1,100,1],'老師重量');
    ctx.range(weight,ctx.draft.knockback,'bossMultiplier',[0,1,.05],'老師推拉倍率（0 固定不動）');
    ctx.el('p','一般怪重量 1；坦克預設 8。重量也用於身體分離；關閉重量效果會恢復原本推拉距離。',weight);
  }
  function drawPacing() {
    const root=ctx.panel('出怪節奏');drawWaveBlocks(root,'pacing'); ctx.wavePreview='pacing';drawWavePreview('pacing');const pacing = ctx.grid(root);
    const bound=ctx.waveBinding('pacing'),events=ctx.waveBinding('events');for(const field of [...Object.keys(bound),...Object.keys(events)]) if(field in ctx.draft.pacing) {const b=field in bound?bound:events;Object.defineProperty(ctx.draft.pacing,field,{enumerable:true,configurable:true,get:()=>b[field],set:value=>{b[field]=value;}});}

    const names = {density:'出怪密度倍率',strongScale:'強波密度倍率',weakScale:'喘息波密度倍率',cycleSeconds:'強弱交替秒數',eventCount:'每次事件怪物數',eventSeconds:'事件進場秒數',warning:'招式預警秒數',chargeSpeed:'衝撞速度',chargeSeconds:'衝撞持續秒數',fuseSeconds:'跳跳糖引信（固定兩秒）',blastRadius:'自爆半徑',blastDamage:'自爆對主角傷害',blastEnemyDamage:'自爆對怪物傷害',shieldRadius:'仙子護盾範圍',shieldSeconds:'護盾施放間隔秒數',shieldHits:'護盾擋住幾下'};
    for(const [key,bounds] of Object.entries(ctx.api.PACING_BOUNDS)) if(!(key in bound)&&!(key in events)) ctx.range(pacing,ctx.draft.pacing,key,bounds,names[key]);
    ctx.el('p','每關主題怪＋隨機兩種，最後混合本場怪物。依事件積木時間各抽一個不同事件；先預警，再從畫面外進場。主角升到設定等級後，小熊與蒲公英仍會丟字。',pacing);
  }
  function drawWavePreview(id) {
    if(!ctx.previewPane) return;
    // 時間表與編譯後資料同源；編輯時立即刷新，實際走位用「試玩」。
    if(!ctx.previewPane.waveSummary) ctx.previewPane.waveSummary=ctx.el('div',undefined,ctx.previewPane);
    const host=ctx.previewPane.waveSummary;host.textContent='';if(!ctx.api.validate(ctx.draft).valid) {ctx.el('p','請先修正積木數值，再查看預覽或試玩。',host);return;}
    const stage=ctx.draft.stages.find(s=>s.id===id);
    if(stage) for(const w of stage.waves) ctx.el('p',w.start+' 秒起：'+(w.typeId==='pacing'?'本場怪物':(ctx.draft.enemies.find(e=>e.id===w.typeId)||{}).name)+' ×'+w.count+'，每 '+w.every+' 秒，'+ctx.api.WAVE_POSITIONS[w.position],host);
    else if(id==='pacing') {const p=ctx.draft.pacing;ctx.el('p',(p.pattern==='steady'?'穩定密度：'+p.strongScale+'。':'強／弱密度：'+p.strongScale+'／'+p.weakScale+'；每 '+p.cycleSeconds+' 秒交替。')+'事件 '+p.eventTimes.join('／')+' 秒，預警 '+p.warning+' 秒後分批 '+p.eventCount+' 隻。',host);for(const [kind,e] of Object.entries(ctx.draft.waveEvents)) ctx.el('p',({ring:'包圍',tide:'湧潮','elite-squad':'精英小隊','candy-rain':'跳跳糖'})[kind]+'：'+(e.typeId==='pacing'?'本場隨機怪物':(ctx.draft.enemies.find(m=>m.id===e.typeId)||{}).name)+(e.elite?'（精英）':'')+'，'+ctx.api.WAVE_POSITIONS[e.position],host);}
    else {const c=ctx.draft[id];ctx.el('p',!c.enabled?'已停用':id==='elites'?'每 '+c.interval+' 秒抽選，機率 '+c.chance+'，每批 '+c.count+' 隻。':'老師出場時間 × '+c.stageFraction+' 時出現一次。',host);}
  }
  function drawWaveBlocks(parent,section) {
    for(const def of ctx.api.waveDefinitions(ctx.draft).filter(d=>d.section===section)) {
      const move=ctx.draft.waveBlocks.moves.find(m=>m.id===def.id), group=ctx.el('section',undefined,parent);group.className='weapon-stack';ctx.el('h3',def.label,group);
      for(const part of ['trigger','shape','timing','effect','feedback']) {
        const fields=ctx.blockPanel(group,'wave-'+def.id+'-'+part,part), values=move[part];
        if(part==='trigger') ctx.el('p',({stageTime:'關卡時間到時',stageClock:'關卡時鐘',eventSelected:'本場抽到這個事件時',interval:'每隔一段時間抽選',stageFraction:'每關出現一次'})[values.event],fields);
        for(const key of def[part]) {
          if(key==='typeId') {if(section==='chocobear') ctx.el('p','生出巧克力大熊',fields);else ctx.select(fields,'生出哪種怪',values,key,{pacing:'本場隨機怪物',...Object.fromEntries(ctx.draft.enemies.map(e=>[e.id,e.name]))});}
          else if(key==='position') ctx.select(fields,'生怪位置',values,key,ctx.api.WAVE_POSITIONS);
          else if(key==='sound') ctx.select(fields,'進場音效',values,key,{none:'靜音',warning:'預警'});
          else if(key==='hint'||key==='elite'||key==='enabled') {const toggle=ctx.button(fields,({hint:'進場提示',elite:'變成精英',enabled:'啟用'})[key]+'：'+(values[key]?'開':'關'),()=>{values[key]=!values[key];ctx.changed();ctx.render();},values[key]);if(key==='enabled') {toggle.setAttribute('aria-label','啟用'+def.label+(values[key]?'：開':'：關'));toggle.setAttribute('role','switch');toggle.setAttribute('aria-checked',String(values[key]));}}
          else if(key==='pattern') ctx.select(fields,'波次型態',values,key,{alternating:'強弱交替',steady:'穩定出怪'});
          else {
            const bounds=({start:[0,300,1],every:[.3,5,.05],count:[1,10,1],first:[1,299,1],second:[2,300,1]})[key]||ctx.api.PACING_BOUNDS[key]||ctx.api.ENCOUNTER_BOUNDS[section]&&ctx.api.ENCOUNTER_BOUNDS[section][key];
            const names={start:'開始秒數',every:move.trigger.start+' 秒起出怪間隔',count:'每批怪物數',first:'第一個事件秒數',second:'第二個事件秒數',density:'出怪密度倍率',strongScale:'強波密度倍率',weakScale:'喘息波密度倍率',cycleSeconds:'強弱交替秒數',eventSeconds:'事件進場秒數',eventCount:'每次事件怪物數',warning:'招式預警秒數',interval:'精英抽選間隔秒數',chance:'每次抽選出現機率',stageFraction:'每關出場時間比例'};
            if(bounds && !(section==='chocobear' && key==='count')) ctx.range(fields,values,key,bounds,names[key]);
          }
        }
        if(!def[part].length) ctx.el('small','沿用關卡的生怪規則',fields);
      }
    }
  }
  function drawStage(stage) {
    drawWaveBlocks(ctx.panel(stage.name+' 波次'),stage.id);ctx.wavePreview=stage.id;drawWavePreview(stage.id);
  }
  // 武器、怪物、老師共用相同的積木外殼與收合狀態。
  return { drawEncounters, drawBodyRules, drawPacing, drawWavePreview, drawWaveBlocks, drawStage };
};
