// 所有物件共用環形座標；負數也會回到 0～size。
function wrapCoordinate(value, size) { return size > 0 && (value < 0 || value >= size) ? ((value % size) + size) % size : value; }
function wrapDelta(to, from, size) {
  const diff = to - from;
  return size > 0 && Math.abs(diff) >= size / 2 ? wrapCoordinate(diff + size / 2, size) - size / 2 : diff;
}
function deltaX(to, from) { if(state.trial)return to-from; return wrapDelta(to, from, state.worldWidth); }
function deltaY(to, from) { if(state.trial)return to-from; return wrapDelta(to, from, state.worldHeight); }
function clampToMap(body) {
  if(state.trial) {
    const result=SurvivorTrialRules.boundary(body,state.trial.arena);
    Object.assign(body,result.position);if(result.hit){body.wallHit=true;if(body.rangeLeft!==undefined)body.alive=false;if(body.vx!==undefined)body.life=0;}
    return;
  }
  body.x = wrapCoordinate(body.x, state.worldWidth);
  body.y = wrapCoordinate(body.y, state.worldHeight);
}
function updateCamera() {
  if(state.trial) {const camera=SurvivorTrialRules.camera(state.player,state.trial.arena,state.width,state.height);state.cameraX=camera.x;state.cameraY=camera.y;return;}
  state.cameraX = state.player.x - state.width / 2;
  state.cameraY = state.player.y - state.height / 2;
}
function resetMap() {
  // 固定世界跨度，不依裝置螢幕大小決定。
  // 整張世界也是地磚的整數倍，跨過世界接縫時花紋不跳動。
  const span = 4096 * MAP_SCREENS;
  state.worldWidth = Math.ceil(span / 336) * 336;
  state.worldHeight = Math.ceil(span / 252) * 252;
}
function fitVisibleViewport() {
  const viewport = window.visualViewport;
  const width = viewport ? viewport.width : window.innerWidth;
  const height = viewport ? viewport.height : window.innerHeight;
  const rotated = window.innerHeight > window.innerWidth;
  // One viewport policy for HUD, levelup, settings and Maker, in shell coordinates.
  // Match the former CSS media queries using the layout viewport; visualViewport
  // still controls shell geometry and offsets below.
  const shellWidth = Math.max(window.innerWidth, window.innerHeight);
  const shellHeight = Math.min(window.innerWidth, window.innerHeight);
  if (gameShell.dataset) gameShell.dataset.short = [
    shellHeight <= 520 ? "compact" : "",
    shellWidth <= 660 ? "small" : "",
    shellWidth <= 600 ? "narrow" : ""
  ].filter(Boolean).join(" ");
  gameShell.style.width = `${rotated ? height : width}px`;
  gameShell.style.height = `${rotated ? width : height}px`;
  gameShell.style.left = `${viewport ? viewport.offsetLeft : 0}px`;
  gameShell.style.top = `${viewport ? viewport.offsetTop : 0}px`;
  gameShell.style.transform = rotated ? "rotate(90deg) translateY(-100%)" : "none";
}
// 固定 320000 平方世界單位，連續縮放鋪滿整個 Canvas，不取整或留邊。
// 740×360 手機約顯示 811×395 世界單位；大裝置放大，像素圖關閉平滑。
function worldViewport(cssWidth, cssHeight) {
  const zoom=Math.sqrt(cssWidth*cssHeight/(800*400));
  const width=cssWidth/zoom,height=cssHeight/zoom;
  return {width,height,zoom,screenWidth:cssWidth,screenHeight:cssHeight,
    viewLeft:0,viewTop:0};
}
function applyWorldViewport(cssWidth,cssHeight) {
  Object.assign(state,worldViewport(cssWidth,cssHeight));
  state.pixelRatio=Math.min(window.devicePixelRatio||1,2);
  canvas.width=Math.round(cssWidth*state.pixelRatio);canvas.height=Math.round(cssHeight*state.pixelRatio);
  ctx.setTransform(state.pixelRatio*state.zoom,0,0,state.pixelRatio*state.zoom,state.viewLeft*state.pixelRatio,state.viewTop*state.pixelRatio);
  ctx.imageSmoothingEnabled=false;
}
function resize() {
  fitVisibleViewport();
  // 旋轉或工具列改變高度時，放開舊搖桿，避免沿舊座標繼續走。
  state.pointerId = null; state.joy = null; state.keys.clear();
  if (typeof cancelManualAttack === "function") cancelManualAttack();
  // client 尺寸不含外框，也不受整個容器旋轉影響。
  const rect = canvas.getBoundingClientRect();
  applyWorldViewport(Math.max(1,canvas.clientWidth||rect.width),Math.max(1,canvas.clientHeight||rect.height));
  if (!state.worldWidth) {
    resetMap(); state.player.x = state.width * MAP_SCREENS / 2; state.player.y = state.height * MAP_SCREENS / 2;
  }

  clampToMap(state.player); updateCamera();
}


// Module accessors; original global functions and loop facade remain unchanged.
globalThis.Survivor.engine = globalThis.Survivor.engine || {};
globalThis.Survivor.engine['camera-viewport'] = globalThis.Survivor.engine['camera-viewport'] || {};
Object.defineProperties(globalThis.Survivor.engine['camera-viewport'], {
  wrapCoordinate: { enumerable: true, get: () => wrapCoordinate },
  wrapDelta: { enumerable: true, get: () => wrapDelta },
  deltaX: { enumerable: true, get: () => deltaX },
  deltaY: { enumerable: true, get: () => deltaY },
  clampToMap: { enumerable: true, get: () => clampToMap },
  updateCamera: { enumerable: true, get: () => updateCamera },
  resetMap: { enumerable: true, get: () => resetMap },
  fitVisibleViewport: { enumerable: true, get: () => fitVisibleViewport },
  worldViewport: { enumerable: true, get: () => worldViewport },
  applyWorldViewport: { enumerable: true, get: () => applyWorldViewport },
  resize: { enumerable: true, get: () => resize }
});
