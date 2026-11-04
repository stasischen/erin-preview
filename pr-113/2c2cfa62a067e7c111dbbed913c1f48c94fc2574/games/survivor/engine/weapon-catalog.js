// Survival-only catalog. Each row is a complete level; Maker's three authored weapons stay separate.
globalThis.SurvivorWeaponCatalog=(()=>{
  const levels=(base,rows)=>rows.map(row=>({...base,...row}));
  const catalog=[
    {id:'water-ball',name:'水球',icon:'water-ball',handler:'original',note:'扇形連射，彈數可再疊加共用多重。',levels:levels({power:1,interval:.72,size:1,count:1},[{},{power:1.18},{power:1.2,count:3},{power:1.4,count:3},{power:1.45,count:5}])},
    {id:'candy-hammer',name:'糖果大錘',icon:'candy-hammer',handler:'original',note:'重招追加震波；與共用水花合成一次附傷。',levels:levels({power:1,interval:.7,size:1,wave:0,branches:1},[{},{power:1.2},{power:1.25,wave:28},{power:1.45,wave:28},{power:1.5,wave:65}])},
    {id:'candy-sword',name:'糖果大劍',icon:'candy-sword',handler:'original',note:'收尾劍氣穿過前方；滿級三向劍氣同敵只中一次。',levels:levels({power:1,interval:.45,size:1,wave:0,branches:1},[{},{power:1.18},{power:1.2,wave:40},{power:1.35,wave:40},{power:1.4,wave:55,branches:3}])},
    {id:'orbit-cookie',name:'旋轉餅乾',icon:'item-cookie',handler:'orbit',note:'餅乾環繞護身，重疊每輪只傷一次。',levels:levels({power:.65,interval:.6,radius:18,range:65,speed:2.2,count:1,size:1},[{},{power:.8},{power:.85,count:2},{power:1,count:2},{power:1.05,count:3}])},
    {id:'return-donut',name:'回力甜甜圈',icon:'item-rear',handler:'return',note:'飛出去再回來，兩程可各命中一次。',levels:levels({power:.8,interval:1.65,radius:13,range:190,speed:240,count:1,size:1},[{},{power:1},{power:1.05,count:2},{power:1.2,count:2},{power:1.25,count:3}])},
    {id:'bounce-bean',name:'彈跳糖豆',icon:'item-split',handler:'bounce',note:'命中後找下一隻，同顆不回打舊目標。',levels:levels({power:.7,interval:1.25,radius:8,range:180,speed:280,count:1,bounces:2,size:1},[{},{power:.85},{power:.9,bounces:4},{power:1.05,bounces:4},{power:1.1,bounces:6}])},
    {id:'popcorn-bomb',name:'爆米花炸彈',icon:'item-candy',handler:'bomb',note:'落點亮起後爆開；滿級留下短暫熱區。',levels:levels({power:1.3,interval:2.5,radius:42,range:190,count:1,delay:.65,seconds:.1,pulse:.5,size:1},[{},{power:1.55},{power:1.6,count:3},{power:1.85,count:3},{power:1.9,count:3,seconds:1.1}])},
    {id:'soda-fountain',name:'汽水噴泉',icon:'water-fountain',handler:'field',note:'定點噴泉反覆傷敵，重疊同輪只計一次。',levels:levels({power:.45,interval:2.8,radius:34,range:155,count:1,delay:.15,seconds:2,pulse:.5,size:1},[{},{power:.6},{power:.65,count:2},{power:.8,count:2},{power:.85,count:3}])},
    {id:'ice-spikes',name:'冰淇淋尖刺',icon:'water-rain',handler:'fan',note:'扇形冰刺穿透並緩速；滿級覆蓋半圓。',levels:levels({power:.55,interval:1.65,radius:8,range:230,speed:280,count:3,spread:.22,pierce:1,slow:1,size:1},[{},{power:.7},{power:.75,count:5,spread:.3},{power:.9,count:5,spread:.3},{power:.95,count:7,spread:Math.PI/6}])},
    {id:'cotton-cloud',name:'雷雲棉花糖',icon:'thunder-ultimate',handler:'zap',note:'優先瞄準強敵；同輪不重複點名。',levels:levels({power:1.1,interval:2.1,radius:20,range:300,count:1,size:1},[{},{power:1.35},{power:1.4,count:2},{power:1.6,count:2},{power:1.65,count:3}])},
    {id:'honey-bees',name:'蜂蜜小蜂',icon:'item-bird',handler:'seek',note:'身旁伴飛，週期衝向不同敵人，再飛回來。',levels:levels({power:.95,interval:1.8,radius:10,range:240,speed:260,count:1,size:1},[{},{power:1.15},{power:1.2,count:2},{power:1.4,count:2},{power:1.45,count:3}])},
    {id:'rainbow-straw',name:'彩虹吸管',icon:'wind-blade',handler:'beam',note:'間歇直線穿透；升級展開前後，再變十字。',levels:levels({power:1,interval:2,radius:12,range:200,count:1,size:1},[{},{power:1.25},{power:1.3,count:2},{power:1.5,count:2},{power:1.55,count:4}])}
  ];
  function get(id){return catalog.find(w=>w.id===id);}
  function level(id,n){return get(id).levels[Math.max(0,Math.min(4,n-1))];}
  function change(id,current){
    const w=get(id), next=level(id,current+1), old=current?level(id,current):null;
    const number=n=>Math.round(n*100)/100, before=key=>old?number(old[key]||0):0;
    const parts=[`基礎威力 ${before('power')} → ${next.power}倍`,`出手 ${next.interval}秒`];
    const labels={count:'數量',bounces:'最多連撞',wave:'重招延伸',branches:'劍氣方向',seconds:'持續秒數'};
    for(const [key,label] of Object.entries(labels))if(next[key] && (!old || old[key]!==next[key]))parts.push(`${label} ${before(key)} → ${number(next[key])}`);
    return parts.join('；');
  }
  return {all:catalog,get,level,change};
})();

Survivor.engine=Survivor.engine||{};Survivor.engine['weapon-catalog']=SurvivorWeaponCatalog;
