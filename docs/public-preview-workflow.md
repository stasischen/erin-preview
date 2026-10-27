# 固定候選公開測試站的產生與驗證

用途：把指定 PR／完整來源 SHA 產成純靜態公開候選頁，讓 **Dot 的雲端瀏覽器直接開 URL**。不要求 Dot 使用本機 executor、下載快照、開本機伺服器或批准本機 Chrome。此工具只準備發布內容，不發布、不合併，也不代表已通過 Dot 遊戲驗收。

## 產生

需要 Python 3 標準函式庫與 Git；工具只讀 `git show/ls-tree/cat-file`，不執行來源 repo 腳本。

```sh
python3 tools/prepare-public-preview.py \
  --repo "$ERIN_REPO" \
  --pr 103 \
  --sha 206f285bf9aac1800613b88dd27daffcac2a8d6b \
  --output "$PREVIEW_STAGE"
```

`--repo` 可明確指定 checkout；`--output` 必須是來源 repo 外專用目錄。輸出不得含 `.git`、symlink 或未知額外檔案。上例是建立第一個站點的模式；發布多個候選時使用下述追加模式，不能直接覆蓋共用首頁。

## 在既有測試站追加候選

既有 PR103 manifest 也固定了根目錄 `index.html`、`README.md`、`.nojekyll` 的 hash。只保留舊候選子目錄、卻改寫共用首頁或 README，仍會破壞舊候選的完整性證據。因此新增候選須沿用既有根三檔的精確 bytes：

```sh
python3 tools/prepare-public-preview.py \
  --repo "$ERIN_REPO" \
  --pr "$PR_NUMBER" \
  --sha "$FULL_SOURCE_SHA" \
  --existing-site "$EXISTING_SITE" \
  --output "$NEW_CANDIDATE_STAGE"
```

`--existing-site` 僅唯讀三個根檔，不修改或複製舊候選、lab 或 Git 資料；允許它指向 Pages checkout，但三檔必須是普通檔案、`.nojekyll` 必須為空。輸出 stage 必須與既有站點分離，不能等於、位於其內或包住它。既有站點已有同一候選路徑時拒絕產生，避免重新製作不同 manifest 後覆寫固定候選。

產生後先驗證新 manifest 所列每個 payload，再於 repo 外模擬覆合：確認所有既有檔案（包含舊 manifest、根檔與 lab）完全未變、舊 manifest 的所有 payload hash 仍相符。實際發布只加入新候選目錄；三個共用根檔應與原站完全相同，不需提交。新 manifest 記錄了沿用根檔的 bytes/hash 與原因，沒有本機來源路徑。

共用首頁和 README 會繼續描述早期候選；新增候選使用自己的 `/pr-<PR>/<完整SHA>/index.html`、遊戲 URL 或 lab URL 送審，不把根首頁當作目前候選。若要重做共用索引，需另行遷移完整性格式，不能在追加發布時順手更改。

本輪固定入口：

https://stasischen.github.io/erin-preview/pr-103/206f285bf9aac1800613b88dd27daffcac2a8d6b/games/survivor/

版本 `20261027i`，adapter 1。首頁列 PR／版本／來源 SHA，明示未合併測試版及正式站外連；遊戲內不增加標籤，不改 viewport／HUD。

## 不可覆蓋的候選身分

同一 PR／SHA／adapter version 的檔案內容可重現，不寫當下時間、本機路徑或 session 資訊。已存在的候選若任一檔內容不同，生成器拒絕寫入；不能手動覆蓋已發布候選。

- 遊戲來源改動：使用新的完整 SHA，得到新路徑與儲存前綴。
- adapter 改動：提升 `--adapter-version`；例如版本 2 使用 `/pr-103/<sha>/adapter-2/` 及新的儲存前綴。先重新審查明列 diff，再發布。
- 來源新增儲存用途、PWA 引用或改變已審查的 literal／呼叫契約：生成器停止，先補審查再改 adapter，不能自動擴大文字替換。

## 部署差異與隔離

只改兩個 JS 的已稽核儲存 key 字面常數；支援兩個完整 profile：

- 舊版五個 key：Maker、舊設定、玩家設定、一般紀錄、Maker 紀錄。
- 每 Boss 紀錄版七個 key：保留上述五個，增加 `erin-survivor-trial-best-seconds-v1` 與 `erin-survivor-maker-trial-best-seconds-v1`。兩個 `const` 宣告及 `getItem`／`setItem` 的完整首參數 `custom?MAKER_TRIAL_RECORD_KEY:TRIAL_RECORD_KEY` 必須一同符合；缺一個、分支顛倒或換成未知變數均拒絕。不能因看見首字 `custom` 就放行未稽核 expression。

所有 key 使用包含 PR／完整 SHA 的前綴，舊資料遷移讀取也隔離。未列入 profile 的呼叫、檔案或 sessionStorage 仍 fail closed，先人工稽核再修改工具。`loop.js` 和戰鬥／資料／render 的其餘邏輯逐 byte 保留，不使用 Storage prototype monkeypatch。

候選 `register-sw.js` 為固定 no-op，不註冊、取消或刪除正式站 SW／cache。候選不發布原 `sw.js`／`manifest.webmanifest`；HTML 移除 PWA/install head 引用並使用 inline favicon，避免 origin 根目錄 favicon 請求。**公開候選不提供、也不驗收 PWA 安裝／離線功能**，需要網路。

公開輸出只有靜態執行期、美術與必要 license、landing、`.nojekyll`、公開 README、manifest 與 logical adapter diff。不得發布 coord、docs、tests、tools、Git 資料、工作階段對照、截圖或完整日誌；生成／驗證工具本身也不放進 Pages payload。

`preview-manifest.json` 記錄來源與部署 SHA-256、每檔變換及 storage 呼叫審查；manifest 與其 detached digest 自身不可能互相列入遞迴 hash，digest 另外驗 manifest。`adapter-diff.patch` 只使用相對 logical path。

## 本機部署工程驗證

Node.js 22 與已安裝的 Chrome 可執行：

```sh
node tools/validate-public-preview.cjs \
  "$PREVIEW_STAGE" "$OTHER_CANDIDATE_STAGE" "$PRIVATE_REPORT"
```

另一候選只供同 origin A／B 隔離測試，輸出與報告都在 repo 外，不發布第二候選測試夾或任何完整日誌。`CHROME_BIN` 可覆寫 Chrome 執行檔；工具以獨立暫存 profile、本機短暫 HTTP server 測試，結束關閉兩者，不接觸使用者日常瀏覽器資料。

檢查所有檔案 HTTP200/hash、候選深路徑可開始／移動、Maker 與設定的真實保存、一般／Maker 紀錄、legacy 遷移、A／B 候選隔離、該 profile 全部正式 key sentinel 未變、既有 `/erin/` SW／cache sentinel 保留、候選無 controller、沒有正式路徑 runtime request、Maker 返回及首頁連結留在候選、沒有 404／console error／JS exception。A／B stage 必須使用同一個完整 profile。

七 key profile 另驗每 Boss 紀錄：正常與 Maker 模式各保存不同時間，A／B 候選不互讀；多次重新載入後分別讀回各自正常／Maker 的值，避免只驗記憶體快取。兩個未加前綴的正式紀錄 key 使用不同 sentinel，結束必須保持原值。這是本機發布隔離工程驗證，可以呼叫規則接合層；不冒充以可見 UI 真正打贏 Boss 的 Dot 驗收。

本機測試只是發布工程正確性／隔離 smoke，不替代 **Dot 雲端瀏覽器** 對固定候選 SHA 的三尺寸實際遊戲驗收；公開後仍須再核對公開 URL、版本與 artifact hash。
