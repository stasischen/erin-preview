// Pure presentation: read the same effect blocks as combat. No gameplay mutation.
globalThis.SurvivorUpgradeInfo=(()=>{
  function cardNote(card, weapon) {
    if (weapon.kind !== 'melee') return card.description;
    const original=globalThis.SURVIVOR_DEFAULTS?.cards.find(c=>c.id===card.id), note=weapon.id==='candy-sword'?'descriptionSword':'descriptionMelee';
    if(original && card.description===original.description && card[note]===original[note] && card.effects?.some(e=>e.feature===card.id)) {
      if(card.id==='multi-water')return '擴大揮擊；Lv3追加背向斬，Lv5全圈掃擊。同次每敵只受一次主擊，與後射不重複。';
      if(card.id==='splash-water')return weapon.id==='candy-sword'?'連段收尾、蓄力或衝刺攻擊追加一道穿透劍氣。':'連段收尾、蓄力或衝刺重擊追加一次環形震波。';
      if(card.id==='wind-blade' && weapon.id==='candy-sword')return '命中後追斬仍在前方範圍內的目標，單一敵人也有效。';
    }
    return (weapon.id==='candy-sword' && card.descriptionSword) || card.descriptionMelee || card.description;
  }
  function cardPresentation(card, weapon) {
    const original=globalThis.SURVIVOR_DEFAULTS?.cards.find(c=>c.id===card.id);
    if(weapon.kind!=='melee' || !original || card.name!==original.name) return card;
    const sword=weapon.id==='candy-sword', noun=sword?'劍':'錘';
    const names={'big-water':sword?'巨刃強化':'重錘強化','rapid-water':'疾速揮'+noun,
      'multi-water':sword?'闊刃斬擊':'廣域揮錘','piercing-water':sword?'延伸劍鋒':'延伸錘擊',
      'splash-water':sword?'收招劍氣':'重擊震波','water-attack':'水紋'+noun+'擊',
      'wind-attack':sword?'疾風劍鋒':'疾風錘擊','thunder-attack':'雷霆'+noun+'擊',
      'water-drop':sword?'蓄勢重斬':'蓄勢重錘','wind-blade':sword?'追風斬':'追風錘'};
    return names[card.id]?{...card,name:names[card.id],icon:card.icon===original.icon?weapon.icon:card.icon}:card;
  }
  function upgradeSummary(data,card,weapon,current) {
    const effect=(card?.effects||[]).find(e=>['big-water','rapid-water','multi-water','piercing-water','splash-water','wind-blade','thunder-attack','thunder-ultimate','wind-ultimate'].includes(e.feature));
    if(!effect)return '';
    const feature=effect.feature, next=Math.min(current+1,card.maxLevel||5), melee=weapon.kind==='melee', sword=weapon.id==='candy-sword';
    const rule=(level,trigger='onShot')=>SurvivorEffectBlocks.event(feature,trigger,data,{level:Math.min(data.tuning.maxUpgradeLevel,level*(effect.power||1)),damage:100,transformed:0});
    const percent=n=>Math.round(n*100)+'%', pair=fn=>fn(current)+' → '+fn(next);
    if(feature==='thunder-attack')return '每次連鎖 '+pair(n=>n?rule(n,'onChain').actions[0].count+' 隻':'未取得')+'；每跳主擊比例 '+pair(n=>n?percent(rule(n,'onChain').actions[0].multiplier):'0%');
    if(feature==='thunder-ultimate')return '每輪雷擊 '+pair(n=>n?rule(n,'onUltimate').conditions[0].count+' 隻':'未取得')+'；每隻 '+pair(n=>n?Math.round(rule(n,'onUltimate').actions[0].amount)+' 傷害':'0 傷害')+'，同輪不重複';
    if(feature==='wind-ultimate')return '環繞旋風 '+pair(n=>n?rule(n,'onUltimate').actions[1].count+' 個':'未取得')+'；每次 '+pair(n=>n?Math.round(rule(n,'onUltimate').actions[0].amount)+' 傷害':'0 傷害')+'，重疊只計一次';
    if(feature==='big-water')return '基礎傷害 '+pair(n=>percent(rule(n).actions[1].multiplier))+'；範圍 '+pair(n=>percent(rule(n).actions[0].multiplier));
    if(feature==='rapid-water')return '基礎攻擊間隔 '+pair(n=>percent(Math.max(.12/(melee?weapon.interval:data.tuning.shotInterval),rule(n).actions[0].multiplier)));
    if(feature==='multi-water' && melee)return '攻擊方向 '+pair(n=>['','前方','前方＋背向','全圈'][rule(n).actions[0].coverage])+'；橫斬 '+pair(n=>Math.round(rule(n).actions[0].coverage>=3?360:Math.min(360,weapon.arcDegrees+rule(n).actions[0].extraArc*180/Math.PI))+'°')+(sword?'；突刺寬度 '+pair(n=>percent(1+Math.min(.5,rule(n).actions[0].extraArc))):'');
    if(feature==='multi-water')return melee?'橫斬角度 '+pair(n=>Math.round(Math.min(360,weapon.arcDegrees+rule(n).actions[0].extraArc*180/Math.PI))+'°')+(sword?'；突刺寬度 '+pair(n=>percent(1+Math.min(.5,rule(n).actions[0].extraArc))):''):'每次水球 '+pair(n=>rule(n).actions[0].count+' 顆');
    if(feature==='piercing-water')return melee?'揮擊距離 '+pair(n=>percent(rule(n).actions[0].size)):'額外穿透 '+pair(n=>rule(n).actions[0].count+' 隻');
    if(feature==='splash-water')return (melee?(sword?'劍氣延伸 ':'震波擴展 '):'水花半徑 ')+pair(n=>n?rule(n,'onShotHit').conditions[0].radius+' 格':'未解鎖')+'；追加傷害 '+percent(data.build.supportSplashDamage);
    return '追加傷害 '+pair(n=>n?percent(data.schoolRules.windBladeDamage):'未解鎖');
  }
  return {cardNote,cardPresentation,upgradeSummary};
})();

Survivor.engine['upgrade-info']=SurvivorUpgradeInfo;
