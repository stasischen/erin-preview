// Selection is owned by levelup.js; this module only builds readable player UI.
const upgradeEscape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function upgradeCardText(card,current) {
  if(state.pickingWeapon)return GAME_DATA.attackMode==='manual'?card.description.replace('自動','手動'):card.description;
  if(card.weaponId)return SurvivorWeaponCatalog.change(card.id,current)+'。'+card.description;
  if(!card.effects)return card.description;
  const text=[SurvivorUpgradeInfo.cardNote(card,activeWeapon()),SurvivorUpgradeInfo.upgradeSummary(GAME_DATA,card,activeWeapon(),current)].filter(Boolean).join(' ');
  if(!state.loadout)return text;
  const maps={'multi-water':'共用：水球加彈；錘劍擴斬並於Lv3背斬/Lv5全圈；其他武器加覆蓋數量，吸管加寬。','piercing-water':'共用：水球/冰刺加穿透，錘劍及其他武器延伸距離。','splash-water':'共用：水球命中水花；錘劍重招波；其他武器每輪一次附傷。','item-rear':'適用水球、錘、劍的背向攻擊。','item-split':'適用水球；碎片不再分裂。'};
  return text+(maps[card.id]?' '+maps[card.id]:'');
}
function upgradeCardMarkup(card,current) {
  const view=state.pickingWeapon?card:SurvivorUpgradeInfo.cardPresentation(card,activeWeapon());
  const type=state.pickingWeapon||card.weaponId?'武器':state.loadout?'共用專長':card.schools?'合體':card.school?BUILD_TUNING[card.school].name:card.neutral?'道具':'支援';
  const level=state.pickingWeapon?(manualMode()?'手動攻擊':'自動攻擊'):card.weaponId?`Lv${current||0} → ${current+1}／5`:card.id==='heal'?'立即恢復':current?`Lv${current} → ${current+1}`:'Lv1 · 新取得';
  const requirements=card.schools?`合體條件：${card.schools.map(id=>BUILD_TUNING[id].name+'各 '+GAME_DATA.schoolRules.fusionCards+' 張').join('＋')}`:card.requires?.length?'需要：'+cardRequirements(card):'';
  return `<span class="card-type">${upgradeEscape(type)} · ${current?'升級':'新能力'}</span><span class="upgrade-icon">${SurvivorIcons.html(view.icon)}</span><strong>${upgradeEscape(view.name)}</strong><small class="card-level">${level}</small><span class="card-copy">${upgradeEscape(upgradeCardText(card,current))}</span>${requirements?`<small class="requirements">${upgradeEscape(requirements)}</small>`:''}<span class="card-selected" aria-hidden="true">已選擇 ✓</span>`;
}
function renderUpgradeLoadout() {
  const host=document.getElementById('upgradeLoadout');if(!host)return;
  const w=activeWeapon(), owned=UPGRADES.filter(c=>upgradeLevel(c.id)), counts=SurvivorSchools.counts(UPGRADES,state.upgrades);
  const number=n=>Math.round(n*10)/10;
  const mode=manualMode()?'手動':'自動';
  const interval=manualMode()?Object.entries(w.timing).filter(([key])=>['windup','active','recovery','cooldown'].includes(key)).reduce((n,[,v])=>n+v,0)*effectiveShotInterval()/(w.kind==='melee'?w.interval:SHOT_INTERVAL):effectiveShotInterval();
  const stats=state.pickingWeapon?`選一把武器，移動躲避。本場使用${mode}攻擊。`:`生命 ${Math.ceil(state.player.health)}／${maxPlayerHealth()}<br>普通主擊 ${number(effectiveDamage()*(w.kind==='melee'?w.damageMultiplier:1))}<br>${mode}攻擊間隔 ${number(interval)} 秒`;
  const fusions=UPGRADES.filter(c=>c.schools?.every(id=>(state.schoolRun?.schools||GAME_DATA.schools.map(s=>s.id)).includes(id)));
  host.innerHTML=`<h3>${state.pickingWeapon?(state.pendingTrial?'Boss試煉':'作品試玩'):'目前配裝'}</h3><b>${state.pickingWeapon?(manualMode()?'手動攻擊':'自動攻擊'):SurvivorIcons.html(w.icon)+upgradeEscape(w.name)}</b><p>${stats}</p>${survivalLoadoutMarkup()}<h4>共用專長</h4><div class="loadout-items">${owned.map(c=>`<span>${SurvivorIcons.html(SurvivorUpgradeInfo.cardPresentation(c,w).icon)}${upgradeEscape(SurvivorUpgradeInfo.cardPresentation(c,w).name)} <b>Lv${upgradeLevel(c.id)}</b></span>`).join('')||'<span>尚未取得升級</span>'}</div>${fusions.map(c=>`<p class="fusion-hint"><b>${upgradeEscape(c.name)}</b><br>${c.schools.map(id=>`${upgradeEscape(BUILD_TUNING[id].name)} ${counts[id]||0}/${GAME_DATA.schoolRules.fusionCards}張`).join(' · ')}<br>${upgradeEscape(c.description)}</p>`).join('')}`;
}

function survivalLoadoutMarkup(){
  if(!state.loadout)return '';
  return `<h4>武器 ${state.loadout.length}／3</h4><div class="loadout-weapons">${state.loadout.map(slot=>SurvivorLoadout.withWeapon(slot,()=>{
    const w=SurvivorWeaponCatalog.get(slot.weaponId), damage=effectiveDamage()*(activeWeapon().kind==='melee'?activeWeapon().damageMultiplier:1);
    return `<p>${SurvivorIcons.html(w.icon)}<b>${upgradeEscape(w.name)} Lv${slot.level}</b><br>主擊 ${Math.round(damage*10)/10} · ${effectiveShotInterval().toFixed(2)}秒</p>`;
  })).join('')}</div>`;
}

Survivor.ui=Survivor.ui||{};Survivor.ui['upgrade-view']={upgradeCardText,upgradeCardMarkup,renderUpgradeLoadout,survivalLoadoutMarkup};
