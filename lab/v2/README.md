# 固定 iframe viewport QA lab v2

Dot 雲端瀏覽器直接開：

`/erin-preview/lab/v2/?pr=103&sha=206f285bf9aac1800613b88dd27daffcac2a8d6b&size=1024x461`

僅接受一組正整數 PR、完整小寫 40 碼 SHA，以及 `1024x461`／`740x360`／`1180x820`。用頁首表單選下一尺寸；它重新載入該不可變候選，不更改候選的任何檔案。候選直連另開分頁時只代表該分頁的實際 viewport。

這是 iframe browsing context 的實際 CSS viewport，不是頂層瀏覽器 resize，也沒有用 scale／zoom／transform 縮小 app。標示頂層 inner/client 大小、iframe inner 大小與 DPR、frame box、Canvas/game-shell geometry、載入資源版本，以及原生 fullscreen 狀態。候選 manifest／版本／detached digest 要先與 query 身分相符才載遊戲。

頁首沒有 sticky/fixed overlay，沒有任何 UI 注入遊戲。大於雲端瀏覽器外窗的 frame 需捲動外頁觀察各部位；例如 native 高度不足 820 時，應分別看上側 HUD 及下側控制，不把單張部分畫面當成整個 frame 都看過。遊戲不縮放，操作使用真正 iframe 內的按鈕／搖桿／鍵盤。頁首「捲外頁看下側控制」與 frame 之後的「回到量測／看上方 HUD」是普通 anchor，不依賴任何 viewport 或 JavaScript 操作 API。來源 body 使用 overscroll-behavior:none，游標留在 iframe 內滾動可能無法捲外頁；使用此外頁連結往返，不必改來源 CSS。外頁捲動或焦點離開可能讓來源遊戲自行暫停，回到 iframe 後用來源的繼續按鈕。

來源 `206f285bf9aac1800613b88dd27daffcac2a8d6b` 的執行期沒有呼叫 `requestFullscreen`／`exitFullscreen`；主遊戲與練習場的「全螢幕」目前是來源自己的 CSS game-shell／practice-dock，會填滿此 frame。lab 正常設 `allowfullscreen`，不阻擋或 monkeypatch 未來來源的 Fullscreen API。若發生原生 fullscreen，量測顯示實際大小並取消固定尺寸吻合判定；先 Esc 退出後再量測。無法實測的原生模式須明列未測。

lab 只讀同源 DOM geometry、URL／script version 與公開 manifest；不讀遊戲內部狀態、不注入腳本、不讀寫 Storage／cache、不註冊／取消 Service Worker。候選遊戲自身依既有 snapshot 使用隔離 key；lab 不做 Maker 草稿修改或保存驗收，不測 PWA 安裝／離線，也不以尺寸吻合自動宣稱 Dot 遊戲驗收通過。

這一版只追加 `lab/v2/`，不更新原候選、root landing、README、`.nojekyll` 或原候選 manifest 已封存的任何檔案；後續改 lab 內容使用新的 lab version 路徑。
