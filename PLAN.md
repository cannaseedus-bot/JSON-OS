# JSON-OS Project Phases

This document tracks the high-level phases for JSON-OS so contributors can quickly understand where the project is and what comes next.

## Phase 1 — Golden Plan Fixtures
* Finalize the canonical hello/caption plan fixtures with locked hashes.
* Keep deterministic bounds, hashing rules, and shared test harness inputs/outputs.
* Ensure both raw JSON and SCXQ2-packed plans remain authoritative.

## Phase 2 — Reference Kernel & CI Parity
* Maintain the reference `kernel/execute_plan.js` implementation and its allowlisted ops.
* Keep the shared harness (`tests/run.shared.test.js`) passing across Node versions.
* Preserve CI coverage that validates Basher ⇄ PWA parity with identical proofs.

## Phase 3 — Basher / PWA Integration
* Provide Basher CLI commands that delegate to the kernel without expanding authority.
* Keep PWA assets (manifest, service worker, index) aligned with the same plan semantics.
* Document how nodes load law (`os.json`/`server.json`) and enforce routes locally.

## Phase 4 — Mesh & Cloud CLI Expansion (Planned)
* Add cloud CLI adapters that validate against `os.json`/`server.json` before dispatching.
* Support node-to-node capability exchange via GAS/HTTP relays while preserving lexicon rules.
* Define discovery, identity, and signing flows without weakening local enforcement.
# Plan

## To-Do → To-Done

- [x] Create a dedicated `gas/` folder containing all Google Apps Script sources.
- [x] Add installation and deployment instructions for the GAS files.
- [x] Cross-link the GAS deployment flow in the main README.

## Future Plans

- Automate GAS deployments (e.g., via `clasp`) to keep web app URLs in sync.
- Add integration tests that validate GAS responses against the golden hashes.
- Provide a template `server.json` generator that wires GAS routes automatically.
