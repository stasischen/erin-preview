// 共用格式、安全界線與本機儲存。只有明列的欄位可以進入引擎；不執行輸入的程式碼。
(function (root) {
  'use strict';
  const KEY = 'erin-preview:pr-105:cc7702eeb3dc4aaed2f1805a6c891c39f211a1f1:erin-survivor-maker-v1';
  const copy = value => JSON.parse(JSON.stringify(value));
  const TYPES = { projectile: '發射水球', aoe: '範圍傷害', chain: '連鎖閃電', 'dash-trail': '留下痕跡', slow: '緩速', stun: '暈眩', knockback: '擊退', summon: '召喚小幫手', 'ring-with-gap': '留缺口的圈' };
  const KINDS = { words: '國字扇形', chalk: '粉筆連發', dash: '直線衝撞', rain: '多點範圍', call: '單點範圍', summon: '召喚', ring: '留缺口的圈', wall: '粉筆牆', cage: '衝刺縮圈', leap:'跳上講台',sniper:'粉筆狙擊',barriers:'黑板封路',combo:'黑板擦連衝',tracking:'點名追蹤' };
  const BOUNDS = { damage: [0, 300, 1], radius: [10, 180, 1], speed: [30, 450, 5], count: [1, 8, 1], spread: [0, 1, .05], duration: [.1, 5, .1], interval: [.4, 15, .1], multiplier: [.2, 1, .05], distance: [0, 300, 5], gap: [1.2, 3, .1], power: [1, 3, 1], warning: [.6, 3, .1], pulse: [.2, 2, .05], hp: [10, 500, 10], maxLevel: [1, 5, 1] };
  const TUNING_BOUNDS = {
    dashCharges:[1,4,1], dashInvincible:[.05,.5,.01], perfectWindow:[.05,.4,.01], perfectHeal:[0,10,1], perfectShield:[0,2,.05], perfectSlowSeconds:[0,1,.05], perfectSlowScale:[.2,1,.05], dashAttackSeconds:[.2,2,.1], dashAttackDamage:[1,3,.1], dashAttackSize:[1,2,.1], levelupRerolls:[0,9,1], playerSpeed:[80,320,5], playerHealth:[40,270,10], actionButtonSize:[72,104,4], waveSeconds:[60,300,10],
    invincibleSeconds:[.3,3,.1], dashCooldown:[1,8,.5], dashSeconds:[.1,.4,.05], dashMultiplier:[2,5,.5],
    bombCooldown:[2,15,1], bombDelay:[.2,1.5,.1], bombDamage:[20,300,10], bombRadius:[50,180,5], bombKnockback:[10,100,5],
    shotInterval:[.25,1.5,.05], projectileSpeed:[150,600,10], projectileDamage:[10,100,5], autoHealSeconds:[2,30,1],
    fireRateReduction:[0,.18,.01], enemyShotGap:[.4,3,.05], enemySpeedGrowth:[0,.2,.01],
    slowMultiplier:[.2,1,.05], supportChance:[0,1,.05], shieldHealthDivisor:[2,10,1], healIntervalMultiplier:[.5,1,.05],
    fieldInterval:[.2,3,.1], trailSpacing:[12,60,1], fieldSeconds:[.2,5,.1], fieldRadius:[10,100,1],
    ultimateSeconds:[2,30,1], cloudSeconds:[.5,10,.5], tornadoTick:[.2,3,.1], attackRadius:[80,900,10], shotRange:[80,900,10],
    warningSeconds:[.6,3,.1], phasePause:[.6,3,.1], shakeSeconds:[0,.4,.01], shakePixels:[0,6,1]
  };
  const BOSS_MOVE_BOUNDS={...BOUNDS,distance:[0,600,5],recovery:[0,3,.1],cooldown:[0,8,.1]};
  const POSTURE_BOUNDS={window:[.05,.4,.01],maximum:[20,200,5],dodgeGain:[0,100,1],recoveryGain:[0,100,1],interruptGain:[0,100,1],decay:[0,30,1],stunSeconds:[1,5,.1],chargeBonus:[0,2,.1],damageMultiplier:[1,5,.1],heal:[0,20,1]};
  const WEAKPOINT_CONDITIONS={'beam-active':'眼面朝外的光束預警／出手','windup':'招式預警時','recovery':'收招時','after-move':'指定招式收招後','behind':'Boss 背對主角','wall-stun':'撞牆暈眩','posture-break':'架勢崩潰','environment':'環境引出','bait':'誘餌引出'};
  const WEAKPOINT_BOUNDS={armorMultiplier:[.15,.25,.01],criticalMultiplier:[1,6,.1],warning:[.1,1.5,.05],closing:[.1,1,.05]};
  const BOSS_COMBAT_BOUNDS={nearDistance:[100,300,10],farDistance:[350,900,10],pursuitDistance:[400,1200,10],pursuitMultiplier:[1,4,.1],healthPerUpgrade:[0,1000,10],leapRecovery:[.6,3,.1],leapPush:[0,100,5],trackingSeconds:[.6,2,.1],lockSeconds:[.5,2,.1],phaseWordsSpeed:[100,450,10],phaseChalkSpeed:[100,450,10]};
  const WEAPON_BOUNDS = {interval:[.2,2,.05],arcDegrees:[30,180,5],radius:[30,150,5],damageMultiplier:[.5,3,.1],push:[0,60,1],spinEvery:[2,10,1],damageReduction:[0,.5,.01]};
  const ATTACK_BOUNDS = {chargeStun:[0,2,.1],splashSize:[1,4,.1],splashDamage:[0,1,.05],comboEvery:[2,10,1],comboReset:[.3,5,.1],comboMultiplier:[1,5,.1],chargeSeconds:[.2,5,.1],chargeMultiplier:[1,5,.1],moveRetention:[0,1,.05],chargeSize:[1,3,.1],comboSize:[1,3,.1],comboPush:[0,100,1],finisherRecovery:[0,1,.05],stepDistance:[0,40,1],thrustWidth:[5,50,1]};
  const PACING_BOUNDS = {density:[.25,2,.05],strongScale:[.5,2,.05],weakScale:[.25,1,.05],cycleSeconds:[5,20,1],eventCount:[2,10,1],eventSeconds:[5,20,1],warning:[.6,3,.1],chargeSpeed:[150,450,10],chargeSeconds:[.3,1,.05],fuseSeconds:[2,2,1],blastRadius:[40,120,5],blastDamage:[0,30,1],blastEnemyDamage:[10,200,10],shieldRadius:[60,220,10],shieldSeconds:[3,12,1],shieldHits:[1,3,1]};
  const PHASE_BOUNDS = {radius:[4,150,1],innerRadius:[0,150,1],length:[40,500,5],angle:[20,180,5],windup:[.6,3,.05],active:[.1,4,.05],recovery:[.2,3,.05],cooldown:[.5,15,.1],damage:[0,30,1],triggerDistance:[40,500,5],speed:[50,200,5],count:[1,12,1],gapDegrees:[40,160,5]};
  const TIMING_BOUNDS = {windup:[0,3,.05],active:[0,4,.05],recovery:[0,3,.05],cooldown:[0,15,.05]};
  const PHASE_SHAPES = {line:'直線',sector:'扇形',circle:'圓形',ring:'圓環',projectiles:'子彈型態'};
  const BEHAVIORS = {chase:'追趕',fast:'弧線快跑',tank:'擋住其他怪',shooter:'射擊後退',charger:'預警衝撞',bomber:'兩秒自爆',splitter:'分裂兩隻',support:'護盾輔助',still:'站在原地',retreat:'靠近後退'};
  const NEUTRAL_BOUNDS = {wavePush:[0,120,1],waveDamage:[0,100,1],waveCooldown:[.1,2,.1],"itemsPerRun": [1, 9, 1], "bombChance": [0, 1, 0.05], "bombDelay": [0.2, 2, 0.1], "bombRadius": [20, 150, 1], "bombDamage": [5, 150, 1], "birdRadius": [25, 120, 1], "birdReach": [20, 150, 1], "birdSeconds": [0.3, 3, 0.1], "birdDamage": [5, 80, 1], "bankEvery": [1, 30, 1], "bankStep": [0.001, 0.05, 0.001], "bankCap": [0, 1, 0.01], "splitDamage": [0.1, 1, 0.1], "splitAngle": [0.1, 1, 0.1], "magnetMultiplier": [1, 4, 0.1], "crownDamage": [0.1, 1, 0.05], "crownHealth": [1, 20, 1], "luckyRareMultiplier": [1, 3, 0.1], "cookieKills": [5, 50, 1]};
  const SCHOOL_BOUNDS = {
    schoolsPerRun:[1,3,1], cardsPerSchool:[3,8,1], transformCards:[2,5,1], ultimateCards:[3,8,1], fusionCards:[1,4,1],
    legendaryChance:[0,.1,.005],rareWeight:[.1,1,.05],ownedWeight:[0,2,.05],starterWeight:[0,4,.1],
    bigDropEvery:[2,12,1],bigDropSize:[1,3,.1],bigDropDamage:[1,3,.1],bigDropPush:[0,100,1],
    fountainSeconds:[2,20,.5],fountainRadius:[40,240,1],fountainPush:[0,100,1],wetSeconds:[.5,6,.1],wetDamage:[0,.5,.01],rainSeconds:[4,30,.5],rainDuration:[1,5,.1],
    windBladeDamage:[.1,1,.05],windBladeRange:[50,300,1],gustSeconds:[3,20,.5],gustRadius:[40,240,1],gustPush:[0,100,1],refundCharge:[0,.75,.05],lightSpeed:[0,.3,.01],lightMagnet:[0,1,.05],eyeWait:[.2,3,.1],eyeRadius:[30,100,1],eyePush:[0,60,1],
    chargeKills:[3,30,1],chargeDamage:[1,4,.1],rodSeconds:[3,20,.5],rodDuration:[1,6,.1],rodRadius:[40,200,1],rodDamage:[5,80,1],rodTick:[.4,3,.1],thunderStepStun:[.1,1.5,.1],staticSeconds:[.4,4,.1],staticDamage:[5,60,1],superconductorJumps:[1,3,1],waterFormSize:[0,.5,.05],windFormCharges:[0,2,1],thunderFormRange:[0,1,.1]
  };
  const ENCOUNTER_BOUNDS = {
    elites: {interval:[5,60,1],chance:[0,1,.05],limit:[1,3,1],sizeScale:[1.1,1.5,.05],healthScale:[2,8,.5],rewardXp:[1,15,1],shieldHits:[1,6,1],auraRadius:[50,240,5],auraSpeed:[1,1.8,.05],syrupInterval:[.4,3,.1],syrupSeconds:[1,6,.5],syrupRadius:[12,50,1],syrupSlow:[.4,1,.05],teleportInterval:[4,15,.5],teleportWarning:[.8,3,.1],teleportDistance:[100,240,5]},
    chocobear: {stageFraction:[.25,.75,.05],hp:[100,1500,10],armor:[20,600,10],radius:[26,44,1],speed:[20,80,1],damage:[0,25,1],slamInterval:[2,10,.5],slamWarning:[.8,3,.1],slamRadius:[45,120,1],slamDamage:[0,30,1]}
  };
  const ELITE_ABILITIES = {shield:'糖霜護盾',split:'分裂',haste:'加速光環',syrup:'黏黏糖漿',teleport:'傳送'};
  const PARAMS = { damage: 35, radius: 80, speed: 190, count: 1, spread: .2, duration: 1, interval: 2, multiplier: .55, distance: 40, gap: 1.8 };
  const PLAYER_BOUNDS = {joystickRadius:[20,70,1],joystickDeadZone:[0,10,1],feedbackIntensity:[0,2,.1],soundVolume:[0,1,.05],musicVolume:[0,1,.05]};
  const PLAYER_LABELS = {joystickRadius:'搖桿大小',joystickDeadZone:'搖桿死區',feedbackIntensity:'打擊回饋強度',soundVolume:'音效音量',musicVolume:'音樂音量'};
  function playerDefaults(data) {
    if (data.playerDefaults) return copy(data.playerDefaults);
    const result = copy(root.SURVIVOR_DEFAULTS.playerDefaults);
    if (data.attackModeChosen === true && ['auto','manual'].includes(data.attackMode)) {
      result.attackMode=data.attackMode; result.attackModeChosen=true;
    }
    if (data.joystick) Object.assign(result,{joystickFollow:data.joystick.follow,joystickRadius:data.joystick.radius,joystickDeadZone:data.joystick.deadZone});
    if (data.hitJuice) Object.assign(result,{hitFeedback:data.hitJuice.enabled,feedbackIntensity:data.hitJuice.intensity});
    return result;
  }
  function normalizePlayer(input, base = root.SURVIVOR_DEFAULTS.playerDefaults) {
    const result=copy(base);
    if (!input || typeof input !== 'object') return result;
    for (const key of Object.keys(result)) {
      const value=input[key];
      if (PLAYER_BOUNDS[key] && typeof value==='number' && Number.isFinite(value)) result[key]=Math.max(PLAYER_BOUNDS[key][0],Math.min(PLAYER_BOUNDS[key][1],value));
      else if (typeof result[key]==='boolean' && typeof value==='boolean') result[key]=value;
    }
    result.attackMode = input.attackModeChosen===true && ['auto','manual'].includes(input.attackMode) ? input.attackMode : 'manual';
    return result;
  }
  // 武器招式 v1：五種積木的白名單。編輯積木，載入時編譯成既有戰鬥接合欄位。
  // 連段重招就是原有特殊招；衝刺斬沿用重招倍率，不另創數值。
  const SPECIAL_BOUNDS={specialCooldown:[.5,15,.1],specialCount:[1,8,1],specialSpread:[0,1,.01],specialRange:[40,600,5],specialDamage:[.5,5,.1],specialLeapDistance:[0,150,5],specialLeapSeconds:[.1,1,.05]};
  const WEAPON_STACKS = [
    {id:'primary',label:'普通攻擊',trigger:['direction'],shape:['baseShape','arcDegrees','radius','thrustWidth'],timing:['interval'],effect:['damageMultiplier','push','damageReduction']},
    {id:'combo',label:'連段重招',trigger:['comboEnabled','comboEvery','comboReset'],shape:['comboShape','comboSize'],timing:['finisherRecovery'],effect:['comboMultiplier','comboPush','stepDistance','splashSize','splashDamage']},
    {id:'charge',label:'蓄力攻擊',trigger:['chargeEnabled','chargeSeconds','moveRetention'],shape:['chargeShape','chargeSize'],timing:[],effect:['chargeMultiplier','chargeStun']},
    {id:'special',label:'特殊招',trigger:[],shape:['specialKind','specialCount','specialSpread','specialRange'],timing:['specialCooldown','specialLeapSeconds'],effect:['specialDamage','specialLeapDistance']},
    {id:'dash',label:'衝刺斬',trigger:['dashThrust'],shape:[],timing:[],effect:[]}
  ];
  const WEAPON_TRIGGERS={primary:'attackReleaseOrTimer',combo:'attackNumber',charge:'chargeReady',special:'specialRelease',dash:'dashAttack'};
  // 回饋 v1：倍率套在既有表現上；缺省欄位讓舊作品保持原手感。
  // 秒、倍率及像素數值均可 JSON 序列化；舊作品只補缺少欄位。
  const FEEDBACK_TIERS={
    small:{sound:'hit',stopSeconds:.05,particles:5,trauma:.18,flash:1,numberScale:1},
    medium:{sound:'water',stopSeconds:.09,particles:10,trauma:.38,flash:1,numberScale:1.3},
    large:{sound:'lightning',stopSeconds:.15,particles:20,trauma:.65,flash:1,numberScale:1.7}
  };
  const FEEDBACK_BOUNDS={hitStop:[0,2,.1],shake:[0,2,.1],stopSeconds:[.04,.15,.01],particles:[0,30,1],trauma:[0,1,.01],flash:[0,1,.1],numberScale:[.5,2,.1]};
  const WARNING_STYLES={original:'原來樣式',outline:'只有外框',pulse:'閃動外框'};
  const FEEDBACK_SOUNDS={shoot:'出招',warning:'預警',hit:'命中',water:'水花',lightning:'閃電',none:'靜音'};
  function feedback(value,base) {
    blockObject(value,['cue','sound','warningStyle','slash','hitStop','shake','hint','level',...Object.keys(FEEDBACK_BOUNDS)],'回饋');
    if(value.level!==undefined && !['small','medium','large','custom'].includes(value.level)) throw new Error('回饋等級不支援');
    const level=value.level||base.level||'small';
    const f={...FEEDBACK_TIERS[level==='custom'?'small':level],level,warningStyle:'original',slash:true,hitStop:base.sound==='warning'?0:1,shake:base.sound==='warning'?0:1,hint:true,...base,...value};
    if(f.cue!==base.cue || !Object.keys(FEEDBACK_SOUNDS).includes(f.sound) || !Object.keys(WARNING_STYLES).includes(f.warningStyle)) throw new Error('回饋選項不支援');
    for(const key of ['slash','hint']) if(typeof f[key]!=='boolean') throw new Error('回饋開關不正確');
    for(const key of Object.keys(FEEDBACK_BOUNDS)) if(typeof f[key]!=='number'||!Number.isFinite(f[key])||f[key]<FEEDBACK_BOUNDS[key][0]||f[key]>FEEDBACK_BOUNDS[key][1]) throw new Error('回饋強度超出範圍');
    return f;
  }
  function weaponCue(weapon,id) {return id==='special'?weapon.specialKind:weapon.kind==='melee'?'hammer-swing':'projectile';}
  function weaponFeedbackBase(weapon,id) {
    const impact=weapon.kind==='melee' && (id!=='special' || weapon.specialKind==='leap');
    return {level:id==='charge'?'medium':'small',cue:weaponCue(weapon,id),sound:'shoot',hitStop:impact?1:0,shake:impact?1:0};
  }
  function weaponStacks(weapon) {
    return {version:1, moves:WEAPON_STACKS.map(def=>{
      const move={id:def.id};
      for(const part of ['trigger','shape','timing','effect']) move[part]=Object.fromEntries(def[part].filter(k=>weapon[k]!==undefined).map(k=>[k,copy(weapon[k])]));
      move.trigger.event=WEAPON_TRIGGERS[def.id];
      if(def.id==='primary') move.timing.phases=copy(weapon.timing);
      move.feedback=feedback((weapon.feedback||{})[def.id]||{}, weaponFeedbackBase(weapon,def.id));
      return move;
    })};
  }
  function compileWeapon(weapon) {
    if(weapon.blocks===undefined) return {...weapon};
    const blocks=weapon.blocks;
    blockObject(blocks,["version","moves"],"武器");
    if(!blocks || Object.keys(blocks).some(k=>!['version','moves'].includes(k)) || blocks.version!==1 || !Array.isArray(blocks.moves) || blocks.moves.length!==WEAPON_STACKS.length) throw new Error('武器積木版本或招式數量不正確');
    const result={...weapon};
    blocks.moves.forEach((move,i)=>{
      const def=WEAPON_STACKS[i];
      blockObject(move,['id',...Object.keys(BLOCK_PARTS)],'武器招式');
      if(!move || move.id!==def.id || Object.keys(move).some(k=>!['id','trigger','shape','timing','effect','feedback'].includes(k))) throw new Error('武器招式積木不正確');
      for(const part of ['trigger','shape','timing','effect']) {
        const values=move[part], allowed=def[part].concat(part==='trigger'?['event']:def.id==='primary'&&part==='timing'?['phases']:[]);
        if(!values || typeof values!=='object' || Array.isArray(values) || Object.keys(values).some(k=>!allowed.includes(k))) throw new Error('武器'+part+'積木不正確');
        for(const key of def[part]) {
          if(weapon[key]!==undefined && values[key]===undefined) throw new Error('武器積木缺少 '+key);
          if(values[key]!==undefined) result[key]=values[key];
        }
      }
      if(move.trigger.event!==WEAPON_TRIGGERS[def.id]) throw new Error('武器觸發積木不支援');
      if(def.id==='primary') {
        if(!move.timing.phases) throw new Error('武器缺少時機積木');
        result.timing=move.timing.phases;
      }
      if(!result.feedback) result.feedback={};
      result.feedback={...result.feedback,[def.id]:feedback(move.feedback,weaponFeedbackBase(weapon,def.id))};
    });
    return result;
  }
  // 與武器相同的五類積木；編譯只搬資料，傷害、時序與表現仍走既有接合層。
  const BLOCK_PARTS = {trigger:'觸發',shape:'形狀',timing:'時機',effect:'效果',feedback:'回饋'};
  const ENEMY_STACKS = [
    {id:'phase',label:'分階段攻擊',event:'targetInRange',trigger:['enabled','triggerDistance'],shape:['shape','radial','radius','innerRadius','length','angle','speed','count','gapDegrees'],timing:['windup','active','recovery','cooldown'],effect:['damage']},
    {id:'legacy',label:'等級攻擊（分階段關閉時）',event:'levelTimer',trigger:['level'],shape:['type','radius','speed','count','spread'],timing:['interval'],effect:['damage']}
  ];
  const BOSS_STACKS = [{id:'move',label:'老師招式',event:'bossPhase',trigger:['minPhase','phaseCount'],shape:['kind','speed','count','spread','radius','gap','distance'],timing:['warning','duration','pulse','recovery','cooldown'],effect:['damage']}];
  function attackStacks(owner,defs) {
    return {version:1,moves:defs.map(def=>{
      const source=def.id==='phase'?owner.phaseAttack:def.id==='legacy'?owner.attack:owner;
      const move={id:def.id};
      for(const part of ['trigger','shape','timing','effect']) move[part]=Object.fromEntries(def[part].map(key=>[key,copy(part==='timing' && def.id==='phase' ? (source.timing || source)[key] : (source[key] ?? 0))]));
      if(def.id==='phase')move.timing.inputBuffer=source.timing?.inputBuffer??.12;
      move.trigger.event=def.event;
      move.feedback=feedback((owner.feedback||{})[def.id]||{}, {cue:def.id==='phase'?'locked-warning':def.id==='legacy'?'enemy-attack':'teacher-warning',sound:'warning',shake:def.id==='move'?1:0});
      return move;
    })};
  }
  function blockObject(value,allowed,label) {
    if(!value || typeof value!=='object' || Array.isArray(value) || Object.keys(value).some(k=>!allowed.includes(k))) throw new Error(label+'積木格式不正確');
  }
  function compileAttack(owner,defs) {
    if(owner.blocks===undefined) return {...owner};
    const blocks=owner.blocks;
    blockObject(blocks,['version','moves'],'招式');
    if(blocks.version!==1 || !Array.isArray(blocks.moves) || blocks.moves.length!==defs.length) throw new Error('招式積木版本或數量不正確');
    const result={...owner};
    blocks.moves.forEach((move,i)=>{
      const def=defs[i];
      blockObject(move,['id',...Object.keys(BLOCK_PARTS)],'招式');
      if(move.id!==def.id) throw new Error('招式積木識別碼不正確');
      const source={};
      for(const part of ['trigger','shape','timing','effect']) {
        blockObject(move[part],def[part].concat(part==='trigger'?['event']:part==='timing'&&def.id==='phase'?['inputBuffer']:[]),part);
        for(const key of def[part]) {
          if(move[part][key]===undefined && !(def.id==='move' && ['recovery','cooldown'].includes(key))) throw new Error('招式積木缺少 '+key);
          source[key]=def.id==='move' && ['recovery','cooldown'].includes(key) && move[part][key]===undefined ? 0 : move[part][key];
        }
      }
      if(move.trigger.event!==def.event) throw new Error('招式觸發不支援');
      const cue=def.id==='phase'?'locked-warning':def.id==='legacy'?'enemy-attack':'teacher-warning';
      result.feedback={...result.feedback,[def.id]:feedback(move.feedback,{cue,sound:'warning',shake:def.id==='move'?1:0})};
      if(def.id==='phase') {source.timing={...Object.fromEntries(def.timing.map(k=>[k,source[k]])),inputBuffer:move.timing.inputBuffer??.12};result.phaseAttack=source;}
      else if(def.id==='legacy') result.attack=source;
      else Object.assign(result,source);
    });
    return result;
  }
  const enemyStacks = enemy => attackStacks(enemy,ENEMY_STACKS);
  // 舊作品遷移：距離分組與舊老師相同，數值皆為世界單位。
  function bossAIRules(boss) {
    return boss.moves.map(m=>{
      const far=['leap','sniper'].includes(m.kind), near=['rain','call','ring','cage','tracking'].includes(m.kind);
      return {moveId:m.id,weight:1,minDistance:near||far?0:boss.combat.nearDistance,
        maxDistance:far?10000:near?boss.combat.nearDistance:boss.combat.farDistance,
        angleWeight:0,phaseWeight:0,offscreen:far};
    });
  }
  const bossStacks = move => attackStacks(move,BOSS_STACKS);
  const compileEnemy = enemy => compileAttack(enemy,ENEMY_STACKS);
  const compileBossMove = move => compileAttack(move,BOSS_STACKS);

  // 波次 v1：和武器／敵人共用五種積木外殼。純資料編譯，不讀時鐘或抽亂數。
  function waveDefinitions(data) {
    const defs=[];
    for(const stage of data.stages) stage.waves.forEach((wave,i)=>defs.push({id:stage.id+'-'+i,label:stage.name+' 第 '+(i+1)+' 波',section:stage.id,
      event:'stageTime',trigger:['start'],shape:['position'],timing:['every'],effect:['typeId','count'],feedback:['sound','hint'],wave,i,stage}));
    defs.push({id:'pacing',label:'出怪節奏',section:'pacing',event:'stageClock',trigger:['pattern','cycleSeconds'],shape:[],timing:[],effect:['density','strongScale','weakScale'],feedback:[]});
    defs.push({id:'events',label:'事件時間',section:'pacing',event:'stageTime',trigger:['first','second'],shape:[],timing:['eventSeconds','warning'],effect:['eventCount'],feedback:[]});
    for(const id of data.pacing.eventPool) defs.push({id:'event-'+id,label:({ring:'包圍',tide:'湧潮','elite-squad':'精英小隊','candy-rain':'跳跳糖'})[id],section:'pacing',event:'eventSelected',trigger:[],shape:['position'],timing:[],effect:['typeId','elite'],feedback:[]});
    defs.push({id:'elites',label:'精英怪',section:'elites',event:'interval',trigger:['enabled','chance'],shape:['position'],timing:['interval'],effect:['typeId','count'],feedback:['sound','hint']});
    defs.push({id:'chocobear',label:'巧克力大熊',section:'chocobear',event:'stageFraction',trigger:['enabled','stageFraction'],shape:['position'],timing:[],effect:['typeId','count'],feedback:['sound','hint']});
    return defs;
  }
  const WAVE_POSITIONS={zone:'畫面外（跟隨安全圈）',random:'畫面外隨機',sides:'四邊輪流',top:'上方',right:'右方',bottom:'下方',left:'左方'};
  function waveStacks(data) {
    const previous=data.waveBlocks;
    if(previous) return copy(previous);
    return {version:1,moves:waveDefinitions(data).map(def=>{
      const move={id:def.id,trigger:{event:def.event},shape:{},timing:{},effect:{},feedback:{}};
      let values;
      if(def.wave) values={...def.wave,typeId:def.wave.typeId||'pacing',count:def.wave.count||1,position:def.wave.position||'zone',sound:def.wave.sound||'none',hint:def.wave.hint===true};
      else if(def.id==='pacing') values=data.pacing;
      else if(def.id==='events') values={...data.pacing,first:45,second:90};
      else if(def.id.startsWith('event-')) {const id=def.id.slice(6);values={typeId:id==='tide'?'otsubon':id==='candy-rain'?'pop-candy':'jaben',elite:id==='elite-squad',position:id==='ring'?'sides':id==='tide'?'left':'zone'};}
      else values={...data[def.id],typeId:def.id==='chocobear'?'chocobear':'pacing',count:1,position:def.id==='chocobear'?'random':'zone',sound:def.id==='chocobear'?'warning':'none',hint:false};
      for(const part of ['trigger','shape','timing','effect','feedback']) for(const key of def[part]) move[part][key]=copy(values[key]);
      return move;
    })};
  }
  function compileWaves(data) {
    if(data.waveBlocks===undefined) return data;
    const result=copy(data), blocks=data.waveBlocks, defs=waveDefinitions(root.SURVIVOR_DEFAULTS);
    blockObject(blocks,['version','moves'],'波次');
    if(blocks.version!==1 || !Array.isArray(blocks.moves) || blocks.moves.length!==defs.length) throw new Error('波次積木版本或數量不正確');
    result.waveEvents={};
    const numeric=(v,a,b,integer=false)=>{if(typeof v!=='number'||!Number.isFinite(v)||v<a||v>b||integer&&!Number.isInteger(v)) throw new Error('波次數值超出安全範圍');};
    blocks.moves.forEach((move,i)=>{
      const def=defs[i];blockObject(move,['id',...Object.keys(BLOCK_PARTS)],'波次');
      if(move.id!==def.id) throw new Error('波次積木識別碼不正確');
      const values={};
      for(const part of ['trigger','shape','timing','effect','feedback']) {
        blockObject(move[part],def[part].concat(part==='trigger'?['event']:[]),'波次'+part);
        for(const key of def[part]) {if(move[part][key]===undefined) throw new Error('波次積木缺少 '+key);values[key]=move[part][key];}
      }
      if(move.trigger.event!==def.event) throw new Error('波次觸發不支援');
      if(values.position!==undefined && !Object.keys(WAVE_POSITIONS).includes(values.position)) throw new Error('生怪位置不支援');
      if(values.typeId!==undefined && !(def.id==='chocobear'?values.typeId==='chocobear':['pacing',...root.SURVIVOR_DEFAULTS.enemies.map(e=>e.id)].includes(values.typeId))) throw new Error('生怪種類不支援');
      if(values.count!==undefined) numeric(values.count,1,def.id==='chocobear'?1:10,true);
      if(values.elite!==undefined && typeof values.elite!=='boolean') throw new Error('精英開關不正確');
      if(values.sound!==undefined && !['none','warning'].includes(values.sound)) throw new Error('波次音效不支援');
      if(values.hint!==undefined && typeof values.hint!=='boolean') throw new Error('波次提示不正確');
      if(def.wave) {
        numeric(values.start,0,300);numeric(values.every,.3,5);
        const stage=result.stages.find(s=>s.id===def.section), wave=stage.waves[def.i];for(const key of ['start','every','typeId','count','position','sound','hint']) wave[key]=values[key];
      } else if(def.id==='events') {
        numeric(values.first,1,299);numeric(values.second,2,300);if(values.first>=values.second) throw new Error('事件時間需遞增');
        Object.assign(result.pacing,values);result.pacing.eventTimes=[values.first,values.second];
      } else if(def.id.startsWith('event-')) result.waveEvents[def.id.slice(6)]=values;
      else if(def.id==='pacing') Object.assign(result.pacing,values);
      else Object.assign(result[def.id],values);
    });
    for(const stage of result.stages) if(stage.waves[0].start!==0 || stage.waves.some((w,i)=>i&&w.start<=stage.waves[i-1].start)) throw new Error('波次時間需從 0 秒遞增');
    return result;
  }

  function defaults() { return copy(root.SURVIVOR_DEFAULTS); }
  function validate(input) {
    const data = defaults(), errors = [];
    const fail = message => { throw new Error(message); };
    const num = (v, min, max, label, integer = false) => {
      if (typeof v !== 'number' || !Number.isFinite(v) || v < min || v > max || (integer && !Number.isInteger(v))) fail(label + ' 超出安全範圍');
      return v;
    };
    // 名稱會顯示在既有技能樹 HTML；拒絕標籤及引號，保留中文字；舊作品的圖示文字自動轉換。
    const name = (v, label, max = 60) => { v = root.SurvivorIcons.clean(v); if (typeof v !== 'string' || !v.trim() || v.length > max || /[<>&"'`]/.test(v)) fail(label + ' 請使用簡短文字，不可包含 HTML 符號'); return v.trim(); };
    const choice = (v, list, label) => { if (!list.includes(v)) fail(label + ' 選項不正確'); return v; };
    const timing = (source,bounds=TIMING_BOUNDS) => {
      if (!source || typeof source!=='object') fail('時機積木格式不正確');
      return {...Object.fromEntries(Object.entries(bounds).map(([key,b])=>[key,num(source[key],b[0],b[1],key)])),inputBuffer:num(source.inputBuffer===undefined?.12:source.inputBuffer,.1,.15,'輸入緩衝')};
    };
    const weakpoint = (value, base, moveIds) => {
      if(value===undefined)return base===undefined?undefined:copy(base);
      if(value===null)return null; // Maker 可移除積木，回到原來的無部位規則。
      blockObject(value,['version','parts','artId','postureChargeMultiplier',...Object.keys(WEAKPOINT_BOUNDS)],'弱點');
      if(value.version!==1||!Array.isArray(value.parts)||value.parts.length<1||value.parts.length>8)fail('弱點版本或部位數量錯誤');
      const result={version:1};
      if(value.artId!==undefined)result.artId=choice(value.artId,['effect/weakpoint','effect/weakpoint-red'],'弱點美術');
      if(value.postureChargeMultiplier!==undefined)result.postureChargeMultiplier=num(value.postureChargeMultiplier,1,2,'破架勢蓄力額外倍率');
      for(const [key,b] of Object.entries(WEAKPOINT_BOUNDS))result[key]=num(value[key],b[0],b[1],'弱點 '+key);
      const seen=new Set();
      result.parts=value.parts.map(p=>{
        blockObject(p,['id','anchor','radiusScale','angleDegrees','arcDegrees','mode','duration','conditions','requiresMatch'],'弱點部位');
        if(typeof p.id!=='string'||!/^[a-z][a-z0-9-]{0,23}$/.test(p.id)||seen.has(p.id))fail('弱點部位 id 不正確或重複');seen.add(p.id);
        if(!Array.isArray(p.conditions)||!p.conditions.length||p.conditions.length>7)fail('弱點需要一到七個開啟條件');
        const part={id:p.id,anchor:choice(p.anchor,['weakpoint'],'美術錨點'),radiusScale:num(p.radiusScale,.25,1.5,'弱點半徑倍率'),angleDegrees:num(p.angleDegrees,-180,180,'弱點方向'),arcDegrees:num(p.arcDegrees,20,360,'弱點角度'),mode:choice(p.mode,['any','all'],'弱點條件組合'),duration:num(p.duration,.5,8,'弱點開啟秒數')};
        if(p.requiresMatch!==undefined){if(typeof p.requiresMatch!=='boolean')fail('弱點條件持續需為開關');part.requiresMatch=p.requiresMatch;}
        if(part.duration<=result.closing)fail('弱點開啟時間需長於關閉提示');
        part.conditions=p.conditions.map(c=>{
          blockObject(c,['type','moveId'],'弱點條件');
          const type=choice(c.type,Object.keys(WEAKPOINT_CONDITIONS),'弱點條件');
          if(type==='after-move')return {type,moveId:choice(c.moveId,moveIds,'弱點指定招式')};
          if(c.moveId!==undefined)fail('只有指定招式條件可帶 moveId');
          return {type};
        });return part;
      });return result;
    };
    const trialEffects=(effect,base,timing)=>{
      const result={};
      for(const key of ['sequence','relocate','projectiles','slide','limb','gridRoll','beam','charge']) {
        if(!base[key]){if(effect[key]!==undefined)fail('此招式沒有 '+key+' 積木');continue;}
        const value=effect[key];if(!value||typeof value!=='object')fail('缺少 '+key+' 積木');
        if(key==='sequence'){
          blockObject(value,['count','phaseCount'],'連斬');result[key]={count:num(value.count,1,8,'連斬刀數',true),phaseCount:num(value.phaseCount,1,8,'後半場刀數',true)};
          if(result[key].phaseCount<result[key].count)fail('後半場刀數不可少於前半場');
        }else if(key==='relocate'){
          blockObject(value,['mode','distance','vanish','flash'],'換位');result[key]={mode:choice(value.mode,['behind'],'換位方式'),distance:num(value.distance,40,160,'背後距離'),vanish:num(value.vanish,.1,1,'消失秒數'),flash:num(value.flash,.2,.5,'白閃預警秒數')};
          if(result[key].vanish+result[key].flash>timing.windup+1e-8)fail('換位後需留足完整白閃預警');
        }else if(key==='projectiles'){
          blockObject(value,['count','speed','life','radius','artId'],'苦無彈幕');result[key]={count:num(value.count,1,15,'苦無數量',true),speed:num(value.speed,60,400,'苦無速度'),life:num(value.life,.5,5,'苦無壽命'),radius:num(value.radius,3,12,'苦無半徑'),artId:choice(value.artId,['move/kunai'],'苦無美術')};
        }else if(key==='gridRoll'){
          blockObject(value,['cell'],'格步翻滾');result[key]={cell:num(value.cell,60,120,'格距')};
        }else if(key==='beam'){
          blockObject(value,['width','range'],'直線光束');result[key]={width:num(value.width,3,20,'光束半寬'),range:num(value.range,100,800,'光束最長距離')};
        }else if(key==='limb'){
          blockObject(value,['side','reach','lift'],'交替肢體');
          if(value.side!==base.limb.side)fail('肢體左右識別不可改變');
          result[key]={side:value.side,reach:num(value.reach,60,300,'肢體觸及距離'),lift:num(value.lift,20,120,'舉手高度')};
        }else if(key==='charge'){
          blockObject(value,['wallStun'],'直線衝撞');if(typeof value.wallStun!=='boolean')fail('撞牆暈眩需為開關');result[key]={wallStun:value.wallStun};
        }else {blockObject(value,['speed'],'側滑');result[key]={speed:num(value.speed,0,300,'側滑速度')};}
      }
      return result;
    };
    try {
      if (!input || input.schemaVersion !== 1) fail('作品版本不支援');
      input=compileWaves(input);
      if (input.attackMode !== undefined) data.attackMode = choice(input.attackMode,['auto','manual'],'攻擊模式');
      data.attackModeChosen = input.attackModeChosen === true;
      if (input.playerDefaults !== undefined) {
        const p=input.playerDefaults;
        if (!p || typeof p!=='object') fail('預設設定格式不正確');
        for (const [key,value] of Object.entries(data.playerDefaults)) {
          if (PLAYER_BOUNDS[key]) num(p[key],PLAYER_BOUNDS[key][0],PLAYER_BOUNDS[key][1],key);
          else if (key==='attackMode') choice(p[key],['auto','manual'],'預設攻擊模式');
          else if (typeof p[key] !== typeof value) fail('預設設定 '+key+' 格式不正確');
        }
        data.playerDefaults=normalizePlayer(p);
      } else data.playerDefaults=playerDefaults(input);
      // 舊作品的兩把武器／缺省欄位自動補齊；未知或重複 id 拒絕。
      if (input.weapons !== undefined) {
        if (!Array.isArray(input.weapons) || input.weapons.length < 2 || input.weapons.length > data.weapons.length || new Set(input.weapons.map(w=>w && w.id)).size !== input.weapons.length || input.weapons.some(w=>!w || !data.weapons.some(b=>b.id===w.id))) fail('武器清單不正確');
        for (const weapon of data.weapons) {
          let source = input.weapons.find(w => w.id === weapon.id);
          if (!source && weapon.id === 'candy-sword') continue;
          if (!source || source.kind !== weapon.kind) fail('武器種類不正確');
          source=source.blocks===undefined ? source : compileWeapon({...weapon,...source,feedback:source.feedback});
          if(source.timing !== undefined) weapon.timing=timing(source.timing);
          if (weapon.kind === 'melee') for (const [field,bounds] of Object.entries(WEAPON_BOUNDS)) weapon[field] = num(source[field],bounds[0],bounds[1],field,field === 'spinEvery');
          for (const [field,bounds] of Object.entries(ATTACK_BOUNDS)) if(source[field] !== undefined) weapon[field]=num(source[field],bounds[0],bounds[1],field,field==='comboEvery');
          for(const field of ['baseShape','comboShape','chargeShape']) if(source[field]!==undefined) weapon[field]=choice(source[field],weapon.kind==='projectile'?['projectile']:field==='comboShape'?['sector','line','spin']:['sector','line'],field);
          if(source.direction!==undefined) weapon.direction=choice(source.direction,['nearest','facing'],'武器方向');
          if(weapon.id==='candy-hammer') {if(source.comboEvery===undefined) weapon.comboEvery=weapon.spinEvery;weapon.spinEvery=weapon.comboEvery;}
          for (const field of ['comboEnabled','chargeEnabled','dashThrust']) if(source[field] !== undefined) {
            if(typeof source[field] !== 'boolean') fail(field+' 需要開或關');
            weapon[field]=source[field];
          }
        }
      }
      for(const weapon of data.weapons) {
        const source=input.weapons && input.weapons.find(w=>w.id===weapon.id);
        if(source) {
          const compiled=compileWeapon({...weapon,...source,feedback:source.feedback});
          for(const [key,b] of Object.entries(SPECIAL_BOUNDS)) if(compiled[key]!==undefined) weapon[key]=num(compiled[key],b[0],b[1],key,key==='specialCount');
          if(compiled.specialKind!==undefined) weapon.specialKind=choice(compiled.specialKind,[weapon.specialKind],'特殊招種類');
        }
        if(source) weapon.feedback=compileWeapon({...weapon,...source,feedback:source.feedback}).feedback;
        weapon.blocks=weaponStacks(weapon);
        weapon.feedback=Object.fromEntries(weapon.blocks.moves.map(m=>[m.id,m.feedback]));
      }
      // 舊作品缺省補齊；半徑與死區使用遊戲畫面單位。
      if (input.joystick !== undefined) {
        const j = input.joystick;
        if (!j || typeof j.follow !== 'boolean') fail('搖桿跟隨需要開或關');
        data.joystick = { follow: j.follow, radius: num(j.radius, 20, 70, '搖桿半徑'), deadZone: num(j.deadZone, 0, 10, '搖桿死區') };
      }
      if (input.visuals !== undefined) {
        if (!input.visuals || typeof input.visuals.spriteOutline !== 'boolean') fail('角色外框需要開或關');
        data.visuals.spriteOutline = input.visuals.spriteOutline;
      }
      // 舊作品沒有縮圈設定時補預設；只接受有限、溫和的數值。
      if (input.bossZone !== undefined) {
        const z = input.bossZone;
        if (!z || typeof z.enabled !== 'boolean') fail('縮圈需要開或關');
        data.bossZone = { enabled: z.enabled, steps: num(z.steps, 0, 3, '縮圈次數', true), speed: num(z.speed, 10, 160, '縮圈速度'), damage: num(z.damage, 0, 4, '紫霧每秒傷害'),initialRadius:num(z.initialRadius===undefined?600:z.initialRadius,300,1200,'安全圈初始半徑'),finalRadius:num(z.finalRadius===undefined?180:z.finalRadius,100,300,'安全圈最終半徑'),warning:num(z.warning===undefined?4:z.warning,1,8,'縮圈預告秒數') };
      }
      if(data.bossZone.finalRadius>=data.bossZone.initialRadius) fail('最終安全圈需小於初始半徑');
      for (const key of ['elites','chocobear']) {
        // 舊作品沒有此區塊時補預設；輸入值仍逐項驗證。
        if (input[key] === undefined) continue;
        const source = input[key];
        if (!source || typeof source.enabled !== 'boolean') fail(key + ' 需要開或關');
        data[key].enabled = source.enabled;
        for (const [field, bounds] of Object.entries(ENCOUNTER_BOUNDS[key])) {
          data[key][field] = num(source[field], bounds[0], bounds[1], field, ['limit','rewardXp','shieldHits'].includes(field));
        }
        if (key === 'chocobear') data[key].name = name(source.name, '小頭目名稱', 24);
        else {
          if (!Array.isArray(source.abilities) || !source.abilities.length || source.abilities.length > 5 || new Set(source.abilities).size !== source.abilities.length) fail('精英需要 1～5 種不同能力');
          data[key].abilities = source.abilities.map(id => choice(id, Object.keys(ELITE_ABILITIES), '精英能力'));
        }
      }
      for (const key of ['tuning', 'build', 'bossTuning']) {
        if (!input[key] || typeof input[key] !== 'object') fail('缺少 ' + key);
        for (const field of Object.keys(data[key])) {
          const base = data[key][field], value = ['levelupRerolls','dashCharges','dashInvincible','perfectWindow','perfectHeal','perfectShield','perfectSlowSeconds','perfectSlowScale','dashAttackSeconds','dashAttackDamage','dashAttackSize'].includes(field) && input[key][field] === undefined ? base : input[key][field];
          if (typeof base === 'number') {
            const bounds = TUNING_BOUNDS[field] || [base === 0 ? 0 : Math.min(.01, base), Math.max(5, base * 3)];
            data[key][field] = num(value, bounds[0], bounds[1], field, ["levelupRerolls","dashCharges"].includes(field));
          }
          else if (Array.isArray(base)) data[key][field] = base.map((n, i) => num(value && value[i], .4, 10, field));
          else {
            data[key][field].name = name(value && value.name, '流派名稱', 24);
            if (!/^#[0-9a-f]{6}$/i.test(value.color)) fail('流派顏色不正確');
            data[key][field].color = value.color;
          }
        }
      }
      // 新數值缺省補齊；舊作品保留既有卡片／積木，新增卡以 id 補入。
      if (input.schoolRules !== undefined) {
        for (const [field, base] of Object.entries(data.schoolRules)) {
          const bounds = SCHOOL_BOUNDS[field];
          data.schoolRules[field] = num(input.schoolRules[field], bounds[0], bounds[1], field, bounds[2] === 1);
        }
      }
      if (input.neutralRules !== undefined) {
        for (const [field, bounds] of Object.entries(NEUTRAL_BOUNDS)) data.neutralRules[field] = num(input.neutralRules[field] === undefined && field.startsWith('wave') ? data.neutralRules[field] : input.neutralRules[field], bounds[0], bounds[1], field, ['itemsPerRun','bankEvery','cookieKills','crownHealth'].includes(field));
      }
      if (input.schools !== undefined && JSON.stringify(input.schools) !== JSON.stringify(data.schools)) fail('流派登錄表請由資料檔擴充');
      // 物件數量上限固定，避免作品讓裝置卡住；整數欄位不得帶小數。
      for (const field of ['maxUpgradeLevel','enemyLimit','enemyShotLimit','teacherShotCount','teacherShotLimit','projectileLimit','gemLimit','xpToLevel','xpGrowthPerLevel','enemyShootLevel']) data.tuning[field] = num(input.tuning[field], 1, root.SURVIVOR_DEFAULTS.tuning[field], field, true);
      data.build.fieldLimit = num(input.build.fieldLimit, 1, 18, '痕跡上限', true);
      data.bossTuning.hazardLimit = num(input.bossTuning.hazardLimit, 1, 8, '預警上限', true);
      data.build.slowMultiplier = num(input.build.slowMultiplier, .2, 1, '緩速倍率');
      data.build.supportChance = num(input.build.supportChance, 0, 1, '支援卡機率');
      if (!Array.isArray(input.cards) || input.cards.length > data.cards.length || new Set(input.cards.map(c => c.id)).size !== input.cards.length || input.cards.some(c => !data.cards.some(base => base.id === c.id)) || data.cards.slice(0,24).some(c => !input.cards.some(old => old.id === c.id))) fail('卡片數量不正確');
      const savedCards = input.cards;
      input = { ...input, cards: data.cards.map(base => savedCards.find(c => c.id === base.id) || base) };
      const features = new Map(data.cards.map(card => [card.id, card.effects[0].type]));
      data.cards = data.cards.map((base, i) => {
        const c = input.cards[i];
        if (!c || c.id !== base.id) fail('卡片識別碼不正確');
        const result = { ...base, name: name(c.name, '卡片名稱', 24), description: name(c.description, '卡片說明', 120), icon: root.SurvivorIcons.normalize(c.icon, base.icon), maxLevel: num(c.maxLevel, 1, 5, '最高等級', true), slot: choice(c.slot, ['attack','skill','dash','passive'], '欄位') };
        if (c.descriptionSword !== undefined) result.descriptionSword = name(c.descriptionSword, '大劍說明', 120);
        else result.descriptionSword = c.descriptionMelee || c.description;
        if (c.descriptionMelee !== undefined) result.descriptionMelee = name(c.descriptionMelee, '近戰說明', 120);
        if (base.id === 'item-wall' && c.name === '彈牆水球') { result.name=base.name; result.description=base.description; result.descriptionMelee=base.descriptionMelee; }
        if (base.neutral && (c.school || c.tier || c.requires.length)) fail('中立道具不能有流派或前置卡');
        result.school = c.school ? choice(c.school, data.schools.map(s => s.id), '流派') : undefined;
        result.rarity = c.rarity === undefined ? base.rarity : choice(c.rarity, ['common','rare','legendary'], '品質');
        result.tier = c.tier ? choice(c.tier, ['entry','advanced-a','advanced-b','fusion','ultimate'], '階段') : undefined;
        if (!Array.isArray(c.requires) || c.requires.length > 6 || new Set(c.requires).size !== c.requires.length) fail('前置條件不正確');
        result.requires = (c.school && c.rarity === undefined ? [] : c.requires).map(id => { if (id === c.id || !features.has(id)) fail('前置卡不存在或指向自己'); return id; });
        if (!Array.isArray(c.effects) || c.effects.length < 1 || c.effects.length > 3) fail('每卡需要 1～3 個積木');
        result.effects = c.effects.map(effect => {
          if (effect.feature) {
            if (!features.has(effect.feature) || features.get(effect.feature) !== effect.type) fail('既有組合不正確');
            return { type: effect.type, feature: effect.feature, power: num(effect.power, 1, 3, '組合強度', true) };
          }
          const e = { type: choice(effect.type, Object.keys(TYPES), '積木'), trigger: choice(effect.trigger, ['hit','skill','dash','interval','combo'], '觸發時機') };
          if(e.trigger==='combo') e.comboStep=num(effect.comboStep === undefined ? 3 : effect.comboStep,1,10,'第幾下',true);
          if(e.type==='knockback') e.slideSeconds=effect.slideSeconds===undefined?.2:num(effect.slideSeconds,.15,.25,'擊退滑動秒數');
          for (const key of Object.keys(PARAMS)) e[key] = num(effect[key], key === 'distance' && e.type === 'knockback' ? -300 : BOUNDS[key][0], BOUNDS[key][1], key, key === 'count');
          return e;
        });
        return result;
      });
      const visiting = new Set(), visited = new Set();
      function visit(id) {
        if (visiting.has(id)) fail('前置條件不能繞成圈');
        if (visited.has(id)) return;
        visiting.add(id); data.cards.find(c => c.id === id).requires.forEach(visit); visiting.delete(id); visited.add(id);
      }
      data.cards.forEach(c => visit(c.id));
      if (input.pacing !== undefined) {
        data.pacing.pattern=choice(input.pacing.pattern,["alternating","steady"],"波次型態");
        for (const [field,b] of Object.entries(PACING_BOUNDS)) data.pacing[field] = num(input.pacing[field],b[0],b[1],field,['eventCount','shieldHits'].includes(field));
        if (JSON.stringify(input.pacing.themes)!==JSON.stringify(data.pacing.themes) || JSON.stringify(input.pacing.eventPool)!==JSON.stringify(data.pacing.eventPool)) fail('主題與事件池請由資料檔擴充');
      }
      // 舊的兩種怪物作品以穩定 id 補新種類，原本的名稱、行為和攻擊都保留。
      if (!Array.isArray(input.enemies) || input.enemies.length < 2 || input.enemies.length > data.enemies.length || new Set(input.enemies.map(e=>e.id)).size !== input.enemies.length || input.enemies.some(e=>!data.enemies.some(b=>b.id===e.id)) || data.enemies.slice(0,2).some(b=>!input.enemies.some(e=>e.id===b.id))) fail('怪物種類數量不正確');
      input = {...input,enemies:data.enemies.map(b=>input.enemies.find(e=>e.id===b.id)||b)};
      if(input.knockback !== undefined) {
        const k=input.knockback;
        if(!k || typeof k.enabled!=='boolean') fail('重量效果開關格式錯誤');
        data.knockback={enabled:k.enabled,strength:num(k.strength,0,5,'重量影響'),
          bossMass:num(k.bossMass,1,100,'老師重量'),minibossMass:num(k.minibossMass,1,100,'小頭目重量'),
          bossMultiplier:num(k.bossMultiplier,0,1,'老師推拉倍率'),
          slideSeconds:k.slideSeconds===undefined?.2:num(k.slideSeconds,.15,.25,'擊退滑動秒數')};
      }
      if(input.bodySeparation !== undefined) {
        const b=input.bodySeparation;
        if(!b || typeof b.enabled!=='boolean') fail('身體分離開關格式錯誤');
        data.bodySeparation={enabled:b.enabled,radiusScale:num(b.radiusScale,.5,1.5,'身體半徑倍率'),
          playerForce:num(b.playerForce,0,1,'主角與怪物推力'),enemyForce:num(b.enemyForce,0,1,'怪物之間推力')};
      }
      if(input.hitJuice !== undefined) {
        const h=input.hitJuice;
        if(!h || typeof h.enabled !== 'boolean') fail('打擊效果開關格式錯誤');
        data.hitJuice={enabled:h.enabled,intensity:num(h.intensity,0,2,'打擊效果強度')};
      }
      if(input.bodyContact !== undefined) {
        if(typeof input.bodyContact.pushOnly !== 'boolean') fail('碰撞開關格式錯誤');
        data.bodyContact={pushOnly:input.bodyContact.pushOnly,damageScale:num(input.bodyContact.damageScale,0,1,'身體傷害倍率')};
      }
      data.enemies = data.enemies.map((base, i) => {
        const e = compileEnemy(input.enemies[i]); if (!e || e.id !== base.id) fail('怪物識別碼不正確');
        const result = { ...base, name: name(e.name, '怪物名稱', 24), hp: num(e.hp, 10, 500, '血量'), speed: num(e.speed, 0, 170, '移速'), radius: num(e.radius, 10, 35, '大小'), damage: num(e.damage, 0, 40, '碰撞傷害'), behavior: choice(e.behavior, Object.keys(BEHAVIORS), '移動方式') };
        // 舊作品沒有造型欄位時，依原種類補上；保留名稱、能力與數值。
        result.spriteId = e.spriteId === undefined ? base.spriteId : choice(e.spriteId, root.SurvivorMonsters.ids, '怪物造型');
        result.mass = e.mass === undefined ? (e.behavior==='tank'?8:1) : num(e.mass,1,100,'重量');
        result.shadowSize = e.shadowSize === undefined ? .9 : num(e.shadowSize, .3, 1.8, '影子寬度倍率');
        const a = e.attack;
        result.attack = { type: choice(a.type, ['none','projectile','aoe','summon'], '怪物攻擊'), interval: num(a.interval, 1, 15, '攻擊間隔'), speed: num(a.speed, 50, 200, '國字速度'), damage: num(a.damage, 0, 30, '攻擊傷害'), radius: num(a.radius, 10, 100, '攻擊大小'), count: num(a.count, 1, 5, '攻擊數量', true), spread: num(a.spread, 0, .6, '散射角度'), level: num(a.level, 2, 20, '開始攻擊等級', true) };
        if(e.phaseAttack !== undefined) {
          const a=e.phaseAttack;
          if(!a || typeof a.enabled!=='boolean' || typeof a.radial!=='boolean') fail('分階段攻擊開關格式錯誤');
          result.phaseAttack={enabled:a.enabled,radial:a.radial,shape:choice(a.shape,Object.keys(PHASE_SHAPES),'攻擊形狀')};
          for(const [key,b] of Object.entries(PHASE_BOUNDS)) result.phaseAttack[key]=num(a[key],b[0],b[1],key,key==='count');
          result.phaseAttack.timing=timing(a.timing || a,Object.fromEntries(Object.keys(TIMING_BOUNDS).map(k=>[k,PHASE_BOUNDS[k]])));
          Object.assign(result.phaseAttack,result.phaseAttack.timing);
          if(a.shape==='ring' && a.innerRadius>=a.radius) fail('圓環內圈需小於外圈');
        }
        if(!result.phaseAttack.timing) result.phaseAttack.timing=timing(result.phaseAttack,Object.fromEntries(Object.keys(TIMING_BOUNDS).map(k=>[k,PHASE_BOUNDS[k]])));
        result.feedback=e.feedback;
        result.blocks=enemyStacks(result);
        result.feedback=Object.fromEntries(result.blocks.moves.map(m=>[m.id,m.feedback]));
        result.phaseAttack.feedback=result.feedback.phase;
        return result;
      });
      if(input.gallery !== undefined) {
        const base=data.gallery;
        if(!input.gallery || typeof input.gallery!=='object' || Array.isArray(input.gallery))fail('王的試煉資料格式錯誤');
        const g={...input.gallery},legacy=g.schemaVersion===1;
        if(![1,2].includes(g.schemaVersion) || !Array.isArray(g.bosses))fail('王的試煉資料格式錯誤');
        if(legacy)g.arenaRadius=Math.max(200,Math.min(300,num(g.arenaRadius,420,1200,'舊競技場半徑')*200/620));
        // 歷史名單按 ID 遷移，不把陣列順序當身份，也不以任意缺項冒充舊存檔。
        const known=new Set(base.bosses.map(b=>b.id)),saved=new Map();
        for(const b of g.bosses){
          if(!b || typeof b!=='object' || Array.isArray(b) || !known.has(b.id) || saved.has(b.id))fail('試煉魔王識別錯誤');
          saved.set(b.id,b);
        }
        const historical=[['gatekeeper'],['gatekeeper','frostfire','winged'],['gatekeeper','frostfire','winged','assassin'],['gatekeeper','frostfire','winged','assassin','stone-hands'],['gatekeeper','frostfire','winged','assassin','stone-hands','rolling-eye']];
        const complete=saved.size===known.size;
        const recognized=historical.some(ids=>ids.length===saved.size&&ids.every(id=>known.has(id)&&saved.has(id)));
        if(!complete&&!recognized)fail('試煉魔王名單不完整');
        // 只有缺少的新預設才補入；既有值仍走下方嚴格驗證，不用預設掩蓋壞值。
        g.bosses=base.bosses.map(b=>saved.has(b.id)?saved.get(b.id):copy(b));
        const result={schemaVersion:2};
        for(const [k,lo,hi] of [['arenaRadius',200,300],['entrySeconds',1,5],['wallStun',1,5],['hazardLimit',1,32],['summonLimit',1,16]]) result[k]=num(g[k],lo,hi,k,k.endsWith('Limit'));
        const h=g.hazard;if(!h)fail('地面危險區資料缺少');
        result.hazard={kind:choice(h.kind,['poison','ice','fire'],'危險區種類')};
        for(const [k,lo,hi] of [['radius',20,200],['duration',.1,15],['interval',.1,3],['damage',0,40],['slow',.2,1]])result.hazard[k]=num(h[k],lo,hi,k);
        result.bosses=g.bosses.map((b,i)=>{
          const original=base.bosses[i];if(!b || b.id!==original.id || b.artId!==original.artId || !Array.isArray(b.moves) || b.moves.length!==original.moves.length || !Array.isArray(b.phases) || b.phases.length!==2)fail('試煉魔王識別錯誤');
          const boss={id:b.id,artId:b.artId,name:name(b.name,'試煉魔王',24),hp:num(b.hp,500,5000,'試煉血量'),radius:num(b.radius,20,50,'試煉大小'),speed:num(b.speed,0,200,'試煉移速')};
          boss.phases=b.phases.map((p,i)=>({threshold:num(p.threshold,i===0?1:.05,i===0?1:.95,'階段門檻'),speed:num(p.speed,.5,2,'階段加速')}));
          boss.moves=b.moves.map((m,j)=>{
            const originalMove=original.moves[j],s=m.blocks && m.blocks.moves && m.blocks.moves[0];
            if(m.id!==originalMove.id || !s || m.blocks.version!==1 || m.blocks.moves.length!==1 || s.id!=='move' || !s.trigger || s.trigger.event!=='onSelect' || s.shape.type!==originalMove.blocks.moves[0].shape.type || !s.feedback || s.feedback.pose!==m.id || s.feedback.warning!=='ground' || s.feedback.level!=='medium' || !s.effect)fail('試煉招式積木錯誤');
            const timing={};for(const [k,lo,hi] of [['windup',.6,3],['active',.1,4],['recovery',.2,3],['cooldown',.1,8]])timing[k]=num(s.timing[k],lo,hi,k);
            const a=m.ai===undefined||(legacy&&m.ai.minDistance===0&&m.ai.maxDistance===10000)?originalMove.ai:m.ai;
            if(!a)fail('試煉 AI 規則缺少');
            const ai={minDistance:num(a.minDistance,0,10000,'AI 最近距離'),maxDistance:num(a.maxDistance,0,10000,'AI 最遠距離'),angleWeight:num(a.angleWeight,0,10,'AI 朝向加權'),phaseWeight:num(a.phaseWeight,0,10,'AI 階段加權'),offscreen:typeof a.offscreen==='boolean'?a.offscreen:fail('AI 畫面外規則需為開關')};
            if(ai.minDistance>ai.maxDistance)fail('AI 最近距離不可大於最遠距離');
            return {id:m.id,ai,name:name(m.name,'試煉招式',24),minPhase:legacy&&b.id==='gatekeeper'&&m.id==='charge'?1:num(m.minPhase,1,2,'開始階段',true),weight:num(m.weight,0,100,'選招權重'),blocks:{version:1,moves:[{id:'move',trigger:{event:'onSelect'},shape:{type:s.shape.type,radius:num(s.shape.radius,30,200,'招式範圍'),angle:num(s.shape.angle,0,360,'扇形角度'),...(originalMove.blocks.moves[0].shape.thickness!==undefined?{thickness:num(s.shape.thickness,2,40,'環或光束半寬')}:{})},timing,effect:{damage:num(s.effect.damage,0,40,'傷害'),speed:num(s.effect.speed,0,600,'速度'),...trialEffects(s.effect,originalMove.blocks.moves[0].effect,timing),...(originalMove.blocks.moves[0].effect.duration!==undefined?{duration:num(s.effect.duration,.1,10,'危險區／彈幕壽命'),interval:num(s.effect.interval,.1,3,'生成間隔'),count:num(s.effect.count,1,32,'羽毛數量',true),slow:num(s.effect.slow,.2,1,'冰面剩餘速度'),rotation:num(s.effect.rotation,0,6,'旋轉速度')}:{})},feedback:{...originalMove.blocks.moves[0].feedback}}]}};
          });
          const config=weakpoint(b.weakpoint,original.weakpoint,boss.moves.map(m=>m.id));
          if(config!==undefined)boss.weakpoint=config;
          const grid=boss.moves.find(m=>m.blocks.moves[0].effect.gridRoll),beam=boss.moves.find(m=>m.blocks.moves[0].effect.beam);
          if(grid){
            if(!beam||!config||config.parts.length!==1)fail('翻滾眼需保留光束與單一眼部弱點');
            if(grid.weight!==1||grid.minPhase!==1||grid.ai.minDistance!==0||grid.ai.maxDistance<600)fail('格步翻滾為必要移動，不能停用或限制可達距離');
            if(![0,1].includes(beam.weight))fail('光束啟用需為 0 或 1');
            const part=config.parts[0],timing=beam.blocks.moves[0].timing;
            if(part.id!=='eye'||part.anchor!=='weakpoint'||part.requiresMatch!==true||part.conditions.length!==1||part.conditions[0].type!=='beam-active')fail('眼部條件需與實際光束階段一致');
            if(config.warning+.1>timing.windup||part.duration<timing.windup+timing.active)fail('光束需先完成眼部開啟預警，眼部顯露時間需覆蓋出手');
          }
          if(b.id==='mask-statue'){
            const charge=boss.moves[0],part=config&&config.parts[0];
            if(boss.moves.length!==1||charge.id!=='charge'||charge.weight!==1||charge.minPhase!==1||!charge.ai.offscreen||charge.blocks.moves[0].effect.speed<300||!charge.blocks.moves[0].effect.charge?.wallStun)fail('面具石像需保留畫面外選招的直線衝撞');
            if(!config||config.armorMultiplier>.2||!part||part.id!=='back'||part.angleDegrees!==180||part.arcDegrees>140||part.mode!=='all'||part.requiresMatch!==true||!part.conditions.some(c=>c.type==='behind')||!part.conditions.some(c=>c.type==='wall-stun'))fail('面具石像背後弱點需只在背後且撞牆暈眩時開啟');
          }
          return boss;
        });data.gallery=result;
      }
      const b = { ...input.boss };
      data.boss.weakpoint=weakpoint(b.weakpoint,data.boss.weakpoint,data.boss.moves.map(m=>m.id));
      for(const [key,bounds] of Object.entries(POSTURE_BOUNDS)) data.boss.posture[key]=num(b.posture&&b.posture[key]!==undefined?b.posture[key]:data.boss.posture[key],bounds[0],bounds[1],key);
      data.boss.name = name(b.name, '魔王名稱', 24); data.boss.hp = num(b.hp, 500, 5000, '魔王血量'); data.boss.speed = num(b.speed, 0, 200, '魔王速度'); data.boss.radius = num(b.radius, 20, 50, '魔王大小');
      for(const [key,bounds] of Object.entries(BOSS_COMBAT_BOUNDS)) data.boss.combat[key]=num(b.combat&&b.combat[key]!==undefined?b.combat[key]:data.boss.combat[key],bounds[0],bounds[1],key);
      if (!Array.isArray(b.phases) || b.phases.length !== 3) fail('需要三個魔王階段');
      data.boss.phases = b.phases.map((p, i) => ({ speed:num(p.speed===undefined?b.speed:p.speed,0,200,'階段移速'),threshold: num(p.threshold, i === 0 ? 1 : .05, i === 0 ? 1 : .95, '階段血量比例'), rest: num(p.rest, .4, 8, '招式休息'), combo: p.combo === null ? null : choice(p.combo, data.boss.moves.map(m => m.id), '合招') }));
      if (data.boss.phases.some((p, i, rows) => i && p.threshold >= rows[i - 1].threshold)) fail('魔王階段血量比例必須遞減');
      if (Array.isArray(b.moves)) {
        const optional=['chalk-wall','shrinking-ring','podium-leap','chalk-snipe','board-barriers','eraser-combo','tracking-call'];
        if(new Set(b.moves.map(m=>m.id)).size!==b.moves.length || b.moves.some(m=>!data.boss.moves.some(base=>base.id===m.id))) fail('招式識別碼不正確');
        b.moves=data.boss.moves.map(base=>b.moves.find(m=>m.id===base.id) || (optional.includes(base.id)?base:null));
      }
      if (!Array.isArray(b.moves) || b.moves.length !== data.boss.moves.length) fail('魔王招式數量不正確');
      data.boss.moves = data.boss.moves.map((base, i) => {
        const m = compileBossMove(b.moves[i]); if (!m || m.id !== base.id) fail('招式識別碼不正確');
        const result = { ...base, name: name(m.name, '招式名稱', 24), kind: choice(m.kind, Object.keys(KINDS), '招式積木'), minPhase: num(m.minPhase, 1, 3, '開始階段', true), phaseCount: num(m.phaseCount, 0, 1, '每階段增加數量', true) };
        for (const key of ['warning','damage','speed','count','spread','radius','duration','pulse','gap','distance']) result[key] = num(m[key], BOSS_MOVE_BOUNDS[key][0], BOSS_MOVE_BOUNDS[key][1], key, key === 'count');
        for(const key of ['recovery','cooldown']) result[key]=num(m[key]===undefined?0:m[key],...BOSS_MOVE_BOUNDS[key].slice(0,2),key);
        result.feedback=m.feedback;
        result.blocks=bossStacks(result);
        result.feedback=Object.fromEntries(result.blocks.moves.map(m=>[m.id,m.feedback]));
        return result;
      });
      const ai=b.ai || {rules:bossAIRules(data.boss)};
      if(!Array.isArray(ai.rules) || !ai.rules.length || ai.rules.length>64) fail('AI 招式清單需有 1～64 招');
      if(new Set(ai.rules.map(r=>r.moveId)).size!==ai.rules.length) fail('AI 招式不可重複');
      data.boss.ai={rules:ai.rules.map(r=>({moveId:choice(r.moveId,data.boss.moves.map(m=>m.id),'AI 招式'),
        weight:num(r.weight,0,100,'AI 權重'), minDistance:num(r.minDistance,0,10000,'AI 最近距離'),maxDistance:num(r.maxDistance,0,10000,'AI 最遠距離'),
        angleWeight:num(r.angleWeight,0,10,'AI 朝向權重'),phaseWeight:num(r.phaseWeight,0,10,'AI 階段權重'),
        offscreen:typeof r.offscreen==='boolean'?r.offscreen:fail('AI 畫面外規則需為開關')}))};
      if(data.boss.ai.rules.some(r=>r.minDistance>r.maxDistance)) fail('AI 最近距離不可大於最遠距離');
      // 舊波次保留全部數字；新積木編譯出的生怪欄位交給同一接合層。
      if(input.stages!==undefined) {
        if(!Array.isArray(input.stages)||input.stages.length!==data.stages.length) fail('關卡數量不正確');
        data.stages=data.stages.map((base,i)=>{
          const stage=input.stages[i];if(!stage||stage.id!==base.id||!Array.isArray(stage.waves)||stage.waves.length!==base.waves.length) fail('波次數量不正確');
          const metadata={...stage};delete metadata.waves;delete metadata.decorationDensity;
          const expected={...base};delete expected.waves;delete expected.decorationDensity;
          if(stage.id==='classroom' && metadata.name==='教室' && metadata.background==='classroom') {metadata.name=base.name;metadata.background=base.background;}
          if(stage.id==='playground' && metadata.name==='操場' && metadata.background==='playground') {metadata.name=base.name;metadata.background=base.background;}
          if(JSON.stringify(metadata)!==JSON.stringify(expected)) fail('關卡背景與倍率請沿用原設定');
          const result={...base,decorationDensity:stage.decorationDensity===undefined?base.decorationDensity:num(stage.decorationDensity,0,1,'裝飾密度')};
          result.waves=stage.waves.map((w,j)=>{
            const row={...base.waves[j],start:num(w.start,0,300,'波次開始'),every:num(w.every,.3,5,'出怪間隔秒數'),jaben:num(w.jaben,0,1,'甲本比例'),otsubon:num(w.otsubon,0,1,'乙本比例')};
            if(input.waveBlocks) for(const key of ['typeId','count','position','sound','hint']) row[key]=w[key];
            return row;
          });
          if(result.waves[0].start!==0||result.waves.some((w,j)=>j&&w.start<=result.waves[j-1].start)) fail('波次時間需從 0 秒遞增');
          return result;
        });
      }
      if (JSON.stringify(input.waves) !== JSON.stringify(data.waves)) fail('請編輯各關卡的波次積木');
      // 所有作品（含舊存檔）輸出統一積木；編譯後再驗證節奏／遭遇數值。
      if(input.waveBlocks) data.waveBlocks=copy(input.waveBlocks);
      else data.waveBlocks=waveStacks(data);
      const compiled=compileWaves(data);
      for(const key of ['stages','pacing','waveEvents','elites','chocobear']) data[key]=compiled[key];
    } catch (error) { errors.push(error.message); }
    return { valid: errors.length === 0, data: errors.length ? defaults() : data, errors };
  }
  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return validate(defaults());
      if (raw.length > 150000) throw new Error('作品資料太大');
      const saved = JSON.parse(raw);
      // 舊版 auto 是預設，沒有選擇紀錄時改用手動；不改動其他作品內容。
      if (saved && saved.attackMode === 'auto' && saved.attackModeChosen !== true) saved.attackMode = 'manual';
      return validate(saved);
    } catch (_) { return { valid: false, data: defaults(), errors: ['無法讀取作品，已使用預設'] }; }
  }
  function save(input) {
    const result = validate(input);
    if (result.valid) { try { localStorage.setItem(KEY, JSON.stringify(result.data)); } catch (_) { result.valid = false; result.errors.push('這台裝置無法儲存，請允許本機儲存後再試'); } }
    return result;
  }
  root.SurvivorData = { WEAKPOINT_BOUNDS, WEAKPOINT_CONDITIONS, bossAIRules, POSTURE_BOUNDS, waveDefinitions, waveStacks, compileWaves, WAVE_POSITIONS, BOSS_MOVE_BOUNDS, BOSS_COMBAT_BOUNDS, FEEDBACK_TIERS, FEEDBACK_BOUNDS, WARNING_STYLES, FEEDBACK_SOUNDS, feedback, KEY, BLOCK_PARTS, ENEMY_STACKS, BOSS_STACKS, enemyStacks, bossStacks, compileEnemy, compileBossMove, SPECIAL_BOUNDS, WEAPON_STACKS, weaponStacks, compileWeapon, TIMING_BOUNDS, PLAYER_BOUNDS, PLAYER_LABELS, playerDefaults, normalizePlayer, PHASE_BOUNDS, PHASE_SHAPES, TYPES, KINDS, BOUNDS, WEAPON_BOUNDS, ATTACK_BOUNDS, TUNING_BOUNDS, PACING_BOUNDS, BEHAVIORS, NEUTRAL_BOUNDS, SCHOOL_BOUNDS, ENCOUNTER_BOUNDS, ELITE_ABILITIES, PARAMS, defaults, validate, load, save, copy };
})(globalThis);
