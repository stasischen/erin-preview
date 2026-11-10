// Session mode is separate from saved player preferences and Maker work data.
let runAttackMode=null, sandboxAttackMode=null;
function enterRunMode(trial=false) {
  if(trial && MAKER_MODE && sandboxAttackMode===null)sandboxAttackMode=GAME_DATA.attackMode;
  runAttackMode=trial?'manual':SURVIVAL_MODE?'auto':null;
  GAME_DATA.attackMode=runAttackMode || sandboxAttackMode || GAME_DATA.attackMode;
  cancelManualAttack();updateAttackModeButtons();
}
function applyAttackPreference() {
  GAME_DATA.attackMode=runAttackMode || (MAKER_MODE?(sandboxAttackMode || GAME_DATA.attackMode):'auto');
}
function canChangeAttackMode() {return MAKER_MODE && !runAttackMode;}

Survivor.engine=Survivor.engine||{};Survivor.engine.mode={enterRunMode,applyAttackPreference,canChangeAttackMode,get runAttackMode(){return runAttackMode;},get sandboxAttackMode(){return sandboxAttackMode;}};
