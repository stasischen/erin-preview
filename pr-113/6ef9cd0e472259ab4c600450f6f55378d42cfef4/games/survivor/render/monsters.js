// 原創 24×24 點陣圖；只改外觀，不附帶招式。每張圖只建立一次。
// Erin 可以改：色票、方塊座標，以及每種造型的中文名字。
(function (root) {
  'use strict';
  const labels = {
    pudding:'布丁', 'pop-candy':'跳跳糖', 'marshmallow-fairy':'棉花糖仙子',
    'marshmallow-rabbit':'棉花糖兔', 'soda-bubble':'汽水泡泡', 'jelly-slime':'果凍史萊姆',
    'macaron-knight':'馬卡龍騎士', 'donut-spinner':'甜甜圈陀螺', 'gummy-bear':'小熊軟糖',
    'chocolate-bear':'巧克力大熊', 'mushroom-hopper':'蘑菇跳跳', 'hedgehog-ball':'刺蝟球',
    dandelion:'蒲公英', 'moss-rock':'青苔石頭', 'firefly-lantern':'螢火蟲燈', 'little-cloud':'小雲朵'
  };
  const cache = {};
  function picture(id, animation='idle', seconds=0, context={}) {
    if (!Object.prototype.hasOwnProperty.call(labels, id)) return null;
    const replacement = root.SurvivorArt && root.SurvivorArt.picture('character/'+id,animation,seconds,context);
    if (replacement) return replacement;
    if (cache[id]) return cache[id];
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 24;
    const g = canvas.getContext('2d'); g.imageSmoothingEnabled = false;
    const ink = '#383349', white = '#fff9ed', pink = '#f5a1bc', green = '#76b966';
    const rect = (x,y,w,h,c) => { g.fillStyle=c; g.fillRect(x,y,w,h); };
    const box = (x,y,w,h,c) => { rect(x,y,w,h,ink); rect(x+1,y+1,w-2,h-2,c); };
    const face = (y=12) => {
      rect(7,y,3,4,ink); rect(14,y,3,4,ink); rect(7,y,1,1,white); rect(14,y,1,1,white);
      rect(5,y+4,3,1,pink); rect(16,y+4,3,1,pink); rect(11,y+5,2,1,ink);
    };
    if (id === 'pudding') {
      box(6,4,12,4,'#a76745'); box(4,8,16,7,'#f8d681'); box(2,15,20,6,'#edbf65');
      rect(6,8,12,2,'#b87c4b'); rect(5,11,3,4,'#fff0ba'); face(12);
    } else if (id === 'pop-candy') {
      box(1,7,6,10,'#f3a5ba'); box(17,7,6,10,'#f3a5ba');box(5,4,14,16,'#e87994');
      rect(7,6,4,3,'#ffe5b8');rect(10,1,2,4,'#a9cf85');rect(13,0,2,3,'#ffe4a0');face(10);
    } else if (id === 'marshmallow-fairy') {
      box(0,8,8,10,'#bce3ec');box(16,8,8,10,'#bce3ec');box(5,4,14,16,white);
      rect(7,6,5,2,'#fff');face(10);rect(4,1,2,3,'#ffe18d');rect(2,2,6,1,'#ffe18d');
      rect(11,21,2,2,'#e5b7dc');
    } else if (id === 'marshmallow-rabbit') {
      box(5,1,5,11,white); box(14,0,5,12,white); rect(7,3,1,6,pink); rect(16,2,1,7,pink);
      box(3,9,18,12,white); rect(5,20,5,3,ink); rect(14,20,5,3,ink); face(12);
    } else if (id === 'soda-bubble') {
      box(8,1,8,5,green); box(5,5,14,3,'#9ce8ef'); box(2,8,20,11,'#70c9de');
      box(5,18,14,4,'#62adcb'); rect(4,9,2,5,white); rect(7,7,4,1,white); face(11);
      rect(19,3,2,2,white); rect(2,4,2,2,'#70c9de');
    } else if (id === 'jelly-slime') {
      box(8,5,8,3,'#a7e6ac'); box(5,7,14,4,'#a7e6ac'); box(2,10,20,11,'#80cda1');
      rect(4,18,16,2,'#57a88b'); rect(6,9,5,2,'#d5f8c5'); face(12);
    } else if (id === 'macaron-knight') {
      box(5,4,14,6,'#a895d3'); box(2,9,20,10,'#b9a2e1'); rect(3,13,18,3,white);
      box(15,13,8,9,'#7dc4c4'); rect(18,15,2,5,white); rect(16,17,6,1,white);
      rect(11,0,2,6,pink); face(8);
    } else if (id === 'donut-spinner') {
      box(6,3,12,3,'#d89561'); box(3,6,18,14,'#d89561'); box(6,19,12,3,'#d89561');
      rect(5,7,14,10,pink); box(9,9,6,6,'#9ad2c0');
      rect(6,7,2,1,white); rect(16,9,1,2,'#ffd36d'); rect(7,15,2,1,'#6baddb');
      rect(5,10,2,3,ink); rect(17,10,2,3,ink); rect(11,21,2,3,ink);
    } else if (id === 'gummy-bear' || id === 'chocolate-bear') {
      const chocolate = id === 'chocolate-bear', base = chocolate ? '#936246' : '#e99c51';
      const light = chocolate ? '#c9936b' : '#ffd187';
      box(3,2,6,6,base); box(15,2,6,6,base); box(4,6,16,13,base);
      box(2,13,4,6,base); box(18,13,4,6,base); box(5,18,5,5,base); box(14,18,5,5,base);
      rect(6,7,4,2,light); rect(9,15,6,4,light); face(10);
      if (chocolate) { rect(8,1,8,3,green); rect(11,0,2,4,'#b2d981'); }
    } else if (id === 'mushroom-hopper') {
      box(7,13,10,9,'#f6e3b2'); box(5,3,14,4,'#df788a'); box(2,6,20,9,'#df788a');
      rect(5,7,4,3,white); rect(14,5,3,3,white); rect(15,11,4,2,pink); face(15);
    } else if (id === 'hedgehog-ball') {
      for (const [x,y] of [[5,3],[12,1],[18,5],[1,10],[20,12],[4,17],[16,18]]) box(x,y,4,5,'#a48270');
      box(4,6,16,14,'#a48270'); box(6,10,13,10,'#eed4b0'); face(12);
    } else if (id === 'dandelion') {
      box(11,11,3,12,green); rect(5,18,6,3,green); rect(14,16,5,3,green);
      box(6,4,12,12,white); rect(3,7,18,6,white); rect(9,1,6,17,white);
      rect(4,5,2,2,'#c4dce3'); rect(18,4,2,2,'#c4dce3'); face(7);
    } else if (id === 'moss-rock') {
      box(6,5,13,4,'#a4b0a3'); box(3,8,19,13,'#87958e'); rect(5,18,15,2,'#687c77');
      rect(4,7,16,4,green); rect(6,4,5,4,'#add281'); rect(16,10,4,4,green); face(12);
    } else if (id === 'firefly-lantern') {
      box(1,6,8,9,'#b5dce7'); box(15,6,8,9,'#b5dce7'); box(7,4,10,17,'#e9c968');
      rect(8,14,8,5,'#fff3a4'); rect(8,0,2,5,ink); rect(14,0,2,5,ink); face(7);
    } else if (id === 'little-cloud') {
      box(5,6,7,10,white); box(12,3,7,13,white); box(1,11,22,9,white);
      rect(3,12,18,6,white); face(12); rect(6,21,2,3,'#76c2e5'); rect(16,21,2,3,'#76c2e5');
    }
    cache[id] = canvas; return canvas;
  }
  root.SurvivorMonsters = { labels, ids: Object.keys(labels), picture };
  root.Survivor = window.Survivor = window.Survivor || {};
  root.Survivor.render = root.Survivor.render || {};
  root.Survivor.render.monsters = root.SurvivorMonsters;
})(globalThis);
