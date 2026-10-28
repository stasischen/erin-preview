// ✏️ Erin 可以改：bpm 是速度；root 是主音（60 = 中央 Do）。每小節 16 格。
// 原創曲式：前奏 4、A 8、B 8、A' 8、橋段 4、尾奏 8 小節，合計 40 小節。
(function () {
  const form = [
    { name: 'intro', bars: 4 }, { name: 'A', bars: 8 },
    { name: 'B', bars: 8 }, { name: 'Aprime', bars: 8 },
    { name: 'bridge', bars: 4 }, { name: 'outro', bars: 8 }
  ];
  const songs = {
    calm: { name: '糖果森林', bpm: 128, root: 60, scale: [0,2,4,5,7,9,11],
      chords: [0,3,4,0,5,3,4,4],
      motifs: { A: [0,2,4,2,1,3,4,6], B: [4,6,8,7,5,4,3,1] },
      rhythm: [0,3,4,6,8,11,12,14], bass: [0,6,8,14], hats: [2,6,10,14] },
    biscuit: { name: '餅乾森林', bpm: 136, root: 62, scale: [0,2,3,5,7,8,10],
      chords: [0,5,2,6,3,0,4,4],
      motifs: { A: [0,4,2,3,4,6,5,2], B: [7,6,4,5,3,2,1,4] },
      rhythm: [0,2,5,6,8,10,13,14], bass: [0,3,6,8,11,14], hats: [0,2,4,6,8,10,12,14] },
    boss: { name: '老師戰', bpm: 144, root: 57, scale: [0,2,3,5,7,8,11],
      chords: [0,0,5,4,3,5,4,4],
      motifs: { A: [0,0,4,3,2,3,1,4], B: [7,6,4,2,5,4,3,6] },
      rhythm: [0,2,4,7,8,10,12,15], bass: [0,2,6,8,10,14], hats: [0,2,4,6,8,10,12,14] }
  };
  // 音符、樂器、力度、長度全在事件資料裡，音訊引擎只負責排程。
  for (const song of Object.values(songs)) {
    song.step = 60 / song.bpm / 4;
    song.events = Array.from({length: 640}, () => []);
    song.sections = [];
    const pitch = degree => song.root + song.scale[((degree % 7) + 7) % 7] + 12 * Math.floor(degree / 7);
    let bar = 0;
    for (const section of form) {
      song.sections.push({ name: section.name, start: bar * 16, bars: section.bars });
      for (let local = 0; local < section.bars; local++, bar++) {
        const chord = song.chords[local % song.chords.length];
        const sparse = section.name === 'intro' || section.name === 'bridge';
        const varied = section.name === 'Aprime' || section.name === 'outro';
        const motif = song.motifs[section.name === 'B' || section.name === 'bridge' ? 'B' : 'A'];
        const put = (step, instrument, midi, length, volume) => song.events[bar * 16 + step].push({ instrument, midi, length, volume });
        song.rhythm.forEach((step, i) => {
          if (sparse && i % 2) return;
          const turn = varied && local % 4 === 3 && i >= 6 ? 7 - i : i;
          put(step, 'lead', pitch(motif[turn] + (local % 2 ? 2 : 0)) + (varied && local >= 4 ? 12 : 0), 1.5, .55);
        });
        song.bass.forEach((step, i) => put(step, 'bass', pitch(chord + (i % 2 ? 4 : 0)) - 24, 1.8, .65));
        for (let step = 0; step < 16; step += 2) {
          put(step, 'arp', pitch(chord + [0,2,4,2][step / 2 % 4]), 1.7, .16);
        }
        if (!sparse) {
          [0,8].forEach((step, i) => put(step, 'harmony', pitch(chord + (i ? 2 : 4)) + 12, 6, .19));
          [0,8].forEach(step => put(step, 'kick', 0, 1.4, .42));
          [4,12].forEach(step => put(step, 'snare', 0, 1, .24));
          song.hats.forEach(step => put(step, 'hat', 0, .35, step % 4 ? .10 : .07));
          if (local === section.bars - 1) [13,14,15].forEach(step => put(step, 'snare', 0, .6, .13));
        } else {
          [2,10].forEach(step => put(step, 'hat', 0, .4, .07));
        }
      }
    }
    song.duration = song.events.length * song.step;
  }
  Survivor.engine.music = { songs, form };
})();
