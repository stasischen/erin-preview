// 純資料規則 v1：秒、相對世界座標；不讀全域遊戲狀態或繪圖物件。
globalThis.SurvivorEffectBlocks = (() => {
  // ✏️ Erin 可以改的地方：在這裡重組已支援的觸發、條件、動作與修飾。
  const recipes = [
    {feature:'thunder-static', rules:[{id:'thunder-static', trigger:'onTimer',
      interval:{ref:'schoolRules.staticSeconds'},
      conditions:[{type:'touching', padding:3}],
      actions:[{type:'cue', cue:'lightning'}, {type:'damage', amount:{ref:'schoolRules.staticDamage'}}]}]},
    {feature:'item-crown', modifiers:[
      {stat:'neutralDamageMultiplier', op:'multiply', value:{op:'add',args:[1,{ref:'neutralRules.crownDamage'}]}},
      {stat:'maxHealth', op:'subtract', value:{ref:'neutralRules.crownHealth'}}
    ]}
  ];
  const ref = name => ({ref:name}), arg = name => ({input:name});
  const op = (name,...args) => ({op:name,args});
  // 共用拼圖：保留 feature id 作舊作品的穩定連結，所有數值在作品內共用。
  recipes.push(
    {feature:'thunder-attack',rules:[{trigger:'onChain',actions:[{type:'chain',
      radius:op('multiply',ref('build.chainRadius'),op('add',1,op('multiply',arg('transformed'),ref('schoolRules.thunderFormRange')))),
      count:1, multiplier:op('multiply',ref('build.chainDamage'),op('add',1,op('multiply',op('max',0,op('subtract',arg('level'),1)),ref('build.chainGrowth'))))}]}]},
    {feature:'thunder-super',rules:[{trigger:'onChain',actions:[{type:'chain-modifier',extra:ref('schoolRules.superconductorJumps'),multiplier:1}]}]},
    {feature:'thunder-skill',rules:[{trigger:'onSkillBlast',conditions:[{type:'radius',radius:arg('radius'),includeTargetRadius:true}],actions:[
      {type:'stun',duration:op('multiply',ref('build.stunSeconds'),arg('level'))},
      {type:'damage',amount:op('multiply',arg('damage'),ref('build.skillDamageMultiplier'),arg('level'))}]}]},
    {feature:'thunder-counter',rules:[{trigger:'onHurt',conditions:[{type:'radius',radius:ref('build.counterRadius'),strict:true}],actions:[
      {type:'damage',amount:op('multiply',arg('level'),ref('build.counterDamage'))}]}]},
    {feature:'thunder-ultimate',rules:[{trigger:'onUltimate',interval:ref('build.cloudSeconds'),conditions:[{type:'randomTarget',count:1}],actions:[
      {type:'damage',amount:op('multiply',ref('build.ultimateDamage'),op('add',1,op('multiply',op('subtract',arg('level'),1),ref('build.ultimateGrowth'))))}]}]},
    {feature:'fusion-dash',rules:[{trigger:'onDashTrail',actions:[{type:'field',school:'thunder',spacing:ref('build.trailSpacing'),radius:ref('build.fieldRadius'),
      radiusGrowth:ref('build.fieldRadiusGrowth'),seconds:ref('build.fieldSeconds'),interval:ref('build.fieldInterval'),limit:ref('build.fieldLimit'),
      damage:op('multiply',ref('build.fieldDamage'),op('max',1,arg('level')))}]}]},
    {feature:'thunder-charge',rules:[{trigger:'onShot',conditions:[{type:'killThreshold',every:ref('schoolRules.chargeKills')}],actions:[
      {type:'charged',multiplier:ref('schoolRules.chargeDamage')}]}]},
    {feature:'thunder-rod',rules:[{trigger:'onSummonTimer',interval:ref('schoolRules.rodSeconds'),actions:[{type:'summon',limit:3,seconds:ref('schoolRules.rodDuration'),
      interval:ref('schoolRules.rodTick'),radius:ref('schoolRules.rodRadius'),damage:ref('schoolRules.rodDamage')}]}]},
    {feature:'thunder-step',rules:[{trigger:'onDashCross',conditions:[{type:'segmentTouching'}],actions:[{type:'stun',duration:ref('schoolRules.thunderStepStun')}]}]}
  );
  // 水流派沿用舊卡 id、場地生命週期及事件順序；公式只在這份共用資料定義。
  const waterField = {type:'field',school:'water',spacing:ref('build.trailSpacing'),radius:ref('build.fieldRadius'),
    radiusGrowth:ref('build.fieldRadiusGrowth'),seconds:ref('build.fieldSeconds'),interval:ref('build.fieldInterval'),limit:ref('build.fieldLimit')};
  const waterTick={trigger:'onFieldTick',actions:[
    {type:'damage',amount:op('multiply',ref('build.fieldDamage'),op('max',1,arg('level')))},
    {type:'wet',duration:ref('schoolRules.wetSeconds')},{type:'slow',duration:ref('build.slowSeconds'),multiplier:0}]};
  recipes.push(
    {feature:'water-attack',rules:[{trigger:'onWaterHit',conditions:[{type:'radius',strict:true,
      radius:op('add',ref('tuning.splashBaseRadius'),op('multiply',arg('level'),ref('tuning.splashPerLevel')))}],actions:[
      {type:'damage',amount:op('multiply',arg('damage'),op('add',ref('build.splashDamageBase'),op('multiply',arg('level'),ref('build.splashDamageGrowth'))))}]}]},
    {feature:'water-skill',rules:[
      {trigger:'onWaterHit',actions:[waterField]}, {trigger:'onSkillBlast',actions:[waterField]},
      {trigger:'onShotHit',actions:[{type:'wet',duration:ref('schoolRules.wetSeconds')}]},
      waterTick]},
    {feature:'water-dash',rules:[{trigger:'onDashTrail',actions:[waterField]},waterTick]},
    {feature:'fusion-puddle',rules:[{trigger:'onWaterHit',actions:[waterField]},
      {trigger:'onFieldTick',actions:[{type:'damage',amount:op('multiply',ref('build.fieldDamage'),arg('level'))}]}]},
    {feature:'water-ultimate',rules:[{trigger:'onUltimate',interval:ref('build.ultimateSeconds'),actions:[
      {type:'damage',amount:op('multiply',ref('build.ultimateDamage'),op('add',1,op('multiply',op('subtract',arg('level'),1),ref('build.ultimateGrowth'))))}]}]},
    {feature:'water-drop',rules:[{trigger:'onShot',conditions:[{type:'shotMultiple',every:ref('schoolRules.bigDropEvery')}],actions:[
      {type:'big-drop',size:ref('schoolRules.bigDropSize'),damage:ref('schoolRules.bigDropDamage'),push:ref('schoolRules.bigDropPush')}]}]},
    {feature:'water-fountain',rules:[{trigger:'onPulse',interval:ref('schoolRules.fountainSeconds'),conditions:[{type:'radius',radius:ref('schoolRules.fountainRadius')}],actions:[
      {type:'push',distance:ref('schoolRules.fountainPush')},{type:'wet',duration:ref('schoolRules.wetSeconds')}]}]},
    {feature:'water-bubble',rules:[{trigger:'onDashEnd',actions:[{type:'bubble',active:true}]},
      {trigger:'onHurt',conditions:[{type:'positiveDamage'},{type:'bubbleActive'}],actions:[{type:'absorb',damage:0,active:false}]}]},
    {feature:'water-wet',rules:[{trigger:'onDamage',conditions:[{type:'wetTarget'}],actions:[
      {type:'damage-multiplier',multiplier:op('add',1,ref('schoolRules.wetDamage'))}]}]},
    {feature:'water-rain',rules:[{trigger:'onPulse',interval:ref('schoolRules.rainSeconds'),actions:[
      {type:'rain',duration:ref('schoolRules.rainDuration'),cueRadius:ref('schoolRules.fountainRadius')},
      {type:'slow',duration:ref('schoolRules.rainDuration'),multiplier:0},{type:'wet',duration:ref('schoolRules.wetSeconds')}]},
      {trigger:'onRainTick',actions:[{type:'slow',duration:op('multiply',arg('dt'),2),multiplier:0},
        {type:'wet',duration:ref('schoolRules.wetSeconds')}]}]}
  );
  // 風卡：原事件負責生命週期，積木描述公式、範圍與動作；舊作品不用改格式。
  const windField={...waterField,school:'wind',damage:op('multiply',ref('build.fieldDamage'),op('max',1,arg('level')))};
  recipes.push(
    {feature:'wind-attack',rules:[{trigger:'onShot',actions:[{type:'attack-multiplier',multiplier:op('add',1,op('multiply',arg('level'),ref('build.windSpeed')))}]}]},
    {feature:'wind-speed',rules:[{trigger:'onShot',actions:[{type:'rate-multiplier',multiplier:op('add',1,op('multiply',arg('moving'),arg('level'),ref('build.movingRate')))}]}]},
    {feature:'wind-dash',rules:[{trigger:'onDashTrail',actions:[windField]},
      {trigger:'onFieldTick',actions:[{type:'push',distance:op('multiply',ref('build.pushDistance'),op('max',1,arg('level')))}]},
      {trigger:'onSkillBlast',conditions:[{type:'radius',includeTargetRadius:true,radius:op('multiply',arg('radius'),ref('build.skillRadiusMultiplier'))}],actions:[{type:'push',distance:op('multiply',-1,ref('build.pullDistance'))}]}]},
    {feature:'fusion-storm',rules:[{trigger:'onDashTrail',actions:[waterField,windField]}]},
    {feature:'wind-ultimate',rules:[{trigger:'onUltimate',interval:ref('build.tornadoTick'),
      conditions:[{type:'radius',strict:true,includeTargetRadius:true,radius:ref('build.fieldRadius')}],actions:[
      {type:'damage',amount:op('multiply',ref('build.ultimateDamage'),op('add',1,op('multiply',op('subtract',arg('level'),1),ref('build.ultimateGrowth'))))},
      {type:'orbit',radius:ref('build.tornadoRadius'),speed:ref('build.tornadoSpeed')}]}]},
    {feature:'wind-blade',rules:[{trigger:'onShot',actions:[{type:'pierce',count:1}]},
      {trigger:'onShotHit',conditions:[{type:'bladeEligible'},{type:'radius',radius:ref('schoolRules.windBladeRange')}],actions:[
        {type:'blade',multiplier:ref('schoolRules.windBladeDamage'),range:ref('schoolRules.windBladeRange')}]},
      {trigger:'onMeleeHit',conditions:[{type:'radius',radius:ref('schoolRules.windBladeRange')}],actions:[
        {type:'blade',multiplier:ref('schoolRules.windBladeDamage')}]}]},
    {feature:'wind-gust',rules:[{trigger:'onPulse',interval:ref('schoolRules.gustSeconds'),conditions:[{type:'radius',radius:ref('schoolRules.gustRadius')}],actions:[{type:'push',distance:ref('schoolRules.gustPush')}]}]},
    {feature:'wind-refund',rules:[{trigger:'onDashEnd',actions:[{type:'refund',fraction:ref('schoolRules.refundCharge')}]}]},
    {feature:'wind-light',rules:[{trigger:'onMove',actions:[{type:'move-multiplier',multiplier:op('add',1,op('multiply',arg('level'),ref('schoolRules.lightSpeed')))}]},
      {trigger:'onPickup',actions:[{type:'pickup-multiplier',multiplier:op('add',1,op('multiply',arg('level'),ref('schoolRules.lightMagnet')))}]}]},
    {feature:'wind-eye',rules:[{trigger:'onStill',conditions:[{type:'still',seconds:ref('schoolRules.eyeWait')}],actions:[{type:'wall',radius:ref('schoolRules.eyeRadius')}]},
      {trigger:'onWallTick',conditions:[{type:'radius',strict:true,includeTargetRadius:true,radius:ref('schoolRules.eyeRadius')}],actions:[{type:'push',distance:op('multiply',ref('schoolRules.eyePush'),arg('dt'))}]},
      {trigger:'onEnemyShot',conditions:[{type:'radius',strict:true,includeTargetRadius:true,radius:ref('schoolRules.eyeRadius')}],actions:[{type:'block-shot'}]}]}
  );
  // 支援卡沿用原事件順序，等級由舊 feature/power 合併封頂後傳入。
  recipes.push(
    {feature:'big-water',rules:[{trigger:'onShot',actions:[
      {type:'size-multiplier',multiplier:op('add',1,op('multiply',arg('level'),ref('tuning.waterSizePerLevel')))},
      {type:'damage-multiplier',multiplier:op('add',1,op('multiply',arg('level'),ref('tuning.damagePerLevel')))}]}]},
    {feature:'rapid-water',rules:[{trigger:'onShot',actions:[{type:'interval-multiplier',multiplier:op('subtract',1,op('multiply',arg('level'),ref('tuning.fireRateReduction')))}]}]},
    {feature:'multi-water',rules:[{trigger:'onShot',actions:[{type:'spread',count:op('add',1,arg('level')),angle:ref('tuning.extraShotAngle'),extraArc:op('multiply',arg('level'),ref('tuning.extraShotAngle'))}]}]},
    {feature:'onion-dash',rules:[{trigger:'onMove',actions:[{type:'move-multiplier',multiplier:op('add',1,op('multiply',arg('level'),ref('tuning.moveSpeedPerLevel')))}]}]},
    {feature:'bubble-shield',rules:[{trigger:'onHealth',actions:[{type:'health',amount:op('multiply',arg('level'),op('ceil',op('divide',ref('tuning.playerHealth'),ref('build.shieldHealthDivisor'))))}]},
      {trigger:'onUpgrade',actions:[{type:'heal',amount:op('ceil',op('divide',ref('tuning.playerHealth'),ref('build.shieldHealthDivisor')))}]}]},
    {feature:'gem-magnet',rules:[{trigger:'onPickup',actions:[{type:'pickup-multiplier',multiplier:op('add',1,op('multiply',arg('level'),ref('tuning.magnetPerLevel')))}]}]},
    {feature:'piercing-water',rules:[{trigger:'onShot',actions:[{type:'pierce',count:arg('level'),size:op('add',1,op('multiply',arg('level'),.1))}]}]},
    {feature:'splash-water',rules:[{trigger:'onShotHit',conditions:[{type:'radius',strict:true,radius:op('add',ref('tuning.splashBaseRadius'),op('multiply',arg('level'),ref('tuning.splashPerLevel')))}],actions:[{type:'damage',amount:op('multiply',arg('damage'),ref('build.supportSplashDamage'))}]}]},
    {feature:'auto-heal',rules:[{trigger:'onHealTick',interval:op('multiply',ref('tuning.autoHealSeconds'),op('power',ref('build.healIntervalMultiplier'),op('subtract',arg('level'),1))),conditions:[{type:'healthMissing'}],actions:[{type:'heal',amount:1}]}]}
  );
  // 中立道具：保留一次掛載、原有次序及世界單位，亂數／計數由事件傳入。
  const nr = key => ref('neutralRules.'+key);
  const bankBonus = op('min',nr('bankCap'),op('multiply',op('floor',op('divide',arg('gems'),nr('bankEvery'))),nr('bankStep')));
  // 王冠沿用已完成的 modifier；積木檢視直接共用同一份公式。
  const crown=recipes.find(r=>r.feature==='item-crown');
  crown.rules=[
    {trigger:'onDamage',actions:[{type:'damage-multiplier',multiplier:crown.modifiers[0].value}]},
    {trigger:'onHealth',actions:[{type:'health-cost',amount:crown.modifiers[1].value}]}];
  recipes.push(
    {feature:'item-wall',rules:[{trigger:'onWaveHit',conditions:[{type:'waveEligible'}],actions:[
      {type:'push',distance:nr('wavePush')},{type:'collision-damage',amount:nr('waveDamage'),cooldown:nr('waveCooldown')}]}]},
    {feature:'item-candy',rules:[{trigger:'onDeath',conditions:[{type:'chance',probability:nr('bombChance')}],actions:[
      {type:'bomb-drop',delay:nr('bombDelay'),limit:12}]},
      {trigger:'onBombDue',conditions:[{type:'radius',includeTargetRadius:true,radius:nr('bombRadius')}],actions:[{type:'damage',amount:nr('bombDamage')}]}]},
    {feature:'item-bird',rules:[{trigger:'onBirdTick',interval:nr('birdSeconds'),conditions:[{type:'radius',includeTargetRadius:true,radius:nr('birdReach')}],actions:[
      {type:'orbit',radius:nr('birdRadius'),speed:2.5},{type:'damage',amount:nr('birdDamage')}]}]},
    {feature:'item-bank',rules:[{trigger:'onPickup',conditions:[{type:'countMultiple',every:nr('bankEvery')}],actions:[{type:'bank-count',amount:1,bonus:bankBonus}]},
      {trigger:'onDamage',actions:[{type:'damage-multiplier',multiplier:op('add',1,bankBonus)}]}]},
    {feature:'item-split',rules:[{trigger:'onShotHit',conditions:[{type:'splitEligible'}],actions:[{type:'split',count:2,angle:nr('splitAngle'),multiplier:nr('splitDamage')}]}]},
    {feature:'item-magnet',rules:[{trigger:'onPickup',actions:[{type:'pickup-multiplier',multiplier:nr('magnetMultiplier')}]}]},
    {feature:'item-clover',rules:[{trigger:'onAcquire',conditions:[{type:'firstClover'}],actions:[{type:'reroll',amount:1}]},
      {trigger:'onOffer',actions:[{type:'rare-multiplier',multiplier:nr('luckyRareMultiplier')}]}]},
    {feature:'item-rear',rules:[{trigger:'onShot',conditions:[{type:'volleyPresent'}],actions:[{type:'rear-shot',count:1,angle:Math.PI,multiplier:1}]}]},
    {feature:'item-cookie',rules:[{trigger:'onDeath',conditions:[{type:'countMultiple',every:nr('cookieKills')}],actions:[{type:'kill-count',amount:1},{type:'heal',amount:1}]}]}
  );
  // 主角與敵人共用 trigger / conditions / actions；接合層只提供事件。
  recipes.push({feature:'posture',rules:[
    {trigger:'onPerfectDodge',conditions:[],actions:[{type:'posture',amount:ref('boss.posture.dodgeGain')}]},
    {trigger:'onRecoveryHit',conditions:[],actions:[{type:'posture',amount:ref('boss.posture.recoveryGain')}]},
    {trigger:'onInterrupt',conditions:[],actions:[{type:'posture',amount:ref('boss.posture.interruptGain')}]},
    {trigger:'onPostureBreak',conditions:[],actions:[{type:'stun',duration:ref('boss.posture.stunSeconds')},{type:'heal',amount:ref('boss.posture.heal')}]}
  ]});
  const refs = new Set(['schoolRules.staticSeconds','schoolRules.staticDamage','neutralRules.crownDamage','neutralRules.crownHealth']);
  function collect(node) {
    if (!node || typeof node!=='object') return;
    if(node.ref) refs.add(node.ref);
    Object.values(node).forEach(collect);
  }
  recipes.forEach(collect);
  const inputs=new Set(['level','transformed','radius','damage','dt','moving','gems']);
  function value(expression, data, context={}) {
    if (typeof expression === 'number' && Number.isFinite(expression)) return expression;
    if (expression && refs.has(expression.ref)) {
      const result = expression.ref.split('.').reduce((node,key)=>node&&node[key],data);
      if (typeof result === 'number' && Number.isFinite(result)) return result;
    }
    if(expression && inputs.has(expression.input) && Number.isFinite(context[expression.input])) return context[expression.input];
    if(expression && Array.isArray(expression.args)) {
      const args=expression.args.map(a=>value(a,data,context));
      if(expression.op==='add') return args.reduce((a,b)=>a+b,0);
      if(expression.op==='multiply') return args.reduce((a,b)=>a*b,1);
      if(expression.op==='subtract') return args[0]-args[1];
      if(expression.op==='ceil') return Math.ceil(args[0]);
      if(expression.op==='divide') return args[0]/args[1];
      if(expression.op==='power') return Math.pow(args[0],args[1]);
      if(expression.op==='min') return Math.min(...args);
      if(expression.op==='floor') return Math.floor(args[0]);
      if(expression.op==='max') return Math.max(...args);
    }
    throw new Error('Unsupported effect expression');
  }
  function resolve(node,data,context) {
    if(!node || typeof node!=='object') return node;
    if(node.ref || node.input || node.op) return value(node,data,context);
    if(Array.isArray(node)) return node.map(n=>resolve(n,data,context));
    return Object.fromEntries(Object.entries(node).map(([k,v])=>[k,resolve(v,data,context)]));
  }
  // 呼叫端提供本次事件的數值、等級與外部亂數；回傳不含實體物件的規則。
  function event(feature,trigger,data,context={},definitions=recipes) {
    const recipe=definitions.find(r=>r.feature===feature);
    const rule=recipe && (recipe.rules||[]).find(r=>r.trigger===trigger);
    return rule ? resolve(rule,data,context) : null;
  }
  function matches(condition,target,player={r:0},end={x:0,y:0}) {
    if(condition.type==='chance') return target.draw<condition.probability;
    if(condition.type==='countMultiple') return target.number%condition.every===0;
    if(condition.type==='splitEligible') return !target.fragment && !target.maker;
    if(condition.type==='firstClover') return !!target.cloverAcquired;
    if(condition.type==='volleyPresent') return target.count>0;
    if(condition.type==='waveEligible') return target.length>0 && (target.boss || target.alive) && target.attackable;
    if(condition.type==='healthMissing') return target.health<target.maxHealth;
    if(condition.type==='still') return target.seconds>=condition.seconds;
    if(condition.type==='bladeEligible') return !target.melee && target.pierce>0 && !target.blade;
    if(condition.type==='positiveDamage') return target.damage>0;
    if(condition.type==='bubbleActive') return !!target.bubble;
    if(condition.type==='wetTarget') return target.wetTimer>0;
    if(condition.type==='shotMultiple') return target.number % condition.every === 0;
    if(condition.type==='radius') return condition.strict ? Math.hypot(target.dx,target.dy)<condition.radius+(condition.includeTargetRadius?target.r:0) : Math.hypot(target.dx,target.dy)<=condition.radius+(condition.includeTargetRadius?target.r:0);
    if(condition.type==='segmentTouching') {
      const length=end.x*end.x+end.y*end.y;
      const t=length?Math.max(0,Math.min(1,(target.dx*end.x+target.dy*end.y)/length)):0;
      return Math.hypot(target.dx-t*end.x,target.dy-t*end.y)<=target.r+player.r;
    }
    throw new Error('Unsupported effect condition');
  }
  function select(rule,targets,draw) {
    const random=(rule.conditions||[]).find(c=>c.type==='randomTarget');
    return random ? (targets.length ? [targets[Math.floor(draw*targets.length)]] : []) : targets.slice();
  }
  function drop(number,owned,data) {
    const rule=event('water-drop','onShot',data);
    return owned && matches(rule.conditions[0],{number}) ? rule.actions[0] : {size:1,damage:1,push:0};
  }
  function charge(kills,used,owned,data) {
    const rule=event('thunder-charge','onShot',data);
    const charged=!!owned && Math.floor(kills/rule.conditions[0].every)>used;
    return {charged,multiplier:charged?rule.actions[0].multiplier:1};
  }
  // levels 已由 effectLevel 合併及封頂；存在才掛一次，不按等級重複掛載。
  function modify(stat, base, levels, data, definitions=recipes) {
    let result=base;
    for (const recipe of definitions) if (levels[recipe.feature]) for (const modifier of recipe.modifiers || []) {
      if (modifier.stat !== stat) continue;
      const amount=value(modifier.value,data);
      if (modifier.op === 'multiply') result *= amount;
      else if (modifier.op === 'subtract') result -= amount;
      else throw new Error('Unsupported effect modifier');
    }
    return result;
  }
  // timers 用規則 id（本階段每 feature 一個 card instance）。回傳副本，最多補一跳。
  // targets 已由接合層過濾合法目標，dx/dy 是環繞地圖最短距離。
  function step(input, definitions=recipes) {
    const timers={...input.timers}, events=[];
    for (const recipe of definitions) if (input.levels[recipe.feature]) for (const rule of recipe.rules || []) {
      if (rule.trigger !== 'onTimer') {
        if (['onWaveHit','onDeath','onBombDue','onBirdTick','onAcquire','onOffer','onHealth','onUpgrade','onHealTick','onChain','onSkillBlast','onHurt','onUltimate','onDashTrail','onShot','onSummonTimer','onDashCross','onWaterHit','onShotHit','onFieldTick','onPulse','onDashEnd','onDamage','onRainTick','onMeleeHit','onMove','onPickup','onStill','onWallTick','onEnemyShot'].includes(rule.trigger)) continue;
        throw new Error('Unsupported effect trigger');
      }
      const seconds=value(rule.interval,input.data);
      timers[rule.id]=(timers[rule.id] === undefined ? seconds : timers[rule.id])-input.dt;
      if (timers[rule.id]>0) continue;
      timers[rule.id]+=seconds;
      for (const target of input.targets) {
        if (!(rule.conditions || []).every(condition=>{
          if (condition.type !== 'touching') throw new Error('Unsupported effect condition');
          return Math.hypot(target.dx,target.dy)<input.player.r+target.r+value(condition.padding,input.data);
        })) continue;
        for (const action of rule.actions) {
          if (action.type === 'cue' && action.cue === 'lightning') events.push({type:'cue',cue:action.cue,targetId:target.id,source:rule.id});
          else if (action.type === 'damage') events.push({type:'damage',amount:value(action.amount,input.data),targetId:target.id,source:rule.id});
          else throw new Error('Unsupported effect action');
        }
      }
    }
    return {timers,events};
  }
  function attackTick(previous, weapon, dt, moving, chargeRate=1) {
    const p=previous || {number:0,idle:0,charge:0,moving:false};
    const idle=p.idle+dt;
    let charge=weapon.chargeEnabled ? p.charge : 0;
    if (moving && !p.moving) charge*=weapon.moveRetention;
    if (!moving && weapon.chargeEnabled) charge=Math.min(weapon.chargeSeconds,charge+dt*chargeRate);
    return {number:idle>=weapon.comboReset?0:p.number,idle,charge,moving};
  }
  function attack(previous, weapon, fallbackNumber=0) {
    const p=previous || {number:fallbackNumber,idle:0,charge:0,moving:false};
    const number=weapon.comboEnabled ? (p.idle>=weapon.comboReset?1:p.number%weapon.comboEvery+1) : 1;
    const charged=weapon.chargeEnabled && p.charge>=weapon.chargeSeconds;
    return {state:{...p,number,idle:0,charge:charged?0:p.charge},
      event:{type:'weapon-attack',weaponId:weapon.id,number,finisher:weapon.comboEnabled && number===weapon.comboEvery,charged}};
  }
  return {version:2,recipes,modify,step,attackTick,attack,event,matches,charge,select,drop};
})();
