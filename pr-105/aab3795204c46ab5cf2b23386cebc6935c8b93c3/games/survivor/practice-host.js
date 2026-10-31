// 每個小場景各有獨立引擎；只傳已驗證的作品資料，不存檔。
globalThis.SurvivorPractice = (()=>{
  let full=null;
  const minis=[],debugMemory={};
  function remember(entry) {
    const f=entry.frame;if(f.contentWindow && f.contentWindow.captureDebugBefore)f.contentWindow.captureDebugBefore();
    debugMemory[f._practiceId]={options:f._debugOptions,before:f._debugBefore};
  }
  function payload(data) {const r=SurvivorData.validate(data);return r.valid?SurvivorData.copy(r.data):null;}
  function refresh(data) {
    const value=payload(data);if(!value)return;
    for(const entry of minis.concat(full?[full]:[])) {
      entry.frame._practicePayload={data:SurvivorData.copy(value)};
      if(entry.frame.contentWindow&&entry.frame.contentWindow.updatePracticeData)entry.frame.contentWindow.updatePracticeData(value);
    }
  }
  function frame(data,id,mini=false) {
    const f=document.createElement('iframe');f.title=mini?'怪物即時預覽':'招式練習場';f._practicePayload={data:payload(data)};f._practiceId=id;f._practiceMini=mini;
    const remembered=debugMemory[id]||{};f._debugOptions=remembered.options;f._debugBefore=remembered.before;
    f.src=new URL('practice.html?v=20261031a',SurvivorPreview.base).href;return f;
  }
  function closeFull() {
    if(!full)return;
    const {host,origin,onClose}=full;remember(full);full=null;host.remove();
    for(const entry of minis)if(entry.frame.contentWindow.setPracticeActive)entry.frame.contentWindow.setPracticeActive(true);
    if(origin&&origin.focus)origin.focus();if(onClose)onClose();
  }
  function close() {closeFull();for(const e of minis){remember(e);e.host.textContent='';}minis.length=0;}
  function open(data,container,onClose,id='water-ball') {
    closeFull();
    const host=document.createElement('section');host.className='practice-dock';host.setAttribute('aria-label','招式練習場');
    const f=frame(data,id);f._practiceClose=closeFull;
    full={host,frame:f,origin:document.activeElement,onClose};host.appendChild(f);
    // 外層 game-shell 已跟正式遊戲一起處理旋轉、安全區及視窗尺寸。
    (document.querySelector('.game-shell')||container).appendChild(host);
    for(const e of minis)if(e.frame.contentWindow.setPracticeActive)e.frame.contentWindow.setPracticeActive(false);
    f.addEventListener('load',()=>{if(f.contentWindow)f.contentWindow.focus();});
  }
  function mount(host,data,id) {
    const f=frame(data,id,true);host.appendChild(f);minis.push({host,frame:f});
  }
  function unmount(host) {const i=minis.findIndex(e=>e.host===host);if(i>=0){remember(minis[i]);minis.splice(i,1);}host.textContent='';}
  return {open,close,refresh,mount,unmount};
})();
