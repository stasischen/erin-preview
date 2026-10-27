// 共用純規則：秒、資料狀態與單次進入事件；不讀畫面、儲存、時鐘或亂數。
globalThis.SurvivorTiming = (() => {
  const phases=['windup','active','recovery','cooldown'];
  function config(source) { return source.timing || source; }
  function start(source) { return {phase:'windup',left:config(source).windup,entered:true}; }
  // 每次最多換一階段，與舊敵人規則相同；掉幀也保留可見預警和生效。
  function advance(previous,source,dt) {
    const left=Math.max(0,previous.left-Math.max(0,dt));
    if(left>1e-6 || previous.phase==='ready') return {...previous,left,entered:false};
    const phase=phases[phases.indexOf(previous.phase)+1] || 'ready';
    return {...previous,phase,left:config(source)[phase]||0,entered:true};
  }
  function cancelRecovery(previous,source) {
    return previous && previous.phase==='recovery'
      ? {...previous,phase:'cooldown',left:config(source).cooldown,entered:true} : previous;
  }
  function segments(source) {
    const c=config(source); let start=0;
    return phases.map(phase=>{const row={phase,start,seconds:c[phase]};start+=c[phase];return row;});
  }
  function buffer(previous,command,seconds=.12) {return {command,left:Math.max(.1,Math.min(.15,seconds))};}
  function consume(previous,dt,ready) {
    if(!previous)return {buffer:null,command:null};
    if(previous.left+1e-8<dt)return {buffer:null,command:null};
    return ready?{buffer:null,command:previous.command}:{buffer:{...previous,left:previous.left-dt},command:null};
  }
  return {start,advance,cancelRecovery,segments,buffer,consume};
})();
if(globalThis.Survivor && Survivor.engine) Survivor.engine.timing={rules:SurvivorTiming};
