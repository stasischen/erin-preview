# Erin public preview

Latest candidate: PR #112, source `4324a6cd73a1f65ea71e230bc6f3a645d97be98f`, version `20261101i`.

Candidate URL: https://stasischen.github.io/erin-preview/pr-112/4324a6cd73a1f65ea71e230bc6f3a645d97be98f/games/survivor/

This branch contains only static candidate payloads. Do not run source scripts or add CI workflows. Each candidate is immutable and isolated by PR and full source SHA. The source game repository and its main branch are unchanged by this payload.

Candidate snapshots disable service worker registration and PWA installation only within the snapshot, and isolate storage keys by PR/SHA. No production worker is unregistered and no cache is deleted. `sw.js`, `manifest.webmanifest`, tests, tools, docs, screenshots, logs, coordination data, and Git metadata are not published. Each candidate includes a SHA-256 manifest and logical adapter diff.
