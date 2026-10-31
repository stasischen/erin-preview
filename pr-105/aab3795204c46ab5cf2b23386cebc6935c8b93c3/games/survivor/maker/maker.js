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
  function panel(title) { const node = el('section', undefined, content); node.className = 'panel'; el('h2', title, node); return node; }
  function grid(parent) { const node = el('div', undefined, parent); node.className = 'grid'; return node; }
  function text(parent, label, object, key, maxLength = 24) { const row = el('label', label, parent), input = el('input', undefined, row); input.type = 'text'; input.maxLength = maxLength; input.value = object[key] || ''; input.addEventListener('input', () => { object[key] = input.value; changed(); }); }
  function button(parent, title, action, pressed) {
    const node = el('button', title, parent); node.type = 'button';
    if (pressed !== undefined) node.setAttribute('aria-pressed', String(pressed));
    node.addEventListener('click', action); return node;
  }
  function select(parent, label, object, key, choices, onChange) {
    const row = el('details', undefined, parent); row.className = 'maker-choice';
    const heading = el('summary', label + '：' + (choices[object[key] || ''] || '請選擇'), row);
    const options = grid(row);
    Object.entries(choices).forEach(([value, title]) => button(options, title, () => {
      object[key] = value; heading.textContent = label + '：' + title; row.open = false;
      changed(); if (onChange) onChange(); else render();
    }, String(object[key] || '') === value));
    return row;
  }
  function range(parent, object, key, limits, label, iconOnly = false) {
    const bounds = limits || api.BOUNDS[key];
    if (key === 'phaseCount' && bounds && bounds[0] === 0 && bounds[1] === 1) {
      const toggle = button(parent, (label || labels[key] || key) + (object[key] ? '：開' : '：關'), () => { object[key] = object[key] ? 0 : 1; changed(); render(); });
      toggle.setAttribute('role', 'switch'); toggle.setAttribute('aria-checked', String(!!object[key])); return;
    }
    const row = el('div', undefined, parent); row.className = 'maker-number';
    el('span', label || labels[key] || key, row);
    const controls = el('div', undefined, row), value = el('output', String(object[key]), controls);
    const slider = el('input', undefined, row); slider.type = 'range'; slider.className = 'maker-slider';
    slider.min = bounds[0]; slider.max = bounds[1]; slider.step = bounds[2]; slider.value = object[key];
    slider.setAttribute('aria-label', label || labels[key] || key);
    slider.addEventListener('input', () => { object[key] = Number(slider.value); value.textContent = String(object[key]); changed(); });
    function adjust(direction) {
      object[key] = Number(Math.max(bounds[0], Math.min(bounds[1], object[key] + direction * bounds[2])).toFixed(4));
      value.textContent = String(object[key]); slider.value = object[key]; changed();
    }
    const minus = button(controls, '−', () => adjust(-1)), plus = button(controls, '＋', () => adjust(1));
    minus.setAttribute('aria-label', (label || labels[key] || key) + ' 減少');
    plus.setAttribute('aria-label', (label || labels[key] || key) + ' 增加');
    if (iconOnly) for (const [b,id] of [[minus,'minus'],[plus,'plus']]) { b.textContent=''; b.innerHTML=SurvivorIcons.html(id); b.className='encounter-adjust'; }

  }
  function feedbackEditor(parent,f) {
    select(parent,'回饋等級',f,'level',{small:'小',medium:'中',large:'大',custom:'自訂'},()=>{if(f.level!=='custom')Object.assign(f,api.FEEDBACK_TIERS[f.level],{hitStop:1,shake:1});changed();render();});
    select(parent,'預警樣式',f,'warningStyle',api.WARNING_STYLES);
    select(parent,'音效',f,'sound',api.FEEDBACK_SOUNDS);
    for(const [key,label] of [['slash','刀光'],['hint','提示']]) button(parent,label+'：'+(f[key]?'開':'關'),()=>{f[key]=!f[key];changed();render();},f[key]);
    range(parent,f,'hitStop',api.FEEDBACK_BOUNDS.hitStop,'頓幀倍率');
    range(parent,f,'shake',api.FEEDBACK_BOUNDS.shake,'震動倍率');
    for(const [key,label] of [['stopSeconds','停頓秒數'],['particles','粒子數'],['trauma','鏡頭創傷值'],['flash','閃白強度'],['numberScale','傷害數字大小']])range(parent,f,key,api.FEEDBACK_BOUNDS[key],label);
    el('small','仍套用玩家設定的回饋強度、震動與聲音開關。',parent);
  }
  function iconPicker(parent, card) {
    const picker = el('details', undefined, parent);
    const summary = el('summary', '挑選圖示', picker);
    summary.innerHTML = SurvivorIcons.html(card.icon) + summary.innerHTML;
    const choices = grid(picker); choices.className += ' icon-picker';
    SurvivorIcons.ids.forEach(id => {
      const option = button(choices, '', () => { card.icon = id; changed(); render(); }, card.icon === id);
      option.innerHTML = SurvivorIcons.html(id); option.setAttribute('aria-label', SurvivorIcons.labels[id]); option.title = SurvivorIcons.labels[id];
    });
  }
  function drawSchools() {
    const p = panel('替流派取名字');
    for (const school of draft.schools.map(s => s.id)) text(p, api.defaults().build[school].name, draft.build[school], 'name');
  }
  function drawCards() {
    const p = panel('設計技能卡');
    const edit = el('section', undefined, p); edit.id = 'makerCardEdit'; edit.className = 'maker-card-edit';
    el('h3', '編輯選中的卡片', edit);
    const c = draft.cards[cardIndex], fields = grid(edit);
    if (globalThis.SurvivorPreview) { const host=el('div',undefined,previewPane); host.className='skill-preview-host'; SurvivorPreview.mount(host,draft,{kind:'card',id:c.id}); }
    iconPicker(fields, c); text(fields, '卡片名稱', c, 'name'); text(fields, '遠程說明', c, 'description', 120); text(fields, '近戰說明', c, 'descriptionMelee', 120); text(fields, '大劍說明', c, 'descriptionSword', 120); range(fields, c, 'maxLevel');
    if (!c.neutral) select(fields, '流派', c, 'school', { '': '支援', ...Object.fromEntries(draft.schools.map(s => [s.id,draft.build[s.id].name])) });
    select(fields, '欄位', c, 'slot', {attack:'普攻',skill:'技能',dash:'衝刺',passive:'被動'});
    select(fields, '品質', c, 'rarity', {common:'普通',rare:'稀有',legendary:'傳說'});
    if (!c.neutral) select(fields, '技能樹階段', c, 'tier', {'':'支援',entry:'入門','advanced-a':'進階 A','advanced-b':'進階 B',fusion:'合體',ultimate:'終極（同流派 5 張）'});
    const prerequisites = el('details', undefined, edit); el('summary', '選擇前置卡片（目前 ' + c.requires.length + ' 張）', prerequisites);
    el('p', '每張前置卡達到 Lv1 即可。不要選自己，或讓前置卡互相繞成圈。', prerequisites);
    const checks = grid(prerequisites);
    draft.cards.filter(other => !c.neutral && other.id !== c.id).forEach(other => {
      const prerequisite = button(checks, (c.requires.includes(other.id) ? '✓ ' : '＋ ') + other.name, () => {
        c.requires = c.requires.includes(other.id) ? c.requires.filter(id => id !== other.id) : c.requires.concat(other.id); changed(); render();
      }, c.requires.includes(other.id));
      prerequisite.innerHTML = SurvivorIcons.html(other.icon) + prerequisite.innerHTML;
    });
    c.effects.forEach((effect, index) => drawEffect(edit, c, effect, index));
    if (c.effects.length < 3) { const add = el('button', '＋ 加一個積木', edit); add.type = 'button'; add.addEventListener('click', () => { c.effects.push({type:'aoe',trigger:'skill',...api.PARAMS}); changed(); render(); }); }
  }
  function cardRecipe(id) {
    return globalThis.SurvivorEffectBlocks && SurvivorEffectBlocks.recipes.find(r=>r.feature===id && (id.startsWith('item-') || id.startsWith('thunder-') || id.startsWith('water-') || id.startsWith('wind-') || id==='fusion-storm' || id==='fusion-dash' || id==='fusion-puddle' || ["big-water", "rapid-water", "multi-water", "onion-dash", "bubble-shield", "gem-magnet", "piercing-water", "splash-water", "auto-heal"].includes(id)));
  }
  const CARD_TRIGGERS={onWaveHit:'浪花命中時',onDeath:'擊倒怪物時',onBombDue:'糖果炸彈倒數到時',onBirdTick:'小鳥準備啄擊時',onAcquire:'取得卡片時',onOffer:'抽升級卡時',onHealth:'計算血條上限時',onUpgrade:'選到這張卡時',onHealTick:'回血計時到時',onMeleeHit:'近戰命中後',onMove:'計算移動速度時',onPickup:'吸取寶石時',onStill:'站定不動時',onWallTick:'風牆持續時',onEnemyShot:'敵人子彈碰到風牆時',onWaterHit:'水攻擊命中時',onShotHit:'普攻命中時',onFieldTick:'流派痕跡傷害計時到時',onPulse:'每隔一段時間',onDashEnd:'衝刺結束時',onDamage:'計算傷害時',onRainTick:'下雨持續時',onChain:'跳電命中時',onSkillBlast:'泡泡炸開時',onHurt:'受傷時',onUltimate:'終極技能準備好時',onDashTrail:'衝刺沿路留下痕跡',onShot:'發動普攻時',onSummonTimer:'每隔一段時間',onDashCross:'衝刺穿過怪物時',onTimer:'每隔一段時間'};
  const CARD_CONDITIONS={waveEligible:'非零方向，且目標仍可攻擊',chance:'外部抽樣小於掉落機率',countMultiple:'先增加計數，達到指定倍數才結算獎勵',splitEligible:'不是碎片，且不是自訂積木子彈',firstClover:'首次取得帶幸運草效果的卡',volleyPresent:'本次已有可複製的水球',healthMissing:'血量還沒補滿',still:'站定達到等待秒數',bladeEligible:'遠程普攻仍可穿透，且不是小風刃',shotMultiple:'普攻發數達到倍數',positiveDamage:'這次傷害大於零',bubbleActive:'泡泡盾還在',wetTarget:'目標身上濕濕的',radius:'範圍內的怪物',randomTarget:'隨機一隻可攻擊的怪物',killThreshold:'擊倒數達到門檻，且這次蓄電還沒用過',segmentTouching:'碰到衝刺路線的怪物',touching:'碰到主角的怪物'};
  const CARD_ACTIONS={'health-cost':'降低最大血量（保留至少一點）','collision-damage':'沿擊退路徑找第一隻可互撞怪物，兩隻各受傷並共用冷卻','bomb-drop':'掉落有上限的延遲糖果炸彈','bank-count':'每顆寶石球累積一次，成長獎勵有上限',split:'分裂兩顆碎片，每顆水球只分裂一次',reroll:'立刻增加一次重抽','rare-multiplier':'提高稀有卡抽選權重','rear-shot':'複製第一顆水球向後發射','kill-count':'累積擊倒數','size-multiplier':'放大普攻範圍','interval-multiplier':'縮短普攻間隔',spread:'增加水球數量（近戰擴大扇形）',health:'增加血條上限',heal:'補血並限制在血條上限','attack-multiplier':'加快普攻速度及距離（近戰放大範圍）','rate-multiplier':'依移動程度加快攻速',orbit:'繞著主角旋轉',pierce:'增加穿透次數',blade:'產生小風刃（近戰改成追斬）',refund:'回充部分衝刺進度','move-multiplier':'提高移動速度','pickup-multiplier':'擴大拾取範圍',wall:'建立保護風牆','block-shot':'擋掉敵人子彈',wet:'讓怪物濕濕的',slow:'讓怪物緩速',push:'推開怪物',bubble:'取得泡泡盾',absorb:'消耗泡泡盾並擋下這次傷害','damage-multiplier':'提高傷害倍率','big-drop':'放大這次普攻、增加傷害與擊退',rain:'開始下雨，持續影響全場怪物',chain:'連鎖閃電（每跳選最近的怪物，不重複命中）','chain-modifier':'增加跳電次數，每跳保留完整傷害',stun:'讓怪物暈眩',damage:'造成傷害',field:'留下流派痕跡（依流派造成傷害或緩速）',charged:'強化這次普攻，命中後跳電',summon:'放下避雷針，定時攻擊附近怪物',cue:'閃電提示'};
  function drawCardBlocks(parent,card,effect,index) {
    range(parent,effect,'power',undefined,'每級效果強度');
    el('p','數值與其他使用同一規則的卡片共用；修改後可按預覽看看。',parent);
    const refs=new Set();
    function collect(node) { if(!node || typeof node!=='object')return; if(node.ref)refs.add(node.ref);Object.values(node).forEach(collect); }
    const recipe=cardRecipe(effect.feature);
    for(const [i,rule] of recipe.rules.entries()) {
      const box=el('details',undefined,parent);box.className='card-block-stack';
      const key=card.id+':'+index+':'+i;box.open=cardBlocksOpen[key]===true;
      box.addEventListener('toggle',()=>{cardBlocksOpen[key]=box.open;});
      el('summary','積木堆：'+CARD_TRIGGERS[rule.trigger],box);
      el('p','觸發 → '+CARD_TRIGGERS[rule.trigger],box);
      for(const condition of rule.conditions || []) el('p','條件 → '+CARD_CONDITIONS[condition.type],box);
      for(const action of rule.actions) el('p','動作 → '+CARD_ACTIONS[action.type],box);
      collect(rule);
    }
    const fields=el('details',undefined,parent);el('summary','調整這堆積木的共用數值',fields);
    const defaults=api.defaults();
    for(const ref of refs) {
      const [group,key]=ref.split('.'), base=defaults[group][key];
      const bounds=group==='neutralRules'?api.NEUTRAL_BOUNDS[key]:group==='schoolRules'?api.SCHOOL_BOUNDS[key]:api.TUNING_BOUNDS[key] || (key==='fieldLimit'?[1,18,1]:[base===0?0:Math.min(.01,base),Math.max(5,base*3),base>=5?1:.01]);
      range(fields,draft[group],key,bounds,(NEUTRAL_NAMES[key]||SCHOOL_NAMES[key]||NUMBER_NAMES[key]));
    }
  }
  function drawEffect(parent, card, effect, index) {
    const box = el('fieldset', undefined, parent); const legend = el('legend', '積木 ' + (index + 1), box); legend.innerHTML = SurvivorIcons.html(effect.type) + legend.innerHTML;
    if (globalThis.SurvivorPreview) button(box,'看這個積木的效果',()=>{ previewOpen=true;render();const host=previewPane.querySelector('.skill-preview-host'); SurvivorPreview.mount(host,draft,{kind:'effect',id:card.id,index}); });
    const holder = { recipe: effect.feature ? 'recipe:' + effect.feature : effect.type };
    const recipes = Object.fromEntries(api.defaults().cards.map(c => ['recipe:' + c.id, (cardRecipe(c.id) ? '積木堆：' : '原本組合：') + c.name]));
    select(box, '選擇效果', holder, 'recipe', { ...api.TYPES, ...recipes }, () => {
      if (holder.recipe.startsWith('recipe:')) { const base = api.defaults().cards.find(c => c.id === holder.recipe.slice(7)); card.effects[index] = api.copy(base.effects[0]); }
      else card.effects[index] = { type: holder.recipe, trigger: card.slot === 'dash' ? 'dash' : card.slot === 'skill' ? 'skill' : card.slot === 'passive' ? 'interval' : 'hit', ...api.PARAMS };
      changed(); render();
    });
    if (cardRecipe(effect.feature)) drawCardBlocks(box,card,effect,index);
    else if (effect.feature) { el('p', '使用這張原本卡片的效果組合；數值可到「規則」調整。最多合計 5 級的效果。', box); range(box, effect, 'power'); }
    else {
      if(effect.trigger==='combo') {if(effect.comboStep===undefined)effect.comboStep=3;range(box,effect,'comboStep',[1,10,1],'第幾下');}
      select(box, '什麼時候發動？', effect, 'trigger', {combo:'第 N 下攻擊時',hit:'武器命中時',skill:'按技能時',dash:'按衝刺時',interval:'每隔一段時間'});
      el('p', '「間隔秒數」也是這個積木再次發動前的休息時間。傷害隨卡片等級增加。', box);
      const fields = grid(box), keys = { projectile:['damage','speed','count','spread','interval'], aoe:['damage','radius','interval'], chain:['damage','radius','count','interval'], 'dash-trail':['damage','radius','duration','interval'], slow:['radius','duration','multiplier','interval'], stun:['radius','duration','interval'], knockback:['radius','distance','interval'], summon:['damage','radius','duration','speed','count','interval'], 'ring-with-gap':['damage','radius','gap','interval'] };
      keys[effect.type].forEach(key => range(fields, effect, key, key === 'distance' && effect.type === 'knockback' ? [-300,300,5] : undefined));
      if (effect.type === 'knockback') { if(effect.slideSeconds===undefined)effect.slideSeconds=.2; range(fields,effect,'slideSeconds',[.15,.25,.01],'滑動秒數'); el('p', '距離正數推開，負數拉近；滑動由快到慢。', box); }
      if (effect.type === 'dash-trail') el('p', '按衝刺時會在沿路留下範圍痕跡。', box);
      if (effect.type === 'summon') el('p', '小幫手留在召喚位置，暫時自動發射水球。', box);
    }
    if (card.effects.length > 1) { const remove = el('button', '移除這個積木', box); remove.type = 'button'; remove.addEventListener('click', () => { card.effects.splice(index,1); changed(); render(); }); }
  }
  function monsterPicker(parent, enemy) {
    const picker = el('details', undefined, parent); picker.className = 'maker-choice';
    el('summary', '怪物造型：' + SurvivorMonsters.labels[enemy.spriteId], picker);
    el('p', '只換造型，招式另外設定。', picker);
    const choices = grid(picker);
    SurvivorMonsters.ids.forEach(id => {
      const option = button(choices, '', () => { enemy.spriteId = id; changed(); render(); }, enemy.spriteId === id);
      option.setAttribute('aria-label', SurvivorMonsters.labels[id]);
      const image = el('canvas', undefined, option); image.width = image.height = 48;
      image.setAttribute('aria-hidden', 'true');
      const g = image.getContext('2d'); g.imageSmoothingEnabled = false;
      g.drawImage(SurvivorMonsters.picture(id), 0, 0, 48, 48);
      el('span', SurvivorMonsters.labels[id], option);
    });
  }
  function drawEncounters(key, title) {
    const p = panel(title), cfg = draft[key]; drawWaveBlocks(p,key); wavePreview=key;drawWavePreview(key); p.className += ' maker-encounters';
    const bound=waveBinding(key); for(const field of Object.keys(bound)) if(field in cfg) Object.defineProperty(cfg,field,{enumerable:true,configurable:true,get:()=>bound[field],set:value=>{bound[field]=value;}});
    const toggle = (parent, label, value, action) => {
      const row = el('div',undefined,parent); row.className='encounter-toggle';
      el('span',label,row);
      const b = button(row,'',action); b.innerHTML=SurvivorIcons.html(value ? 'confirm' : 'pause');
      b.setAttribute('aria-label',label + (value ? '：開' : '：關')); b.title=label;
      b.setAttribute('role','switch'); b.setAttribute('aria-checked',String(value));
    };

    if (key==='elites') {
      for (const [id,name] of Object.entries(api.ELITE_ABILITIES)) toggle(p,name,cfg.abilities.includes(id),()=>{
        if (cfg.abilities.includes(id) && cfg.abilities.length===1) { message('至少保留一種能力；可用總開關停用精英。'); return; }
        cfg.abilities=cfg.abilities.includes(id)?cfg.abilities.filter(a=>a!==id):cfg.abilities.concat(id); changed();render();
      });
      el('p','每隔一段時間抽一次精英。分裂的三隻小怪也從畫面外進場。擊敗精英立即得到經驗獎勵。',p);
    } else {
      text(p,'小頭目名稱',cfg,'name');
      el('p','每關出現一次；時間比例乘上老師出場秒數。打破糖衣後才能傷害本體；擊敗後依序選兩張不同的升級卡。',p);
    }
    const names={interval:'精英抽選間隔秒數',chance:'每次抽選出現機率',limit:'同時精英上限',sizeScale:'精英身體倍率',healthScale:'精英血量倍率',rewardXp:'擊敗精英獎勵經驗',shieldHits:'糖霜擋住幾下',auraRadius:'加速光環範圍',auraSpeed:'光環速度倍率',syrupInterval:'留下糖漿間隔秒數',syrupSeconds:'糖漿持續秒數',syrupRadius:'糖漿範圍',syrupSlow:'糖漿內剩餘速度',teleportInterval:'傳送休息秒數',teleportWarning:'傳送預警秒數',teleportDistance:'傳送落點離主角距離',stageFraction:'每關出場時間比例',hp:'本體血量',armor:'糖衣盔甲血量',radius:'身體大小',speed:'移動速度',damage:'碰撞傷害',slamInterval:'重擊休息秒數',slamWarning:'重擊預警秒數',slamRadius:'重擊範圍',slamDamage:'重擊傷害'};
    const fields=grid(p);
    for (const [field,bounds] of Object.entries(api.ENCOUNTER_BOUNDS[key])) {if(!(field in bound)) range(fields,cfg,field,bounds,names[field],true);}
  }

  function drawBodyRules() {
    const body=grid(panel('怪物身體碰撞'));
    const toggle=(parent,label,obj,key)=>{const b=button(parent,label+'：'+(obj[key]?'開':'關'),()=>{obj[key]=!obj[key];changed();render();});b.setAttribute('role','switch');b.setAttribute('aria-checked',String(obj[key]));};
    toggle(body,'碰撞只會推開，不會受傷',draft.bodyContact,'pushOnly');
    range(body,draft.bodyContact,'damageScale',[0,1,.05],'身體傷害倍率（所有小怪，Boss 除外）');
    toggle(body,'身體柔性分離',draft.bodySeparation,'enabled');
    range(body,draft.bodySeparation,'radiusScale',[.5,1.5,.05],'身體半徑倍率');
    range(body,draft.bodySeparation,'playerForce',[0,1,.05],'主角與怪物推力');
    range(body,draft.bodySeparation,'enemyForce',[0,1,.05],'怪物之間推力');
    el('p','衝刺及衝刺保護期間可以穿過怪物；大怪會擋路。分離逐幀推開，怪群推動主角有共同上限。',body);
    const weight=grid(panel('擊退與吸引重量'));
    range(weight,draft.knockback,'slideSeconds',[.15,.25,.01],'擊退滑動秒數');
    toggle(weight,'重量影響推拉',draft.knockback,'enabled');
    range(weight,draft.knockback,'strength',[0,5,.1],'重量影響（越大越難推動大怪）');
    range(weight,draft.knockback,'minibossMass',[1,100,1],'小頭目重量');
    range(weight,draft.knockback,'bossMass',[1,100,1],'老師重量');
    range(weight,draft.knockback,'bossMultiplier',[0,1,.05],'老師推拉倍率（0 固定不動）');
    el('p','一般怪重量 1；坦克預設 8。重量也用於身體分離；關閉重量效果會恢復原本推拉距離。',weight);
  }
  function drawPacing() {
    const root=panel('出怪節奏');drawWaveBlocks(root,'pacing'); wavePreview='pacing';drawWavePreview('pacing');const pacing = grid(root);
    const bound=waveBinding('pacing'),events=waveBinding('events');for(const field of [...Object.keys(bound),...Object.keys(events)]) if(field in draft.pacing) {const b=field in bound?bound:events;Object.defineProperty(draft.pacing,field,{enumerable:true,configurable:true,get:()=>b[field],set:value=>{b[field]=value;}});}

    const names = {density:'出怪密度倍率',strongScale:'強波密度倍率',weakScale:'喘息波密度倍率',cycleSeconds:'強弱交替秒數',eventCount:'每次事件怪物數',eventSeconds:'事件進場秒數',warning:'招式預警秒數',chargeSpeed:'衝撞速度',chargeSeconds:'衝撞持續秒數',fuseSeconds:'跳跳糖引信（固定兩秒）',blastRadius:'自爆半徑',blastDamage:'自爆對主角傷害',blastEnemyDamage:'自爆對怪物傷害',shieldRadius:'仙子護盾範圍',shieldSeconds:'護盾施放間隔秒數',shieldHits:'護盾擋住幾下'};
    for(const [key,bounds] of Object.entries(api.PACING_BOUNDS)) if(!(key in bound)&&!(key in events)) range(pacing,draft.pacing,key,bounds,names[key]);
    el('p','每關主題怪＋隨機兩種，最後混合本場怪物。依事件積木時間各抽一個不同事件；先預警，再從畫面外進場。主角升到設定等級後，小熊與蒲公英仍會丟字。',pacing);
  }
  function drawWavePreview(id) {
    if(!previewPane) return;
    // 時間表與編譯後資料同源；編輯時立即刷新，實際走位用「試玩」。
    if(!previewPane.waveSummary) previewPane.waveSummary=el('div',undefined,previewPane);
    const host=previewPane.waveSummary;host.textContent='';if(!api.validate(draft).valid) {el('p','請先修正積木數值，再查看預覽或試玩。',host);return;}
    const stage=draft.stages.find(s=>s.id===id);
    if(stage) for(const w of stage.waves) el('p',w.start+' 秒起：'+(w.typeId==='pacing'?'本場怪物':(draft.enemies.find(e=>e.id===w.typeId)||{}).name)+' ×'+w.count+'，每 '+w.every+' 秒，'+api.WAVE_POSITIONS[w.position],host);
    else if(id==='pacing') {const p=draft.pacing;el('p',(p.pattern==='steady'?'穩定密度：'+p.strongScale+'。':'強／弱密度：'+p.strongScale+'／'+p.weakScale+'；每 '+p.cycleSeconds+' 秒交替。')+'事件 '+p.eventTimes.join('／')+' 秒，預警 '+p.warning+' 秒後分批 '+p.eventCount+' 隻。',host);for(const [kind,e] of Object.entries(draft.waveEvents)) el('p',({ring:'包圍',tide:'湧潮','elite-squad':'精英小隊','candy-rain':'跳跳糖'})[kind]+'：'+(e.typeId==='pacing'?'本場隨機怪物':(draft.enemies.find(m=>m.id===e.typeId)||{}).name)+(e.elite?'（精英）':'')+'，'+api.WAVE_POSITIONS[e.position],host);}
    else {const c=draft[id];el('p',!c.enabled?'已停用':id==='elites'?'每 '+c.interval+' 秒抽選，機率 '+c.chance+'，每批 '+c.count+' 隻。':'老師出場時間 × '+c.stageFraction+' 時出現一次。',host);}
  }
  function drawWaveBlocks(parent,section) {
    for(const def of api.waveDefinitions(draft).filter(d=>d.section===section)) {
      const move=draft.waveBlocks.moves.find(m=>m.id===def.id), group=el('section',undefined,parent);group.className='weapon-stack';el('h3',def.label,group);
      for(const part of ['trigger','shape','timing','effect','feedback']) {
        const fields=blockPanel(group,'wave-'+def.id+'-'+part,part), values=move[part];
        if(part==='trigger') el('p',({stageTime:'關卡時間到時',stageClock:'關卡時鐘',eventSelected:'本場抽到這個事件時',interval:'每隔一段時間抽選',stageFraction:'每關出現一次'})[values.event],fields);
        for(const key of def[part]) {
          if(key==='typeId') {if(section==='chocobear') el('p','生出巧克力大熊',fields);else select(fields,'生出哪種怪',values,key,{pacing:'本場隨機怪物',...Object.fromEntries(draft.enemies.map(e=>[e.id,e.name]))});}
          else if(key==='position') select(fields,'生怪位置',values,key,api.WAVE_POSITIONS);
          else if(key==='sound') select(fields,'進場音效',values,key,{none:'靜音',warning:'預警'});
          else if(key==='hint'||key==='elite'||key==='enabled') {const toggle=button(fields,({hint:'進場提示',elite:'變成精英',enabled:'啟用'})[key]+'：'+(values[key]?'開':'關'),()=>{values[key]=!values[key];changed();render();},values[key]);if(key==='enabled') {toggle.setAttribute('aria-label','啟用'+def.label+(values[key]?'：開':'：關'));toggle.setAttribute('role','switch');toggle.setAttribute('aria-checked',String(values[key]));}}
          else if(key==='pattern') select(fields,'波次型態',values,key,{alternating:'強弱交替',steady:'穩定出怪'});
          else {
            const bounds=({start:[0,300,1],every:[.3,5,.05],count:[1,10,1],first:[1,299,1],second:[2,300,1]})[key]||api.PACING_BOUNDS[key]||api.ENCOUNTER_BOUNDS[section]&&api.ENCOUNTER_BOUNDS[section][key];
            const names={start:'開始秒數',every:move.trigger.start+' 秒起出怪間隔',count:'每批怪物數',first:'第一個事件秒數',second:'第二個事件秒數',density:'出怪密度倍率',strongScale:'強波密度倍率',weakScale:'喘息波密度倍率',cycleSeconds:'強弱交替秒數',eventSeconds:'事件進場秒數',eventCount:'每次事件怪物數',warning:'招式預警秒數',interval:'精英抽選間隔秒數',chance:'每次抽選出現機率',stageFraction:'每關出場時間比例'};
            if(bounds && !(section==='chocobear' && key==='count')) range(fields,values,key,bounds,names[key]);
          }
        }
        if(!def[part].length) el('small','沿用關卡的生怪規則',fields);
      }
    }
  }
  function drawStage(stage) {
    drawWaveBlocks(panel(stage.name+' 波次'),stage.id);wavePreview=stage.id;drawWavePreview(stage.id);
  }
  // 武器、怪物、老師共用相同的積木外殼與收合狀態。
  function blockPanel(group,key,part) {
    const box=el('details',undefined,group);box.className='weapon-block';
    box.open=weaponBlocksOpen[key]!==false;
    box.addEventListener('toggle',()=>{weaponBlocksOpen[key]=box.open;});
    el('summary',api.BLOCK_PARTS[part]+'積木',box);
    return grid(box);
  }
  function drawAttackStacks(host,owner,defs,key) {
    if(!owner.blocks) owner.blocks=defs===api.ENEMY_STACKS?api.enemyStacks(owner):api.bossStacks(owner);
    const names={enabled:'使用分階段攻擊',triggerDistance:'觸發距離',radial:'子彈向四周發射（留缺口）',innerRadius:'圓環內半徑',length:'直線／子彈飛行距離',angle:'扇形角度',gapDegrees:'四周子彈缺口角度',level:'開始攻擊等級',minPhase:'第幾階段開始使用',recovery:'收招停頓秒數',cooldown:'招後冷卻秒數（至少階段休息）',phaseCount:'每個階段是否多一個目標'};
    for(const [i,move] of owner.blocks.moves.entries()) {
      const def=defs[i],group=el('section',undefined,host);group.className='weapon-move';el('h3',def.label,group);
      for(const part of Object.keys(api.BLOCK_PARTS)) {
        const fields=blockPanel(group,key+'-'+move.id+'-'+part,part),values=move[part];
        if(part==='feedback') {feedbackEditor(fields,move.feedback);continue;}
        if(part==='trigger') el('p',move.id==='phase'?'距離內開始預警，方向與原點鎖定。':move.id==='legacy'?'達到等級且間隔到時；分階段攻擊啟用時不重複出招。':'到達老師階段後，依遠近選招；遠處或畫面外優先跳躍／狙擊。',fields);
        if(move.id==='phase' && part==='timing') {drawTiming(fields,values,api.PHASE_BOUNDS);continue;}
        for(const field of def[part]) {
          if(['enabled','radial'].includes(field)) {
            const b=button(fields,names[field]+'：'+(values[field]?'開':'關'),()=>{values[field]=!values[field];changed();render();});b.setAttribute('role','switch');b.setAttribute('aria-checked',String(values[field]));
          } else if(field==='shape') select(fields,'預警與命中形狀',values,field,api.PHASE_SHAPES);
          else if(field==='type') select(fields,'攻擊形狀',values,field,{none:'不攻擊',projectile:'發射國字',aoe:'預警後範圍傷害',summon:'召喚怪物'});
          else if(field==='kind') select(fields,'招式形狀',values,field,api.KINDS);
          else {
            const legacy={interval:[1,15,.5],level:[2,20,1],damage:[0,30,1],speed:[50,200,5],radius:[10,100,1],count:[1,5,1],spread:[0,.6,.05]};
            const bounds=move.id==='phase'?api.PHASE_BOUNDS[field]:move.id==='legacy'?legacy[field]:field==='minPhase'?[1,3,1]:field==='phaseCount'?[0,1,1]:api.BOSS_MOVE_BOUNDS[field];
            range(fields,values,field,bounds,names[field]);
          }
        }
      }
    }
  }
  function drawEnemies() {
    const toggle=(parent,label,obj,key)=>{const b=button(parent,label+'：'+(obj[key]?'開':'關'),()=>{obj[key]=!obj[key];changed();render();});b.setAttribute('role','switch');b.setAttribute('aria-checked',String(obj[key]));};
    draft.enemies.filter(e=>e.id===selected.enemies).forEach(e => {
      const p = panel(e.name); const portrait = el('canvas', undefined, p); portrait.className = 'maker-portrait'; portrait.width = 128; portrait.height = 100; portrait.setAttribute('aria-label', e.name + '角色預覽'); const preview = portrait.getContext('2d'); preview.imageSmoothingEnabled = false; drawBlob(64, 50, e.radius, e.color, 0, false, e.id, preview, e.shadowSize, 0, e.spriteId); const fields = grid(p); text(fields, '怪物名稱', e, 'name'); range(fields, e, 'hp'); range(fields, e, 'speed', [0,170,5], '移動速度'); range(fields, e, 'radius', [10,35,1], '身體大小'); range(fields, e, 'damage', [0,40,1], '碰撞傷害'); range(fields,e,'mass',[1,100,1],'重量'); range(fields, e, 'shadowSize', [.3,1.8,.1], '影子寬度倍率');
      button(p,'試這隻',()=>SurvivorPractice.open(draft,editor,null,e.id));
      const live=el('details',undefined,previewPane);live.className='enemy-preview-toggle';el('summary','即時預覽（點開／收起）',live);live.open=previewOpen;
      const arena=el('div',undefined,live);arena.className='enemy-live-preview';
      live.addEventListener('toggle',()=>{if(live.open && previewPane.contains(live))SurvivorPractice.mount(arena,draft,e.id);else SurvivorPractice.unmount(arena);});
      monsterPicker(fields, e);
      select(fields, '移動方式', e, 'behavior', api.BEHAVIORS);
      el('p','分階段攻擊開啟時優先使用；關閉後才使用等級攻擊。原有移動與輔助能力保持原樣。',p);
      drawAttackStacks(p,e,api.ENEMY_STACKS,e.id);

    });
  }
  function drawWeakpointEditor() {
    const host=panel('共用弱點積木');
    el('p','普通部位只受護甲倍率傷害並發出小金屬火花；弱點先預告、亮起、關閉前快閃，命中使用大回饋。角度相對 Boss 朝向，180 度是背後。',host);
    const owners=[{owner:draft.boss,base:SURVIVOR_DEFAULTS.boss},...draft.gallery.bosses.filter(b=>SURVIVOR_DEFAULTS.gallery.bosses.find(base=>base.id===b.id).weakpoint).map(owner=>({owner,base:SURVIVOR_DEFAULTS.gallery.bosses.find(b=>b.id===owner.id)}))];
    for(const {owner,base} of owners) {
      const box=el('fieldset',undefined,host);el('legend',owner.name,box);
      if(!owner.weakpoint){button(box,'加入弱點積木',()=>{owner.weakpoint=api.copy(base.weakpoint);changed();render();});continue;}
      const config=owner.weakpoint;
      if(config.artId!==undefined)select(box,'弱點美術',config,'artId',{'effect/weakpoint':'青綠弱點','effect/weakpoint-red':'紅色弱點'});
      if(config.postureChargeMultiplier!==undefined){range(box,config,'postureChargeMultiplier',[1,2,.1],'破架勢蓄力額外倍率');el('p','只有真正破架勢且弱點打開的蓄力命中才額外套一次；不另乘老師暈眩傷害倍率。',box);}
      button(box,'移除弱點積木',()=>{owner.weakpoint=null;changed();render();});
      const names={armorMultiplier:'普通部位傷害倍率',criticalMultiplier:'弱點傷害倍率',warning:'弱點開啟預告秒數',closing:'弱點關閉提示秒數'};
      for(const [key,bounds] of Object.entries(api.WEAKPOINT_BOUNDS))range(box,config,key,bounds,names[key]);
      config.parts.forEach(part=>{
        const field=el('fieldset',undefined,box);el('legend','弱點部位 '+part.id,field);
        select(field,'美術錨點',part,'anchor',{weakpoint:'weakpoint（美術清單）'});
        for(const [key,bounds,label] of [['radiusScale',[.25,1.5,.05],'部位命中半徑倍率'],['angleDegrees',[-180,180,5],'相對朝向角度'],['arcDegrees',[20,360,5],'允許命中角度弧'],['duration',[.5,8,.1],'弱點開啟秒數']])range(field,part,key,bounds,label);
        if(part.requiresMatch!==undefined)button(field,'條件消失即關閉：'+(part.requiresMatch?'開':'關'),()=>{part.requiresMatch=!part.requiresMatch;changed();render();},part.requiresMatch);
        select(field,'條件組合',part,'mode',{any:'任一成立',all:'全部成立'});
        part.conditions.forEach(condition=>{
          const row=el('fieldset',undefined,field);
          select(row,'開啟條件',condition,'type',api.WEAKPOINT_CONDITIONS,()=>{
            if(condition.type==='after-move')condition.moveId=owner.moves[0].id;else delete condition.moveId;
            changed();render();
          });
          if(condition.type==='after-move')select(row,'指定招式',condition,'moveId',Object.fromEntries(owner.moves.map(m=>[m.id,m.name])));
          if(part.conditions.length>1)button(row,'移除此條件',()=>{part.conditions.splice(part.conditions.indexOf(condition),1);changed();render();});
        });
        if(part.conditions.length<7)button(field,'加入開啟條件',()=>{part.conditions.push({type:'recovery'});changed();render();});
        if(config.parts.length>1)button(field,'移除此弱點部位',()=>{config.parts.splice(config.parts.indexOf(part),1);changed();render();});
      });
      if(config.parts.length<8)button(box,'加入弱點部位',()=>{
        let index=1;while(config.parts.some(p=>p.id==='part-'+index))index++;
        config.parts.push({id:'part-'+index,anchor:'weakpoint',radiusScale:1,angleDegrees:0,arcDegrees:360,mode:'any',duration:1.5,conditions:[{type:'recovery'}]});changed();render();
      });
    }
    el('p','環境／誘餌條件由共用 triggerBossWeakpoint 事件入口觸發；此卡不新增場景機關。試老師可從招式頁進練習，守門人從王的試煉進入。',host);
  }
  function drawBoss() {
    if(selected.boss==='weakpoint'){drawWeakpointEditor();return;}
    if(selected.boss==='gallery') {
      const p=panel('王的試煉 · 圓形競技場'),g=draft.gallery;
      range(p,g,'arenaRadius',[200,300,10],'競技場半徑');range(p,g,'entrySeconds',[1,5,.1],'入口預警秒數');range(p,g,'wallStun',[1,5,.1],'撞牆暈眩秒數');
      range(p,g,'hazardLimit',[1,32,1],'危險區上限');range(p,g,'summonLimit',[1,16,1],'召喚物上限');
      const hazard=el('fieldset',undefined,p);el('legend','共用地面危險區積木（供後續 Boss 使用）',hazard);
      select(hazard,'種類',g.hazard,'kind',{poison:'毒池',ice:'冰面',fire:'火圈'});
      for(const [key,bounds,label] of [['radius',[20,200,5],'範圍'],['duration',[.1,15,.1],'持續秒數'],['interval',[.1,3,.1],'傷害間隔'],['damage',[0,40,1],'傷害'],['slow',[.2,1,.05],'剩餘速度']])range(hazard,g.hazard,key,bounds,label);
      for(const b of g.bosses) {
        const box=el('fieldset',undefined,p),gridBoss=b.moves.some(m=>m.blocks.moves[0].effect.gridRoll);el('legend',b.name,box);text(box,'名稱',b,'name');range(box,b,'hp',[500,5000,100],'血量');range(box,b,'radius',[20,50,1],'大小');if(!gridBoss)range(box,b,'speed',[0,200,5],'追擊速度');
        if(!gridBoss){range(box,b.phases[1],'threshold',[.05,.95,.01],'第二階段血量低於比例');range(box,b.phases[1],'speed',[.5,2,.05],'第二階段速度倍率');}
        for(const m of b.moves) {
          const field=el('fieldset',undefined,box);el('legend',m.name,field);const s=m.blocks.moves[0];
          if(s.effect.beam)range(field,m,'weight',[0,1,1],'光束啟用 0 關 1 開');
          else if(!s.effect.gridRoll){range(field,m,'minPhase',[1,2,1],'開始階段');range(field,m,'weight',[0,100,1],'AI 選招權重');range(field,m.ai,'minDistance',[0,10000,10],'AI 最近距離');range(field,m.ai,'maxDistance',[0,10000,10],'AI 最遠距離');range(field,m.ai,'phaseWeight',[0,10,.1],'AI 第二階段加權');}
          if(!s.effect.gridRoll&&!s.effect.beam)range(field,s.shape,'radius',[30,200,5],'形狀半徑');if(['sector','ring'].includes(s.shape.type))range(field,s.shape,'angle',[0,360,5],s.shape.type==='ring'?'安全缺口角度':'扇形角度');
          for(const [key,bounds,label] of [['windup',[.6,3,.05],'預警'],['active',[.1,4,.05],'出手'],['recovery',[.2,3,.05],'收招'],['cooldown',[.1,8,.1],'冷卻']])range(field,s.timing,key,bounds,label+'秒數');
          range(field,s.effect,'damage',[0,40,1],'傷害');if(!s.effect.gridRoll&&!s.effect.beam)range(field,s.effect,'speed',[0,600,10],'招式移速');
          if(s.effect.sequence){range(field,s.effect.sequence,'count',[1,8,1],'前半場連斬刀數');range(field,s.effect.sequence,'phaseCount',[1,8,1],'後半場連斬刀數');el('p','每刀固定使用預警＋出手秒數；只有整組最後才收招。連段開始鎖定刀數，中途半血仍完成原節拍。',field);}
          if(s.effect.relocate)for(const [key,bounds,label]of [['distance',[40,160,2],'背後換位距離'],['vanish',[.1,1,.05],'消失秒數'],['flash',[.2,.5,.05],'白閃預警秒數']])range(field,s.effect.relocate,key,bounds,label);
          if(s.effect.projectiles)for(const [key,bounds,label]of [['count',[1,15,1],'每扇苦無數量'],['speed',[60,400,10],'苦無速度'],['life',[.5,5,.1],'苦無壽命秒數'],['radius',[3,12,1],'苦無半徑']])range(field,s.effect.projectiles,key,bounds,label);
          if(s.effect.limb)for(const [key,bounds,label]of [['reach',[60,300,5],'肢體觸及距離'],['lift',[20,120,5],'舉手高度']])range(field,s.effect.limb,key,bounds,label);
          if(s.effect.gridRoll)range(field,s.effect.gridRoll,'cell',[60,120,5],'格步翻滾格距');
          if(s.effect.beam){range(field,s.effect.beam,'width',[3,20,1],'光束半寬');range(field,s.effect.beam,'range',[100,800,20],'光束最長距離');}
          if(s.effect.slide)range(field,s.effect.slide,'speed',[0,300,10],'橫向滑步速度');
          if(s.effect.duration!==undefined){
            if(['nova','cross'].includes(m.id))range(field,s.shape,'thickness',[2,40,1],'環／光束半寬');
            if(['frost-dash','tornado','feathers','spiral'].includes(m.id))range(field,s.effect,'duration',[.1,10,.1],'危險區／羽毛壽命秒數');
            if(['frost-dash','spiral'].includes(m.id))range(field,s.effect,'interval',[.1,3,.05],'生成間隔秒數');
            if(['feathers','spiral'].includes(m.id))range(field,s.effect,'count',[1,32,1],'每次羽毛數量');
            if(m.id==='frost-dash')range(field,s.effect,'slow',[.2,1,.05],'冰面剩餘速度');
            if(['cross','spiral'].includes(m.id))range(field,s.effect,'rotation',[0,6,.05],m.id==='cross'?'全招旋轉弧度':'每秒旋轉弧度');
          }
        }
      }
    } else if(selected.boss==='ai') {
      const p=panel('AI 規則積木');
      el('p','權重 0 停用。依距離、朝向與血量階段加權抽招，上一組招式不連續重複。老師仍保留近中遠距離分組。階段門檻在魔王階段調整；預警、生效、收招與冷卻在各招式時機積木調整。',p);
      draft.boss.phases.forEach((phase,i)=>{if(i)range(grid(p),phase,'threshold',[.05,.95,.01],'第 '+(i+1)+' 階段血量門檻');});
      draft.boss.ai.rules.forEach(rule=>{
        const box=el('fieldset',undefined,p);el('legend',draft.boss.moves.find(m=>m.id===rule.moveId).name,box);
        if(draft.boss.ai.rules.length>1)button(box,'移出招式清單',()=>{draft.boss.ai.rules.splice(draft.boss.ai.rules.indexOf(rule),1);changed();render();});
        for(const [key,label,bounds] of [['weight','權重（0 停用）',[0,100,1]],['minDistance','最近距離',[0,10000,10]],['maxDistance','最遠距離',[0,10000,10]],['angleWeight','朝向加權',[0,10,.1]],['phaseWeight','後期階段加權',[0,10,.1]]]) range(box,rule,key,bounds,label);
      });
      const missing=draft.boss.moves.filter(m=>!draft.boss.ai.rules.some(r=>r.moveId===m.id));
      for(const move of missing)button(p,'加入 '+move.name,()=>{draft.boss.ai.rules.push(api.bossAIRules(draft.boss).find(r=>r.moveId===move.id));changed();render();});
    } else if(selected.boss==='phases') {
    const p = panel('魔王與三個階段'), fields = grid(p); text(fields,'魔王名稱',draft.boss,'name'); range(fields,draft.boss,'hp',[500,5000,100]); range(fields,draft.boss,'speed',[0,200,5],'舊作品預設移速'); range(fields,draft.boss,'radius',[20,50,1],'身體大小');
    draft.boss.phases.forEach((phase,i) => { const box=el('fieldset',undefined,p); el('legend','第 '+(i+1)+' 階段',box); if(i) range(box,phase,'threshold',[.05,.95,.01],'血量低於比例'); range(box,phase,'speed',[0,200,5],'階段移速'); range(box,phase,'rest',[.4,8,.1],'招式休息秒數'); const holder={combo:phase.combo||''}; select(box,'範圍招式搭配的合招',holder,'combo',{'':'不合招',...Object.fromEntries(draft.boss.moves.map(m=>[m.id,m.name]))},()=>{phase.combo=holder.combo||null;changed();}); });
    const labels={nearDistance:'近距離上限',farDistance:'遠距離起點',pursuitDistance:'快走追趕起點',pursuitMultiplier:'快走速度倍率',healthPerUpgrade:'每次升級增加老師血量',leapRecovery:'跳躍落地可反擊秒數',leapPush:'跳躍落地擊退距離',trackingSeconds:'點名跟隨秒數',lockSeconds:'點名鎖定秒數',phaseWordsSpeed:'第二階段起國字速度',phaseChalkSpeed:'第二階段起粉筆速度'};
    const rules=grid(p);for(const [key,bounds] of Object.entries(api.BOSS_COMBAT_BOUNDS))range(rules,draft.boss.combat,key,bounds,labels[key]);
    const posture=panel('架勢與完美閃避'), pf=grid(posture), pl={window:'完美閃避時間窗（秒）',maximum:'架勢滿條',dodgeGain:'完美閃避累積量',recoveryGain:'收招命中累積量',interruptGain:'打斷招式累積量',decay:'架勢每秒下降',stunSeconds:'滿架勢暈眩秒數',chargeBonus:'暈眩時聚氣加速比例',damageMultiplier:'暈眩時蓄力傷害倍率',heal:'破架勢回血量'};
    for(const [key,bounds] of Object.entries(api.POSTURE_BOUNDS))range(pf,draft.boss.posture,key,bounds,pl[key]);
    el('p','閃過即將命中的招式、收招時打中、用暈眩打斷都能累積。滿條亮出弱點，抓住機會朝前方蓄力重擊！',posture);
    el('p','血量＝（基本血量＋已升級次數×加血量）×關卡倍率；目標 45～60 秒，請試玩調整。距離、速度、範圍皆為世界單位。',p);
    } else if(selected.boss==='zone') {
    const zone = panel('老師戰安全圈'), zf = grid(zone), z = draft.bossZone;
    const toggle = button(zf, '紫霧縮圈：' + (z.enabled ? '開' : '關'), () => { z.enabled = !z.enabled; changed(); render(); });
    toggle.setAttribute('role', 'switch'); toggle.setAttribute('aria-checked', String(z.enabled));
    range(zf,z,'steps',[0,3,1],'縮圈次數（每階段一次）');
    range(zf,z,'speed',[10,160,5],'縮圈速度（每秒距離）');
    range(zf,z,'damage',[0,4,.5],'紫霧每秒扣血');
    range(zf,z,'initialRadius',[300,1200,10],'初始半徑（世界單位）');range(zf,z,'finalRadius',[100,300,10],'最終半徑（世界單位）');range(zf,z,'warning',[1,8,.5],'縮圈預告秒數');
    el('p','每階段預告再收圈；圈外速度剩 80%。預設最後半徑 180（基準短邊 400 的 0.45 倍），裝置旋轉不改圈。完整效果請按試玩。',zone);
    } else {
    moveIndex=draft.boss.moves.findIndex(m=>m.id===selected.boss);
    const m=draft.boss.moves[moveIndex], box=panel(m.name);
    text(grid(box),'招式名稱',m,'name');
    button(box,'試這隻',()=>trial({spec:{kind:'move',id:m.id}}));
    if(globalThis.SurvivorPreview){const host=el('div',undefined,previewPane);host.className='skill-preview-host';SurvivorPreview.mount(host,draft,{kind:'move',id:m.id});}
    drawAttackStacks(box,m,api.BOSS_STACKS,'boss-'+m.id);
    el('p','老師在畫面外仍追擊；每招完整預警後才命中。連衝每次重新瞄準，最短預警 0.6 秒。黑板封路用範圍調牆長、距離調兩側間距；點名跟隨與鎖定時間在魔王階段頁調整。',box);

    }
  }
  function drawDefaults() {
    const pp=panel('預設設定'), details=el('details',undefined,pp), p=draft.playerDefaults;
    defaultsDetails=details;details.open=defaultsOpen;details.addEventListener('toggle',()=>{defaultsOpen=details.open;});
    el('summary','調整新玩家的預設值',details);
    const pf=grid(details);
    el('p','只供沒有個人設定的新玩家使用；你自己的操作、手感、聲音請到齒輪設定調整。',pp);
    select(pf,'預設攻擊模式',p,'attackMode',{manual:'手動',auto:'自動'},()=>{p.attackModeChosen=true;changed();});
    for (const [key,label] of Object.entries({joystickFollow:'搖桿跟隨',hitFeedback:'打擊回饋',vibration:'畫面震動',sound:'音效',music:'音樂',lowEffects:'低特效（省電）'})) {
      const b=button(pf,label+'：'+(p[key]?'開':'關'),()=>{defaultsOpen=details.open;p[key]=!p[key];changed();render();});
      b.setAttribute('role','switch');b.setAttribute('aria-checked',String(p[key]));
    }
    for (const [key,bounds] of Object.entries(api.PLAYER_BOUNDS)) range(pf,p,key,bounds,api.PLAYER_LABELS[key]);
  }
  // 主角與敵人共用的時間軸；編輯秒數時即時更新比例與文字。
  const timingViews=[];
  const timingLabels={windup:'起手',active:'生效',recovery:'收招',cooldown:'冷卻'};
  function refreshTimelines() {
    for(const {node,source} of timingViews) {
      node.textContent='';
      for(const segment of SurvivorTiming.segments(source)) {
        const item=el('span',timingLabels[segment.phase]+' '+Number(segment.seconds.toFixed(2))+'秒',node);
        item.className='timing-'+segment.phase; item.style.flexGrow=String(segment.seconds || .01);
      }
    }
  }
  function drawTiming(parent,source,bounds) {
    const box=el('fieldset',undefined,parent); el('legend','時機積木',box);
    const node=el('div',undefined,box);node.className='timing-timeline';node.setAttribute('aria-label','攻擊時間軸');
    timingViews.push({node,source}); refreshTimelines();
    const fields=grid(box);
    if(source.inputBuffer===undefined)source.inputBuffer=.12;
    range(fields,source,'inputBuffer',[.1,.15,.01],'輸入緩衝秒數');
    for(const key of Object.keys(api.TIMING_BOUNDS)) range(fields,source,key,bounds[key],key==='windup'?'起手預警秒數':key==='recovery'?'收招停頓秒數':timingLabels[key]+'秒數');
  }
  function drawWeapons() {
    const weaponNames={interval:'揮擊間隔秒',arcDegrees:'揮擊角度',radius:'揮擊距離',damageMultiplier:'水球傷害的幾倍',push:'擊退距離',spinEvery:'每幾下旋轉一圈',damageReduction:'受到傷害減少比例'};
    const specialNames={specialCooldown:'特殊招冷卻秒數',specialCount:'特殊招發射數量',specialSpread:'特殊招散射弧度',specialRange:'特殊招距離',specialDamage:'特殊招傷害倍率',specialLeapDistance:'跳躍距離',specialLeapSeconds:'跳躍秒數'};
    const attackNames={chargeStun:'蓄力暈眩秒數',splashSize:'大泡泡水花半徑倍率',splashDamage:'大泡泡水花傷害比例',comboEvery:'連段下數',comboReset:'停止攻擊幾秒重置',comboMultiplier:'最後一段傷害倍率',chargeSeconds:'站定聚氣秒數',chargeMultiplier:'蓄力傷害倍率',moveRetention:'開始移動保留聚氣比例（0 為重置）',chargeSize:'蓄力範圍倍率',comboSize:'最後一段範圍倍率',comboPush:'蓄力／重刺額外擊退',finisherRecovery:'最後一段額外收招秒',stepDistance:'重刺踏步距離',thrustWidth:'突刺半寬'};
    for(const w of draft.weapons.filter(w=>w.id===selected.weapons)) {
      if(!w.blocks) w.blocks=api.weaponStacks(w);
      const host=panel(w.name+'招式積木');
      el('p','由上往下拼招式；連段重招、蓄力和衝刺斬沿用普通攻擊的時間軸；特殊招有自己的冷卻。按旁邊的預覽或試玩看看！',host);
      const partNames=api.BLOCK_PARTS;
      const toggles={comboEnabled:'連段',chargeEnabled:'自動聚氣',dashThrust:'衝刺突刺'};
      for(const [i,move] of w.blocks.moves.entries()) {
        if(move.id==='dash' && w.id!=='candy-sword') continue;
        const group=el('section',undefined,host); group.className='weapon-move';
        el('h3',api.WEAPON_STACKS[i].label,group);
        for(const part of Object.keys(partNames)) {
          const fields=blockPanel(group,w.id+'-'+move.id+'-'+part,part),values=move[part];
          if(part==='feedback') {feedbackEditor(fields,move.feedback);continue;}
          if(move.id==='primary' && part==='timing') drawTiming(fields,values.phases,api.TIMING_BOUNDS);
          for(const field of api.WEAPON_STACKS[i][part]) {
            if(values[field]===undefined) continue;
            if(['specialLeapDistance','specialLeapSeconds'].includes(field) && w.specialKind!=='leap') continue;
            if(field==='specialKind') {el('p',{leap:'跳躍落地扇形重擊','sword-wave':'前方穿透劍波','water-fan':'前方扇形水球'}[values[field]],fields);continue;}
            if(field==='direction') {select(fields,'攻擊方向',values,field,{nearest:'朝最近的敵人',facing:'朝移動面向'});continue;}
            if(toggles[field]) {
              const label=toggles[field], toggle=button(fields,label+'：'+(values[field]?'開':'關'),()=>{values[field]=!values[field];changed();render();});
              toggle.setAttribute('role','switch');toggle.setAttribute('aria-checked',String(values[field]));continue;
            }
            if(field.endsWith('Shape')) {
              if(w.kind==='projectile') el('p','朝前方發射水球',fields);
              else select(fields,field==='baseShape'?'普通招式':field==='comboShape'?'最後一段招式':'蓄力招式',values,field,field==='comboShape'?{sector:'前方扇形',line:'前方直線',spin:'旋轉一圈'}:{sector:'前方扇形',line:'前方直線'});
              continue;
            }
            if(w.kind!=='projectile' && ['splashSize','splashDamage'].includes(field)) continue;
            if(w.kind==='projectile' && ['comboPush','finisherRecovery','stepDistance','thrustWidth','chargeStun'].includes(field) || w.id!=='candy-sword' && ['stepDistance','thrustWidth'].includes(field)) continue;
            range(fields,values,field,api.SPECIAL_BOUNDS[field]||api.ATTACK_BOUNDS[field]||api.WEAPON_BOUNDS[field],specialNames[field]||attackNames[field]||weaponNames[field]);
          }
          if(move.id==='dash' && part==='shape') el('p','朝前方直線突刺，沿用連段特殊招的大小與寬度。',fields);
          if(move.id==='dash' && part==='effect') el('p','沿用連段特殊招的傷害、擊退與踏步。',fields);
          if(move.id==='special' && part==='trigger') el('p','手動模式放開特殊招按鈕；冷卻到時可再用。',fields);
          if(!['primary','special'].includes(move.id) && part==='timing') el('small','沿用普通攻擊時間軸；自動模式維持原節奏。',fields);
          if(move.id==='primary' && part==='trigger') el('small','手動：放開攻擊鍵；自動：攻擊間隔到時。',fields);
          if(move.id==='combo' && part==='trigger') el('small','第 N 下使用特殊招。',fields);
          if(move.id==='charge' && part==='trigger') el('small','手動：按住再放開；自動：站定聚氣。只放大朝前方的形狀。',fields);
        }
      }
    }
  }

  const NEUTRAL_NAMES={wavePush:"浪花額外擊退距離",waveDamage:"浪花互撞傷害",waveCooldown:"浪花每隻冷卻秒", "itemsPerRun": "每場道具卡池張數", "bombChance": "炸彈掉落機率", "bombDelay": "炸彈等待秒", "bombRadius": "炸彈半徑", "bombDamage": "炸彈傷害", "birdRadius": "小鳥繞行半徑", "birdReach": "小鳥啄擊距離", "birdSeconds": "小鳥攻擊間隔秒", "birdDamage": "小鳥傷害", "bankEvery": "金庫每幾顆球成長", "bankStep": "金庫每次傷害加成", "bankCap": "金庫傷害加成上限", "splitDamage": "分裂傷害倍率", "splitAngle": "分裂角度", "magnetMultiplier": "磁鐵拾取倍率", "crownDamage": "王冠傷害加成", "crownHealth": "王冠減少最大血量", "luckyRareMultiplier": "幸運草稀有權重倍率", "cookieKills": "餅乾回血所需擊倒數"};
  function drawNumbers() {
    const defaults=api.defaults();
    if(selected.rules==='neutral') {
    const nf=grid(panel('中立道具數值'));

    for(const [key,bounds] of Object.entries(api.NEUTRAL_BOUNDS)) range(nf,draft.neutralRules,key,bounds,NEUTRAL_NAMES[key]);
    }
    if(selected.rules==='schoolRules') {
    const schoolPanel=panel('流派數值'), schoolFields=grid(schoolPanel);
    for (const [key,bounds] of Object.entries(api.SCHOOL_BOUNDS)) range(schoolFields,draft.schoolRules,key,bounds,SCHOOL_NAMES[key]);
    }
    for(const [key,title] of [['tuning','基本玩法'],['build','流派共用數值'],['bossTuning','魔王共用數值']]) {
      if(selected.rules!==key) continue;
      const p=panel(title), fields=grid(p);
      for(const [field,value] of Object.entries(draft[key])) {
        if(typeof value!=='number') continue;
        if(key==='bossTuning' && !['phasePause','hazardLimit','shakeSeconds','shakePixels'].includes(field)) continue;
        if(key==='tuning' && ['enemySpeed','enemyRadius','enemyDamage','enemyHealth','secondEnemySpeed','secondEnemyDamage','enemyShootLevel','enemyShotInterval','secondEnemyShotInterval','enemyShotSpeed','enemyShotDamage','secondEnemyHealth','teacherHealth','teacherShotDamage','teacherShotCount','teacherShotSpread'].includes(field)) continue;
        const integer=['maxUpgradeLevel','enemyLimit','enemyShotLimit','teacherShotCount','teacherShotLimit','projectileLimit','gemLimit','xpToLevel','xpGrowthPerLevel','enemyShootLevel','fieldLimit','hazardLimit'].includes(field);
        let min=integer?1:value===0?0:Math.min(.01,defaults[key][field]), max=integer?defaults[key][field]:Math.max(5,defaults[key][field]*3), step=integer?1:defaults[key][field]>=5?1:.01;
        if(field==='slowMultiplier') {min=.2;max=1;step=.05;} if(field==='supportChance') {min=0;max=1;step=.05;}
        range(fields,draft[key],field,api.TUNING_BOUNDS[field] || [min,max,step],NUMBER_NAMES[field]);
      }
    }
  }
  const SCHOOL_NAMES = {
    schoolsPerRun:'每場流派數',cardsPerSchool:'每流派一般卡池張數',transformCards:'變身所需不同卡數',ultimateCards:'終極所需不同卡數',fusionCards:'合體各流派卡數',legendaryChance:'傳說額外抽選權重',rareWeight:'稀有抽選權重',ownedWeight:'每張同流派卡增加權重',starterWeight:'起始流派額外權重',bigDropEvery:'每幾發出大水滴',bigDropSize:'大水滴大小倍率',bigDropDamage:'大水滴傷害倍率',bigDropPush:'大水滴擊退距離',fountainSeconds:'噴泉間隔秒',fountainRadius:'噴泉範圍',fountainPush:'噴泉擊退距離',wetSeconds:'濕潤秒數',wetDamage:'濕答答額外傷害比例',rainSeconds:'下雨間隔秒',rainDuration:'下雨持續秒',windBladeDamage:'風刃傷害比例',windBladeRange:'風刃飛行距離',gustSeconds:'吹飛間隔秒',gustRadius:'吹飛範圍',gustPush:'吹飛距離',refundCharge:'順風回充格數',lightSpeed:'輕飄飄移速比例',lightMagnet:'輕飄飄拾取加成',eyeWait:'風牆站定等待秒',eyeRadius:'風牆範圍',eyePush:'風牆每秒推力',chargeKills:'蓄電擊倒數',chargeDamage:'大閃電傷害倍率',rodSeconds:'避雷針間隔秒',rodDuration:'避雷針持續秒',rodRadius:'避雷針範圍',rodDamage:'避雷針傷害',rodTick:'避雷針攻擊間隔秒',thunderStepStun:'雷步暈眩秒',staticSeconds:'靜電間隔秒',staticDamage:'靜電傷害',superconductorJumps:'超導體多跳數',waterFormSize:'水變身水球大小加成',windFormCharges:'風變身衝刺格數',thunderFormRange:'雷變身連鎖範圍加成'
  };
  const NUMBER_NAMES = {
    levelupRerolls:'每場升級重抽次數', splashDamageBase:'水花基本傷害比例', splashDamageGrowth:'水花每級傷害加成', chainGrowth:'跳電每級傷害加成', fieldRadiusGrowth:'痕跡每級範圍加成', supportSplashDamage:'支援水花傷害比例', healIntervalMultiplier:'補血每級間隔倍率', shieldHealthDivisor:'護盾增血除數', maxUpgradeLevel:'卡片等級上限', splashBaseRadius:'水花基本範圍', splashPerLevel:'每級水花範圍', invincibleSeconds:'受傷後保護秒數', waterSizePerLevel:'每級水球大小加成', damagePerLevel:'每級水球傷害加成', fireRateReduction:'每級連發間隔減少比例', extraShotAngle:'多重水球間隔角度', moveSpeedPerLevel:'每級移速加成', magnetPerLevel:'每級磁鐵加成', playerSpeed:'主角速度', playerHealth:'主角血量', enemyLimit:'怪物數量上限', enemySpeed:'甲本預設移速', enemyRadius:'甲本預設大小', enemyDamage:'甲本預設碰撞傷害', enemyHealth:'甲本預設血量', secondEnemySpeed:'乙本預設移速', secondEnemyDamage:'乙本預設碰撞傷害', enemyShootLevel:'預設開始丟字等級', enemyShotInterval:'甲本預設丟字間隔', secondEnemyShotInterval:'乙本預設丟字間隔', enemyShotSpeed:'預設國字速度', enemyShotDamage:'預設國字傷害', enemyShotGap:'怪物共同丟字間隔', enemyShotLimit:'怪物國字上限', enemySpeedGrowth:'每半分鐘怪物加速比例', secondEnemyHealth:'乙本預設血量', waveSeconds:'魔王出場秒數', teacherHealth:'魔王預設血量', teacherShotDamage:'魔王預設國字傷害', teacherShotCount:'魔王預設國字數量', teacherShotSpread:'魔王預設國字角度', teacherShotLimit:'魔王國字上限', shotInterval:'自動水球間隔', projectileDamage:'基本水球傷害', projectileSpeed:'基本水球速度', projectileLimit:'水球數量上限', gemLimit:'寶石數量上限', gemPullRadius:'寶石吸取範圍', xpToLevel:'初次升級需求', xpGrowthPerLevel:'每級增加需求', dashCharges:'衝刺格數',dashInvincible:'衝刺無敵秒數',perfectWindow:'完美閃避時間窗',perfectHeal:'完美閃避回血量',perfectShield:'完美閃避保護秒數',perfectSlowSeconds:'慢動作持續秒數',perfectSlowScale:'慢動作速度倍率',dashAttackSeconds:'衝刺強化有效秒數',dashAttackDamage:'衝刺水球傷害倍率',dashAttackSize:'衝刺水球大小倍率',dashCooldown:'每格衝刺恢復秒數', dashSeconds:'衝刺持續秒數', dashMultiplier:'衝刺速度倍率', bombCooldown:'泡泡炸彈休息秒數', bombDelay:'泡泡延遲秒數', bombDamage:'泡泡傷害', bombRadius:'泡泡範圍', bombKnockback:'泡泡擊退距離', actionButtonSize:'動作按鈕大小', autoHealSeconds:'自動補血秒數', ultimateSeconds:'海嘯間隔', cloudSeconds:'雷雲間隔', ultimateDamage:'終極傷害', ultimateGrowth:'終極每級加成', tornadoRadius:'龍捲風環繞範圍', tornadoSpeed:'龍捲風旋轉速度', tornadoTick:'龍捲風傷害間隔', attackRadius:'主角攻擊最遠距離', shotRange:'水球飛行距離', windSpeed:'風入門每級速度加成', movingRate:'疾行每級攻速加成', stunSeconds:'電泡泡暈眩秒數', counterRadius:'反擊範圍', counterDamage:'反擊傷害', supportChance:'支援卡出現機率', slowSeconds:'水窪緩速秒數', slowMultiplier:'緩速剩餘速度', pushDistance:'旋風擊退距離', pullDistance:'風技能拉近距離', chainRadius:'跳電範圍', chainDamage:'跳電傷害比例', fieldSeconds:'痕跡持續秒數', fieldRadius:'痕跡範圍', fieldInterval:'痕跡傷害間隔', fieldDamage:'痕跡傷害', fieldLimit:'痕跡上限', trailSpacing:'痕跡間距', skillRadiusMultiplier:'流派技能範圍倍率', skillDamageMultiplier:'流派技能傷害倍率', warningSeconds:'預設預警秒數', phasePause:'轉階段休息秒數', damage:'魔王預設傷害', chalkSpeed:'預設粉筆速度', dashSpeed:'預設衝撞速度', dashDistance:'預設衝撞距離', rainRadius:'預設考卷範圍', callRadius:'預設點名範圍', ringRadius:'預設圈大小', ringGap:'預設圈缺口', ringSeconds:'預設圈持續秒數', hazardLimit:'預警招式上限', shakeSeconds:'震動秒數', shakePixels:'震動畫素'
  };
  // 外殼只選擇要編輯的資料；不改作品格式或戰鬥規則。
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
  document.querySelectorAll('[data-tab]').forEach(button => button.addEventListener('click', () => {
    tab = button.dataset.tab; render();content.scrollTop=0;
  }));
  function save() { const result=api.save(draft); if(result.valid){dirty=false;message('作品已儲存在這台裝置！');}else message(result.errors.join('；'),true);return result.valid; }
  document.getElementById('save').addEventListener('click',save);
  document.getElementById('play').addEventListener('click',()=>playGame(selected[tab]));
  document.getElementById('reset').addEventListener('click',()=>{draft=api.defaults();if(globalThis.SurvivorPractice) SurvivorPractice.refresh(draft);if(save()){render();message('已恢復預設作品。');}});
  window.addEventListener('beforeunload',event=>{if(dirty){event.preventDefault();event.returnValue='';}});
  const room = document.getElementById('makerPanel');
  function openMaker(result) {
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
    else { if (dirty && !save()) return; room.hidden = true; showOverlay('ready'); document.getElementById('makerLink').focus(); }
  });
  render();
  if (new URLSearchParams(location.search).get('editor') === '1') openMaker();
  message(loaded.valid?'挑一項開始設計吧！':loaded.errors.join('；'),!loaded.valid);
})();
