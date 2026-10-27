# Erin public preview

This directory is a prepared static Pages payload for PR #103, source `206f285bf9aac1800613b88dd27daffcac2a8d6b`, version `20261027i`.

Candidate URL: https://stasischen.github.io/erin-preview/pr-103/206f285bf9aac1800613b88dd27daffcac2a8d6b/games/survivor/

Publish these prepared files as the Pages branch contents for `stasischen/erin-preview`; do not run source scripts or add CI workflows. The source game repository and its main branch are unchanged by this payload.

The landing pages identify the candidate and link explicitly to the production site. Game viewport and HUD are unchanged. Five storage key literals use a PR-and-full-SHA prefix. Service worker registration and PWA installation references are disabled only in this snapshot; no production worker is unregistered and no cache is deleted. Source `sw.js` and `manifest.webmanifest` are intentionally omitted.

The candidate `preview-manifest.json` lists original and deployed SHA-256 values, allowed transforms, omitted PWA files, and the source storage audit. Its detached `.sha256` covers the manifest itself. `adapter-diff.patch` uses only logical source/deployed paths. No private coordination data, screenshots, logs, tests, tools, Git metadata or workflow files belong in this publication.
