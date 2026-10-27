// Host-only geometry/version reader. No game globals, injected scripts, Storage or worker/cache APIs.
(() => {
  'use strict';
  const sizes = new Map([['1024x461', [1024, 461]], ['740x360', [740, 360]], ['1180x820', [1180, 820]]]);
  const byId = id => document.getElementById(id);
  const status = byId('status');
  let candidate = null, frame = null, identityVerified = false;
  const result = (kind, message) => { status.dataset.result = kind; status.textContent = message; };
  const rect = element => {
    const value = element.getBoundingClientRect();
    return {x: value.x, y: value.y, width: value.width, height: value.height};
  };
  const unscaled = element => {
    const style = getComputedStyle(element);
    return style.transform === 'none' && (!style.zoom || Number(style.zoom) === 1);
  };
  function measure() {
    byId('top-metrics').textContent = `頂層 viewport：${innerWidth} × ${innerHeight} CSS px；client：${document.documentElement.clientWidth} × ${document.documentElement.clientHeight}；DPR：${devicePixelRatio}。`;
    if (!frame || !candidate) return;
    try {
      const win = frame.contentWindow, doc = frame.contentDocument;
      if (!win || !doc || doc.readyState !== 'complete') { result('blocked', '等待 iframe 載入完成。'); return; }
      const box = rect(frame), canvas = doc.querySelector('#gameCanvas'), shell = doc.querySelector('.game-shell');
      const native = !!(document.fullscreenElement || doc.fullscreenElement);
      byId('exit-fullscreen').disabled = !native;
      byId('frame-metrics').textContent = `要求：${candidate.width} × ${candidate.height}；iframe inner：${win.innerWidth} × ${win.innerHeight}；DPR：${win.devicePixelRatio}；frame box：${box.width} × ${box.height}；原生 fullscreen：${native ? '啟用' : '未啟用'}。`;
      if (!canvas || !shell) { result('blocked', 'iframe 已離開遊戲頁或尚未出現 Canvas；請用上方表單重開固定候選。'); return; }
      const canvasBox = rect(canvas), shellBox = rect(shell);
      const versions = [...new Set([...doc.querySelectorAll('script[src]')].map(script => new URL(script.src).searchParams.get('v')).filter(Boolean))];
      byId('canvas-metrics').textContent = `Canvas CSS：${canvasBox.width} × ${canvasBox.height}（位置 ${canvasBox.x}, ${canvasBox.y}）；game-shell：${shellBox.width} × ${shellBox.height}；載入的資源版本：${versions.join(', ') || '無'}。`;
      const exact = win.innerWidth === candidate.width && win.innerHeight === candidate.height && box.width === candidate.width && box.height === candidate.height;
      const fills = canvasBox.x === 0 && canvasBox.y === 0 && canvasBox.width === candidate.width && canvasBox.height === candidate.height && shellBox.width === candidate.width && shellBox.height === candidate.height;
      const scaleFree = [document.documentElement, document.body, document.querySelector('header'), frame].every(unscaled);
      const gamePage = win.location.pathname === candidate.gamePath;
      const versionMatches = versions.length === 1 && versions[0] === candidate.version;
      if (native) result('blocked', '原生全螢幕啟用：這次實測不算固定 iframe 尺寸；請退出後重新量測。');
      else if (identityVerified && exact && fills && scaleFree && gamePage && versionMatches) result('exact', '固定 iframe viewport 尺寸吻合；Canvas 填滿且外頁／iframe 沒有 CSS 縮放，可開始此尺寸實際操作。這不是自動判定遊戲驗收通過。');
      else result('blocked', `不能主張此固定尺寸：identity=${identityVerified} viewport=${exact} canvas=${fills} unscaled=${scaleFree} page=${gamePage} version=${versionMatches}。`);
    } catch (error) { result('error', '無法讀取同源 iframe geometry/version：' + error.message); }
  }
  async function json(url) {
    const response = await fetch(url, {cache: 'no-store'});
    if (!response.ok) throw Error('候選資源 HTTP ' + response.status);
    const text = await response.text();
    return {value: JSON.parse(text), text};
  }
  async function open() {
    const params = new URLSearchParams(location.search);
    const keys = [...params.keys()];
    if (!keys.length) { measure(); return; }
    if (keys.length !== 3 || new Set(keys).size !== 3 || keys.some(key => !['pr', 'sha', 'size'].includes(key))) throw Error('只接受各一個 pr、sha、size 參數。');
    const pr = params.get('pr'), sha = params.get('sha'), size = params.get('size');
    if (!/^[1-9][0-9]*$/.test(pr || '') || !Number.isSafeInteger(Number(pr))) throw Error('PR 必須是正整數。');
    if (!/^[0-9a-f]{40}$/.test(sha || '')) throw Error('SHA 必須是完整小寫 40 碼十六進位。');
    if (!sizes.has(size)) throw Error('尺寸只接受 1024x461、740x360、1180x820。');
    byId('pr').value = pr; byId('sha').value = sha; byId('size').value = size;
    const [width, height] = sizes.get(size), root = `/erin-preview/pr-${pr}/${sha}/`;
    const manifestPath = root + 'preview-manifest.json', gamePath = root + 'games/survivor/';
    const [manifest, version] = await Promise.all([json(manifestPath), json(gamePath + 'version.json')]);
    const data = manifest.value;
    if (data.project_repo !== 'stasischen/erin' || data.pr !== Number(pr) || data.source_commit !== sha || data.adapter_version !== 1 || data.candidate_path !== root || new URL(data.game_url).pathname !== gamePath || !/^[A-Za-z0-9-]+$/.test(data.version || '') || version.value.version !== data.version) throw Error('候選 manifest／版本與指定 PR／SHA 身分不一致。');
    const hash = [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(manifest.text)))].map(byte => byte.toString(16).padStart(2, '0')).join('');
    const detached = await fetch(root + 'preview-manifest.sha256', {cache: 'no-store'});
    if (!detached.ok || (await detached.text()).split(/\s/)[0] !== hash) throw Error('候選 manifest detached hash 不一致。');
    candidate = {pr, sha, width, height, version: data.version, gamePath}; identityVerified = true;
    byId('identity').textContent = `候選已核對：PR #${pr}；來源 ${sha}；版本 ${data.version}；manifest SHA-256 ${hash}。`;
    byId('direct').href = gamePath; byId('direct').hidden = false;
    byId('proof').href = manifestPath; byId('proof').hidden = false;
    frame = document.createElement('iframe'); frame.id = 'candidate-frame'; frame.title = `PR ${pr} 候選 ${width}x${height}`;
    frame.width = String(width); frame.height = String(height);
    frame.style.width = width + 'px'; frame.style.height = height + 'px';
    frame.allowFullscreen = true;
    frame.addEventListener('load', () => {
      try { frame.contentWindow.addEventListener('resize', measure); frame.contentDocument.addEventListener('fullscreenchange', measure); } catch (_) {}
      measure();
    });
    frame.src = gamePath; byId('frame-host').appendChild(frame); measure();
  }
  byId('measure').addEventListener('click', measure);
  byId('exit-fullscreen').addEventListener('click', async () => {
    try { if (document.fullscreenElement && document.exitFullscreen) await document.exitFullscreen(); measure(); }
    catch (error) { result('blocked', '無法由外頁退出原生全螢幕；請按 Esc，再重新量測：' + error.message); }
  });
  window.addEventListener('resize', measure); document.addEventListener('fullscreenchange', measure);
  open().catch(error => { byId('identity').textContent = '候選未載入。'; result('error', error.message); measure(); });
})();
