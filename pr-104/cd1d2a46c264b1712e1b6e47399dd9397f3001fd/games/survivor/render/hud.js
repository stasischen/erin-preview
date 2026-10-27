let lastSlotMarkup = "";
function updateHud() {
  const shownBoss = state.miniboss || state.boss;
  document.getElementById("bossName").textContent = state.miniboss ? GAME_DATA.chocobear.name + (state.miniboss.armor > 0 ? ' · 糖衣盔甲' : '') : state.trial ? state.trial.definition.name : GAME_DATA.boss.name;
  const maxHealth = maxPlayerHealth();
  const ratio = Math.max(0, state.player.health / maxHealth);
  healthFill.style.width = `${ratio * 100}%`;
  healthFill.style.background = ratio < 0.3 ? "linear-gradient(#ff8585 0 48%, #e13e4d 49%)" : "linear-gradient(#5be08b 0 48%, #24b75c 49%)";
  experienceFill.style.width = `${state.xp / experienceNeeded() * 100}%`;
  levelLabel.hidden=!!state.trial;statusEl.hidden=!!state.trial;
  const experienceWrap=document.querySelector('.experience-wrap');
  if(experienceWrap)experienceWrap.hidden=!!state.trial;
  levelLabel.textContent = `${state.stageIndex + 1}關 · Lv.${state.level}`;
  const slots = document.getElementById("buildSlots");
  const slotMarkup = Object.keys(BUILD_SLOTS).map((slot) => {
    const cards = UPGRADES.filter((card) => card.slot === slot && upgradeLevel(card.id));
    const weapon = slot === "attack" && state.weaponId ? activeWeapon() : null;
    const base = weapon ? SurvivorIcons.html(weapon.icon) + weapon.name : "";
    const detail = cards.map(card => `${SurvivorIcons.html(card.icon)}${card.name} Lv${upgradeLevel(card.id)} · ${card.school ? BUILD_TUNING[card.school].name : "支援"}`).join("、");
    return `<span><b>${SurvivorIcons.html(slot)}${BUILD_SLOTS[slot]}</b> <span>${[base,detail].filter(Boolean).join("、") || "尚未取得"}</span></span>`;
  }).join("");
  if (slotMarkup !== lastSlotMarkup) {
    slots.innerHTML = slotMarkup; lastSlotMarkup = slotMarkup;
    if (!PREVIEW_MODE && globalThis.SurvivorPreview) UPGRADES.filter(card => upgradeLevel(card.id)).forEach(card => {
      const button = document.createElement('button'); button.type = 'button'; button.textContent = card.name + '・看效果';
      button.addEventListener('click', () => SurvivorPreview.mount(document.getElementById('ownedPreview'), GAME_DATA, {kind:'card',id:card.id,level:upgradeLevel(card.id),weaponId:state.weaponId}));
      slots.appendChild(button);
    });
  }
  const gauge=document.getElementById('postureGauge');
  if(gauge) {
    gauge.hidden=!state.boss;
    const posture=state.boss&&state.boss.posture, config=GAME_DATA.boss.posture;
    const stunned=posture&&posture.stun>0, progress=posture?(stunned?posture.stun/config.stunSeconds:posture.value/config.maximum):0;
    const color=stunned?'#fff0a5':progress>=.75?'#ffb95c':'#9df6ff';
    const stops=[];for(let i=0;i<20;i++)stops.push(`${i/20<progress?color:'#375776'} ${i*18}deg ${i*18+14}deg`,`#162c43 ${i*18+14}deg ${(i+1)*18}deg`);
    gauge.style.background=`conic-gradient(${stops.join(',')})`;
    gauge.setAttribute('aria-valuenow',String(Math.round(progress*100)));
    gauge.setAttribute('aria-label',stunned?'老師暈眩，蓄力重擊':'老師架勢');
    gauge.title=stunned?'弱點！聚氣加快，蓄力重擊':progress>=.75?'架勢快滿了！準備蓄力':'完美閃避、收招命中或打斷可累積架勢';
    const icon=stunned?'weakpoint':'posture';
    if(gauge.dataset.icon!==icon){gauge.dataset.icon=icon;gauge.innerHTML='<span aria-hidden="true">'+SurvivorIcons.html(icon)+'</span>';}
  }
  bossHud.hidden = !shownBoss;
  if (shownBoss) bossHealthFill.style.width = `${Math.max(0, (shownBoss.hp + (shownBoss.armor || 0)) / (shownBoss.maxHp + (shownBoss.maxArmor || 0))) * 100}%`;
}


function updateActionControls() {
  Survivor.audio.sync();
  actionControls.hidden = state.mode !== "playing";
  if (typeof updateManualControls === "function") updateManualControls();
  actionControls.style.cssText = `--action-size: ${gameSettings.actionButtonSize}px`;
  for (const [button, remaining, total, label] of [
    [dashButton, state.dashCooldown, gameSettings.dashCooldown, "衝刺"],
    [skillButton, state.skillCooldown, gameSettings.bombCooldown, "泡泡炸彈"]
  ]) {
    const ready = button === dashButton ? state.dashCharges > 0 && state.dashTimer <= 0 : remaining <= 0;
    button.style.background = `conic-gradient(#9df6ff ${Math.max(0, 1 - remaining / total) * 360}deg, #375776 0deg)`;
    if (button === dashButton) {
      const segments = [], count = maxDashCharges();
      for (let i=0;i<count;i++) {
        const start=i*360/count, end=(i+1)*360/count-6;
        const fraction=i<state.dashCharges ? 1 : i===state.dashCharges ? Math.max(0,1-remaining/total) : 0;
        segments.push(`#9df6ff ${start}deg ${start+(end-start)*fraction}deg`, `#375776 ${start+(end-start)*fraction}deg ${end}deg`, `#162c43 ${end}deg ${(i+1)*360/count}deg`);
      }
      button.style.background = `conic-gradient(${segments.join(',')})`;
    }
    button.setAttribute("aria-disabled", String(!ready || state.mode !== "playing"));
    button.setAttribute("aria-label", ready ? label + "準備好了" : label + "冷卻中");
    button.title = ready ? label + "準備好了" : `${label}冷卻 ${Math.ceil(remaining)} 秒`;
  }
}
for (const [button, activate] of [[dashButton, activateDash], [skillButton, activateSkill]]) {
  button.addEventListener("pointerdown", (event) => { event.preventDefault(); event.stopPropagation(); activate(); });
  // 鍵盤與輔助操作仍可使用原生按鈕 click；指標按下已觸發，不重複施放。
  button.addEventListener("click", (event) => { if (event.detail === 0) activate(); });
}



// Live accessors preserve shared state and the legacy globals used by preview/VM callers.
globalThis.Survivor.render = globalThis.Survivor.render || {};
globalThis.Survivor.render.hud = globalThis.Survivor.render.hud || {};
Object.defineProperties(globalThis.Survivor.render.hud, {
  lastSlotMarkup: { enumerable: true, get: () => lastSlotMarkup },
  updateHud: { enumerable: true, get: () => updateHud },
  updateActionControls: { enumerable: true, get: () => updateActionControls }
});
