function canOffer(card) {
  if(card.ability)return SurvivorAbilities.eligible(card.id);
  if(SurvivorAbilities.enabled()&&card.tier==='ultimate')return false;
  if(card.weaponId)return SurvivorLoadout.choices().some(c=>c.id===card.id);
  if(activeWeapon().kind==='melee' && card.id==='item-split') return false;
  return SurvivorSchools.eligible(card, UPGRADES, state.upgrades, state.schoolRun, GAME_DATA.schoolRules, UPGRADE_TUNING.maxUpgradeLevel);
}
function buildAppearance() { return SurvivorSchools.appearance(UPGRADES, state.upgrades, state.schoolRun, GAME_DATA.schoolRules); }
function transformed(school) { return buildAppearance().forms.includes(school); }
function maxDashCharges() { return UPGRADE_TUNING.dashCharges + (transformed('wind') ? GAME_DATA.schoolRules.windFormCharges : 0); }
function showWeaponChoices() {
  state.pickingWeapon = true;
  state.pendingChoices = GAME_DATA.weapons.map(w => ({...w}));
  showUpgradeChoices();
}

function cardRequirements(card) {
  return (card.requires || []).map(id => SurvivorWeapons.cardPresentation(UPGRADES.find(other => other.id === id),activeWeapon()).name + " Lv1").join(" ＋ ");
}


function renderRunSummary(summary) {
  const host = document.getElementById('runSummary');
  if (!host) return;
  host.hidden = !summary;
  host.innerHTML = '';
  host.scrollTop = 0;
  if (!summary) return;
  const group = (title, items, empty) => `<h4>${title}</h4><ul>${items.length
    ? items.map(text => `<li>${upgradeEscape(text)}</li>`).join('')
    : `<li>${empty}</li>`}</ul>`;
  host.innerHTML = `<h3>本局摘要</h3><p>本局時間：${summary.seconds} 秒<br>` +
    `到達：第 ${summary.stage} 關 · ${upgradeEscape(summary.stageName)} · 等級 ${summary.level}<br>` +
    `小怪擊倒：${summary.kills}（含精英／大熊，不含關卡 Boss）</p>` +
    (summary.newRecord ? '<p class="run-record">新最長紀錄！</p>' : '') +
    group('最後武器', summary.weapons, '本局尚未取得武器') +
    group('秘技', summary.secrets, '本局尚未取得秘技') +
    group('大招', summary.active, '泡泡炸彈（基礎，尚未選擇大招）') +
    group('已取得升級卡', summary.cards, '本局尚未取得升級卡');
}

function showOverlay(mode) {
  const trialPanel=document.getElementById('trialPanel');if(trialPanel)trialPanel.hidden=true;
  state.mode = mode;
  renderRunSummary(!MAKER_MODE && !PREVIEW_MODE && !state.trial && ['over', 'won'].includes(mode) ? state.runSummary : null);
  SurvivorRoutes.menu(mode);
  if (mode !== "paused") updateBossHealthHud();
  const pauseBuild=document.getElementById("pauseBuild");
  if(pauseBuild) pauseBuild.hidden=mode!=="paused";
  if(mode==="paused") {updateHud();renderSkillTree(document.getElementById("settingsSkillTree"));}
  updateAttackModeButtons();
  Survivor.audio.sync();
  state.keys.clear(); state.pointerId = null; state.joy = null;
  updateActionControls();
  overlay.classList.remove("hidden"); messageCard.hidden = false; upgradePanel.hidden = true; settingsPanel.hidden = true;
  if (state.runSummary && (mode === 'over' || mode === 'won')) messageCard.scrollTop = 0;
  if (mode === "paused") { SurvivorIcons.set(iconEl, "pause"); titleEl.textContent = "先休息一下"; textEl.textContent = "準備好了再繼續玩。"; startButton.textContent = "繼續遊戲"; statusEl.textContent = "已暫停"; SurvivorIcons.set(pauseButton, "settings"); }
  else if (mode === "over") { SurvivorIcons.set(iconEl, "over"); titleEl.textContent = "再試一次！"; textEl.textContent = `水星人的血條用完了。這次撐了 ${Math.floor(state.elapsed)} 秒。${bestRecord ? ` 最佳紀錄：${bestRecord} 秒。` : ""}`; startButton.textContent = "重新開始"; statusEl.textContent = "本局結束"; SurvivorIcons.set(pauseButton, "settings"); }
  else if (mode === "won") { SurvivorIcons.set(iconEl, "win"); titleEl.textContent = "打敗" + GAME_DATA.boss.name + "了！"; textEl.textContent = `${GAME_DATA.boss.name}的血條清空，這一局勝利！${bestRecord ? ` 最佳紀錄：${bestRecord} 秒。` : ""}`; startButton.textContent = "再玩一次"; statusEl.textContent = "勝利！"; SurvivorIcons.set(pauseButton, "settings"); }
  else { SurvivorIcons.set(iconEl, "onion-dash"); titleEl.textContent = "小怪獸"; textEl.textContent = "用搖桿或方向鍵移動，衝刺躲字、放泡泡炸彈！"; startButton.textContent = "開始生存"; statusEl.textContent = "準備開始"; }
}


function chooseUpgradeCards(excludedIds = []) {
  state.pickingWeapon = false;
  const eligible = UPGRADES.filter(card => (card.rarity !== "legendary" || card.tier === "ultimate" || Math.random() < GAME_DATA.schoolRules.legendaryChance) && canOffer(card) && !(state.rewardPicking && state.rewardPicked.includes(card.id)));
  eligible.push(...SurvivorAbilities.choices().filter(c=>!(state.rewardPicking&&state.rewardPicked.includes(c.id))));
  const fresh = eligible.filter(card => !excludedIds.includes(card.id));
  // 卡池足夠時，整排換成沒看過的卡；卡池不足仍維持合法且不重複的選項。
  const available = fresh.length >= Math.min(3, eligible.length) ? fresh : eligible;
  if (!available.length) { state.pendingChoices = [{ id: "heal", icon: "heal", name: "回血", description: "恢復 1 顆心" }]; }
  else {
    state.pendingChoices = SurvivorSchools.pick(available, state.upgrades, state.schoolRun, {...GAME_DATA.schoolRules, rareWeight:GAME_DATA.schoolRules.rareWeight * (effectLevel("item-clover") ? cardBlock('item-clover','onOffer').actions[0].multiplier : 1)}, [Math.random(), Math.random(), Math.random()]);
  }
  state.pendingChoices=SurvivorLoadout.guarantee(state.pendingChoices.filter(c=>c.id!=='heal'),excludedIds);
  state.pendingChoices=SurvivorAbilities.guarantee(state.pendingChoices,excludedIds);
  if(!state.pendingChoices.length)state.pendingChoices=[{id:'heal',icon:'heal',name:'回血',description:'立即恢復生命'}];
  showUpgradeChoices();
}
function renderSkillTree(tree) {
  const hint=document.querySelector('.skill-rule-hint');
  if(hint)hint.textContent=SurvivorAbilities.enabled()?'同元素 3 種基礎能力解鎖秘技；最多 2 秘技、1 大招路線；雙元素各 2 種解鎖合體。':`卡片依作品等級上限；同流派 ${GAME_DATA.schoolRules.transformCards} 張變身、${GAME_DATA.schoolRules.ultimateCards} 張解鎖終極；雙流派各 ${GAME_DATA.schoolRules.fusionCards} 張解鎖合體。`;
  if(SurvivorAbilities.enabled()){
    tree.innerHTML=survivalAbilityMarkup()+SurvivorAbilityCatalog.all.map(c=>`<span class="${SurvivorAbilities.level(c.id)?'owned':''}">${SurvivorIcons.html(c.icon)}${c.ability==='secret'?'秘技':'大招'} · ${c.name} Lv${SurvivorAbilities.level(c.id)} · ${SurvivorAbilities.eligible(c.id)?'可抽取':SurvivorAbilities.level(c.id)>=5?'已滿級':c.ability==='active'&&state.abilities.active?'已固定其他路線':c.ability==='secret'&&state.abilities.secrets.length>=2&&!SurvivorAbilities.level(c.id)?'秘技槽已滿':c.ability==='secret'?BUILD_TUNING[c.school].name+' 需 3 種基礎能力':'尚未取得'}</span>`).join('')+'<div><b>被動與合體</b>'+UPGRADES.filter(c=>c.tier!=='ultimate').map(c=>`<span class="${upgradeLevel(c.id)?'owned':''}">${SurvivorIcons.html(c.icon)}${upgradeEscape(c.name)} Lv${upgradeLevel(c.id)}</span>`).join('')+'</div>';
    return;
  }
  tree.innerHTML = (state.schoolRun ? state.schoolRun.schools : GAME_DATA.schools.map(s => s.id)).concat('neutral').map(school => `<div><b style="color:${school === "neutral" ? "#e5c77d" : BUILD_TUNING[school].color}">${SurvivorIcons.html(school === "neutral" ? "passive" : school)}${school === "neutral" ? "中立道具" : BUILD_TUNING[school].name}</b> ${UPGRADES.filter(card => school === "neutral" ? card.neutral && (!state.schoolRun || state.schoolRun.neutralPool.includes(card.id)) : card.school === school).map(card => `<span class="${upgradeLevel(card.id) ? "owned" : ""}" title="${SurvivorWeapons.cardNote(card,activeWeapon())}${card.requires && card.requires.length ? "；需要：" + cardRequirements(card) : ""}">${SurvivorIcons.html(SurvivorWeapons.cardPresentation(card,activeWeapon()).icon)}${SurvivorWeapons.cardPresentation(card,activeWeapon()).name} Lv${upgradeLevel(card.id)}${card.requires && card.requires.length ? " ← " + cardRequirements(card) : ""}</span>`).join("")}</div>`).join("");
}
function showUpgradeChoices() {
  const choices = state.pendingChoices;
  playSound("levelup");
  render();
  state.mode = "levelup"; Survivor.audio.sync(); state.keys.clear(); state.pointerId = null; state.joy = null; updateActionControls(); overlay.classList.remove("hidden"); messageCard.hidden = true; upgradePanel.hidden = false; upgradeCards.innerHTML = "";
  upgradePanel.className = 'upgrade-panel' + (state.pickingWeapon ? ' weapon-picker' : '');
  if (!state.pickingWeapon) renderSkillTree(document.getElementById("skillTree"));
  let selectedIndex = -1;
  const confirm = document.getElementById("confirmUpgrade");
  confirm.disabled = true;
  confirm.onclick = () => applyUpgrade(selectedIndex, choices);
  const reroll = document.getElementById("rerollUpgrade");
  reroll.hidden = !!state.pickingWeapon;
  reroll.disabled = state.pickingWeapon || state.rerollsRemaining <= 0 || !(UPGRADES.some(canOffer)||SurvivorLoadout.choices().length||SurvivorAbilities.choices().length);
  document.getElementById("rerollCount").textContent = String(state.rerollsRemaining);
  reroll.setAttribute("aria-label", `重抽升級卡，剩下 ${state.rerollsRemaining} 次`);
  reroll.title = `重抽升級卡，剩下 ${state.rerollsRemaining} 次`;
  reroll.onclick = rerollUpgradeCards;
  const choiceButtons = [];
  renderUpgradeLoadout();
  state.pendingChoices.forEach((card, index) => {
    const current = card.ability?SurvivorAbilities.level(card.id):card.weaponId?(SurvivorLoadout.owned(card.id)?.level||0):upgradeLevel(card.id), level = `Lv${current} → Lv${current + 1}`;
    const button = document.createElement("button"); button.className = "upgrade-card"; button.type = "button";
    button.dataset.rarity = card.rarity || (card.tier === "ultimate" ? "legendary" : card.tier === "fusion" ? "epic" : card.requires && card.requires.length ? "rare" : "common");
    if (card.school) button.style.setProperty("--school-color", BUILD_TUNING[card.school].color);
    button.setAttribute("aria-label", SurvivorWeapons.cardPresentation(card,activeWeapon()).name + (state.pickingWeapon || card.id === "heal" ? "" : "，" + level));
    button.title = SurvivorWeapons.cardPresentation(card,activeWeapon()).name;
    button.innerHTML = upgradeCardMarkup(card,current);
    button.setAttribute("aria-pressed", "false");
    choiceButtons.push(button); upgradeCards.appendChild(button);
    const preview = () => {
      selectedIndex = index; confirm.disabled = false;
      confirm.setAttribute("aria-label", "選這張：" + SurvivorWeapons.cardPresentation(card,activeWeapon()).name);
      confirm.title = "選這張：" + SurvivorWeapons.cardPresentation(card,activeWeapon()).name;
      choiceButtons.forEach(node => node.setAttribute('aria-pressed', String(node === button)));

    };
    button.addEventListener('click', preview);button.addEventListener('focus', preview);
    if (!index) preview();
  });
  const rewardText = state.pickingWeapon ? (state.pendingTrial?"試煉 · 選一把手動武器":"選一把武器") : state.rewardPicking ? `大熊獎勵 · 選第 ${3-state.rewardChoices} 張／共 2 張` : '升級了！選一張卡';
  document.getElementById('upgradeHeading').textContent = rewardText;
  statusEl.textContent = state.pickingWeapon || state.rewardPicking ? rewardText : "選一張升級卡";
}
function rerollUpgradeCards() {
  // 只剩回血備案時，保留重抽次數。
  if (state.pickingWeapon || state.mode !== "levelup" || state.rerollsRemaining <= 0 || !(UPGRADES.some(canOffer)||SurvivorLoadout.choices().length||SurvivorAbilities.choices().length)) return;
  state.rerollsRemaining--;
  chooseUpgradeCards(state.pendingChoices.map(card => card.id));
}
function applyUpgrade(index, choices = state.pendingChoices) {
  if (choices !== state.pendingChoices) return;
  const card = state.pendingChoices[index]; if (!card || state.mode !== "levelup" || (!state.pickingWeapon && card.id !== "heal" && !canOffer(card))) return;
  if (globalThis.SurvivorPreview) SurvivorPreview.stop();
  if (state.pickingWeapon) {
    if(state.pendingTrial){const id=state.pendingTrial;startTrial(id,card.id);return;}
    state.weaponId = card.id; state.pickingWeapon = false; state.pendingChoices = [];
    overlay.classList.add('hidden'); state.mode = 'playing'; spawnEnemy();
    playSound('select'); updateActionControls(); updateHud(); state.lastTime = performance.now(); scheduleFrame(); return;
  }
  const before = { ...state.upgrades };
  if(card.ability)SurvivorAbilities.acquire(card.id);
  else if(card.weaponId)SurvivorLoadout.acquire(card.weaponId);
  else if (card.id === "heal") state.player.health = Math.min(maxPlayerHealth(), state.player.health + Math.ceil(PLAYER_HEALTH / BUILD_TUNING.shieldHealthDivisor));
  else { state.upgrades[card.id] = upgradeLevel(card.id) + 1; if (upgradeLevel(card.id) === 1 && card.effects.some(e => e.feature === "water-ultimate")) state.ultimateTimer = BUILD_TUNING.ultimateSeconds; if (card.effects.some(e => e.feature === "bubble-shield")) { state.player.health = Math.min(maxPlayerHealth(), state.player.health + cardBlock('bubble-shield','onUpgrade').actions[0].amount); } }
  neutralEvent('acquire', state.player.x, state.player.y, card.id);
  state.player.health = Math.min(state.player.health, maxPlayerHealth());
  if (state.schoolRun && !state.schoolRun.starter && card.school) state.schoolRun.starter = card.school;
  if (!card.ability && card.id === 'water-ultimate') { state.ultimateTimers = state.ultimateTimers || {}; state.ultimateTimers.water = BUILD_TUNING.ultimateSeconds; }
  if(SurvivorAbilities.enabled()&&card.school&&!card.ability){
    const previous=SurvivorSchools.counts(UPGRADES.filter(c=>c.tier!=='ultimate'),before);
    if((previous[card.school]||0)<3&&(SurvivorAbilities.counts()[card.school]||0)>=3)skillVisual('card',state.player.x,state.player.y-60,{text:'秘技解鎖',color:BUILD_TUNING[card.school].color,life:1.5});
  }
  handleSchoolEvents(SurvivorSchools.growth(UPGRADES, before, state.upgrades, GAME_DATA.schoolRules));
  skillVisual("card", state.player.x, state.player.y - 38, { text: SurvivorWeapons.cardPresentation(card,activeWeapon()).icon || "health", color: card.school ? BUILD_TUNING[card.school].color : "#237bc2", life: .8 });
  playSound("select");
  if (state.rewardPicking) {
    state.rewardPicked.push(card.id); state.rewardChoices--;
    if (state.rewardChoices > 0) { chooseUpgradeCards(); return; }
    state.rewardPicking = false; state.rewardPicked = [];
  }
  state.pendingChoices = []; overlay.classList.add("hidden"); state.mode = "playing"; SurvivorIcons.set(pauseButton, "settings"); updateActionControls(); updateHud(); state.lastTime = performance.now(); scheduleFrame();
}


// Live accessors preserve shared state and the legacy globals used by preview/VM callers.
globalThis.Survivor.ui = globalThis.Survivor.ui || {};
globalThis.Survivor.ui.levelup = globalThis.Survivor.ui.levelup || {};
Object.defineProperties(globalThis.Survivor.ui.levelup, {
  canOffer: { enumerable: true, get: () => canOffer },
  cardRequirements: { enumerable: true, get: () => cardRequirements },
  showOverlay: { enumerable: true, get: () => showOverlay },
  chooseUpgradeCards: { enumerable: true, get: () => chooseUpgradeCards },
  renderSkillTree: { enumerable: true, get: () => renderSkillTree },
  showUpgradeChoices: { enumerable: true, get: () => showUpgradeChoices },
  rerollUpgradeCards: { enumerable: true, get: () => rerollUpgradeCards },
  applyUpgrade: { enumerable: true, get: () => applyUpgrade }
});
