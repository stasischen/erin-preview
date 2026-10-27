// 純弱點積木：只收可序列化資料、角度與秒，不讀畫面、音訊或實體。
globalThis.SurvivorWeakpoints = (() => {
  const wrap = angle => Math.atan2(Math.sin(angle), Math.cos(angle));
  function inArc(source, body, facing, angleDegrees, arcDegrees) {
    if (arcDegrees >= 360) return true;
    if(Math.hypot(source.x-body.x,source.y-body.y)<1e-8)return false; // 無方向的中心命中不能猜成背擊。
    const angle = Math.atan2(source.y - body.y, source.x - body.x);
    return Math.abs(wrap(angle - facing - angleDegrees * Math.PI / 180)) <= arcDegrees * Math.PI / 360 + 1e-8;
  }
  function matches(condition, context) {
    if (condition.type === 'behind') return inArc(context.source, context.body, context.facing, 180, 120);
    if (condition.type === 'after-move') return !!context.flags['after-move'] && context.moveId === condition.moveId;
    return context.flags[condition.type] === true;
  }
  function step(previous, config, context, dt) {
    if (!config) return {state: {}, events: []};
    const state = {}, events = [];
    for (const part of config.parts) {
      const old = previous && previous[part.id] || {phase: 'closed', left: 0, matched: false};
      const values = part.conditions.map(c => matches(c, context));
      const matched = part.mode === 'all' ? values.every(Boolean) : values.some(Boolean);
      const oldMatches=old.matches||values.map(()=>old.matched);
      const triggered=matched&&(!old.matched||part.mode==='any'&&values.some((value,i)=>value&&!oldMatches[i]));
      let phase = old.phase, left = old.left, seconds = Math.max(0, dt);
      if (triggered) {
        phase = 'warning'; left = config.warning; events.push({type: 'weakpoint-warning', partId: part.id});
      }
      for (let i = 0; i < 3 && phase !== 'closed'; i++) {
        if (seconds < left - 1e-8) {left -= seconds; break;}
        seconds = Math.max(0, seconds - left);
        if (phase === 'warning') {phase = 'open'; left = part.duration - config.closing;}
        else if (phase === 'open') {phase = 'closing'; left = config.closing;}
        else {phase = 'closed'; left = 0;}
        events.push({type: 'weakpoint-' + phase, partId: part.id});
      }
      state[part.id] = {phase, left, matched, matches:values};
    }
    return {state, events};
  }
  function resolve(config, state, body, source, facing, points, hit = body) {
    if (!config) return {multiplier: 1, kind: 'normal', partId: null};
    for (const part of config.parts) {
      const phase = state && state[part.id] && state[part.id].phase, point = points[part.anchor];
      if (!['open', 'closing'].includes(phase) || !point) continue;
      if (!inArc(source, body, facing, part.angleDegrees, part.arcDegrees)) continue;
      if (Math.hypot(hit.x - point.x, hit.y - point.y) > body.r * part.radiusScale + (hit.r || 0)) continue;
      return {multiplier: config.criticalMultiplier, kind: 'critical', partId: part.id};
    }
    return {multiplier: config.armorMultiplier, kind: 'armor', partId: null};
  }
  return {inArc, matches, step, resolve};
})();
SurvivorEffectBlocks.weakpoint = SurvivorWeakpoints;

// 接合層統一輸入；只掛在有弱點設定的 Boss，不影響其他怪物。
function bossWeakpointConfig(body) {
  if (!body || body !== state.boss && !body.trialActor) return null;
  return state.trial ? state.trial.definition.weakpoint || null : GAME_DATA.boss.weakpoint || null;
}
function bossWeakpointArt(body) {return state.trial ? body.artId || state.trial.definition.artId : 'character/teacher';}
function bossWeakpointPoints(body, config) {
  const id=bossWeakpointArt(body),context={angle:body.facingAngle||0,displayScale:body.r/32};
  const art = SurvivorArt.lookup(id,'idle',0,SurvivorArtManifest,context), points = {};
  const scale=body.r/32;
  const [x,y,width,height]=SurvivorArt.bounds(id,body.x-26*scale,body.y-34*scale,52*scale,68*scale,context);
  for (const part of config.parts) {
    const anchor = art.anchors && art.anchors[part.anchor];
    if (!anchor) continue;
    // 與 renderer 共用 bounds、pivot、scale 與鏡像，部位命中半徑仍是世界單位。
    points[part.anchor] = {x:x+width*(art.flipX?1-anchor[0]:anchor[0]),y:y+height*anchor[1]};
  }
  return points;
}
function triggerBossWeakpoint(body, type, seconds = 1) {
  if (!bossWeakpointConfig(body) || !['wall-stun', 'posture-break', 'environment', 'bait'].includes(type)) return;
  body.weakpointSignals = {...body.weakpointSignals, [type]: Math.max(0, seconds)};
}
function clearBossWeakpoints(body) {
  delete body.weakpoints;delete body.weakpointSignals;delete body.weakpointMoveId;delete body.facingAngle;
}
function noteBossRecovery(body, moveId, seconds=.6) {
  if(!bossWeakpointConfig(body))return;
  body.weakpointMoveId=moveId;
  body.weakpointSignals={...body.weakpointSignals,recovery:seconds,'after-move':seconds};
}
function updateBossWeakpoints(dt) {
  for (const body of state.trial ? trialBodies() : state.boss ? [state.boss] : []) {
    const config = bossWeakpointConfig(body);
    if (!config) {if(body.weakpointSignals||body.weakpoints)clearBossWeakpoints(body); continue;}
    if (state.bossIntro > 0 || state.bossPhasePause > 0) {clearBossWeakpoints(body); continue;}
    const moves = body.moves || state.bossMoves, move = moves[0];
    const signals = body.weakpointSignals || {};
    const recovery = signals.recovery>0 || moves.some(m => m.recovery > 0 || m.ai && m.ai.phase === 'recovery');
    if (move && Number.isFinite(move.angle)) body.facingAngle = move.angle;
    else if (!recovery && !(body.posture && body.posture.stun > 0)) body.facingAngle = Math.atan2(deltaY(state.player.y, body.y), deltaX(state.player.x, body.x));
    const context = {body, source: {x: body.x + deltaX(state.player.x, body.x), y: body.y + deltaY(state.player.y, body.y)},
      facing: body.facingAngle || 0, moveId: body.weakpointMoveId,
      flags: {recovery, 'after-move':signals['after-move']>0, 'posture-break': signals['posture-break'] > 0,
        'wall-stun': signals['wall-stun'] > 0, environment: signals.environment > 0, bait: signals.bait > 0}};
    const result = SurvivorWeakpoints.step(body.weakpoints, config, context, body.feedbackFrozen ? 0 : dt);
    body.weakpoints = result.state;
    for (const key of Object.keys(signals)) signals[key] = countdown(signals[key], body.feedbackFrozen?0:dt);
  }
}
function resolveBossWeakpoint(body, attack = {}) {
  const config = bossWeakpointConfig(body);
  if (!config) return {multiplier: 1, kind: 'normal', partId: null};
  const origin = attack.source || state.player;
  const source = {x: body.x + deltaX(origin.x, body.x), y: body.y + deltaY(origin.y, body.y)};
  const hit=attack.point?{...attack.point,x:body.x+deltaX(attack.point.x,body.x),y:body.y+deltaY(attack.point.y,body.y)}:body;
  return SurvivorWeakpoints.resolve(config, body.weakpoints, body, source, body.facingAngle || 0,
    bossWeakpointPoints(body, config), hit);
}
function weakpointImpact(body, result, attacker = state.player) {
  if (result.kind === 'normal') return;
  tierImpact(result.kind === 'critical' ? 'large' : 'small', attacker, body,
    result.kind === 'armor' ? {sound: 'metal', trauma: .08, particles: 5} : {sound: 'posture'});
}
Survivor.engine=Survivor.engine||{};
Survivor.engine.weakpoint={rules:SurvivorWeakpoints,bossWeakpointConfig,updateBossWeakpoints,resolveBossWeakpoint,triggerBossWeakpoint,clearBossWeakpoints,noteBossRecovery};
