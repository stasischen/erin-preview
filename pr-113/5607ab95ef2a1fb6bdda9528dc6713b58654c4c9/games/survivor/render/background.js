const BACKGROUND_TILES = {};
let BACKGROUND_GLOW;
function backgroundGlow() {
  if (BACKGROUND_GLOW !== undefined) return BACKGROUND_GLOW;
  const canvas=document.createElement('canvas');canvas.width=canvas.height=672;
  const g=canvas.getContext('2d');if(!g||!g.createRadialGradient){BACKGROUND_GLOW=null;return null;}
  const glow=g.createRadialGradient(336,336,0,336,336,336);
  if(!glow||typeof glow.addColorStop!=='function'){BACKGROUND_GLOW=null;return null;}
  glow.addColorStop(0,'rgba(56,141,230,0.22)');glow.addColorStop(.55,'rgba(56,141,230,0.08)');glow.addColorStop(1,'rgba(56,141,230,0)');
  g.fillStyle=glow;g.fillRect(0,0,672,672);BACKGROUND_GLOW=canvas;return canvas;
}
// Broad matte tiles only: fine parallel lines shimmer under a moving scaled camera.
function backgroundTile(kind, density) {
  const replacement = SurvivorArt.picture('background/'+kind);
  if (replacement) return replacement;
  if (density === undefined) density = .25;
  const key = density === .25 ? kind : kind + ":" + density;
  if (BACKGROUND_TILES[key]) return BACKGROUND_TILES[key];
  const tile = document.createElement("canvas"); tile.width = 336; tile.height = 252;
  const g = tile.getContext("2d"); g.imageSmoothingEnabled = false;
  const colors = ["#1b1633", "#201c3b", "#3b3655"];
  g.fillStyle = colors[0]; g.fillRect(0, 0, 336, 252);
  // 84 整除四邊；圖案遠離邊緣，拼接線兩側都是同一底色。
  for (let y = 0; y < 252; y += 84) for (let x = 0; x < 336; x += 84) {
    g.fillStyle = (x / 84 + y / 84) % 2 ? '#1d1937' : colors[1];
    g.fillRect(x + 2, y + 2, 80, 80);
  }
  const marks = [[42,42], [210,126], [294,210], [126,42]];
  g.fillStyle = colors[2];
  marks.slice(0, Math.round(density * marks.length)).forEach(([x,y]) => {
    // 只有 12×6 的落葉／餅乾碎屑，遠小於怪物，也不使用寶石的圓形輪廓。
    g.fillRect(x - 6, y - 2, 8, 2); g.fillRect(x - 2, y, 8, 2);
  });
  BACKGROUND_TILES[key] = tile; return tile;
}

function drawClassroom() {
  return SurvivorArt.paint('layer/draw-classroom', null, () => drawClassroomPlaceholder.apply(this, arguments));
}
function drawClassroomPlaceholder() {
  if(SurvivorWaves.enabled()){SurvivorEnvironment.draw();return;}
  const tile = backgroundTile(currentStage().background, currentStage().decorationDensity);
  const left = Math.floor(state.cameraX / 336) * 336;
  const top = Math.floor(state.cameraY / 252) * 252;
  ctx.save();ctx.imageSmoothingEnabled=true;
  for (let y = top; y < state.cameraY + state.height + 16; y += 252)
    for (let x = left; x < state.cameraX + state.width + 16; x += 336) ctx.drawImage(tile, x, y);
  ctx.restore();
  const glow=backgroundGlow();if(glow)ctx.drawImage(glow,state.cameraX+state.width/2-336,state.cameraY+state.height/2-336);
}


// Module accessors; legacy global functions and world facade remain unchanged.
globalThis.Survivor.render = globalThis.Survivor.render || {};
globalThis.Survivor.render['background'] = globalThis.Survivor.render['background'] || {};
Object.defineProperties(globalThis.Survivor.render['background'], {
  backgroundGlow: { enumerable: true, get: () => backgroundGlow },
  backgroundTile: { enumerable: true, get: () => backgroundTile },
  drawClassroom: { enumerable: true, get: () => drawClassroom },
  drawClassroomPlaceholder: { enumerable: true, get: () => drawClassroomPlaceholder },
  BACKGROUND_TILES: { enumerable: true, get: () => BACKGROUND_TILES },
  BACKGROUND_GLOW: { enumerable: true, get: () => BACKGROUND_GLOW }
});
