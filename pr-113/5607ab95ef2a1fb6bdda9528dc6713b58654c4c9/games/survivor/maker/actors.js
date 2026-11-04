// Editor controls share the shell's single live draft through ctx.
globalThis.SurvivorMakerModules = globalThis.SurvivorMakerModules || {};
SurvivorMakerModules['actors'] = function (ctx) {
  'use strict';
  function monsterPicker(parent, enemy) {
    const picker = ctx.el('details', undefined, parent); picker.className = 'maker-choice';
    ctx.el('summary', '怪物造型：' + SurvivorMonsters.labels[enemy.spriteId], picker);
    ctx.el('p', '只換造型，招式另外設定。', picker);
    const choices = ctx.grid(picker);
    SurvivorMonsters.ids.forEach(id => {
      const option = ctx.button(choices, '', () => { enemy.spriteId = id; ctx.changed(); ctx.render(); }, enemy.spriteId === id);
      option.setAttribute('aria-label', SurvivorMonsters.labels[id]);
      const image = ctx.el('canvas', undefined, option); image.width = image.height = 48;
      image.setAttribute('aria-hidden', 'true');
      const g = image.getContext('2d'); g.imageSmoothingEnabled = false;
      g.drawImage(SurvivorMonsters.picture(id), 0, 0, 48, 48);
      ctx.el('span', SurvivorMonsters.labels[id], option);
    });
  }
  function blockPanel(group,key,part) {
    const box=ctx.el('details',undefined,group);box.className='weapon-block';
    box.open=ctx.weaponBlocksOpen[key]!==false;
    box.addEventListener('toggle',()=>{ctx.weaponBlocksOpen[key]=box.open;});
    ctx.el('summary',ctx.api.BLOCK_PARTS[part]+'積木',box);
    return ctx.grid(box);
  }
  function drawAttackStacks(host,owner,defs,key) {
    if(!owner.blocks) owner.blocks=defs===ctx.api.ENEMY_STACKS?ctx.api.enemyStacks(owner):ctx.api.bossStacks(owner);
    const names={enabled:'使用分階段攻擊',triggerDistance:'觸發距離',radial:'子彈向四周發射（留缺口）',innerRadius:'圓環內半徑',length:'直線／子彈飛行距離',angle:'扇形角度',gapDegrees:'四周子彈缺口角度',level:'開始攻擊等級',minPhase:'第幾階段開始使用',recovery:'收招停頓秒數',cooldown:'招後冷卻秒數（至少階段休息）',phaseCount:'每個階段是否多一個目標'};
    for(const [i,move] of owner.blocks.moves.entries()) {
      const def=defs[i],group=ctx.el('section',undefined,host);group.className='weapon-move';ctx.el('h3',def.label,group);
      for(const part of Object.keys(ctx.api.BLOCK_PARTS)) {
        const fields=blockPanel(group,key+'-'+move.id+'-'+part,part),values=move[part];
        if(part==='feedback') {ctx.feedbackEditor(fields,move.feedback);continue;}
        if(part==='trigger') ctx.el('p',move.id==='phase'?'距離內開始預警，方向與原點鎖定。':move.id==='legacy'?'達到等級且間隔到時；分階段攻擊啟用時不重複出招。':'到達老師階段後，依遠近選招；遠處或畫面外優先跳躍／狙擊。',fields);
        if(move.id==='phase' && part==='timing') {ctx.drawTiming(fields,values,ctx.api.PHASE_BOUNDS);continue;}
        for(const field of def[part]) {
          if(['enabled','radial'].includes(field)) {
            const b=ctx.button(fields,names[field]+'：'+(values[field]?'開':'關'),()=>{values[field]=!values[field];ctx.changed();ctx.render();});b.setAttribute('role','switch');b.setAttribute('aria-checked',String(values[field]));
          } else if(field==='shape') ctx.select(fields,'預警與命中形狀',values,field,ctx.api.PHASE_SHAPES);
          else if(field==='type') ctx.select(fields,'攻擊形狀',values,field,{none:'不攻擊',projectile:'發射國字',aoe:'預警後範圍傷害',summon:'召喚怪物'});
          else if(field==='kind') ctx.select(fields,'招式形狀',values,field,ctx.api.KINDS);
          else {
            const legacy={interval:[1,15,.5],level:[2,20,1],damage:[0,30,1],speed:[50,200,5],radius:[10,100,1],count:[1,5,1],spread:[0,.6,.05]};
            const bounds=move.id==='phase'?ctx.api.PHASE_BOUNDS[field]:move.id==='legacy'?legacy[field]:field==='minPhase'?[1,3,1]:field==='phaseCount'?[0,1,1]:ctx.api.BOSS_MOVE_BOUNDS[field];
            ctx.range(fields,values,field,bounds,names[field]);
          }
        }
      }
    }
  }
  function drawEnemies() {
    const toggle=(parent,label,obj,key)=>{const b=ctx.button(parent,label+'：'+(obj[key]?'開':'關'),()=>{obj[key]=!obj[key];ctx.changed();ctx.render();});b.setAttribute('role','switch');b.setAttribute('aria-checked',String(obj[key]));};
    ctx.draft.enemies.filter(e=>e.id===ctx.selected.enemies).forEach(e => {
      const p = ctx.panel(e.name); const portrait = ctx.el('canvas', undefined, p); portrait.className = 'maker-portrait'; portrait.width = 128; portrait.height = 100; portrait.setAttribute('aria-label', e.name + '角色預覽'); const preview = portrait.getContext('2d'); preview.imageSmoothingEnabled = false; drawBlob(64, 50, e.radius, e.color, 0, false, e.id, preview, e.shadowSize, 0, e.spriteId); const fields = ctx.grid(p); ctx.text(fields, '怪物名稱', e, 'name'); ctx.range(fields, e, 'hp'); ctx.range(fields, e, 'speed', [0,170,5], '移動速度'); ctx.range(fields, e, 'radius', [10,35,1], '身體大小'); ctx.range(fields, e, 'damage', [0,40,1], '碰撞傷害'); ctx.range(fields,e,'mass',[1,100,1],'重量'); ctx.range(fields, e, 'shadowSize', [.3,1.8,.1], '影子寬度倍率');
      ctx.button(p,'試這隻',()=>SurvivorPractice.open(ctx.draft,ctx.editor,null,e.id));
      const live=ctx.el('details',undefined,ctx.previewPane);live.className='enemy-preview-toggle';ctx.el('summary','即時預覽（點開／收起）',live);live.open=ctx.previewOpen;
      const arena=ctx.el('div',undefined,live);arena.className='enemy-live-preview';
      live.addEventListener('toggle',()=>{if(live.open && ctx.previewPane.contains(live))SurvivorPractice.mount(arena,ctx.draft,e.id);else SurvivorPractice.unmount(arena);});
      monsterPicker(fields, e);
      ctx.select(fields, '移動方式', e, 'behavior', ctx.api.BEHAVIORS);
      ctx.el('p','分階段攻擊開啟時優先使用；關閉後才使用等級攻擊。原有移動與輔助能力保持原樣。',p);
      drawAttackStacks(p,e,ctx.api.ENEMY_STACKS,e.id);

    });
  }
  function drawWeakpointEditor() {
    const host=ctx.panel('共用弱點積木');
    ctx.el('p','普通部位只受護甲倍率傷害並發出小金屬火花；弱點先預告、亮起、關閉前快閃，命中使用大回饋。角度相對 Boss 朝向，180 度是背後。',host);
    const owners=[{owner:ctx.draft.boss,base:SURVIVOR_DEFAULTS.boss},...ctx.draft.gallery.bosses.filter(b=>SURVIVOR_DEFAULTS.gallery.bosses.find(base=>base.id===b.id).weakpoint).map(owner=>({owner,base:SURVIVOR_DEFAULTS.gallery.bosses.find(b=>b.id===owner.id)}))];
    for(const {owner,base} of owners) {
      const box=ctx.el('fieldset',undefined,host);ctx.el('legend',owner.name,box);
      if(!owner.weakpoint){ctx.button(box,'加入弱點積木',()=>{owner.weakpoint=ctx.api.copy(base.weakpoint);ctx.changed();ctx.render();});continue;}
      const config=owner.weakpoint;
      if(config.artId!==undefined)ctx.select(box,'弱點美術',config,'artId',{'effect/weakpoint':'青綠弱點','effect/weakpoint-red':'紅色弱點'});
      if(config.postureChargeMultiplier!==undefined){ctx.range(box,config,'postureChargeMultiplier',[1,2,.1],'破架勢蓄力額外倍率');ctx.el('p','只有真正破架勢且弱點打開的蓄力命中才額外套一次；不另乘老師暈眩傷害倍率。',box);}
      ctx.button(box,'移除弱點積木',()=>{owner.weakpoint=null;ctx.changed();ctx.render();});
      const names={armorMultiplier:'普通部位傷害倍率',criticalMultiplier:'弱點傷害倍率',warning:'弱點開啟預告秒數',closing:'弱點關閉提示秒數'};
      for(const [key,bounds] of Object.entries(ctx.api.WEAKPOINT_BOUNDS))ctx.range(box,config,key,bounds,names[key]);
      config.parts.forEach(part=>{
        const field=ctx.el('fieldset',undefined,box);ctx.el('legend','弱點部位 '+part.id,field);
        ctx.select(field,'美術錨點',part,'anchor',{weakpoint:'weakpoint（美術清單）'});
        for(const [key,bounds,label] of [['radiusScale',[.25,1.5,.05],'部位命中半徑倍率'],['angleDegrees',[-180,180,5],'相對朝向角度'],['arcDegrees',[20,360,5],'允許命中角度弧'],['duration',[.5,8,.1],'弱點開啟秒數']])ctx.range(field,part,key,bounds,label);
        ctx.select(field,'條件組合',part,'mode',{any:'任一成立',all:'全部成立'});
        part.conditions.forEach(condition=>{
          const row=ctx.el('fieldset',undefined,field);
          ctx.select(row,'開啟條件',condition,'type',ctx.api.WEAKPOINT_CONDITIONS,()=>{
            if(condition.type==='after-move')condition.moveId=owner.moves[0].id;else delete condition.moveId;
            ctx.changed();ctx.render();
          });
          if(condition.type==='after-move')ctx.select(row,'指定招式',condition,'moveId',Object.fromEntries(owner.moves.map(m=>[m.id,m.name])));
          if(part.conditions.length>1)ctx.button(row,'移除此條件',()=>{part.conditions.splice(part.conditions.indexOf(condition),1);ctx.changed();ctx.render();});
        });
        if(part.conditions.length<7)ctx.button(field,'加入開啟條件',()=>{part.conditions.push({type:'recovery'});ctx.changed();ctx.render();});
        if(config.parts.length>1)ctx.button(field,'移除此弱點部位',()=>{config.parts.splice(config.parts.indexOf(part),1);ctx.changed();ctx.render();});
      });
      if(config.parts.length<8)ctx.button(box,'加入弱點部位',()=>{
        let index=1;while(config.parts.some(p=>p.id==='part-'+index))index++;
        config.parts.push({id:'part-'+index,anchor:'weakpoint',radiusScale:1,angleDegrees:0,arcDegrees:360,mode:'any',duration:1.5,conditions:[{type:'recovery'}]});ctx.changed();ctx.render();
      });
    }
    ctx.el('p','環境／誘餌條件由共用 triggerBossWeakpoint 事件入口觸發；此卡不新增場景機關。試老師可從招式頁進練習，守門人從王的試煉進入。',host);
  }
  function drawBoss() {
    if(ctx.selected.boss==='weakpoint'){drawWeakpointEditor();return;}
    if(ctx.selected.boss==='gallery') {
      const p=ctx.panel('王的試煉 · 圓形競技場'),g=ctx.draft.gallery;
      ctx.range(p,g,'arenaRadius',[200,300,10],'競技場半徑');ctx.range(p,g,'entrySeconds',[1,5,.1],'入口預警秒數');ctx.range(p,g,'wallStun',[1,5,.1],'撞牆暈眩秒數');
      ctx.range(p,g,'hazardLimit',[1,32,1],'危險區上限');ctx.range(p,g,'summonLimit',[1,16,1],'召喚物上限');
      const hazard=ctx.el('fieldset',undefined,p);ctx.el('legend','共用地面危險區積木（供後續 Boss 使用）',hazard);
      ctx.select(hazard,'種類',g.hazard,'kind',{poison:'毒池',ice:'冰面',fire:'火圈'});
      for(const [key,bounds,label] of [['radius',[20,200,5],'範圍'],['duration',[.1,15,.1],'持續秒數'],['interval',[.1,3,.1],'傷害間隔'],['damage',[0,40,1],'傷害'],['slow',[.2,1,.05],'剩餘速度']])ctx.range(hazard,g.hazard,key,bounds,label);
      for(const b of g.bosses) {
        const box=ctx.el('fieldset',undefined,p);ctx.el('legend',b.name,box);ctx.text(box,'名稱',b,'name');ctx.range(box,b,'hp',[500,5000,100],'血量');ctx.range(box,b,'radius',[20,50,1],'大小');ctx.range(box,b,'speed',[0,200,5],'追擊速度');
        ctx.range(box,b.phases[1],'threshold',[.05,.95,.01],'第二階段血量低於比例');ctx.range(box,b.phases[1],'speed',[.5,2,.05],'第二階段速度倍率');
        for(const m of b.moves) {
          const field=ctx.el('fieldset',undefined,box);ctx.el('legend',m.name,field);const s=m.blocks.moves[0];
          ctx.range(field,m,'minPhase',[1,2,1],'開始階段');ctx.range(field,m,'weight',[0,100,1],'AI 選招權重');
          ctx.range(field,m.ai,'minDistance',[0,10000,10],'AI 最近距離');ctx.range(field,m.ai,'maxDistance',[0,10000,10],'AI 最遠距離');ctx.range(field,m.ai,'phaseWeight',[0,10,.1],'AI 第二階段加權');
          ctx.range(field,s.shape,'radius',[30,200,5],'形狀半徑');if(['sector','ring'].includes(s.shape.type))ctx.range(field,s.shape,'angle',[0,360,5],s.shape.type==='ring'?'安全缺口角度':'扇形角度');
          for(const [key,bounds,label] of [['windup',[.6,3,.05],'預警'],['active',[.1,4,.05],'出手'],['recovery',[.2,3,.05],'收招'],['cooldown',[.1,8,.1],'冷卻']])ctx.range(field,s.timing,key,bounds,label+'秒數');
          ctx.range(field,s.effect,'damage',[0,40,1],'傷害');ctx.range(field,s.effect,'speed',[0,600,10],'招式移速');
          if(s.effect.sequence){ctx.range(field,s.effect.sequence,'count',[1,8,1],'前半場連斬刀數');ctx.range(field,s.effect.sequence,'phaseCount',[1,8,1],'後半場連斬刀數');ctx.el('p','每刀固定使用預警＋出手秒數；只有整組最後才收招。連段開始鎖定刀數，中途半血仍完成原節拍。',field);}
          if(s.effect.relocate)for(const [key,bounds,label]of [['distance',[40,160,2],'背後換位距離'],['vanish',[.1,1,.05],'消失秒數'],['flash',[.2,.5,.05],'白閃預警秒數']])ctx.range(field,s.effect.relocate,key,bounds,label);
          if(s.effect.projectiles)for(const [key,bounds,label]of [['count',[1,15,1],'每扇苦無數量'],['speed',[60,400,10],'苦無速度'],['life',[.5,5,.1],'苦無壽命秒數'],['radius',[3,12,1],'苦無半徑']])ctx.range(field,s.effect.projectiles,key,bounds,label);
          if(s.effect.slide)ctx.range(field,s.effect.slide,'speed',[0,300,10],'橫向滑步速度');
          if(s.effect.duration!==undefined){
            if(['nova','cross'].includes(m.id))ctx.range(field,s.shape,'thickness',[2,40,1],'環／光束半寬');
            if(['frost-dash','tornado','feathers','spiral'].includes(m.id))ctx.range(field,s.effect,'duration',[.1,10,.1],'危險區／羽毛壽命秒數');
            if(['frost-dash','spiral'].includes(m.id))ctx.range(field,s.effect,'interval',[.1,3,.05],'生成間隔秒數');
            if(['feathers','spiral'].includes(m.id))ctx.range(field,s.effect,'count',[1,32,1],'每次羽毛數量');
            if(m.id==='frost-dash')ctx.range(field,s.effect,'slow',[.2,1,.05],'冰面剩餘速度');
            if(['cross','spiral'].includes(m.id))ctx.range(field,s.effect,'rotation',[0,6,.05],m.id==='cross'?'全招旋轉弧度':'每秒旋轉弧度');
          }
        }
      }
    } else if(ctx.selected.boss==='ai') {
      const p=ctx.panel('AI 規則積木');
      ctx.el('p','權重 0 停用。依距離、朝向與血量階段加權抽招，上一組招式不連續重複。老師仍保留近中遠距離分組。階段門檻在魔王階段調整；預警、生效、收招與冷卻在各招式時機積木調整。',p);
      ctx.draft.boss.phases.forEach((phase,i)=>{if(i)ctx.range(ctx.grid(p),phase,'threshold',[.05,.95,.01],'第 '+(i+1)+' 階段血量門檻');});
      ctx.draft.boss.ai.rules.forEach(rule=>{
        const box=ctx.el('fieldset',undefined,p);ctx.el('legend',ctx.draft.boss.moves.find(m=>m.id===rule.moveId).name,box);
        if(ctx.draft.boss.ai.rules.length>1)ctx.button(box,'移出招式清單',()=>{ctx.draft.boss.ai.rules.splice(ctx.draft.boss.ai.rules.indexOf(rule),1);ctx.changed();ctx.render();});
        for(const [key,label,bounds] of [['weight','權重（0 停用）',[0,100,1]],['minDistance','最近距離',[0,10000,10]],['maxDistance','最遠距離',[0,10000,10]],['angleWeight','朝向加權',[0,10,.1]],['phaseWeight','後期階段加權',[0,10,.1]]]) ctx.range(box,rule,key,bounds,label);
      });
      const missing=ctx.draft.boss.moves.filter(m=>!ctx.draft.boss.ai.rules.some(r=>r.moveId===m.id));
      for(const move of missing)ctx.button(p,'加入 '+move.name,()=>{ctx.draft.boss.ai.rules.push(ctx.api.bossAIRules(ctx.draft.boss).find(r=>r.moveId===move.id));ctx.changed();ctx.render();});
    } else if(ctx.selected.boss==='phases') {
    const p = ctx.panel('魔王與三個階段'), fields = ctx.grid(p); ctx.text(fields,'魔王名稱',ctx.draft.boss,'name'); ctx.range(fields,ctx.draft.boss,'hp',[500,5000,100]); ctx.range(fields,ctx.draft.boss,'speed',[0,200,5],'舊作品預設移速'); ctx.range(fields,ctx.draft.boss,'radius',[20,50,1],'身體大小');
    ctx.draft.boss.phases.forEach((phase,i) => { const box=ctx.el('fieldset',undefined,p); ctx.el('legend','第 '+(i+1)+' 階段',box); if(i) ctx.range(box,phase,'threshold',[.05,.95,.01],'血量低於比例'); ctx.range(box,phase,'speed',[0,200,5],'階段移速'); ctx.range(box,phase,'rest',[.4,8,.1],'招式休息秒數'); const holder={combo:phase.combo||''}; ctx.select(box,'範圍招式搭配的合招',holder,'combo',{'':'不合招',...Object.fromEntries(ctx.draft.boss.moves.map(m=>[m.id,m.name]))},()=>{phase.combo=holder.combo||null;ctx.changed();}); });
    const labels={nearDistance:'近距離上限',farDistance:'遠距離起點',pursuitDistance:'快走追趕起點',pursuitMultiplier:'快走速度倍率',healthPerUpgrade:'每次升級增加老師血量',leapRecovery:'跳躍落地可反擊秒數',leapPush:'跳躍落地擊退距離',trackingSeconds:'點名跟隨秒數',lockSeconds:'點名鎖定秒數',phaseWordsSpeed:'第二階段起國字速度',phaseChalkSpeed:'第二階段起粉筆速度'};
    const rules=ctx.grid(p);for(const [key,bounds] of Object.entries(ctx.api.BOSS_COMBAT_BOUNDS))ctx.range(rules,ctx.draft.boss.combat,key,bounds,labels[key]);
    const posture=ctx.panel('架勢與完美閃避'), pf=ctx.grid(posture), pl={window:'完美閃避時間窗（秒）',maximum:'架勢滿條',dodgeGain:'完美閃避累積量',recoveryGain:'收招命中累積量',interruptGain:'打斷招式累積量',decay:'架勢每秒下降',stunSeconds:'滿架勢暈眩秒數',chargeBonus:'暈眩時聚氣加速比例',damageMultiplier:'暈眩時蓄力傷害倍率',heal:'破架勢回血量'};
    for(const [key,bounds] of Object.entries(ctx.api.POSTURE_BOUNDS))ctx.range(pf,ctx.draft.boss.posture,key,bounds,pl[key]);
    ctx.el('p','閃過即將命中的招式、收招時打中、用暈眩打斷都能累積。滿條亮出弱點，抓住機會朝前方蓄力重擊！',posture);
    ctx.el('p','血量＝（基本血量＋已升級次數×加血量）×關卡倍率；目標 45～60 秒，請試玩調整。距離、速度、範圍皆為世界單位。',p);
    } else if(ctx.selected.boss==='zone') {
    const zone = ctx.panel('老師戰安全圈'), zf = ctx.grid(zone), z = ctx.draft.bossZone;
    const toggle = ctx.button(zf, '紫霧縮圈：' + (z.enabled ? '開' : '關'), () => { z.enabled = !z.enabled; ctx.changed(); ctx.render(); });
    toggle.setAttribute('role', 'switch'); toggle.setAttribute('aria-checked', String(z.enabled));
    ctx.range(zf,z,'steps',[0,3,1],'縮圈次數（每階段一次）');
    ctx.range(zf,z,'speed',[10,160,5],'縮圈速度（每秒距離）');
    ctx.range(zf,z,'damage',[0,4,.5],'紫霧每秒扣血');
    ctx.range(zf,z,'initialRadius',[300,1200,10],'初始半徑（世界單位）');ctx.range(zf,z,'finalRadius',[100,300,10],'最終半徑（世界單位）');ctx.range(zf,z,'warning',[1,8,.5],'縮圈預告秒數');
    ctx.el('p','每階段預告再收圈；圈外速度剩 80%。預設最後半徑 180（基準短邊 400 的 0.45 倍），裝置旋轉不改圈。完整效果請按試玩。',zone);
    } else {
    ctx.moveIndex=ctx.draft.boss.moves.findIndex(m=>m.id===ctx.selected.boss);
    const m=ctx.draft.boss.moves[ctx.moveIndex], box=ctx.panel(m.name);
    ctx.text(ctx.grid(box),'招式名稱',m,'name');
    ctx.button(box,'試這隻',()=>ctx.trial({spec:{kind:'move',id:m.id}}));
    if(globalThis.SurvivorPreview){const host=ctx.el('div',undefined,ctx.previewPane);host.className='skill-preview-host';SurvivorPreview.mount(host,ctx.draft,{kind:'move',id:m.id});}
    drawAttackStacks(box,m,ctx.api.BOSS_STACKS,'boss-'+m.id);
    ctx.el('p','老師在畫面外仍追擊；每招完整預警後才命中。連衝每次重新瞄準，最短預警 0.6 秒。黑板封路用範圍調牆長、距離調兩側間距；點名跟隨與鎖定時間在魔王階段頁調整。',box);

    }
  }
  return { monsterPicker, blockPanel, drawAttackStacks, drawEnemies, drawWeakpointEditor, drawBoss };
};
