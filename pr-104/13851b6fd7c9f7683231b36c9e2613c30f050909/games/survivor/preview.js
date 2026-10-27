// 展示共用入口：同時只保留一個沙盒；文字從目前作品的積木與數值產生。
(function () {
  'use strict';
  let active = null, refreshTimer = null;
  const debugMemory={};
  function effectDescription(e, data, level) {
    const r=data.schoolRules, q=data.neutralRules;
    const t = data.tuning, b = data.build, n = Math.min(5, level * (e.power || 1));
    if (e.feature) {
      const recipes = {
        'wind-blade':()=>`水球多穿過一隻怪，產生最遠 ${r.windBladeRange} 格、傷害 ${Math.round(r.windBladeDamage*100)}% 的小風刃；近戰改成追斬。`,
        'wind-gust':()=>`每 ${r.gustSeconds} 秒，把 ${r.gustRadius} 格內的怪推開 ${r.gustPush} 格。`,
        'wind-refund':()=>`衝刺結束回充 ${r.refundCharge} 格衝刺。`,
        'wind-light':()=>`移速增加 ${Math.round(r.lightSpeed*n*100)}%，拾取範圍增加 ${Math.round(r.lightMagnet*n*100)}%。`,
        'wind-eye':()=>`站定 ${r.eyeWait} 秒，產生 ${r.eyeRadius} 格風牆，擋子彈並每秒推開 ${r.eyePush} 格。`,
        'item-wall':()=>`普攻浪花推開 ${q.wavePush} 格；撞到另一隻怪時兩隻各受 ${q.waveDamage} 傷害，互撞冷卻 ${q.waveCooldown} 秒。`,
        'item-candy':()=>`打倒怪有 ${Math.round(q.bombChance*100)}% 機率掉糖果炸彈，${q.bombDelay} 秒後炸開 ${q.bombRadius} 格，造成 ${q.bombDamage} 傷害。`,
        'item-bird':()=>`小鳥在 ${q.birdRadius} 格外繞行，每 ${q.birdSeconds} 秒啄 ${q.birdReach} 格內的怪，造成 ${q.birdDamage} 傷害。`,
        'item-bank':()=>`每撿 ${q.bankEvery} 顆經驗球，傷害增加 ${q.bankStep*100}%，最多增加 ${q.bankCap*100}%。`,
        'item-split':()=>`飛行水球命中後分裂兩顆碎片，各造成 ${q.splitDamage*100}% 傷害；碎片只分裂一次，近戰本體不分裂。`,
        'item-magnet':()=>`經驗球拾取範圍變成 ${q.magnetMultiplier} 倍。`,
        'item-crown':()=>`傷害增加 ${q.crownDamage*100}%，最大血量減少 ${q.crownHealth}（至少保留 1 點）。`,
        'item-clover':()=>`立即多 1 次重抽，稀有卡抽選權重變成 ${q.luckyRareMultiplier} 倍。`,
        'item-rear':()=>`每次普攻向後方多射一發；近戰改成後方揮擊。`,
        'item-cookie':()=>`持有後每打倒 ${q.cookieKills} 隻怪，回復 1 點血，回復不超過血量上限。`,
        'big-water': () => `水球變大 ${Math.round(t.waterSizePerLevel*n*100)}%，打得更痛。`,
        'rapid-water': () => `水球連發更快，約每 ${Math.max(.12,t.shotInterval*(1-t.fireRateReduction*n)).toFixed(2)} 秒一發。`,
        'multi-water': () => `一次發射 ${1+n} 顆水球。`,
        'onion-dash': () => `走路快 ${Math.round(t.moveSpeedPerLevel*n*100)}%。`,
        'bubble-shield': () => `血條變長，每級多 ${Math.ceil(t.playerHealth/b.shieldHealthDivisor)} 滴血。`,
        'gem-magnet': () => `在 ${Math.round(t.gemPullRadius*(1+t.magnetPerLevel*n))} 格內把寶石吸過來。`,
        'piercing-water': () => `水球可以再穿過 ${n} 隻怪。`,
        'splash-water': () => `打中會濺水花，打到旁邊 ${t.splashBaseRadius+t.splashPerLevel*n} 格內的怪。`,
        'auto-heal': () => `約每 ${(t.autoHealSeconds*Math.pow(b.healIntervalMultiplier,n-1)).toFixed(1)} 秒補 1 滴血。`,
        'water-attack': () => `打中濺出 ${t.splashBaseRadius+t.splashPerLevel*n} 格大的水花。`,
        'water-skill': () => `水球和泡泡留下水窪，怪物變慢 ${b.slowSeconds} 秒。`,
        'water-dash': () => `衝刺留下水痕，怪物只剩 ${Math.round(b.slowMultiplier*100)}% 速度。`,
        'water-drop': () => `每第 ${data.schoolRules.bigDropEvery} 下普攻放大到 ${data.schoolRules.bigDropSize} 倍，傷害 ${data.schoolRules.bigDropDamage} 倍並推開 ${data.schoolRules.bigDropPush} 格。`,
        'water-fountain': () => `每 ${data.schoolRules.fountainSeconds} 秒推開 ${data.schoolRules.fountainRadius} 格內的怪，推 ${data.schoolRules.fountainPush} 格並弄濕。`,
        'water-bubble': () => '衝刺結束取得泡泡盾，擋下一次傷害後消失。',
        'water-wet': () => `濕潤的怪多受 ${Math.round(data.schoolRules.wetDamage*100)}% 傷害。`,
        'water-rain': () => `每 ${data.schoolRules.rainSeconds} 秒下雨 ${data.schoolRules.rainDuration} 秒，讓全場怪物變慢又濕潤。`,
        'water-ultimate': () => `每 ${b.ultimateSeconds} 秒一道巨浪掃過怪物。`,
        'wind-attack': () => `水球飛得更快、更遠，每級加快 ${Math.round(b.windSpeed*100)}%。`,
        'wind-dash': () => `衝刺留下旋風，把怪推開 ${b.pushDistance} 格。`,
        'wind-speed': () => `跑得越快，水球發射越快，每級加成 ${Math.round(b.movingRate*100)}%。`,
        'wind-ultimate': () => `龍捲風繞著你，每 ${b.tornadoTick} 秒打到碰到的怪。`,
        'thunder-attack': () => `打中會跳電到 ${b.chainRadius} 格內的另一隻怪。`,
        'thunder-skill': () => `泡泡炸開會放電，怪物暈 ${b.stunSeconds} 秒。`,
        'thunder-counter': () => `受傷時放電，反擊 ${b.counterRadius} 格內的怪。`,
        'thunder-ultimate': () => `每 ${b.cloudSeconds} 秒雷雲劈一隻怪。`,
        'fusion-puddle': () => `水窪讓怪變慢，也對水窪裡的怪追加雷傷。`,
        'fusion-storm': () => `衝刺同時留下旋風和水窪，推開怪也讓牠變慢。`,
        'thunder-charge': () => `每擊倒 ${data.schoolRules.chargeKills} 隻怪蓄電，下一次普攻傷害變成 ${data.schoolRules.chargeDamage} 倍並跳電。`,
        'thunder-rod': () => `每 ${data.schoolRules.rodSeconds} 秒放下避雷針，在 ${data.schoolRules.rodRadius} 格內每 ${data.schoolRules.rodTick} 秒打 ${data.schoolRules.rodDamage} 滴血。`,
        'thunder-step': () => `衝刺路線碰到怪物，讓牠暈 ${data.schoolRules.thunderStepStun} 秒。`,
        'thunder-static': () => `每 ${data.schoolRules.staticSeconds} 秒電到碰到主角的怪物，打 ${data.schoolRules.staticDamage} 滴血。`,
        'thunder-super': () => `跳電多 ${data.schoolRules.superconductorJumps} 跳，每跳保留完整傷害。`,
        'fusion-dash': () => `衝刺留下電痕，在 ${b.chainRadius} 格內跳電。`
      };
      return recipes[e.feature] ? recipes[e.feature]() : (data.cards.find(c=>c.id===e.feature)||{}).description || '這個效果尚未提供說明。';
    }
    const trigger = {hit:'打中時',skill:'按技能時',dash:'衝刺時',interval:`每 ${e.interval} 秒`}[e.trigger];
    const words = {
      projectile:`發射 ${e.count} 顆水球，每顆打 ${Math.min(600,e.damage*level)} 滴血`,
      aoe:`打到 ${e.radius} 格內的怪，扣 ${Math.min(600,e.damage*level)} 滴血`,
      chain:`跳電到附近 ${e.count} 隻怪，每跳最遠 ${e.radius} 格`,
      'dash-trail':`留下 ${e.duration} 秒痕跡，打到 ${e.radius} 格內的怪`,
      slow:`讓 ${e.radius} 格內的怪只剩 ${Math.round(e.multiplier*100)}% 速度，持續 ${e.duration} 秒`,
      stun:`讓 ${e.radius} 格內的怪暈 ${e.duration} 秒`,
      knockback:`把 ${e.radius} 格內的怪${e.distance < 0 ? '拉近' : '推開'} ${Math.abs(e.distance)} 格`,
      summon:`叫小幫手留 ${e.duration} 秒，每次射 ${e.count} 顆水球`,
      'ring-with-gap':`放出 ${e.radius} 格大的圈，留 ${Math.round(e.gap*180/Math.PI)} 度缺口`
    };
    return trigger + '，' + words[e.type] + '。';
  }
  function describe(data, spec) {
    if (spec.kind === 'move') {
      const m = data.boss.moves.find(m => m.id === spec.id);
      const count=Math.min(10,m.count+m.phaseCount*3);
      const words = {leap:`跳到紅圈落點，落地後轉星星可反擊`,sniper:`紅線瞄準後射出速度 ${m.speed} 的一根粉筆`,barriers:`兩側出現短牆 ${m.duration} 秒，上下有缺口`,combo:`連衝 2～3 次，每次重新預告方向`,tracking:`圈跟隨 ${data.boss.combat.trackingSeconds} 秒，再鎖定 ${data.boss.combat.lockSeconds} 秒命中`,wall:'一整道粉筆牆橫掃過來，用衝刺穿過',cage:'放出沒有缺口的縮圈，用衝刺穿過',words:`扇形射出 ${count} 個國字`,chalk:`每 ${m.pulse} 秒連發 ${count} 根粉筆`,dash:`沿預告線衝 ${m.distance} 格`,rain:`落下 ${count} 個 ${m.radius} 格大的考卷圈`,call:`在 ${count} 個位置點名，圈有 ${m.radius} 格大`,summon:`叫出 ${count} 隻小怪`,ring:`放出 ${m.radius} 格大的圈，留 ${Math.round(m.gap*180/Math.PI)} 度出口`};
      return `老師第 3 階段：先亮提示 ${m.warning} 秒，再${words[m.kind]}。`;
    }
    if (spec.id === 'heal') return `補回 ${Math.ceil(data.tuning.playerHealth/data.build.shieldHealthDivisor)} 滴血。`;
    const card = data.cards.find(c => c.id === spec.id), effects = spec.kind === 'effect' ? [card.effects[spec.index]] : card.effects;
    if (data.weapons.some(w=>w.id===spec.weaponId && w.kind==='melee') && globalThis.SurvivorWeapons) {
      const note = SurvivorWeapons.cardNote(card,data.weapons.find(w=>w.id===spec.weaponId));
      if (note) return note;
    }
    return effects.map(e => effectDescription(e, data, spec.level || 1)).join(' ') + (card.slot === 'dash' ? ` 有 ${data.tuning.dashCharges} 格衝刺，衝刺無敵，結束後第一顆水球強化。` : '');
  }
  function stop() {
    clearTimeout(refreshTimer);
    if (!active) return;
    if(active.frame.contentWindow && active.frame.contentWindow.captureDebugBefore)active.frame.contentWindow.captureDebugBefore();
    debugMemory[JSON.stringify(active.spec)]={options:active.frame._debugOptions,before:active.frame._debugBefore};
    if (active.observer) active.observer.disconnect();
    active.host.textContent = ''; active = null;
  }
  function mount(host, data, spec, force = false) {
    if (!host) return;
    if (!force && active && active.host===host && active.data===data && JSON.stringify(active.spec)===JSON.stringify(spec)) return;
    const debugOptions=active && active.debugOptions,debugBefore=active && active.debugBefore;
    stop();
    const title = document.createElement('strong'); title.textContent = '效果展示・' + (spec.kind === 'move' ? data.boss.moves.find(m=>m.id===spec.id).name : spec.id==='heal' ? '回血' : data.cards.find(c=>c.id===spec.id).name);
    const caption = document.createElement('p'); caption.textContent = describe(data,spec) + (spec.kind==='move' && data.boss.moves.find(m=>m.id===spec.id).warning>1.8 ? ' 小場景加速示範。' : '');
    const frame = document.createElement('iframe'); frame.title = title.textContent; frame.tabIndex = -1;
    const remembered=debugMemory[JSON.stringify(spec)]||{};
    frame._debugOptions=remembered.options || debugOptions;frame._debugBefore=remembered.before || debugBefore;
    frame._previewPayload = JSON.parse(JSON.stringify({data,spec}));
    frame.src = new URL('preview.html?v=20261028b', SurvivorPreview.base).href;
    host.appendChild(title); host.appendChild(frame); host.appendChild(caption);
    active = {host,data,spec,frame};
    if (typeof IntersectionObserver !== 'undefined') {
      const observer = new IntersectionObserver(entries => { const visible = entries[0].isIntersecting; if(frame.contentWindow && frame.contentWindow.setPreviewVisible) frame.contentWindow.setPreviewVisible(visible); frame._previewVisible = visible; });
      active.observer = observer; observer.observe(frame);
    }
  }
  function refresh() {
    if (!active) return;
    const {host,data,spec} = active;
    if(active.frame.contentWindow && active.frame.contentWindow.captureDebugBefore) active.frame.contentWindow.captureDebugBefore();
    active.debugOptions=active.frame._debugOptions;active.debugBefore=active.frame._debugBefore;
    clearTimeout(refreshTimer); refreshTimer = setTimeout(() => mount(host,data,spec,true),120);
  }
  const base = new URL('.', document.currentScript.src).href;
  globalThis.SurvivorPreview = {mount,stop,refresh,describe,effectDescription,base};
})();
