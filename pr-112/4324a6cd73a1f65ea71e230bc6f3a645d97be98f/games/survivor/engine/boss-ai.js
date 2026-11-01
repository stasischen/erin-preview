// 引擎無關純規則。輸入為資料、秒、固定抽樣；事件可對應 Godot signal。
globalThis.SurvivorBossAI = (() => {
  function phase(phases, ratio) {
    return phases.reduce((value,row,i)=>ratio<=row.threshold?i+1:value,1);
  }
  function scores(moves,rules,input) {
    return rules.flatMap(rule=>{
      const move=moves.find(m=>m.id===rule.moveId);
      if(!move || move.minPhase>input.phase || input.previous.includes(move.id) ||
        input.distance<rule.minDistance || input.distance>rule.maxDistance || (!input.visible&&!rule.offscreen)) return [];
      const score=rule.weight*(1+rule.angleWeight*(1+Math.cos(input.angle))/2)*(1+rule.phaseWeight*(input.phase-1));
      return score>0?[{id:move.id,score}]:[];
    });
  }
  function choose(rows,sample) {
    let remaining=Math.max(0,Math.min(1-Number.EPSILON,sample))*rows.reduce((s,r)=>s+r.score,0);
    for(const row of rows) {remaining-=row.score;if(remaining<0)return row.id;}
    return null; // 全部停用或只剩上一招時等待，不破壞「不連出同招」。
  }
  function start(timing) {return {phase:'windup',left:timing.windup};}
  function advance(state,timing,dt) {
    const left=Math.max(0,state.left-Math.max(0,dt));
    if(left>1e-6 || state.phase==='select') return {state:{...state,left},events:[]};
    const order=['windup','active','recovery','cooldown','select'];
    const phase=order[order.indexOf(state.phase)+1];
    return {state:{phase,left:timing[phase]||0},events:[{type:'enter',phase}]};
  }
  return {phase,scores,choose,start,advance};
})();

if(globalThis.Survivor && Survivor.engine) Survivor.engine['boss-ai']={rules:SurvivorBossAI};
