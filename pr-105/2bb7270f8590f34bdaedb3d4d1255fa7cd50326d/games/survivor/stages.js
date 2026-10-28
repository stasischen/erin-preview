function currentStage() { return STAGES[state.stageIndex || 0]; }
function currentWaves() { return currentStage().waves; }


// Live accessors preserve shared state and the legacy globals used by preview/VM callers.
globalThis.Survivor.stages = globalThis.Survivor.stages || {};
Object.defineProperties(globalThis.Survivor.stages, {
  currentStage: { enumerable: true, get: () => currentStage },
  currentWaves: { enumerable: true, get: () => currentWaves }
});
