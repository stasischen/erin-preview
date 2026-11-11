// Parser-time loader shared by game, preview and practice entry pages.
(function () {
  const version = new URL(document.currentScript.src).search;
  for (const file of SurvivorDataManifest) document.write('<script src="' + file + version + '"><\/script>');
})();
