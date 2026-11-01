// 純規則：亂數由呼叫端傳入；資料與事件不含 DOM、Canvas 或音訊。
globalThis.SurvivorSchools = (() => {
  function counts(cards, upgrades) {
    const result = {};
    for (const card of cards) if (card.school && !card.schools && upgrades[card.id]) result[card.school] = (result[card.school] || 0) + 1;
    return result;
  }
  function shuffled(items, draws) {
    const result = items.slice();
    for (let i = result.length - 1, n = 0; i > 0; i--, n++) {
      const j = Math.floor((draws[n % draws.length] || 0) * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
  function createRun(data, draws) {
    const schools = shuffled(data.schools.map(s => s.id), draws).slice(0, data.schoolRules.schoolsPerRun);
    const pool = [];
    schools.forEach((id, i) => pool.push(...shuffled(data.cards.filter(c => c.school === id && !c.schools && c.tier !== 'ultimate' && c.rarity !== 'legendary'), draws.slice(i + 1).concat(draws.slice(0, i + 1))).slice(0, data.schoolRules.cardsPerSchool).map(c => c.id)));
    const neutralPool = shuffled(data.cards.filter(c => c.neutral), draws.slice(7).concat(draws.slice(0,7))).slice(0,data.neutralRules.itemsPerRun).map(c=>c.id);
    return { schools, pool, neutralPool, starter: null };
  }
  function eligible(card, cards, upgrades, run, rules, maxLevel) {
    if ((upgrades[card.id] || 0) >= Math.min(card.maxLevel, maxLevel)) return false;
    if ((card.requires || []).some(id => !upgrades[id])) return false;
    if (card.neutral && run && run.neutralPool && !run.neutralPool.includes(card.id)) return false;
    if (!run) return true; // 獨立預覽／舊測試尚未建立一局。
    const schools = card.schools || (card.school ? [card.school] : []);
    if (schools.some(id => !run.schools.includes(id))) return false;
    const owned = counts(cards, upgrades);
    if (card.schools) return card.schools.every(id => (owned[id] || 0) >= rules.fusionCards);
    if (card.tier === 'ultimate') return (owned[card.school] || 0) >= rules.ultimateCards;
    return !card.school || card.rarity === 'legendary' || run.pool.includes(card.id);
  }
  function pick(cards, upgrades, run, rules, draws) {
    const available = cards.slice(), picked = [], owned = counts(cards, upgrades);
    for (let i = 0; i < 3 && available.length; i++) {
      const weights = available.map(c => {
        const schoolWeight = 1 + (owned[c.school] || 0) * rules.ownedWeight + (run && c.school === run.starter ? rules.starterWeight : 0);
        return schoolWeight * (c.rarity === 'rare' ? rules.rareWeight : 1);
      });
      let position = (draws[i] || 0) * weights.reduce((a, b) => a + b, 0), index = weights.length - 1;
      for (let j = 0; j < weights.length; j++) { position -= weights[j]; if (position < 0) { index = j; break; } }
      picked.push(available.splice(index, 1)[0]);
    }
    return picked;
  }
  function growth(cards, before, after, rules) {
    const oldCounts = counts(cards, before), newCounts = counts(cards, after), events = [];
    for (const id of Object.keys(newCounts)) {
      if ((oldCounts[id] || 0) < rules.transformCards && newCounts[id] >= rules.transformCards) events.push({ type: 'transformed', schoolId: id });
      if ((oldCounts[id] || 0) < rules.ultimateCards && newCounts[id] >= rules.ultimateCards) events.push({ type: 'ultimate-unlocked', schoolId: id });
    }
    return events;
  }
  function appearance(cards, upgrades, run, rules) {
    const owned = counts(cards, upgrades), ids = run ? run.schools : Object.keys(owned);
    const ranked = ids.slice().sort((a,b) => (owned[b] || 0) - (owned[a] || 0) || (a === (run && run.starter) ? -1 : b === (run && run.starter) ? 1 : 0));
    const main = ranked.find(id => owned[id]) || 'water';
    const fusion = cards.find(c => c.schools && upgrades[c.id]);
    const colors = fusion ? fusion.schools : [main];
    return { main, colors, bodyColors: fusion || ranked.some(id => owned[id]) ? colors : [], forms: ids.filter(id => (owned[id] || 0) >= rules.transformCards) };
  }
  function shot(number, kills, chargedUsed, powers, rules) {
    const drop = SurvivorEffectBlocks.drop(number,powers.drop,{schoolRules:rules});
    const charge = SurvivorEffectBlocks.charge(kills,chargedUsed,powers.charge,{schoolRules:rules});
    const charged = charge.charged;
    return { size: drop.size, damage: drop.damage * charge.multiplier, push: drop.push, charged: !!charged };
  }
  function segmentDistance(x,y,endX,endY) {
    const length2 = endX*endX+endY*endY;
    const t = length2 ? Math.max(0,Math.min(1,(x*endX+y*endY)/length2)) : 0;
    return Math.hypot(x-t*endX,y-t*endY);
  }
  return { segmentDistance, counts, createRun, eligible, pick, growth, appearance, shot };
})();
