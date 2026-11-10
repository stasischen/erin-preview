// Editor controls share the shell's single live draft through ctx.
globalThis.SurvivorMakerModules = globalThis.SurvivorMakerModules || {};
SurvivorMakerModules['rules'] = function (ctx) {
  'use strict';
  function drawDefaults() {
    const pp=ctx.panel('預設設定'), details=ctx.el('details',undefined,pp), p=ctx.draft.playerDefaults;
    ctx.defaultsDetails=details;details.open=ctx.defaultsOpen;details.addEventListener('toggle',()=>{ctx.defaultsOpen=details.open;});
    ctx.el('summary','調整新玩家的預設值',details);
    const pf=ctx.grid(details);
    ctx.el('p','只供沒有個人設定的新玩家使用；你自己的操作、手感、聲音請到齒輪設定調整。',pp);
    ctx.select(pf,'預設攻擊模式',p,'attackMode',{manual:'手動',auto:'自動'},()=>{p.attackModeChosen=true;ctx.changed();});
    for (const [key,label] of Object.entries({joystickFollow:'搖桿跟隨',hitFeedback:'打擊回饋',vibration:'畫面震動',sound:'音效',music:'音樂',lowEffects:'低特效（省電）'})) {
      const b=ctx.button(pf,label+'：'+(p[key]?'開':'關'),()=>{ctx.defaultsOpen=details.open;p[key]=!p[key];ctx.changed();ctx.render();});
      b.setAttribute('role','switch');b.setAttribute('aria-checked',String(p[key]));
    }
    for (const [key,bounds] of Object.entries(ctx.api.PLAYER_BOUNDS)) ctx.range(pf,p,key,bounds,ctx.api.PLAYER_LABELS[key]);
  }
  // 主角與敵人共用的時間軸；編輯秒數時即時更新比例與文字。
  const NEUTRAL_NAMES={wavePush:"浪花額外擊退距離",waveDamage:"浪花互撞傷害",waveCooldown:"浪花每隻冷卻秒", "itemsPerRun": "每場道具卡池張數", "bombChance": "炸彈掉落機率", "bombDelay": "炸彈等待秒", "bombRadius": "炸彈半徑", "bombDamage": "炸彈傷害", "birdRadius": "小鳥繞行半徑", "birdReach": "小鳥啄擊距離", "birdSeconds": "小鳥攻擊間隔秒", "birdDamage": "小鳥傷害", "bankEvery": "金庫每幾顆球成長", "bankStep": "金庫每次傷害加成", "bankCap": "金庫傷害加成上限", "splitDamage": "分裂傷害倍率", "splitAngle": "分裂角度", "magnetMultiplier": "磁鐵拾取倍率", "crownDamage": "王冠傷害加成", "crownHealth": "王冠減少最大血量", "luckyRareMultiplier": "幸運草稀有權重倍率", "cookieKills": "餅乾回血所需擊倒數"};
  function drawNumbers() {
    const defaults=ctx.api.defaults();
    if(ctx.selected.rules==='neutral') {
    const nf=ctx.grid(ctx.panel('中立道具數值'));

    for(const [key,bounds] of Object.entries(ctx.api.NEUTRAL_BOUNDS)) ctx.range(nf,ctx.draft.neutralRules,key,bounds,NEUTRAL_NAMES[key]);
    }
    if(ctx.selected.rules==='schoolRules') {
    const schoolPanel=ctx.panel('流派數值'), schoolFields=ctx.grid(schoolPanel);
    for (const [key,bounds] of Object.entries(ctx.api.SCHOOL_BOUNDS)) ctx.range(schoolFields,ctx.draft.schoolRules,key,bounds,SCHOOL_NAMES[key]);
    }
    for(const [key,title] of [['tuning','基本玩法'],['build','流派共用數值'],['bossTuning','魔王共用數值']]) {
      if(ctx.selected.rules!==key) continue;
      const p=ctx.panel(title), fields=ctx.grid(p);
      for(const [field,value] of Object.entries(ctx.draft[key])) {
        if(typeof value!=='number') continue;
        if(key==='bossTuning' && !['phasePause','hazardLimit','shakeSeconds','shakePixels'].includes(field)) continue;
        if(key==='tuning' && ['enemySpeed','enemyRadius','enemyDamage','enemyHealth','secondEnemySpeed','secondEnemyDamage','enemyShootLevel','enemyShotInterval','secondEnemyShotInterval','enemyShotSpeed','enemyShotDamage','secondEnemyHealth','teacherHealth','teacherShotDamage','teacherShotCount','teacherShotSpread'].includes(field)) continue;
        const integer=['maxUpgradeLevel','enemyLimit','enemyShotLimit','teacherShotCount','teacherShotLimit','projectileLimit','gemLimit','xpToLevel','xpGrowthPerLevel','enemyShootLevel','fieldLimit','hazardLimit'].includes(field);
        let min=integer?1:value===0?0:Math.min(.01,defaults[key][field]), max=integer?defaults[key][field]:Math.max(5,defaults[key][field]*3), step=integer?1:defaults[key][field]>=5?1:.01;
        if(field==='slowMultiplier') {min=.2;max=1;step=.05;} if(field==='supportChance') {min=0;max=1;step=.05;}
        ctx.range(fields,ctx.draft[key],field,ctx.api.TUNING_BOUNDS[field] || [min,max,step],NUMBER_NAMES[field]);
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
  return { drawDefaults, NEUTRAL_NAMES, drawNumbers, SCHOOL_NAMES, NUMBER_NAMES };
};
