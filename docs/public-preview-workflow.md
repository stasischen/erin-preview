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

`--repo` 可明確指定 checkout；`--output` 必須是來源 repo 外專用目錄。輸出不得含 `.git`、symlink 或未知額外檔案。每次新候選使用自己的 stage；發布多個候選時保留舊候選路徑，更新首頁索引不等於覆蓋舊候選。

本輪固定入口：

https://stasischen.github.io/erin-preview/pr-103/206f285bf9aac1800613b88dd27daffcac2a8d6b/games/survivor/

版本 `20261027i`，adapter 1。首頁列 PR／版本／來源 SHA，明示未合併測試版及正式站外連；遊戲內不增加標籤，不改 viewport／HUD。

## 不可覆蓋的候選身分

同一 PR／SHA／adapter version 的檔案內容可重現，不寫當下時間、本機路徑或 session 資訊。已存在的候選若任一檔內容不同，生成器拒絕寫入；不能手動覆蓋已發布候選。

- 遊戲來源改動：使用新的完整 SHA，得到新路徑與儲存前綴。
- adapter 改動：提升 `--adapter-version`；例如版本 2 使用 `/pr-103/<sha>/adapter-2/` 及新的儲存前綴。先重新審查明列 diff，再發布。
- 來源新增儲存用途、PWA 引用或改變已審查的 literal／呼叫契約：生成器停止，先補審查再改 adapter，不能自動擴大文字替換。

## 部署差異與隔離

只改兩個 JS 的五個儲存 key 字面常數：Maker、舊設定、玩家設定、一般紀錄、Maker 紀錄；使用包含 PR／完整 SHA 的前綴，舊資料遷移讀取也隔離。`loop.js` 和戰鬥／資料／render 的其餘邏輯逐 byte 保留，不使用 Storage prototype monkeypatch。

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

檢查所有檔案 HTTP200/hash、候選深路徑可開始／移動、Maker 與設定的真實保存、一般／Maker 紀錄、legacy 遷移、A／B 候選隔離、五個正式 key sentinel 未變、既有 `/erin/` SW／cache sentinel 保留、候選無 controller、沒有正式路徑 runtime request、Maker 返回及首頁連結留在候選、沒有 404／console error／JS exception。

本機測試只是發布工程正確性／隔離 smoke，不替代 **Dot 雲端瀏覽器** 對固定候選 SHA 的三尺寸實際遊戲驗收；公開後仍須再核對公開 URL、版本與 artifact hash。
