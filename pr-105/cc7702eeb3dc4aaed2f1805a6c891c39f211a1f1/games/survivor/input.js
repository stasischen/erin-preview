function movementInput() {
  let x = 0, y = 0;
  if (state.keys.has("ArrowLeft") || state.keys.has("a")) x--;
  if (state.keys.has("ArrowRight") || state.keys.has("d")) x++;
  if (state.keys.has("ArrowUp") || state.keys.has("w")) y--;
  if (state.keys.has("ArrowDown") || state.keys.has("s")) y++;
  if (state.joy) { x += state.joy.x; y += state.joy.y; }
  const length = Math.max(1, Math.hypot(x, y));
  return { x: x / length, y: y / length };
}
// 流派可以混搭；四欄顯示本局已拿到的效果，不會蓋掉先前選的卡。

document.addEventListener("click", event => { if (event.target && event.target.closest && event.target.closest("button")) playSound("click"); });
settingsButton.addEventListener("click", openSettings);
closeSettingsButton.addEventListener("click", closeSettings);
resetSettingsButton.addEventListener("click", () => {
  Object.assign(gameSettings,SurvivorData.playerDefaults(GAME_DATA));
  applyPlayerSettings();setAttackMode(gameSettings.attackMode);saveSettings();makeSettingsControls();
});
soundToggle.addEventListener("click", () => { gameSettings.sound = !gameSettings.sound; saveSettings(); updateSettingsButtons(); if (gameSettings.sound) playSound("click"); });
document.getElementById("musicToggle").addEventListener("click", () => { gameSettings.music = !gameSettings.music; saveSettings(); updateSettingsButtons(); });
vibrationToggle.addEventListener("click", () => { gameSettings.vibration = !gameSettings.vibration; saveSettings(); updateSettingsButtons(); });
startButton.addEventListener("click", () => { startAudio(); state.mode === "paused" ? togglePause() : startGame(); });
pauseButton.addEventListener("click", () => { if (state.mode === "playing" || state.mode === "paused") togglePause(); });
window.addEventListener("keydown", (event) => {
  if(state.mode==='trial-confirm'){if(event.key==='Escape')confirmTrialMenu(false);return;}
  const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
  if (state.mode === "maker" || settingsPanel.hidden === false || (state.mode !== "playing" && event.target && event.target.tagName === "BUTTON") || (event.target && /^(INPUT|TEXTAREA|SELECT)$/.test(event.target.tagName))) return;
  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " ", "e"].includes(key)) event.preventDefault();
  state.keys.add(key);
  if (event.repeat) return;
  if (key === "Escape") togglePause();
  if (key === " ") activateDash();
  if (key === "e") activateSkill();
  if (key === "j") beginManualAttack("attack");
  if (key === "k") beginManualAttack("special");
});
window.addEventListener("keydown", (event) => { if (state.mode === "levelup" && /^[123]$/.test(event.key)) { event.preventDefault(); applyUpgrade(Number(event.key) - 1); } });
window.addEventListener("keyup", (event) => { const key=event.key.length===1?event.key.toLowerCase():event.key; state.keys.delete(key); if(key==="j") releaseManualAttack("attack"); if(key==="k") releaseManualAttack("special"); });
window.addEventListener("blur", () => { state.keys.clear(); cancelManualAttack(); if (state.mode === "playing") showOverlay("paused"); });
document.addEventListener("visibilitychange", () => { if (document.hidden && state.mode === "playing") showOverlay("paused"); Survivor.audio.sync(); });
window.addEventListener("contextmenu", (event) => event.preventDefault());
// CSS 直拿時順時針轉 90 度；把螢幕位置轉回遊戲位置（包含縮放）。
function canvasScreenPoint(event) {
  const rect = canvas.getBoundingClientRect();
  if (window.innerHeight > window.innerWidth) {
    return { x: (event.clientY - rect.top) * (state.screenWidth||state.width) / rect.height,
      y: (rect.right - event.clientX) * (state.screenHeight||state.height) / rect.width };
  }
  return { x: (event.clientX - rect.left) * (state.screenWidth||state.width) / rect.width,
    y: (event.clientY - rect.top) * (state.screenHeight||state.height) / rect.height };
}
function canvasPoint(event) {
  const p=canvasScreenPoint(event),zoom=state.zoom||1;
  return {x:(p.x-(state.viewLeft||0))/zoom,y:(p.y-(state.viewTop||0))/zoom};
}
// 純計算：底座沿原拖曳方向移動，碰到界線即停止，避免斜向貼邊時方向歪掉。
// 外圈與搖桿頭皆留在左半畫面；極小視窗時縮小顯示。
function joystickBounds(width, height, radius) {
  const inset = Math.max(0, Math.min(radius + 19, width / 4, height / 2));
  return { minX: inset, maxX: width / 2 - inset, minY: inset, maxY: height - inset };
}
function clampJoystickBase(point, bounds) {
  return { baseX: Math.max(bounds.minX, Math.min(bounds.maxX, point.x)),
    baseY: Math.max(bounds.minY, Math.min(bounds.maxY, point.y)) };
}
function calculateJoystick(joy, point, config, bounds) {
  let { baseX, baseY } = joy;
  const dx = point.x - baseX, dy = point.y - baseY, distance = Math.hypot(dx, dy);
  if (!distance) return { baseX, baseY, x: 0, y: 0 };
  const ux = dx / distance, uy = dy / distance;
  if (config.follow && distance > config.radius) {
    let travel = distance - config.radius;
    if (ux > 0) travel = Math.min(travel, (bounds.maxX - baseX) / ux);
    if (ux < 0) travel = Math.min(travel, (bounds.minX - baseX) / ux);
    if (uy > 0) travel = Math.min(travel, (bounds.maxY - baseY) / uy);
    if (uy < 0) travel = Math.min(travel, (bounds.minY - baseY) / uy);
    travel = Math.max(0, travel);
    baseX += ux * travel; baseY += uy * travel;
  }
  const remaining = Math.hypot(point.x - baseX, point.y - baseY);
  const amount = Math.max(0, Math.min(1, (remaining - config.deadZone) / (config.radius - config.deadZone)));
  return { baseX, baseY, x: ux * amount, y: uy * amount };
}
canvas.addEventListener("pointerdown", (event) => {
  if (state.mode !== "playing" || event.target.closest("button")) return;
  if (state.pointerId !== null) return;
  const point = canvasScreenPoint(event);
  if (point.x < 0 || point.x > (state.screenWidth||state.width) / 2 || point.y < 0 || point.y > (state.screenHeight||state.height)) return;
  event.preventDefault(); state.pointerId = event.pointerId; canvas.setPointerCapture(event.pointerId);
  state.joy = { ...clampJoystickBase(point, joystickBounds(state.screenWidth||state.width, state.screenHeight||state.height, GAME_DATA.joystick.radius)), x: 0, y: 0 };
});
canvas.addEventListener("pointermove", (event) => {
  if (event.pointerId !== state.pointerId || !state.joy) return;
  event.preventDefault();
  state.joy = calculateJoystick(state.joy, canvasScreenPoint(event), GAME_DATA.joystick,
    joystickBounds(state.screenWidth||state.width, state.screenHeight||state.height, GAME_DATA.joystick.radius));
});
function endPointer(event) { if (event.pointerId !== state.pointerId) return; state.pointerId = null; state.joy = null; }
canvas.addEventListener("pointerup", endPointer); canvas.addEventListener("pointercancel", endPointer); canvas.addEventListener("lostpointercapture", endPointer);
window.addEventListener("resize", () => { if (!PREVIEW_MODE) resize(); });
if (window.visualViewport && !PREVIEW_MODE) {
  window.visualViewport.addEventListener("resize", resize);
  window.visualViewport.addEventListener("scroll", resize);
}
if (!PREVIEW_MODE) { resize(); showOverlay("ready"); renderLoop(); }
if (MAKER_MODE && !PREVIEW_MODE) {
  const makerLink = document.getElementById("makerLink");
  makerLink.innerHTML = SurvivorIcons.html("maker") + " 回設計室";
  if (MAKER_LOAD.valid && new URLSearchParams(location.search).get("play") === "1") startGame();
  else textEl.textContent = MAKER_LOAD.errors.join("；") + "。本次使用預設作品。";
}


// Live accessors preserve shared state and the legacy globals used by preview/VM callers.
globalThis.Survivor.input = globalThis.Survivor.input || {};
Object.defineProperties(globalThis.Survivor.input, {
  movementInput: { enumerable: true, get: () => movementInput },
  canvasPoint: { enumerable: true, get: () => canvasPoint },
  calculateJoystick: { enumerable: true, get: () => calculateJoystick },
  joystickBounds: { enumerable: true, get: () => joystickBounds },
  endPointer: { enumerable: true, get: () => endPointer }
});

if(!PREVIEW_MODE) {
  document.getElementById('trialEntry').onclick=requestTrialMenu;
  document.getElementById('trialConfirmYes').onclick=()=>confirmTrialMenu(true);
  document.getElementById('trialConfirmNo').onclick=()=>confirmTrialMenu(false);
  document.getElementById('trialBack').onclick=closeTrialMenu;
}
