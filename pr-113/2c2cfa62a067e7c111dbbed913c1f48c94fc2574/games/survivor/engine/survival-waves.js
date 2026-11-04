// Survival-only pressure. Authored single-weapon works and trials retain their original pacing.
globalThis.SurvivorWaves=(()=>{
  const rows=[
    {cap:18,every:1.3,batch:1,hp:1,mass:1,speed:1,name:'糖果小隊',types:['jaben','jaben','otsubon']},
    {cap:28,every:1.1,batch:2,hp:1.12,mass:1.1,speed:1.04,name:'側翼快襲',types:['jaben','otsubon','otsubon','jelly','mushroom']},
    {cap:40,every:.95,batch:3,hp:1.28,mass:1.3,speed:1.08,name:'重裝前排',types:['pudding','jaben','jelly','donut','fairy']},
    {cap:52,every:.85,batch:3,hp:1.48,mass:1.5,speed:1.12,name:'支援混編',types:['jaben','otsubon','pudding','jelly','fairy','pop-candy','mushroom']},
    {cap:64,every:.75,batch:4,hp:1.7,mass:1.75,speed:1.16,name:'森林大隊',types:['pudding','jaben','otsubon','jelly','donut','pop-candy','fairy','mushroom']}
  ];
  function enabled(){return !!state.loadout&&!state.trial&&!PREVIEW_MODE;}
  function current(){const index=Math.max(0,Math.floor(state.stageElapsed/30));return {...rows[Math.min(rows.length-1,index)],number:index+1,index};}
  function bossTime(){return gameSettings.waveSeconds+(enabled()?30:0);}
  function limit(){return enabled()?Math.max(1,Math.round(current().cap*ENEMY_LIMIT/SURVIVOR_DEFAULTS.tuning.enemyLimit)):ENEMY_LIMIT;}
  function allowed(type){
    if(!enabled())return true;
    const living=state.enemies.filter(e=>e.alive);
    if(['shooter','charger'].includes(type.behavior))return living.filter(e=>['shooter','charger'].includes(e.behavior)).length<2;
    if(type.behavior==='support')return !living.some(e=>e.behavior==='support');
    if(type.behavior==='bomber')return living.filter(e=>e.behavior==='bomber').length<2;
    return true;
  }
  function pick(){
    const row=current(),cursor=state.survivalWave?.cursor||0;
    const available=row.types.filter(id=>{const t=ENEMY_TYPES.find(t=>t.id===id);return t&&allowed(t);});
    if(state.survivalWave)state.survivalWave.cursor++;
    return available[cursor%Math.max(1,available.length)]||ENEMY_TYPES[0].id;
  }
  function update(){
    if(!enabled())return;
    const row=current();
    if(!state.survivalWave||state.survivalWave.number!==row.number){
      state.survivalWave={number:row.number,cursor:0,stage:state.stageIndex};
      enemyNotice.textContent=`第 ${row.number} 波 · ${row.name}`;enemyNotice.hidden=false;state.bookNoticeTimer=3;
      updateHud();
    }
  }
  function spawnBatch(){
    update();const row=current(),side=(row.number+Math.floor(state.stageElapsed/6))%4;
    for(let i=0;i<row.batch;i++)spawnEnemy({typeId:pick(),side:(side+(i%2))%4,offscreen:true});
  }
  function bodyScale(type){return enabled()&&type.behavior==='tank'?1+Math.min(.22,current().index*.055):1;}
  function decorate(enemy){
    if(!enabled()||enemy.waveNumber)return;
    const row=current(),type=ENEMY_TYPES.find(t=>t.id===enemy.typeId),heavy=enemy.behavior==='tank';
    enemy.waveNumber=row.number;
    enemy.hp*=row.hp;enemy.maxHp=enemy.hp;
    enemy.speed*=row.speed;
    enemy.mass=(type?.mass||1)*row.mass*(heavy?1.35:1);
    enemy.heavy=heavy;enemy.weightStep=heavy?.58:1/Math.sqrt(row.mass);
    if(heavy)enemy.speed*=.88;
  }
  return {rows,enabled,current,limit,allowed,pick,update,spawnBatch,decorate,bodyScale,bossTime};
})();
Survivor.engine=Survivor.engine||{};Survivor.engine['survival-waves']=SurvivorWaves;
