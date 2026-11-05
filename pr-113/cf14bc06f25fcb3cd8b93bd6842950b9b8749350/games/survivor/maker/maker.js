(function () {
  'use strict';
  const api = SurvivorData, loaded = api.load();
  let draft = loaded.data, tab = 'weapons', selected = {}, defaultsOpen = false, previewOpen = false, cardIndex = 0, moveIndex = 0, dirty = false;
  let content, previewPane, defaultsDetails;
  const weaponBlocksOpen={}, cardBlocksOpen={};
  const editor = document.getElementById('editor'), status = document.getElementById('makerStatus');
  const labels = { damage: '傷害', radius: '範圍／大小', speed: '速度', count: '數量', spread: '散射角度', duration: '持續秒數', interval: '間隔秒數', multiplier: '緩速後剩餘速度', distance: '擊退／衝撞距離', gap: '缺口角度', warning: '預警秒數', pulse: '連發間隔', hp: '血量', maxLevel: '最高等級', power: '原本效果強度' };
  function el(tag, text, parent) { const node = document.createElement(tag); if (text !== undefined) node.textContent = text; if (parent) parent.appendChild(node); return node; }
  function message(text, error = false) { status.textContent = text; status.className = error ? 'error' : ''; }
  let wavePreview;
  function syncWaveDraft() {
    if(!draft.waveBlocks) draft.waveBlocks=api.waveStacks(draft);
    let compiled;try {compiled=api.compileWaves(draft);} catch(error) {message(error.message,true);return false;}
    for(const key of ['pacing','elites','chocobear']) Object.assign(draft[key],compiled[key]);
    draft.stages.forEach((stage,i)=>stage.waves.forEach((wave,j)=>Object.assign(wave,compiled.stages[i].waves[j])));
    draft.waveEvents=compiled.waveEvents;return true;
  }
  function waveBinding(id) {
    const move=draft.waveBlocks.moves.find(m=>m.id===id), binding={};
    for(const part of ['trigger','shape','timing','effect','feedback']) for(const key of Object.keys(move[part])) if(key!=='event') Object.defineProperty(binding,key,{enumerable:true,get:()=>move[part][key],set:value=>{move[part][key]=value;}});
    return binding;
  }
  function changed() { syncWaveDraft(); if(wavePreview) drawWavePreview(wavePreview); for(const w of draft.weapons) if(w.blocks) Object.assign(w,api.compileWeapon(w)); for(const e of draft.enemies) if(e.blocks) Object.assign(e,api.compileEnemy(e)); for(const m of draft.boss.moves) if(m.blocks) Object.assign(m,api.compileBossMove(m)); refreshTimelines(); if (globalThis.SurvivorPreview) SurvivorPreview.refresh(); if (globalThis.SurvivorPractice) SurvivorPractice.refresh(draft); dirty = true; const result = api.validate(draft); message(result.valid ? '作品已修改，記得儲存或按試玩！' : result.errors.join('；'), !result.valid); }
  function items() {
    if(tab==='weapons') return draft.weapons.map(w=>({id:w.id,name:w.name,icon:w.icon,draw:drawWeapons,practice:w.id}));
    if(tab==='cards') return [{id:'schools',name:'流派名稱',icon:'water',draw:drawSchools},...draft.cards.map((c,i)=>({id:c.id,name:c.name,icon:c.icon,note:(c.school?draft.build[c.school].name:'支援')+' · '+(c.requires.length?'↳ '+c.requires.map(id=>draft.cards.find(x=>x.id===id).name).join(' ＋ '):'起點'),draw:()=>{cardIndex=i;drawCards();},spec:{kind:'card',id:c.id}}))];
    if(tab==='enemies') return draft.enemies.map(e=>({id:e.id,name:e.name,icon:'monster',draw:drawEnemies,practice:e.id}));
    if(tab==='boss') return [{id:'gallery',name:'王的試煉',icon:'boss',draw:drawBoss},{id:'weakpoint',name:'弱點積木',icon:'weakpoint',draw:drawBoss},{id:'ai',name:'AI 規則',icon:'boss',draw:drawBoss},{id:'phases',name:'魔王階段',icon:'boss',draw:drawBoss},{id:'zone',name:'安全圈',icon:'ring',draw:drawBoss},...draft.boss.moves.map(m=>({id:m.id,name:m.name,icon:m.kind,draw:drawBoss,spec:{kind:'move',id:m.id}}))];
    if(tab==='stages') return [{id:'pacing',name:'出怪節奏',icon:'monster',draw:drawPacing},...draft.stages.map(stage=>({id:stage.id,name:stage.name,icon:'play',draw:()=>drawStage(stage)})),{id:'elites',name:'精英怪',icon:'monster',draw:()=>drawEncounters('elites','精英怪')},{id:'chocobear',name:'巧克力大熊',icon:'boss',draw:()=>drawEncounters('chocobear','巧克力大熊')}];
    return [{id:'defaults',name:'預設設定',draw:drawDefaults},{id:'body',name:'碰撞與重量',draw:drawBodyRules},{id:'neutral',name:'中立道具',draw:drawNumbers},{id:'schoolRules',name:'流派數值',draw:drawNumbers},{id:'tuning',name:'基本玩法',draw:drawNumbers},{id:'build',name:'流派共用',draw:drawNumbers},{id:'bossTuning',name:'魔王共用',draw:drawNumbers}].map(x=>({icon:'numbers',...x}));
  }
  function playGame(itemId) {
    if(save()) location.href='?maker=1&play=1'+(tab==='stages' && draft.stages.some(s=>s.id===itemId)?'&stage='+itemId:'');
  }
  function trial(item) {
    if(!api.validate(draft).valid) {message('請先修正作品中的錯誤再試玩。',true);return;}
    if(item.practice && globalThis.SurvivorPractice) {SurvivorPractice.open(draft,editor,null,item.practice);return;}
    if(item.spec && globalThis.SurvivorPreview) {
      SurvivorPreview.stop();
      const dock=el('section',undefined,document.getElementById('makerPanel'));dock.className='maker-trial';
      button(dock,'返回編輯',()=>{SurvivorPreview.stop();dock.remove();render();});
      const host=el('div',undefined,dock);host.className='skill-preview-host';SurvivorPreview.mount(host,draft,item.spec);return;
    }
    playGame(item.id);
  }
  function render() {
    syncWaveDraft();wavePreview=null;
    timingViews.length=0;
    if (globalThis.SurvivorPreview) SurvivorPreview.stop();
    if (globalThis.SurvivorPractice) SurvivorPractice.close();
    if(defaultsDetails) {defaultsOpen=defaultsDetails.open;defaultsDetails=null;}
    const scroll = content ? content.scrollTop : 0; editor.textContent = '';
    document.querySelectorAll('[data-tab]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.tab === tab)));
    const entries=items();
    const current=entries.find(x=>x.id===selected[tab])||entries[0];selected[tab]=current.id;
    const list=el('nav',undefined,editor);list.className='maker-items';list.setAttribute('aria-label','選擇編輯項目');
    for(const item of entries) {
      const tile=button(list,item.name,()=>{selected[tab]=item.id;render();content.scrollTop=0;},item.id===current.id);
      tile.dataset.item=item.id;tile.title=item.name;tile.setAttribute('aria-label',item.name);
      tile.innerHTML=SurvivorIcons.html(item.icon)+tile.innerHTML;
      if(item.note) el('small',item.note,tile);
    }
    content=el('div',undefined,editor);content.className='maker-content';
    const heading=el('div',undefined,content);heading.className='maker-item-heading';
    el('strong',current.name,heading);button(heading,'試玩',()=>trial(current));
    const toggle=button(heading,previewOpen?'收起預覽':'預覽',()=>{previewOpen=!previewOpen;render();});toggle.setAttribute('aria-expanded',String(previewOpen));
    previewPane=el('aside',undefined,editor);previewPane.className='maker-preview';previewPane.hidden=!previewOpen;editor.dataset.preview=previewOpen?'open':'closed';
    el('h3','預覽',previewPane);
    current.draw();content.scrollTop=scroll;
    if(previewOpen && current.practice && tab==='weapons' && globalThis.SurvivorPractice) {const host=el('div',undefined,previewPane);host.className='enemy-live-preview';SurvivorPractice.mount(host,draft,current.practice);}
    if(tab!=='stages' && !current.spec && !current.practice) el('p','按「試玩」到遊戲裡看看這個設定的效果。',previewPane);
  }
  const ctx = { api, editor, trial, el, message, changed, syncWaveDraft, waveBinding, render, labels };
  Object.defineProperties(ctx, {
    draft: { get: () => draft, set: value => { draft = value; } },
    tab: { get: () => tab, set: value => { tab = value; } },
    selected: { get: () => selected, set: value => { selected = value; } },
    defaultsOpen: { get: () => defaultsOpen, set: value => { defaultsOpen = value; } },
    previewOpen: { get: () => previewOpen, set: value => { previewOpen = value; } },
    cardIndex: { get: () => cardIndex, set: value => { cardIndex = value; } },
    moveIndex: { get: () => moveIndex, set: value => { moveIndex = value; } },
    content: { get: () => content, set: value => { content = value; } },
    previewPane: { get: () => previewPane, set: value => { previewPane = value; } },
    defaultsDetails: { get: () => defaultsDetails, set: value => { defaultsDetails = value; } },
    wavePreview: { get: () => wavePreview, set: value => { wavePreview = value; } }
  });
  Object.assign(ctx, { weaponBlocksOpen, cardBlocksOpen });
  for (const factory of Object.values(SurvivorMakerModules)) Object.assign(ctx, factory(ctx));
  const { panel, grid, text, button, select, range, feedbackEditor, iconPicker, timingViews, timingLabels, refreshTimelines, drawTiming, drawSchools, drawCards, cardRecipe, CARD_TRIGGERS, CARD_CONDITIONS, CARD_ACTIONS, drawCardBlocks, drawEffect, drawWeapons, monsterPicker, blockPanel, drawAttackStacks, drawEnemies, drawWeakpointEditor, drawBoss, drawEncounters, drawBodyRules, drawPacing, drawWavePreview, drawWaveBlocks, drawStage, drawDefaults, NEUTRAL_NAMES, drawNumbers, SCHOOL_NAMES, NUMBER_NAMES } = ctx;
  document.querySelectorAll('[data-tab]').forEach(button => button.addEventListener('click', () => {
    tab = button.dataset.tab; render();content.scrollTop=0;
  }));
  function save() { const result=api.save(draft); if(result.valid){dirty=false;message('作品已儲存在這台裝置！');}else message(result.errors.join('；'),true);return result.valid; }
  document.getElementById('save').addEventListener('click',save);
  document.getElementById('playSurvival').addEventListener('click',()=>{if(save())location.href='?maker=1&play=1&survival=1';});
  document.getElementById('play').addEventListener('click',()=>playGame(selected[tab]));
  document.getElementById('reset').addEventListener('click',()=>{draft=api.defaults();if(globalThis.SurvivorPractice) SurvivorPractice.refresh(draft);if(save()){render();message('已恢復預設作品。');}});
  window.addEventListener('beforeunload',event=>{if(dirty){event.preventDefault();event.returnValue='';}});
  const room = document.getElementById('makerPanel');
  let returnMode = 'ready';
  function openMaker(result) {
    if (state.mode !== 'maker') returnMode = state.mode === 'playing' ? 'paused' : state.mode;
    render(); state.keys.clear(); state.pointerId = null; state.joy = null; state.mode = 'maker'; updateActionControls();
    room.hidden = false; document.getElementById('overlay').classList.add('hidden');
    message(result || '挑一項開始設計吧！'); document.getElementById('play').focus();
  }
  window.openSurvivorMaker = openMaker;
  document.getElementById('makerLink').addEventListener('click', () => openMaker());
  document.getElementById('makerClose').addEventListener('click', () => {
    if(globalThis.SurvivorPractice) SurvivorPractice.close();
    if(globalThis.SurvivorPreview) SurvivorPreview.stop();
    if (MAKER_MODE) { if (dirty && !save()) return; location.href = './'; }
    else { if (dirty && !save()) return; room.hidden = true; showOverlay(returnMode); openSettings(); document.getElementById('makerLink').focus(); }
  });
  render();
  if (new URLSearchParams(location.search).get('editor') === '1') openMaker();
  message(loaded.valid?'挑一項開始設計吧！':loaded.errors.join('；'),!loaded.valid);
})();
