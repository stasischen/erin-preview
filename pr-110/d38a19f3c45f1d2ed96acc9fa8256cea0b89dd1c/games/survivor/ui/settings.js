function startAudio() { Survivor.audio.unlock(); }
function playSound(id) { return Survivor.audio.play(id); }

function updateAttackModeButtons() {
  for (const id of ['startAttackMode', 'pauseAttackMode']) {
    const button = document.getElementById(id);
    if (!button) continue;
    const manual = GAME_DATA.attackMode === 'manual';
    button.setAttribute('aria-checked', String(manual));
    button.setAttribute('aria-label', '手動攻擊');
    button.title = manual ? '切換為自動攻擊' : '切換為手動攻擊';
    button.innerHTML = '<span class="mode-pixel" aria-hidden="true"></span><span>攻擊：' + (manual ? '手動' : '自動') + '　切換</span>';
  }
}
function setAttackMode(mode) {
  if (!['manual', 'auto'].includes(mode)) return;
  cancelManualAttack();
  if (state.weaponAttack) state.weaponAttack.charge = 0;
  state.keys.delete('j'); state.keys.delete('k');
  GAME_DATA.attackMode = mode; GAME_DATA.attackModeChosen = true;
  if (!PREVIEW_MODE) {
    gameSettings.attackMode = mode; gameSettings.attackModeChosen = true; saveSettings();
  }
  state.shotTimer = effectiveShotInterval();
  updateAttackModeButtons(); updateActionControls();
}
for (const id of ['startAttackMode', 'pauseAttackMode']) {
  const button = document.getElementById(id);
  if (button) button.addEventListener('click', () => setAttackMode(GAME_DATA.attackMode === 'manual' ? 'auto' : 'manual'));
}
function updateSettingsButtons() {
  updateAttackModeButtons();
  for (const [id, key, icon, label] of [["soundToggle", "sound", "sound", "音效"], ["musicToggle", "music", "music", "音樂"]]) {
    const button = document.getElementById(id);
    if (!button) continue;
    button.innerHTML = SurvivorIcons.html(gameSettings[key] ? icon : key === "music" ? "music-off" : "mute");
    button.setAttribute("aria-label", label + (gameSettings[key] ? "：開" : "：關"));
    button.setAttribute("title", label + (gameSettings[key] ? "：開" : "：關"));
    button.setAttribute("aria-pressed", String(gameSettings[key]));
  }
  Survivor.audio.sync();
  vibrationToggle.setAttribute("aria-pressed",String(gameSettings.vibration));
  vibrationToggle.innerHTML = SurvivorIcons.html("vibration") + (gameSettings.vibration ? " 畫面震動：開" : " 畫面震動：關");
}

function updateSettingValue(key, value) {
  gameSettings[key] = Number(value);
  // 保留舊測試／展示呼叫的數值接合；玩家設定介面不再編輯或儲存玩法數值。
  if (SETTING_CONTROLS.some(item=>item.key===key)) {
    ENEMY_TYPES[0].speed=gameSettings.enemySpeed;ENEMY_TYPES[0].hp=gameSettings.enemyHealth;
    ENEMY_TYPES[1].speed=gameSettings.secondEnemySpeed;ENEMY_TYPES[1].hp=gameSettings.secondEnemyHealth;
    PLAYER_SPEED=gameSettings.playerSpeed;PLAYER_HEALTH=gameSettings.playerHealth;SHOT_INTERVAL=gameSettings.shotInterval;
    if(state.mode!=="playing" && state.mode!=="levelup") state.player.health=PLAYER_HEALTH;
  }
  applyPlayerSettings();
  state.joy=null; state.pointerId=null;
  if (!gameSettings.hitFeedback || gameSettings.feedbackIntensity===0) {state.hitStop=0;state.hitShake=0;}
  saveSettings(); Survivor.audio.sync(); updateHud(); updateActionControls();
}

function makeSettingsControls() {
  const fixed={};
  for (const id of ["pauseAttackMode","musicToggle","soundToggle","vibrationToggle"]) fixed[id]=document.getElementById(id);
  settingsControls.innerHTML = "";
  const groups = [
    ['操作',['joystickFollow','joystickRadius','joystickDeadZone']],
    ['手感',['hitFeedback','feedbackIntensity']],
    ['聲音',['musicVolume','soundVolume']],
    ['顯示',['lowEffects']]
  ];
  const labels={...SurvivorData.PLAYER_LABELS,joystickFollow:'搖桿跟隨',hitFeedback:'打擊回饋',lowEffects:'低特效（省電）'};
  for (const [title,keys] of groups) {
    const group=document.createElement('fieldset'), legend=document.createElement('legend');
    legend.textContent=title;group.appendChild(legend);settingsControls.appendChild(group);
    if (title==='操作') group.appendChild(fixed.pauseAttackMode);
    if (title==='手感') group.appendChild(vibrationToggle);
    if (title==='聲音') for(const id of ['musicToggle','soundToggle']) group.appendChild(fixed[id]);
    for (const key of keys) {
      const bounds=SurvivorData.PLAYER_BOUNDS[key];
      if (!bounds) {
        const button=document.createElement('button');button.type='button';button.className='settings-action';button.id='setting-'+key;
        const refresh=()=>{button.textContent=labels[key]+'：'+(gameSettings[key]?'開':'關');button.setAttribute('aria-checked',String(gameSettings[key]));};
        button.setAttribute('role','switch');button.addEventListener('click',()=>{gameSettings[key]=!gameSettings[key];applyPlayerSettings();state.joy=null;state.pointerId=null;if(!gameSettings.hitFeedback){state.hitStop=0;state.hitShake=0;}saveSettings();refresh();});
        refresh();group.appendChild(button);continue;
      }
      const row=document.createElement('label');row.className='setting-row';
      const heading=document.createElement('span');heading.className='setting-heading';
      const name=document.createElement('strong');name.textContent=labels[key];
      const value=document.createElement('span');value.className='setting-value';
      const range=document.createElement('input');range.type='range';range.id='setting-'+key;
      range.min=bounds[0];range.max=bounds[1];range.step=bounds[2];range.value=gameSettings[key];
      const show=()=>{value.textContent=key.endsWith('Volume')?Math.round(Number(range.value)*100)+'%':String(range.value);};
      range.setAttribute('aria-label',labels[key]);range.addEventListener('input',()=>{show();updateSettingValue(key,range.value);});
      heading.append(name,value);row.append(heading,range);group.appendChild(row);show();
    }
  }
  updateSettingsButtons();
}

let settingsReturnMode = "ready";
function openSettings() {
  if (state.mode === "transition") return;
  if (state.mode === "playing") togglePause();
  settingsReturnMode = state.mode;
  makeSettingsControls(); updateHud(); messageCard.hidden = true; upgradePanel.hidden = true;
  settingsPanel.hidden = false; overlay.classList.remove("hidden");
}
function closeSettings() {
  if (globalThis.SurvivorPreview) SurvivorPreview.stop();
  settingsPanel.hidden = true; messageCard.hidden = false;
  showOverlay(settingsReturnMode);
}



// Live accessors preserve shared state and the legacy globals used by preview/VM callers.
globalThis.Survivor.ui = globalThis.Survivor.ui || {};
globalThis.Survivor.ui.settings = globalThis.Survivor.ui.settings || {};
Object.defineProperties(globalThis.Survivor.ui.settings, {
  startAudio: { enumerable: true, get: () => startAudio },
  playSound: { enumerable: true, get: () => playSound },
  updateSettingsButtons: { enumerable: true, get: () => updateSettingsButtons },
  updateSettingValue: { enumerable: true, get: () => updateSettingValue },
  makeSettingsControls: { enumerable: true, get: () => makeSettingsControls },
  settingsReturnMode: { enumerable: true, get: () => settingsReturnMode },
  openSettings: { enumerable: true, get: () => openSettings },
  closeSettings: { enumerable: true, get: () => closeSettings }
});
