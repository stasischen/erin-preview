// Classic scripts share lexical bindings for legacy callers; public API lives in Survivor.
globalThis.Survivor = window.Survivor = window.Survivor || {};
Survivor.engine = Survivor.engine || {};
Survivor.engine.schools = SurvivorSchools;
Survivor.engine.neutral = SurvivorNeutral;
Survivor.engine['effect-blocks'] = SurvivorEffectBlocks;
const PREVIEW_MODE = !!globalThis.SURVIVOR_PREVIEW;
// Maker 資料只在 ?maker=1 試玩時啟用；一般遊戲沿用預設與原設定。
const MAKER_MODE = PREVIEW_MODE || typeof location !== "undefined" && new URLSearchParams(location.search).get("maker") === "1";
const MAKER_LOAD = PREVIEW_MODE ? { data: globalThis.SURVIVOR_PREVIEW.data, valid: true } : MAKER_MODE ? SurvivorData.load() : null;
const GAME_DATA = MAKER_MODE ? MAKER_LOAD.data : SurvivorData.defaults();
// ✏️ Erin 設定區：改下面的數字，就能改變遊戲玩法。
const UPGRADE_TUNING = GAME_DATA.tuning;
// ✏️ Erin 可以改：每場重抽次數預設 2；在 data/defaults.js 的 levelupRerolls 或 Maker 調整（0～9）。
const LEVELUP_REROLLS = UPGRADE_TUNING.levelupRerolls;
// ✏️ Erin 可以改：老師每招先亮提示才出手；這些是待試玩的初值。
const BOSS_TUNING = GAME_DATA.bossTuning;
const BOSS_MOVES = GAME_DATA.boss.moves;
// ✏️ Erin 可以改：這些是流派的試玩初值；水／風／雷也可以改名。
const BUILD_TUNING = GAME_DATA.build;
// ✏️ Erin 可以改：技能閃光最多同時幾個；閃電留幾秒（建議 0.15～0.25）。
const VFX_TUNING = { limit: 48, lightningSeconds: 0.22 };
const BUILD_SLOTS = { attack: "普攻", skill: "技能", dash: "衝刺", passive: "被動" };
const SETTINGS_KEY = "erin-preview:pr-104:13851b6fd7c9f7683231b36c9e2613c30f050909:erin-survivor-settings-v3";
const PLAYER_SETTINGS_KEY = "erin-preview:pr-104:13851b6fd7c9f7683231b36c9e2613c30f050909:erin-survivor-player-settings-v1";
const TRIAL_RECORD_KEY = "erin-preview:pr-104:13851b6fd7c9f7683231b36c9e2613c30f050909:erin-survivor-trial-best-seconds-v1";
const MAKER_TRIAL_RECORD_KEY = "erin-preview:pr-104:13851b6fd7c9f7683231b36c9e2613c30f050909:erin-survivor-maker-trial-best-seconds-v1";
const RECORD_KEY = MAKER_MODE ? "erin-preview:pr-104:13851b6fd7c9f7683231b36c9e2613c30f050909:erin-survivor-maker-best-seconds-v1" : "erin-preview:pr-104:13851b6fd7c9f7683231b36c9e2613c30f050909:erin-survivor-best-seconds-v1";
const SETTING_DEFAULTS = {
  playerSpeed: UPGRADE_TUNING.playerSpeed, playerHealth: UPGRADE_TUNING.playerHealth,
  enemySpeed: GAME_DATA.enemies[0].speed, enemyHealth: GAME_DATA.enemies[0].hp,
  secondEnemySpeed: GAME_DATA.enemies[1].speed, secondEnemyHealth: GAME_DATA.enemies[1].hp,
  waveSeconds: UPGRADE_TUNING.waveSeconds, teacherHealth: GAME_DATA.boss.hp,
  shotInterval: UPGRADE_TUNING.shotInterval, spawnScale: 1,
  enemyShootLevel: UPGRADE_TUNING.enemyShootLevel,
  enemyShotInterval: UPGRADE_TUNING.enemyShotInterval, secondEnemyShotInterval: UPGRADE_TUNING.secondEnemyShotInterval,
  enemyShotSpeed: UPGRADE_TUNING.enemyShotSpeed, enemyShotDamage: UPGRADE_TUNING.enemyShotDamage,
  dashCooldown: UPGRADE_TUNING.dashCooldown,
  dashSeconds: UPGRADE_TUNING.dashSeconds,
  dashMultiplier: UPGRADE_TUNING.dashMultiplier,
  bombCooldown: UPGRADE_TUNING.bombCooldown,
  bombDelay: UPGRADE_TUNING.bombDelay,
  bombDamage: UPGRADE_TUNING.bombDamage,
  bombRadius: UPGRADE_TUNING.bombRadius,
  bombKnockback: UPGRADE_TUNING.bombKnockback,
  actionButtonSize: UPGRADE_TUNING.actionButtonSize,
  ...SurvivorData.playerDefaults(GAME_DATA)
};
const SETTING_CONTROLS = [
  { key: "dashCooldown", label: "衝刺後休息幾秒", min: 1, max: 8, step: 0.5, unit: " 秒" },
  { key: "dashSeconds", label: "衝刺持續幾秒", min: 0.1, max: 0.4, step: 0.05, unit: " 秒" },
  { key: "dashMultiplier", label: "衝刺是平常速度的幾倍", min: 2, max: 5, step: 0.5, unit: " 倍" },
  { key: "bombCooldown", label: "泡泡炸彈用完休息幾秒", min: 2, max: 15, step: 1, unit: " 秒" },
  { key: "bombDelay", label: "泡泡放下後幾秒爆開", min: 0.2, max: 1.5, step: 0.1, unit: " 秒" },
  { key: "bombDamage", label: "泡泡爆開扣多少敵人的血", min: 20, max: 300, step: 10, unit: "" },
  { key: "bombRadius", label: "泡泡能打到多遠", min: 50, max: 180, step: 10, unit: "" },
  { key: "bombKnockback", label: "泡泡把敵人推多遠", min: 10, max: 100, step: 5, unit: "" },
  { key: "actionButtonSize", label: "動作按鈕有多大", min: 72, max: 104, step: 4, unit: " px" },

  { key: "playerSpeed", label: "水星人速度", min: 100, max: 320, step: 10, unit: "" },
  { key: "playerHealth", label: "水星人血量", min: 40, max: 200, step: 10, unit: "" },
  { key: "enemySpeed", label: "甲本速度", min: 30, max: 130, step: 5, unit: "" },
  { key: "enemyHealth", label: "甲本血量", min: 40, max: 240, step: 10, unit: "" },
  { key: "secondEnemySpeed", label: "乙本速度", min: 45, max: 170, step: 5, unit: "" },
  { key: "secondEnemyHealth", label: "乙本血量", min: 30, max: 180, step: 10, unit: "" },
  { key: "waveSeconds", label: "老師出場時間", min: 60, max: 300, step: 10, unit: " 秒" },
  { key: "teacherHealth", label: "老師血量", min: 500, max: 3000, step: 100, unit: "" },
  { key: "shotInterval", label: "水球發射間隔", min: 0.25, max: 1.5, step: 0.05, unit: " 秒" },
  { key: "enemyShootLevel", label: "甲乙本開始丟字等級", min: 2, max: 20, step: 1, unit: " 級" },
  { key: "enemyShotInterval", label: "甲本丟字間隔", min: 1, max: 10, step: 0.5, unit: " 秒" },
  { key: "secondEnemyShotInterval", label: "乙本丟字間隔", min: 1, max: 12, step: 0.5, unit: " 秒" },
  { key: "enemyShotSpeed", label: "甲乙本國字速度", min: 50, max: 200, step: 10, unit: "" },
  { key: "enemyShotDamage", label: "甲乙本國字傷害", min: 1, max: 30, step: 1, unit: "" },
  { key: "spawnScale", label: "波次出怪速度", min: 0.5, max: 2, step: 0.1, unit: " 倍", format: (value) => value.toFixed(1) }
];
function loadSavedSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}");
    const result = { ...SETTING_DEFAULTS };
    if (saved.attackModeChosen === true && ["auto", "manual"].includes(saved.attackMode)) {
      result.attackMode = saved.attackMode; result.attackModeChosen = true;
    }
    for (const item of SETTING_CONTROLS) {
      const value = Number(saved[item.key]);
      if (Number.isFinite(value)) result[item.key] = Math.max(item.min, Math.min(item.max, value));
    }
    if (typeof saved.sound === "boolean") result.sound = saved.sound;
    if (typeof saved.music === "boolean") result.music = saved.music;
    if (typeof saved.vibration === "boolean") result.vibration = saved.vibration;
    return result;
  } catch (_) { return { ...SETTING_DEFAULTS }; }
}
function loadPlayerSettings() {
  const base = SurvivorData.playerDefaults(GAME_DATA);
  if (PREVIEW_MODE) return base;
  try {
    const raw=localStorage.getItem(PLAYER_SETTINGS_KEY);
    if (raw !== null) return SurvivorData.normalizePlayer(JSON.parse(raw),base);
    const readLegacy=key=>{try{return JSON.parse(localStorage.getItem(key) || 'null');}catch(_){return null;}};
    const old=readLegacy(SETTINGS_KEY);
    const workRaw=readLegacy(SurvivorData.KEY);
    const work=workRaw ? SurvivorData.validate(workRaw) : null;
    const legacy=work && work.valid ? SurvivorData.playerDefaults(work.data) : base;
    const migrated=old ? {...legacy,...old} : legacy;
    if(old && Object.prototype.hasOwnProperty.call(old,'attackMode')) migrated.attackModeChosen=old.attackModeChosen===true;
    const result=SurvivorData.normalizePlayer(migrated,base);
    try {localStorage.setItem(PLAYER_SETTINGS_KEY,JSON.stringify(result));} catch (_) {}
    return result;
  } catch (_) { return base; }
}
let gameSettings = {...(MAKER_MODE ? SETTING_DEFAULTS : loadSavedSettings()), ...loadPlayerSettings()};
function applyPlayerSettings() {
  GAME_DATA.attackMode=gameSettings.attackMode;
  GAME_DATA.joystick={follow:gameSettings.joystickFollow,radius:gameSettings.joystickRadius,deadZone:gameSettings.joystickDeadZone};
  GAME_DATA.hitJuice={enabled:gameSettings.hitFeedback,intensity:gameSettings.feedbackIntensity};
}
applyPlayerSettings();
function saveSettings() {
  try { if (!PREVIEW_MODE) localStorage.setItem(PLAYER_SETTINGS_KEY, JSON.stringify(SurvivorData.normalizePlayer(gameSettings))); } catch (_) { /* 儲存空間不可用時仍可正常遊玩 */ }
}
function loadBestRecord() {
  try { const value = Number(localStorage.getItem(RECORD_KEY)); return Number.isFinite(value) && value > 0 ? value : 0; } catch (_) { return 0; }
}
let bestRecord = PREVIEW_MODE ? 0 : loadBestRecord();
const trialRecordMemory={normal:null,maker:null};
function loadTrialRecords(custom=false) {
  const mode=custom?'maker':'normal';
  if(trialRecordMemory[mode])return {...trialRecordMemory[mode]};
  let saved={};
  try {if(!PREVIEW_MODE)saved=JSON.parse(localStorage.getItem(custom?MAKER_TRIAL_RECORD_KEY:TRIAL_RECORD_KEY)||'{}');}catch(_){}
  const valid=saved&&typeof saved==='object'&&!Array.isArray(saved)?saved:{};
  trialRecordMemory[mode]=Object.fromEntries(GAME_DATA.gallery.bosses.filter(b=>Object.hasOwn(valid,b.id)&&typeof valid[b.id]==='number'&&Number.isFinite(valid[b.id])&&valid[b.id]>0).map(b=>[b.id,valid[b.id]]));
  return {...trialRecordMemory[mode]};
}
function saveTrialRecord(id,seconds,won,custom=false) {
  const before=loadTrialRecords(custom),next=SurvivorTrialBlocks.record(before,id,seconds,won);
  if(next[id]===before[id])return next;
  trialRecordMemory[custom?'maker':'normal']=next;
  try {if(!PREVIEW_MODE)localStorage.setItem(custom?MAKER_TRIAL_RECORD_KEY:TRIAL_RECORD_KEY,JSON.stringify(next));}catch(_){}
  return {...next};
}

let PLAYER_SPEED = gameSettings.playerSpeed; // 請改上面的 playerSpeed
let PLAYER_HEALTH = gameSettings.playerHealth; // 請改上面的 playerHealth
const ENEMY_LIMIT = UPGRADE_TUNING.enemyLimit; // 請改上面的 enemyLimit
const ENEMY_TYPES = GAME_DATA.enemies;
// ✏️ Erin 可以改每一波：開始秒數、甲本比例、乙本比例、幾秒出一隻。
// 比例加起來請等於 1；秒數越小，怪物越常出現。
const WAVES = GAME_DATA.waves;
const STAGES = GAME_DATA.stages;

// 相容舊的程式介面；新美術請改 art-manifest.js，不再另行載入圖片。
const SPRITES = { player: null, jaben: null, otsubon: null };
// ✏️ Erin 可以改水星人的顏色；每個字是一個像素，句點是透明。
const HERO_COLORS = { o: "#183b70", d: "#2464bb", b: "#388de6", l: "#78cfff", h: "#d6f6ff", w: "#ffffff", p: "#142e57", c: "#98dffa" };
const HERO_PIXELS = [
  "..........o.........",
  ".........olo........",
  ".....o...olbo.......",
  ".....olo.olbo..o....",
  "......oloolbo.olo...",
  "......ollllboolbo...",
  ".......olllbbldo....",
  ".......olllbbdo.....",
  "......ollllbbbdo....",
  ".....olhlllbbbbdo...",
  "....olhhlllbbbbddo..",
  "...olhhllllbbbbdddo.",
  "..olhllllllbbbbdddo.",
  "..ollllllllbbbbdddo.",
  ".ollllllllbbbbbddddo",
  ".olllllllbbbbbbddddo",
  ".olllllllbbbbbbddddo",
  ".olllllllbbbbbbddddo",
  "..olllllbbbbbbddddo.",
  "..olllllbbbbbbddddo.",
  "...ollllbbbbbddddo..",
  "....odbbbbbbddddo...",
  ".....ooddddddoo.....",
  ".......oooooo......."
];
// 用子彈的資料色盤替換身體；深色輪廓、眼睛和表情保留原色。
// 深淺比例沿用原本水球的亮面／陰影，雙色以中線分開。
function heroPixelColor(token, x, colors) {
  const shade = { d: -.32, b: 0, l: .36, h: .8, c: .55 }[token];
  if (!colors.length || shade === undefined) return HERO_COLORS[token];
  const color = colors[Math.min(colors.length - 1, Math.floor(x / 10))];
  const channels = color.slice(1).match(/../g).map(part => parseInt(part, 16));
  return '#' + channels.map(value => Math.round(shade < 0 ? value * (1 + shade) : value + (255 - value) * shade).toString(16).padStart(2, '0')).join('');
}
function makeHeroPicture(hurt, colors = []) {
  const picture = document.createElement("canvas");
  picture.width = 20; picture.height = 24;
  const pen = picture.getContext("2d");
  HERO_PIXELS.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      if (row[x] === ".") continue;
      pen.fillStyle = heroPixelColor(row[x], x, colors); pen.fillRect(x, y, 1, 1);
    }
  });
  function pixels(color, x, y, w, h) { pen.fillStyle = heroPixelColor(color, x, colors); pen.fillRect(x, y, w, h); }
  if (hurt) {
    // 痛痛時閉眼，嘴巴變成小小的 O。
    for (const x of [5, 12]) {
      pixels("p", x, 13, 1, 1); pixels("p", x + 1, 14, 2, 1); pixels("p", x, 15, 1, 1);
    }
    pixels("p", 9, 17, 3, 3); pixels("h", 10, 18, 1, 1);
  } else {
    for (const x of [4, 11]) {
      pixels("o", x, 12, 5, 5); pixels("w", x, 12, 4, 4);
      pixels("p", x + 2, 13, 2, 3); pixels("w", x + 2, 13, 1, 1);
    }
    pixels("p", 8, 18, 1, 1); pixels("p", 9, 19, 3, 1); pixels("p", 12, 18, 1, 1);
  }
  pixels("c", 3, 17, 3, 1); pixels("c", 14, 17, 3, 1);
  return picture;
}
const HERO_PICTURES = { happy: makeHeroPicture(false), hurt: makeHeroPicture(true) };
// 只在配色改變時產生小圖，暫停、移動與受傷閃爍都直接重用。
const HERO_SCHOOL_PICTURES = {};
function heroSchoolPicture(hurt, schools) {
  if (!schools.length) return hurt ? HERO_PICTURES.hurt : HERO_PICTURES.happy;
  const colors = schools.map(id => BUILD_TUNING[id].color);
  const key = colors.join(':') + ':' + hurt;
  if (!HERO_SCHOOL_PICTURES[key]) HERO_SCHOOL_PICTURES[key] = makeHeroPicture(hurt, colors);
  return HERO_SCHOOL_PICTURES[key];
}
const INVINCIBLE_SECONDS = UPGRADE_TUNING.invincibleSeconds; // 請改上面的 invincibleSeconds
let SHOT_INTERVAL = gameSettings.shotInterval; // 請改上面的 shotInterval
const PROJECTILE_DAMAGE = UPGRADE_TUNING.projectileDamage; // 請改上面的 projectileDamage
const PROJECTILE_SPEED = UPGRADE_TUNING.projectileSpeed; // 請改上面的 projectileSpeed
const PROJECTILE_LIMIT = UPGRADE_TUNING.projectileLimit; // 請改上面的 projectileLimit
const GEM_LIMIT = UPGRADE_TUNING.gemLimit; // 請改上面的 gemLimit
const GEM_PULL_RADIUS = UPGRADE_TUNING.gemPullRadius; // 請改上面的 gemPullRadius
const XP_TO_LEVEL = UPGRADE_TUNING.xpToLevel; // 請改上面的 xpToLevel
const MAX_DT = 0.05;
const HIT_FLASH_SECONDS = 0.08;
const KNOCKBACK_SPEED = 90;
const WATER_COLOR = "#168cff"; // Erin 可以改水球顏色
const GEM_COLOR = "#ff9f24"; // Erin 可以改經驗寶石顏色


// Erin 可以在這裡調整升級卡；專屬卡等 Erin 決定名稱、圖示和效果後再加入。
const UPGRADES = GAME_DATA.cards;

const stage = document.getElementById("stage");
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const overlay = document.getElementById("overlay");
const titleEl = document.getElementById("messageTitle");
const textEl = document.getElementById("messageText");
const iconEl = document.getElementById("messageIcon");
const startButton = document.getElementById("startButton");
const pauseButton = document.getElementById("pauseButton");
const healthFill = document.getElementById("healthFill");
const statusEl = document.getElementById("status");
const experienceFill = document.getElementById("experienceFill");
const bossHud = document.getElementById("bossHud");
const bossHealthFill = document.getElementById("bossHealthFill");
const levelLabel = document.getElementById("levelLabel");
const messageCard = document.querySelector(".message-card");
const upgradePanel = document.getElementById("upgradePanel");
const upgradeCards = document.getElementById("upgradeCards");
const settingsPanel = document.getElementById("settingsPanel");
const settingsControls = document.getElementById("settingsControls");
const settingsButton = document.getElementById("settingsButton");
const closeSettingsButton = document.getElementById("closeSettingsButton");
const resetSettingsButton = document.getElementById("resetSettingsButton");
const soundToggle = document.getElementById("soundToggle");
const vibrationToggle = document.getElementById("vibrationToggle");

const actionControls = document.getElementById("actionControls");
const dashButton = document.getElementById("dashButton");
const skillButton = document.getElementById("skillButton");
const enemyNotice = document.getElementById("enemyNotice");
const BOOK_CHARACTERS = ["甲", "乙", "字", "考", "寫", "讀"];

const state = { bossZone: null, stageIndex: 0, stageElapsed: 0, stageTransition: 0, enemyHazards: [], makerFields: [], makerTimers: {}, bossMoves: [], bossMovePool: [], bossPhase: 1, bossPhasePause: 0, bossRest: 0, lastBossMoves: [], bossShout: 0, bossShake: 0, vfx: [], vfxPool: [], dashTimer: 0, dashCooldown: 0, dashCharges: UPGRADE_TUNING.dashCharges, dashAttack: 0, slowMotion: 0, dashGhosts: [], skillCooldown: 0, dashX: 1, dashY: 0, faceX: 1, faceY: 0, bomb: null, bombBlast: null, fields: [], fieldPool: [], trailDistance: 0, mode: "ready", player: { x: 0, y: 0, r: 18, health: PLAYER_HEALTH, invincible: 0, hitFlash: 0, walkPhase: 0, moving: false, facing: 1 }, enemies: [], projectiles: [], enemyShots: [], enemyShotPool: [], bookShotTimer: 0, bookNoticeTimer: 0, bookShootingStarted: false, gems: [], effects: [], projectilePool: [], gemPool: [], effectPool: [], keys: new Set(), pointerId: null, joy: null, elapsed: 0, spawnTimer: 0, shotTimer: 0, healTimer: 0, boss: null, bossIntro: 0, xp: 0, level: 1, upgrades: {}, pendingChoices: [], rerollsRemaining: LEVELUP_REROLLS, lastTime: 0, width: 0, height: 0 };

let sharedAudio = null;

function takeFromPool(pool, values) {
  const item = pool.pop() || {};
  delete item.hitStop;delete item.feedbackFrozen;delete item.feedbackNumberScale;delete item.numberScale;
  Object.assign(item, values);
  if (Number.isFinite(item.x) && Number.isFinite(item.y)) clampToMap(item);
  return item;
}

// 世界預留大螢幕空間，旋轉與工具列伸縮不改動世界。
const MAP_SCREENS = 3;
const gameShell = document.querySelector(".game-shell");

let frameRequest = null;


// Live accessors preserve shared state and the legacy globals used by preview/VM callers.
globalThis.Survivor.engine = globalThis.Survivor.engine || {};
globalThis.Survivor.engine.state = globalThis.Survivor.engine.state || {};
Object.defineProperties(globalThis.Survivor.engine.state, {
  PREVIEW_MODE: { enumerable: true, get: () => PREVIEW_MODE },
  MAKER_MODE: { enumerable: true, get: () => MAKER_MODE },
  MAKER_LOAD: { enumerable: true, get: () => MAKER_LOAD },
  GAME_DATA: { enumerable: true, get: () => GAME_DATA },
  UPGRADE_TUNING: { enumerable: true, get: () => UPGRADE_TUNING },
  BOSS_TUNING: { enumerable: true, get: () => BOSS_TUNING },
  BOSS_MOVES: { enumerable: true, get: () => BOSS_MOVES },
  BUILD_TUNING: { enumerable: true, get: () => BUILD_TUNING },
  VFX_TUNING: { enumerable: true, get: () => VFX_TUNING },
  BUILD_SLOTS: { enumerable: true, get: () => BUILD_SLOTS },
  SETTINGS_KEY: { enumerable: true, get: () => SETTINGS_KEY },
  RECORD_KEY: { enumerable: true, get: () => RECORD_KEY },
  SETTING_DEFAULTS: { enumerable: true, get: () => SETTING_DEFAULTS },
  SETTING_CONTROLS: { enumerable: true, get: () => SETTING_CONTROLS },
  loadSavedSettings: { enumerable: true, get: () => loadSavedSettings },
  gameSettings: { enumerable: true, get: () => gameSettings },
  saveSettings: { enumerable: true, get: () => saveSettings },
  loadBestRecord: { enumerable: true, get: () => loadBestRecord },
  bestRecord: { enumerable: true, get: () => bestRecord },
  PLAYER_SPEED: { enumerable: true, get: () => PLAYER_SPEED },
  PLAYER_HEALTH: { enumerable: true, get: () => PLAYER_HEALTH },
  ENEMY_LIMIT: { enumerable: true, get: () => ENEMY_LIMIT },
  ENEMY_TYPES: { enumerable: true, get: () => ENEMY_TYPES },
  WAVES: { enumerable: true, get: () => WAVES },
  STAGES: { enumerable: true, get: () => STAGES },
  SPRITES: { enumerable: true, get: () => SPRITES },
  HERO_COLORS: { enumerable: true, get: () => HERO_COLORS },
  HERO_PIXELS: { enumerable: true, get: () => HERO_PIXELS },
  makeHeroPicture: { enumerable: true, get: () => makeHeroPicture },
  HERO_PICTURES: { enumerable: true, get: () => HERO_PICTURES },
  INVINCIBLE_SECONDS: { enumerable: true, get: () => INVINCIBLE_SECONDS },
  SHOT_INTERVAL: { enumerable: true, get: () => SHOT_INTERVAL },
  PROJECTILE_DAMAGE: { enumerable: true, get: () => PROJECTILE_DAMAGE },
  PROJECTILE_SPEED: { enumerable: true, get: () => PROJECTILE_SPEED },
  PROJECTILE_LIMIT: { enumerable: true, get: () => PROJECTILE_LIMIT },
  GEM_LIMIT: { enumerable: true, get: () => GEM_LIMIT },
  GEM_PULL_RADIUS: { enumerable: true, get: () => GEM_PULL_RADIUS },
  XP_TO_LEVEL: { enumerable: true, get: () => XP_TO_LEVEL },
  MAX_DT: { enumerable: true, get: () => MAX_DT },
  HIT_FLASH_SECONDS: { enumerable: true, get: () => HIT_FLASH_SECONDS },
  KNOCKBACK_SPEED: { enumerable: true, get: () => KNOCKBACK_SPEED },
  WATER_COLOR: { enumerable: true, get: () => WATER_COLOR },
  GEM_COLOR: { enumerable: true, get: () => GEM_COLOR },
  UPGRADES: { enumerable: true, get: () => UPGRADES },
  stage: { enumerable: true, get: () => stage },
  canvas: { enumerable: true, get: () => canvas },
  ctx: { enumerable: true, get: () => ctx },
  overlay: { enumerable: true, get: () => overlay },
  titleEl: { enumerable: true, get: () => titleEl },
  textEl: { enumerable: true, get: () => textEl },
  iconEl: { enumerable: true, get: () => iconEl },
  startButton: { enumerable: true, get: () => startButton },
  pauseButton: { enumerable: true, get: () => pauseButton },
  healthFill: { enumerable: true, get: () => healthFill },
  statusEl: { enumerable: true, get: () => statusEl },
  experienceFill: { enumerable: true, get: () => experienceFill },
  bossHud: { enumerable: true, get: () => bossHud },
  bossHealthFill: { enumerable: true, get: () => bossHealthFill },
  levelLabel: { enumerable: true, get: () => levelLabel },
  messageCard: { enumerable: true, get: () => messageCard },
  upgradePanel: { enumerable: true, get: () => upgradePanel },
  upgradeCards: { enumerable: true, get: () => upgradeCards },
  settingsPanel: { enumerable: true, get: () => settingsPanel },
  settingsControls: { enumerable: true, get: () => settingsControls },
  settingsButton: { enumerable: true, get: () => settingsButton },
  closeSettingsButton: { enumerable: true, get: () => closeSettingsButton },
  resetSettingsButton: { enumerable: true, get: () => resetSettingsButton },
  soundToggle: { enumerable: true, get: () => soundToggle },
  vibrationToggle: { enumerable: true, get: () => vibrationToggle },
  actionControls: { enumerable: true, get: () => actionControls },
  dashButton: { enumerable: true, get: () => dashButton },
  skillButton: { enumerable: true, get: () => skillButton },
  enemyNotice: { enumerable: true, get: () => enemyNotice },
  BOOK_CHARACTERS: { enumerable: true, get: () => BOOK_CHARACTERS },
  state: { enumerable: true, get: () => state },
  sharedAudio: { enumerable: true, get: () => sharedAudio },
  takeFromPool: { enumerable: true, get: () => takeFromPool },
  MAP_SCREENS: { enumerable: true, get: () => MAP_SCREENS },
  gameShell: { enumerable: true, get: () => gameShell },
  frameRequest: { enumerable: true, get: () => frameRequest }
});
