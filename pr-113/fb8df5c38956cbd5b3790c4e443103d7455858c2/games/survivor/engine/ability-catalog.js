// Survival ability data. The only level table; UI and combat read the same rows.
globalThis.SurvivorAbilityCatalog=(()=>{
  const secret=(id,name,school,kind,shape,base={})=>({id,name,school,kind,shape,ability:'secret',icon:school+'-ultimate',base:{damage:1.5,radius:95,cooldown:10,duration:3,pulse:.7,...base}});
  const active=(id,name,school,kind,shape,base={})=>({id:'active-'+id,name,school,kind,shape,ability:'active',icon:school+'-skill',base:{damage:2.5,radius:140,cooldown:1,duration:3,pulse:.6,...base}});
  const all=[
    secret('water-ultimate','大海嘯','water','wave',['前方浪牆清群','前後雙向浪牆','退潮再次命中'],{radius:100,duration:1.3}),
    secret('wind-ultimate','環繞龍捲','wind','orbit',['一股旋風近身護衛','雙旋風環繞','三旋風定期向外展開'],{radius:40,duration:5,pulse:.6}),
    secret('thunder-ultimate','雷雲','thunder','cloud',['優先雷擊強敵','同時點名兩個不同目標','雷擊向另一敵人跳電'],{radius:260,duration:.5}),
    secret('secret-ice','冰晶花園','water','ice',['單朵冰花緩速','三區冰花綻放','結束時碎冰爆開'],{radius:65,duration:4}),
    secret('secret-meteor','流星糖雨','thunder','meteor',['預告一處流星落點','三處依序落下','最後再落一顆大流星'],{radius:65,duration:2.8}),
    secret('secret-jelly','果凍守衛','water','shield',['週期產生承傷盾','破盾時推開敵人','破盾後留下緩速區'],{shield:30,radius:110,duration:5}),
    secret('secret-magnet','磁力漩渦','wind','magnet',['定點漩渦吸近普通敵人','結束爆開','兩個漩渦交替吸引'],{radius:95,duration:4}),
    secret('secret-garden','甜夢花園','water','garden',['腳下回復區，可繼續移動','區內同時緩速敵人','離開後短暫持續回復'],{heal:2,radius:90,duration:4}),
    secret('secret-clone','星光分身','wind','clone',['留下引誘普通敵人的分身','結束時爆開','兩個分身交替引敵'],{radius:180,duration:4}),
    active('tide','潮汐爆破','water','tide',['自身周圍爆破推敵','追加外擴水環','三段向外潮汐']),
    active('thunder','雷霆裁決','thunder','judgment',['自動鎖附近最強敵人','雷擊周圍跳電','延遲追加第二重雷'],{radius:300}),
    active('wind','暴風通道','wind','corridor',['沿移動／面朝方向清出通道','留下加速區','通道兩側旋風隔開敵群'],{radius:65,range:300,duration:4}),
    active('ice','冰封時刻','water','freeze',['凍住近身普通敵人；Boss僅緩速','解凍時碎冰','結束留下緩速區'],{duration:2.5}),
    active('jelly','果凍堡壘','water','fortress',['短暫承傷盾','開盾時推開敵人','結束依剩餘盾量追加爆破'],{shield:65,duration:4}),
    active('candy','糖果狂歡','thunder','frenzy',['短時加快三把武器的節奏','啟動時各武器立即出手一次','結束時各武器再出手一次'],{duration:4,haste:1.4,damage:0})
  ];
  function get(id){return all.find(c=>c.id===id);}
  function level(id,n=1){const c=get(id);if(!c)return null;const lv=Math.max(1,Math.min(5,n)),b=c.base,boost=lv>=2?1.25:1;return {...b,level:lv,damage:b.damage*boost,shield:(b.shield||0)*boost,heal:(b.heal||0)*boost,haste:b.haste?b.haste+(lv>=2?.15:0):1,radius:b.radius*(lv>=2?1.1:1),cooldown:b.cooldown*(lv>=4?.8:1),shape:c.shape[lv>=5?2:lv>=3?1:0]};}
  return {all,get,level};
})();
Survivor.engine=Survivor.engine||{};Survivor.engine['ability-catalog']=SurvivorAbilityCatalog;
