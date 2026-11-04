// Editor controls share the shell's single live draft through ctx.
globalThis.SurvivorMakerModules = globalThis.SurvivorMakerModules || {};
SurvivorMakerModules['widgets'] = function (ctx) {
  'use strict';
  function panel(title) { const node = ctx.el('section', undefined, ctx.content); node.className = 'panel'; ctx.el('h2', title, node); return node; }
  function grid(parent) { const node = ctx.el('div', undefined, parent); node.className = 'grid'; return node; }
  function text(parent, label, object, key, maxLength = 24) { const row = ctx.el('label', label, parent), input = ctx.el('input', undefined, row); input.type = 'text'; input.maxLength = maxLength; input.value = object[key] || ''; input.addEventListener('input', () => { object[key] = input.value; ctx.changed(); }); }
  function button(parent, title, action, pressed) {
    const node = ctx.el('button', title, parent); node.type = 'button';
    if (pressed !== undefined) node.setAttribute('aria-pressed', String(pressed));
    node.addEventListener('click', action); return node;
  }
  function select(parent, label, object, key, choices, onChange) {
    const row = ctx.el('details', undefined, parent); row.className = 'maker-choice';
    const heading = ctx.el('summary', label + '：' + (choices[object[key] || ''] || '請選擇'), row);
    const options = grid(row);
    Object.entries(choices).forEach(([value, title]) => button(options, title, () => {
      object[key] = value; heading.textContent = label + '：' + title; row.open = false;
      ctx.changed(); if (onChange) onChange(); else ctx.render();
    }, String(object[key] || '') === value));
    return row;
  }
  function range(parent, object, key, limits, label, iconOnly = false) {
    const bounds = limits || ctx.api.BOUNDS[key];
    if (key === 'phaseCount' && bounds && bounds[0] === 0 && bounds[1] === 1) {
      const toggle = button(parent, (label || ctx.labels[key] || key) + (object[key] ? '：開' : '：關'), () => { object[key] = object[key] ? 0 : 1; ctx.changed(); ctx.render(); });
      toggle.setAttribute('role', 'switch'); toggle.setAttribute('aria-checked', String(!!object[key])); return;
    }
    const row = ctx.el('div', undefined, parent); row.className = 'maker-number';
    ctx.el('span', label || ctx.labels[key] || key, row);
    const controls = ctx.el('div', undefined, row), value = ctx.el('output', String(object[key]), controls);
    const slider = ctx.el('input', undefined, row); slider.type = 'range'; slider.className = 'maker-slider';
    slider.min = bounds[0]; slider.max = bounds[1]; slider.step = bounds[2]; slider.value = object[key];
    slider.setAttribute('aria-label', label || ctx.labels[key] || key);
    slider.addEventListener('input', () => { object[key] = Number(slider.value); value.textContent = String(object[key]); ctx.changed(); });
    function adjust(direction) {
      object[key] = Number(Math.max(bounds[0], Math.min(bounds[1], object[key] + direction * bounds[2])).toFixed(4));
      value.textContent = String(object[key]); slider.value = object[key]; ctx.changed();
    }
    const minus = button(controls, '−', () => adjust(-1)), plus = button(controls, '＋', () => adjust(1));
    minus.setAttribute('aria-label', (label || ctx.labels[key] || key) + ' 減少');
    plus.setAttribute('aria-label', (label || ctx.labels[key] || key) + ' 增加');
    if (iconOnly) for (const [b,id] of [[minus,'minus'],[plus,'plus']]) { b.textContent=''; b.innerHTML=SurvivorIcons.html(id); b.className='encounter-adjust'; }

  }
  function feedbackEditor(parent,f) {
    select(parent,'回饋等級',f,'level',{small:'小',medium:'中',large:'大',custom:'自訂'},()=>{if(f.level!=='custom')Object.assign(f,ctx.api.FEEDBACK_TIERS[f.level],{hitStop:1,shake:1});ctx.changed();ctx.render();});
    select(parent,'預警樣式',f,'warningStyle',ctx.api.WARNING_STYLES);
    select(parent,'音效',f,'sound',ctx.api.FEEDBACK_SOUNDS);
    for(const [key,label] of [['slash','刀光'],['hint','提示']]) button(parent,label+'：'+(f[key]?'開':'關'),()=>{f[key]=!f[key];ctx.changed();ctx.render();},f[key]);
    range(parent,f,'hitStop',ctx.api.FEEDBACK_BOUNDS.hitStop,'頓幀倍率');
    range(parent,f,'shake',ctx.api.FEEDBACK_BOUNDS.shake,'震動倍率');
    for(const [key,label] of [['stopSeconds','停頓秒數'],['particles','粒子數'],['trauma','鏡頭創傷值'],['flash','閃白強度'],['numberScale','傷害數字大小']])range(parent,f,key,ctx.api.FEEDBACK_BOUNDS[key],label);
    ctx.el('small','仍套用玩家設定的回饋強度、震動與聲音開關。',parent);
  }
  function iconPicker(parent, card) {
    const picker = ctx.el('details', undefined, parent);
    const summary = ctx.el('summary', '挑選圖示', picker);
    summary.innerHTML = SurvivorIcons.html(card.icon) + summary.innerHTML;
    const choices = grid(picker); choices.className += ' icon-picker';
    SurvivorIcons.ids.forEach(id => {
      const option = button(choices, '', () => { card.icon = id; ctx.changed(); ctx.render(); }, card.icon === id);
      option.innerHTML = SurvivorIcons.html(id); option.setAttribute('aria-label', SurvivorIcons.labels[id]); option.title = SurvivorIcons.labels[id];
    });
  }
  const timingViews=[];
  const timingLabels={windup:'起手',active:'生效',recovery:'收招',cooldown:'冷卻'};
  function refreshTimelines() {
    for(const {node,source} of timingViews) {
      node.textContent='';
      for(const segment of SurvivorTiming.segments(source)) {
        const item=ctx.el('span',timingLabels[segment.phase]+' '+Number(segment.seconds.toFixed(2))+'秒',node);
        item.className='timing-'+segment.phase; item.style.flexGrow=String(segment.seconds || .01);
      }
    }
  }
  function drawTiming(parent,source,bounds) {
    const box=ctx.el('fieldset',undefined,parent); ctx.el('legend','時機積木',box);
    const node=ctx.el('div',undefined,box);node.className='timing-timeline';node.setAttribute('aria-label','攻擊時間軸');
    timingViews.push({node,source}); refreshTimelines();
    const fields=grid(box);
    if(source.inputBuffer===undefined)source.inputBuffer=.12;
    range(fields,source,'inputBuffer',[.1,.15,.01],'輸入緩衝秒數');
    for(const key of Object.keys(ctx.api.TIMING_BOUNDS)) range(fields,source,key,bounds[key],key==='windup'?'起手預警秒數':key==='recovery'?'收招停頓秒數':timingLabels[key]+'秒數');
  }
  return { panel, grid, text, button, select, range, feedbackEditor, iconPicker, timingViews, timingLabels, refreshTimelines, drawTiming };
};
