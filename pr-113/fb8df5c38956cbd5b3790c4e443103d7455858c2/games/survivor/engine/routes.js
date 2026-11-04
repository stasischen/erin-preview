// Per-run travel only: two existing stages, no save migration or extra bosses.
globalThis.SurvivorRoutes=(()=>{
  const all=[
    {id:'forest',name:'森林旅程',themes:[{id:'candy-forest',name:'糖果森林',seed:23},{id:'cookie-forest',name:'餅乾森林',seed:79}]},
    {id:'coast',name:'清涼旅程',themes:[{id:'soda-coast',name:'汽水海岸',seed:137},{id:'icecream-snow',name:'冰淇淋雪原',seed:191}]},
    {id:'garden',name:'甜蜜旅程',themes:[{id:'jam-garden',name:'果醬花園',seed:263},{id:'caramel-lava',name:'焦糖熔岩地',seed:307}]}
  ];
  function selected(){const select=document.getElementById('survivalRoute');return !MAKER_MODE&&all.some(r=>r.id===select?.value)?select.value:'forest';}
  function route(){return all.find(r=>r.id===state.survivalRoute)||all[0];}
  function theme(index=state.stageIndex){return route().themes[Math.max(0,Math.min(1,index||0))];}
  function name(){return SurvivorWaves.enabled()?theme().name:currentStage().name;}
  function menu(mode){const box=document.getElementById('survivalRoutePicker');if(box)box.hidden=MAKER_MODE||!!state.trial||!['ready','over','won'].includes(mode);}
  return {all,selected,route,theme,name,menu};
})();
Survivor.engine=Survivor.engine||{};Survivor.engine.routes=SurvivorRoutes;
