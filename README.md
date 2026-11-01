# Erin public preview

Latest candidate: PR #112, source `39b4519d4075e354b75df87f04d2539981790d1f`, version `20261101f`.

Candidate URL: https://stasischen.github.io/erin-preview/pr-112/39b4519d4075e354b75df87f04d2539981790d1f/games/survivor/

This branch contains only static candidate payloads. Do not run source scripts or add CI workflows. Each candidate is immutable and isolated by PR and full source SHA. The source game repository and its main branch are unchanged by this payload.

Candidate snapshots disable service worker registration and PWA installation only within the snapshot, and isolate storage keys by PR/SHA. No production worker is unregistered and no cache is deleted. `sw.js`, `manifest.webmanifest`, tests, tools, docs, screenshots, logs, coordination data, and Git metadata are not published. Each candidate includes a SHA-256 manifest and logical adapter diff.
