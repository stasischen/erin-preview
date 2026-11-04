// Editor controls share the shell's single live draft through ctx.
globalThis.SurvivorMakerModules = globalThis.SurvivorMakerModules || {};
SurvivorMakerModules['cards-weapons'] = function (ctx) {
  'use strict';
  function drawSchools() {
    const p = ctx.panel('替流派取名字');
    for (const school of ctx.draft.schools.map(s => s.id)) ctx.text(p, ctx.api.defaults().build[school].name, ctx.draft.build[school], 'name');
  }
  function drawCards() {
    const p = ctx.panel('設計技能卡');
    const edit = ctx.el('section', undefined, p); edit.id = 'makerCardEdit'; edit.className = 'maker-card-edit';
    ctx.el('h3', '編輯選中的卡片', edit);
    const c = ctx.draft.cards[ctx.cardIndex], fields = ctx.grid(edit);
    if (globalThis.SurvivorPreview) { const host=ctx.el('div',undefined,ctx.previewPane); host.className='skill-preview-host'; SurvivorPreview.mount(host,ctx.draft,{kind:'card',id:c.id}); }
    ctx.iconPicker(fields, c); ctx.text(fields, '卡片名稱', c, 'name'); ctx.text(fields, '遠程說明', c, 'description', 120); ctx.text(fields, '近戰說明', c, 'descriptionMelee', 120); ctx.text(fields, '大劍說明', c, 'descriptionSword', 120); ctx.range(fields, c, 'maxLevel');
    if (!c.neutral) ctx.select(fields, '流派', c, 'school', { '': '支援', ...Object.fromEntries(ctx.draft.schools.map(s => [s.id,ctx.draft.build[s.id].name])) });
    ctx.select(fields, '欄位', c, 'slot', {attack:'普攻',skill:'技能',dash:'衝刺',passive:'被動'});
    ctx.select(fields, '品質', c, 'rarity', {common:'普通',rare:'稀有',legendary:'傳說'});
    if (!c.neutral) ctx.select(fields, '技能樹階段', c, 'tier', {'':'支援',entry:'入門','advanced-a':'進階 A','advanced-b':'進階 B',fusion:'合體',ultimate:'終極（同流派 5 張）'});
    const prerequisites = ctx.el('details', undefined, edit); ctx.el('summary', '選擇前置卡片（目前 ' + c.requires.length + ' 張）', prerequisites);
    ctx.el('p', '每張前置卡達到 Lv1 即可。不要選自己，或讓前置卡互相繞成圈。', prerequisites);
    const checks = ctx.grid(prerequisites);
    ctx.draft.cards.filter(other => !c.neutral && other.id !== c.id).forEach(other => {
      const prerequisite = ctx.button(checks, (c.requires.includes(other.id) ? '✓ ' : '＋ ') + other.name, () => {
        c.requires = c.requires.includes(other.id) ? c.requires.filter(id => id !== other.id) : c.requires.concat(other.id); ctx.changed(); ctx.render();
      }, c.requires.includes(other.id));
      prerequisite.innerHTML = SurvivorIcons.html(other.icon) + prerequisite.innerHTML;
    });
    c.effects.forEach((effect, index) => drawEffect(edit, c, effect, index));
    if (c.effects.length < 3) { const add = ctx.el('button', '＋ 加一個積木', edit); add.type = 'button'; add.addEventListener('click', () => { c.effects.push({type:'aoe',trigger:'skill',...ctx.api.PARAMS}); ctx.changed(); ctx.render(); }); }
  }
  function cardRecipe(id) {
    return globalThis.SurvivorEffectBlocks && SurvivorEffectBlocks.recipes.find(r=>r.feature===id && (id.startsWith('item-') || id.startsWith('thunder-') || id.startsWith('water-') || id.startsWith('wind-') || id==='fusion-storm' || id==='fusion-dash' || id==='fusion-puddle' || ["big-water", "rapid-water", "multi-water", "onion-dash", "bubble-shield", "gem-magnet", "piercing-water", "splash-water", "auto-heal"].includes(id)));
  }
  const CARD_TRIGGERS={onWaveHit:'浪花命中時',onDeath:'擊倒怪物時',onBombDue:'糖果炸彈倒數到時',onBirdTick:'小鳥準備啄擊時',onAcquire:'取得卡片時',onOffer:'抽升級卡時',onHealth:'計算血條上限時',onUpgrade:'選到這張卡時',onHealTick:'回血計時到時',onMeleeHit:'近戰命中後',onMove:'計算移動速度時',onPickup:'吸取寶石時',onStill:'站定不動時',onWallTick:'風牆持續時',onEnemyShot:'敵人子彈碰到風牆時',onWaterHit:'水攻擊命中時',onShotHit:'普攻命中時',onFieldTick:'流派痕跡傷害計時到時',onPulse:'每隔一段時間',onDashEnd:'衝刺結束時',onDamage:'計算傷害時',onRainTick:'下雨持續時',onChain:'跳電命中時',onSkillBlast:'泡泡炸開時',onHurt:'受傷時',onUltimate:'終極技能準備好時',onDashTrail:'衝刺沿路留下痕跡',onShot:'發動普攻時',onSummonTimer:'每隔一段時間',onDashCross:'衝刺穿過怪物時',onTimer:'每隔一段時間'};
  const CARD_CONDITIONS={waveEligible:'非零方向，且目標仍可攻擊',chance:'外部抽樣小於掉落機率',countMultiple:'先增加計數，達到指定倍數才結算獎勵',splitEligible:'不是碎片，且不是自訂積木子彈',firstClover:'首次取得帶幸運草效果的卡',volleyPresent:'本次已有可複製的水球',healthMissing:'血量還沒補滿',still:'站定達到等待秒數',bladeEligible:'遠程普攻仍可穿透，且不是小風刃',shotMultiple:'普攻發數達到倍數',positiveDamage:'這次傷害大於零',bubbleActive:'泡泡盾還在',wetTarget:'目標身上濕濕的',radius:'範圍內的怪物',randomTarget:'隨機一隻可攻擊的怪物',killThreshold:'擊倒數達到門檻，且這次蓄電還沒用過',segmentTouching:'碰到衝刺路線的怪物',touching:'碰到主角的怪物'};
  const CARD_ACTIONS={'health-cost':'降低最大血量（保留至少一點）','collision-damage':'沿擊退路徑找第一隻可互撞怪物，兩隻各受傷並共用冷卻','bomb-drop':'掉落有上限的延遲糖果炸彈','bank-count':'每顆寶石球累積一次，成長獎勵有上限',split:'分裂兩顆碎片，每顆水球只分裂一次',reroll:'立刻增加一次重抽','rare-multiplier':'提高稀有卡抽選權重','rear-shot':'複製第一顆水球向後發射','kill-count':'累積擊倒數','size-multiplier':'放大普攻範圍','interval-multiplier':'縮短普攻間隔',spread:'增加水球數量（近戰擴大扇形）',health:'增加血條上限',heal:'補血並限制在血條上限','attack-multiplier':'加快普攻速度及距離（近戰放大範圍）','rate-multiplier':'依移動程度加快攻速',orbit:'繞著主角旋轉',pierce:'增加穿透次數',blade:'產生小風刃（近戰改成追斬）',refund:'回充部分衝刺進度','move-multiplier':'提高移動速度','pickup-multiplier':'擴大拾取範圍',wall:'建立保護風牆','block-shot':'擋掉敵人子彈',wet:'讓怪物濕濕的',slow:'讓怪物緩速',push:'推開怪物',bubble:'取得泡泡盾',absorb:'消耗泡泡盾並擋下這次傷害','damage-multiplier':'提高傷害倍率','big-drop':'放大這次普攻、增加傷害與擊退',rain:'開始下雨，持續影響全場怪物',chain:'連鎖閃電（每跳選最近的怪物，不重複命中）','chain-modifier':'增加跳電次數，每跳保留完整傷害',stun:'讓怪物暈眩',damage:'造成傷害',field:'留下流派痕跡（依流派造成傷害或緩速）',charged:'強化這次普攻，命中後跳電',summon:'放下避雷針，定時攻擊附近怪物',cue:'閃電提示'};
  function drawCardBlocks(parent,card,effect,index) {
    ctx.range(parent,effect,'power',undefined,'每級效果強度');
    ctx.el('p','數值與其他使用同一規則的卡片共用；修改後可按預覽看看。',parent);
    const refs=new Set();
    function collect(node) { if(!node || typeof node!=='object')return; if(node.ref)refs.add(node.ref);Object.values(node).forEach(collect); }
    const recipe=cardRecipe(effect.feature);
    for(const [i,rule] of recipe.rules.entries()) {
      const box=ctx.el('details',undefined,parent);box.className='card-block-stack';
      const key=card.id+':'+index+':'+i;box.open=ctx.cardBlocksOpen[key]===true;
      box.addEventListener('toggle',()=>{ctx.cardBlocksOpen[key]=box.open;});
      ctx.el('summary','積木堆：'+CARD_TRIGGERS[rule.trigger],box);
      ctx.el('p','觸發 → '+CARD_TRIGGERS[rule.trigger],box);
      for(const condition of rule.conditions || []) ctx.el('p','條件 → '+CARD_CONDITIONS[condition.type],box);
      for(const action of rule.actions) ctx.el('p','動作 → '+CARD_ACTIONS[action.type],box);
      collect(rule);
    }
    const fields=ctx.el('details',undefined,parent);ctx.el('summary','調整這堆積木的共用數值',fields);
    const defaults=ctx.api.defaults();
    for(const ref of refs) {
      const [group,key]=ref.split('.'), base=defaults[group][key];
      const bounds=group==='neutralRules'?ctx.api.NEUTRAL_BOUNDS[key]:group==='schoolRules'?ctx.api.SCHOOL_BOUNDS[key]:ctx.api.TUNING_BOUNDS[key] || (key==='fieldLimit'?[1,18,1]:[base===0?0:Math.min(.01,base),Math.max(5,base*3),base>=5?1:.01]);
      ctx.range(fields,ctx.draft[group],key,bounds,(ctx.NEUTRAL_NAMES[key]||ctx.SCHOOL_NAMES[key]||ctx.NUMBER_NAMES[key]));
    }
  }
  function drawEffect(parent, card, effect, index) {
    const box = ctx.el('fieldset', undefined, parent); const legend = ctx.el('legend', '積木 ' + (index + 1), box); legend.innerHTML = SurvivorIcons.html(effect.type) + legend.innerHTML;
    if (globalThis.SurvivorPreview) ctx.button(box,'看這個積木的效果',()=>{ ctx.previewOpen=true;ctx.render();const host=ctx.previewPane.querySelector('.skill-preview-host'); SurvivorPreview.mount(host,ctx.draft,{kind:'effect',id:card.id,index}); });
    const holder = { recipe: effect.feature ? 'recipe:' + effect.feature : effect.type };
    const recipes = Object.fromEntries(ctx.api.defaults().cards.map(c => ['recipe:' + c.id, (cardRecipe(c.id) ? '積木堆：' : '原本組合：') + c.name]));
    ctx.select(box, '選擇效果', holder, 'recipe', { ...ctx.api.TYPES, ...recipes }, () => {
      if (holder.recipe.startsWith('recipe:')) { const base = ctx.api.defaults().cards.find(c => c.id === holder.recipe.slice(7)); card.effects[index] = ctx.api.copy(base.effects[0]); }
      else card.effects[index] = { type: holder.recipe, trigger: card.slot === 'dash' ? 'dash' : card.slot === 'skill' ? 'skill' : card.slot === 'passive' ? 'interval' : 'hit', ...ctx.api.PARAMS };
      ctx.changed(); ctx.render();
    });
    if (cardRecipe(effect.feature)) drawCardBlocks(box,card,effect,index);
    else if (effect.feature) { ctx.el('p', '使用這張原本卡片的效果組合；數值可到「規則」調整。最多合計 5 級的效果。', box); ctx.range(box, effect, 'power'); }
    else {
      if(effect.trigger==='combo') {if(effect.comboStep===undefined)effect.comboStep=3;ctx.range(box,effect,'comboStep',[1,10,1],'第幾下');}
      ctx.select(box, '什麼時候發動？', effect, 'trigger', {combo:'第 N 下攻擊時',hit:'武器命中時',skill:'按技能時',dash:'按衝刺時',interval:'每隔一段時間'});
      ctx.el('p', '「間隔秒數」也是這個積木再次發動前的休息時間。傷害隨卡片等級增加。', box);
      const fields = ctx.grid(box), keys = { projectile:['damage','speed','count','spread','interval'], aoe:['damage','radius','interval'], chain:['damage','radius','count','interval'], 'dash-trail':['damage','radius','duration','interval'], slow:['radius','duration','multiplier','interval'], stun:['radius','duration','interval'], knockback:['radius','distance','interval'], summon:['damage','radius','duration','speed','count','interval'], 'ring-with-gap':['damage','radius','gap','interval'] };
      keys[effect.type].forEach(key => ctx.range(fields, effect, key, key === 'distance' && effect.type === 'knockback' ? [-300,300,5] : undefined));
      if (effect.type === 'knockback') { if(effect.slideSeconds===undefined)effect.slideSeconds=.2; ctx.range(fields,effect,'slideSeconds',[.15,.25,.01],'滑動秒數'); ctx.el('p', '距離正數推開，負數拉近；滑動由快到慢。', box); }
      if (effect.type === 'dash-trail') ctx.el('p', '按衝刺時會在沿路留下範圍痕跡。', box);
      if (effect.type === 'summon') ctx.el('p', '小幫手留在召喚位置，暫時自動發射水球。', box);
    }
    if (card.effects.length > 1) { const remove = ctx.el('button', '移除這個積木', box); remove.type = 'button'; remove.addEventListener('click', () => { card.effects.splice(index,1); ctx.changed(); ctx.render(); }); }
  }
  function drawWeapons() {
    const weaponNames={interval:'揮擊間隔秒',arcDegrees:'揮擊角度',radius:'揮擊距離',damageMultiplier:'水球傷害的幾倍',push:'擊退距離',spinEvery:'每幾下旋轉一圈',damageReduction:'受到傷害減少比例'};
    const specialNames={specialCooldown:'特殊招冷卻秒數',specialCount:'特殊招發射數量',specialSpread:'特殊招散射弧度',specialRange:'特殊招距離',specialDamage:'特殊招傷害倍率',specialLeapDistance:'跳躍距離',specialLeapSeconds:'跳躍秒數'};
    const attackNames={chargeStun:'蓄力暈眩秒數',splashSize:'大泡泡水花半徑倍率',splashDamage:'大泡泡水花傷害比例',comboEvery:'連段下數',comboReset:'停止攻擊幾秒重置',comboMultiplier:'最後一段傷害倍率',chargeSeconds:'站定聚氣秒數',chargeMultiplier:'蓄力傷害倍率',moveRetention:'開始移動保留聚氣比例（0 為重置）',chargeSize:'蓄力範圍倍率',comboSize:'最後一段範圍倍率',comboPush:'蓄力／重刺額外擊退',finisherRecovery:'最後一段額外收招秒',stepDistance:'重刺踏步距離',thrustWidth:'突刺半寬'};
    for(const w of ctx.draft.weapons.filter(w=>w.id===ctx.selected.weapons)) {
      if(!w.blocks) w.blocks=ctx.api.weaponStacks(w);
      const host=ctx.panel(w.name+'招式積木');
      ctx.el('p','由上往下拼招式；連段重招、蓄力和衝刺斬沿用普通攻擊的時間軸；特殊招有自己的冷卻。按旁邊的預覽或試玩看看！',host);
      const partNames=ctx.api.BLOCK_PARTS;
      const toggles={comboEnabled:'連段',chargeEnabled:'自動聚氣',dashThrust:'衝刺突刺'};
      for(const [i,move] of w.blocks.moves.entries()) {
        if(move.id==='dash' && w.id!=='candy-sword') continue;
        const group=ctx.el('section',undefined,host); group.className='weapon-move';
        ctx.el('h3',ctx.api.WEAPON_STACKS[i].label,group);
        for(const part of Object.keys(partNames)) {
          const fields=ctx.blockPanel(group,w.id+'-'+move.id+'-'+part,part),values=move[part];
          if(part==='feedback') {ctx.feedbackEditor(fields,move.feedback);continue;}
          if(move.id==='primary' && part==='timing') ctx.drawTiming(fields,values.phases,ctx.api.TIMING_BOUNDS);
          for(const field of ctx.api.WEAPON_STACKS[i][part]) {
            if(values[field]===undefined) continue;
            if(['specialLeapDistance','specialLeapSeconds'].includes(field) && w.specialKind!=='leap') continue;
            if(field==='specialKind') {ctx.el('p',{leap:'跳躍落地扇形重擊','sword-wave':'前方穿透劍波','water-fan':'前方扇形水球'}[values[field]],fields);continue;}
            if(field==='direction') {ctx.select(fields,'攻擊方向',values,field,{nearest:'朝最近的敵人',facing:'朝移動面向'});continue;}
            if(toggles[field]) {
              const label=toggles[field], toggle=ctx.button(fields,label+'：'+(values[field]?'開':'關'),()=>{values[field]=!values[field];ctx.changed();ctx.render();});
              toggle.setAttribute('role','switch');toggle.setAttribute('aria-checked',String(values[field]));continue;
            }
            if(field.endsWith('Shape')) {
              if(w.kind==='projectile') ctx.el('p','朝前方發射水球',fields);
              else ctx.select(fields,field==='baseShape'?'普通招式':field==='comboShape'?'最後一段招式':'蓄力招式',values,field,field==='comboShape'?{sector:'前方扇形',line:'前方直線',spin:'旋轉一圈'}:{sector:'前方扇形',line:'前方直線'});
              continue;
            }
            if(w.kind!=='projectile' && ['splashSize','splashDamage'].includes(field)) continue;
            if(w.kind==='projectile' && ['comboPush','finisherRecovery','stepDistance','thrustWidth','chargeStun'].includes(field) || w.id!=='candy-sword' && ['stepDistance','thrustWidth'].includes(field)) continue;
            ctx.range(fields,values,field,ctx.api.SPECIAL_BOUNDS[field]||ctx.api.ATTACK_BOUNDS[field]||ctx.api.WEAPON_BOUNDS[field],specialNames[field]||attackNames[field]||weaponNames[field]);
          }
          if(move.id==='dash' && part==='shape') ctx.el('p','朝前方直線突刺，沿用連段特殊招的大小與寬度。',fields);
          if(move.id==='dash' && part==='effect') ctx.el('p','沿用連段特殊招的傷害、擊退與踏步。',fields);
          if(move.id==='special' && part==='trigger') ctx.el('p','手動模式放開特殊招按鈕；冷卻到時可再用。',fields);
          if(!['primary','special'].includes(move.id) && part==='timing') ctx.el('small','沿用普通攻擊時間軸；自動模式維持原節奏。',fields);
          if(move.id==='primary' && part==='trigger') ctx.el('small','手動：放開攻擊鍵；自動：攻擊間隔到時。',fields);
          if(move.id==='combo' && part==='trigger') ctx.el('small','第 N 下使用特殊招。',fields);
          if(move.id==='charge' && part==='trigger') ctx.el('small','手動：按住再放開；自動：站定聚氣。只放大朝前方的形狀。',fields);
        }
      }
    }
  }

  return { drawSchools, drawCards, cardRecipe, CARD_TRIGGERS, CARD_CONDITIONS, CARD_ACTIONS, drawCardBlocks, drawEffect, drawWeapons };
};
