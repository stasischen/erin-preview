// ✏️ Erin 可以改：音量 0～1；每個音效的 cooldown 是兩次之間休息的秒數。
// params 使用 ZzFX 的參數順序；音效與配樂由本專案合成，沒有外部音檔。
(function () {
  const tuning = { soundVolume: .35, musicVolume: .035, maxVoices: 8, perSound: 2 };
  const sounds = {
    metal: {cooldown:.08,params:[.2,0,1750,.001,.015,.1,1,1.8,-24,0,720,.012]},
    perfect: {cooldown:.1,params:[.35,0,1350,.001,.015,.22,0,1,0,0,350,.03]},
    posture: {cooldown:.3,params:[.4,0,420,.005,.08,.25,1,1,3]},
    shoot: { cooldown: .09, params: [.35, 0, 620, .002, .015, .06, 1, 1, -8] },
    water: { cooldown: .12, params: [.3, .1, 380, .003, .02, .10, 0, 1, -5, 0, 0, 0, 0, .5] },
    hit: { cooldown: .07, params: [.25, .1, 180, .001, .01, .05, 4] },
    death: { cooldown: .09, params: [.4, .05, 540, .002, .02, .14, 1, 1, 6] },
    xp: { cooldown: .08, params: [.24, 0, 1050, .002, .01, .06, 0, 1, 3] },
    levelup: { cooldown: .4, params: [.5, 0, 520, .01, .12, .25, 1, 1, 1, 0, 260, .1] },
    select: { cooldown: .15, params: [.4, 0, 780, .003, .04, .16, 1, 1, 3] },
    dash: { cooldown: .18, params: [.35, .05, 220, .005, .03, .13, 3, 1, 9, 0, 0, 0, 0, .2] },
    lightning: { cooldown: .13, params: [.3, .05, 100, .002, .03, .12, 4, 1, -2, 0, 0, 0, 0, 1] },
    explosion: { cooldown: .2, params: [.5, .1, 90, .005, .04, .25, 4, 1, -2, 0, 0, 0, 0, 1] },
    warning: { cooldown: .8, params: [.45, 0, 210, .01, .2, .2, 1, 1, 0, 0, 110, .1, .15] },
    hurt: { cooldown: .25, params: [.4, .05, 160, .003, .03, .14, 2, 1, -3] },
    win: { cooldown: .7, params: [.5, 0, 660, .01, .2, .4, 1, 1, 2, 0, 330, .14] },
    over: { cooldown: .7, params: [.45, 0, 260, .01, .15, .4, 1, 1, -3] },
    click: { cooldown: .06, params: [.2, 0, 700, .001, .01, .04, 1] }
  };
  const songs = Survivor.engine.music.songs;
  const voices = new Set(), last = {}, buffers = {};
  let context = null, soundGain = null, musicGain = null, track = null, timer = null, noise = null, resumePoint = null;
  const layers = new Set();
  const muted = () => PREVIEW_MODE || globalThis.SURVIVOR_AUDIO_MUTED === true;
  function stopNodes(nodes) {
    for (const node of Array.from(nodes)) { try { node.stop(); node.disconnect(); } catch (_) {} }
    nodes.clear();
  }
  function dispose(layer) { stopNodes(layer.nodes); layer.gain.disconnect(); layers.delete(layer); }
  function stopMusic() {
    if (timer !== null) clearTimeout(timer);
    timer = null;
    if (track) {
      resumePoint = ['playing','transition','paused','levelup'].includes(state.mode)
        ? { id: track.id, position: Math.max(0, context.currentTime - track.origin) % songs[track.id].duration } : null;
    } else if (!['playing','transition','paused','levelup'].includes(state.mode)) resumePoint = null;
    track = null;
    for (const layer of Array.from(layers)) dispose(layer);
  }
  function available() { return !muted() && context && context.state === "running" && !document.hidden; }
  function desiredTrack() {
    return available() && gameSettings.music && (state.mode === "playing" || state.mode === "transition")
      ? (state.boss || state.bossIntro > 0 ? "boss" : state.stageIndex > 0 ? "biscuit" : "calm") : null;
  }
  function note(event, time, song, layer) {
    const drum = ['kick','snare','hat'].includes(event.instrument);
    const source = drum ? context.createBufferSource() : context.createOscillator();
    const filter = context.createBiquadFilter(), gain = context.createGain();
    const duration = Math.max(.025, event.length * song.step), attack = Math.min(.015, duration / 4);
    if (drum) {
      source.buffer = noise;
      filter.type = event.instrument === 'hat' ? 'highpass' : 'lowpass';
      filter.frequency.value = event.instrument === 'kick' ? 160 : event.instrument === 'snare' ? 1800 : 6500;
    } else {
      // 三角波主旋律／低音與低通方波琶音，避免尖銳高頻。
      source.type = event.instrument === 'arp' ? 'square' : 'triangle';
      source.frequency.value = 440 * Math.pow(2, (event.midi - 69) / 12);
      filter.type = 'lowpass'; filter.frequency.value = event.instrument === 'bass' ? 850 : 2600;
    }
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(event.volume, time + attack);
    gain.gain.linearRampToValueAtTime(event.volume * .65, time + duration * .35);
    gain.gain.setValueAtTime(event.volume * .65, time + duration * .65);
    gain.gain.linearRampToValueAtTime(0, time + duration);
    source.connect(filter); filter.connect(gain); gain.connect(layer.gain); layer.nodes.add(source);
    source.onended = () => { layer.nodes.delete(source); source.disconnect(); filter.disconnect(); gain.disconnect(); };
    source.start(time); source.stop(time + duration + .005);
  }
  function pump() {
    timer = null;
    if (!track || desiredTrack() !== track.id) { sync(); return; }
    try {
      const now = context.currentTime;
      for (const layer of Array.from(layers)) {
        if (layer.end <= now) { dispose(layer); continue; }
        const song = songs[layer.id];
        // 主執行緒延遲時跳過錯過的拍子，保持曲式時間，不補播一堆音。
        if (layer.next < now) {
          const skipped = Math.ceil((now - layer.next) / song.step);
          layer.beat += skipped; layer.next += skipped * song.step;
        }
        while (layer.next < now + .2 && layer.next < layer.end) {
          for (const event of song.events[layer.beat % song.events.length]) note(event, layer.next, song, layer);
          layer.beat++; layer.next += song.step;
        }
      }
      timer = setTimeout(pump, 80);
    } catch (_) { stopMusic(); }
  }
  function sync() {
    if (!context) return;
    soundGain.gain.value=tuning.soundVolume*gameSettings.soundVolume;
    musicGain.gain.value=tuning.musicVolume*gameSettings.musicVolume;
    if (!available() || !gameSettings.sound) stopNodes(voices);
    const wanted = desiredTrack();
    if (!wanted) { stopMusic(); return; }
    if (!track || track.id !== wanted) {
      const now = context.currentTime;
      // 只有一個離場曲；快速連續切換也不會堆疊多首曲子。
      for (const layer of Array.from(layers)) if (layer !== track) dispose(layer);
      if (track) {
        track.end = now + 1;
        track.gain.gain.cancelScheduledValues(now);
        track.gain.gain.setValueAtTime(Math.min(1, Math.max(0, now - track.start)), now);
        track.gain.gain.linearRampToValueAtTime(0, now + 1);
      }
      const gain = context.createGain(); gain.connect(musicGain);
      gain.gain.setValueAtTime(0, now); gain.gain.linearRampToValueAtTime(1, now + 1);
      const song = songs[wanted];
      const position = resumePoint && resumePoint.id === wanted ? resumePoint.position : 0;
      resumePoint = null;
      const beat = Math.ceil(position / song.step);
      track = { id: wanted, gain, nodes: new Set(), beat, start: now,
        origin: now + .02 - position, next: now + .02 + beat * song.step - position, end: Infinity };
      layers.add(track);
      if (timer !== null) clearTimeout(timer);
      pump();
    }
  }
  function unlock() {
    if (muted()) return;
    try {
      if (!context) {
        const AudioClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioClass) return;
        context = new AudioClass(); sharedAudio = context;
        soundGain = context.createGain(); soundGain.gain.value = tuning.soundVolume; soundGain.connect(context.destination);
        musicGain = context.createGain(); musicGain.gain.value = tuning.musicVolume;
        // 共用軟限幅器的輸出永遠小於 0.95，音效和交叉淡入曲子一起保護。
        const limiter = context.createWaveShaper(), curve = new Float32Array(4097);
        for (let i = 0; i < curve.length; i++) { const x = i * 2 / (curve.length - 1) - 1; curve[i] = .95 * Math.tanh(x / .95); }
        limiter.curve = curve;
        soundGain.disconnect(); soundGain.connect(limiter); musicGain.connect(limiter); limiter.connect(context.destination);
        noise = context.createBuffer(1, Math.ceil(context.sampleRate * .5), context.sampleRate);
        const samples = noise.getChannelData(0);
        let seed = 73;
        for (let i = 0; i < samples.length; i++) { seed = (seed * 16807) % 2147483647; samples[i] = seed / 1073741823.5 - 1; }
      }
      if (context.state === "suspended") {
        const resumed = context.resume();
        if (resumed && resumed.then) resumed.then(sync).catch(() => {});
      }
      sync();
    } catch (_) { /* 音訊不可用仍然能玩。 */ }
  }
  function play(id) {
    const sound = sounds[id];
    if (!sound || !available() || !gameSettings.sound) return false;
    const now = context.currentTime;
    if (now - (last[id] === undefined ? -Infinity : last[id]) < sound.cooldown || voices.size >= tuning.maxVoices || Array.from(voices).filter(v => v.soundId === id).length >= tuning.perSound) return false;
    try {
      const buffer = buffers[id] || (buffers[id] = Survivor.engine.zzfx.buffer(context, ...sound.params));
      const source = context.createBufferSource(); source.buffer = buffer; source.soundId = id;
      source.connect(soundGain); voices.add(source); last[id] = now;
      source.onended = () => { voices.delete(source); source.disconnect(); };
      source.start(); return true;
    } catch (_) { return false; }
  }
  Survivor.audio = Survivor.engine.audio = { unlock, play, sync, sounds, songs, tuning };
})();
