// Same parser-time loading convention as the game entry point.
(function () {
  const version = new URL(document.currentScript.src).search;
  for (const file of SurvivorMakerManifest) document.write('<script src="' + file + version + '"><\/script>');
})();
