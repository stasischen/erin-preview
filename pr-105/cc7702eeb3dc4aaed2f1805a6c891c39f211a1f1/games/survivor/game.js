// Parser-time classic loader: dependencies finish before maker.js / preview-engine.js.
// Both pages load manifest.js immediately before this entry point.
(function () {
  const version = new URL(document.currentScript.src).search;
  for (const file of SurvivorManifest) {
    document.write('<script src="' + file + version + '"><\/script>');
  }
})();
