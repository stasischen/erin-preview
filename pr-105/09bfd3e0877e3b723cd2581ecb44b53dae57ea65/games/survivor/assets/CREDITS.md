# 素材與程式來源

- ZzFX Micro v1.4.0，Frank Force，MIT License。
  - 官方來源：https://github.com/KilledByAPixel/ZzFX/blob/master/ZzFXMicro.js
  - 官方授權：https://github.com/KilledByAPixel/ZzFX/blob/master/LICENSE
  - 本地完整授權：[audio/ZzFX-LICENSE.txt](audio/ZzFX-LICENSE.txt)。
  - `engine/zzfx.js` 保留合成演算法，改成一般腳本的 `Survivor.engine.zzfx.buffer(context, ...params)`；由呼叫者提供音訊環境，只產生可快取的 buffer，不在載入時建立 AudioContext 或播放。
- 15 組音效參數、三首 chiptune 配樂（糖果森林、餅乾森林、老師戰）由本專案以程式產生，沒有使用外部音檔。

- 出怪節奏初版新增布丁、跳跳糖、棉花糖仙子：原創 24×24 程式點陣圖，來源為 `render/monsters.js`，未使用外部素材；無獨立圖片檔。

## 巨斧守門人

- 原創像素圖：`../art/characters/gatekeeper.png`，16×16，沒有使用外部素材或原作角色圖片。
- 可編輯原稿／產生器：`../tools/gatekeeper-art.py`。
- 美術清單 id：`character/gatekeeper`；動畫動作與地面預警使用可替換的程式圖。

## 王的試煉：霜火雙子與羽翼古神

`art/characters/frost-twin.png`、`fire-twin.png`、`winged.png` 為本專案原創 16×16 像素圖，無外部素材。可編輯原稿：`tools/gallery-art.py`（沿用 `tools/gatekeeper-art.py` 的 PNG 格式）；同一幀套用動作變形，逐幀動畫尚未製作。穩定美術 id、尺寸與錨點見 `art-manifest.js`。

## 美術清單 v2 方向測試圖

`art/samples/player-directions.png` 為本專案原創程式佔位圖，無外部素材、人物照片或遊戲截圖。每格 64×64，S/E/N 三列、idle/run/hurt 三欄，W 鏡像 E；整張含 margin／spacing 為 198×198。可編輯原稿與可重現產生器：`tools/player-directions-art.py`；只供清單與繪圖驗證，不預設替換正式主角。

## 雙刃刺客

- `../art/characters/assassin.png`：本專案原創 16×16 字元像素稿，來源與可重現 PNG 匯出在 `../tools/assassin-art.py`；無外部素材。
- 苦無、白閃與紅色弱點使用 art-manifest 的程序圖條目；角色顯示和錨點不改世界碰撞。
