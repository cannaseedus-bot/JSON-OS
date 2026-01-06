// tests/run.shared.test.js
// =====================================================
// JSON-OS / ASX-R — Shared Parity Test Harness (v1)
// Tests:
//   - raw plan.json
//   - SCXQ2-packed plan.scxq2.json
// Ensures identical proof hashes across forms.
// =====================================================

import fs from "fs";
import path from "path";
import { execute_plan } from "../kernel/execute_plan.js";

const ROOT = new URL(".", import.meta.url);
const GOLDEN_DIR = new URL("./golden/", ROOT);
const EXPECTED = JSON.parse(
  fs.readFileSync(new URL("./golden/expected.hashes.json", ROOT), "utf8")
);

// Map raw → packed
const FIXTURES = [
  {
    name: "hello",
    raw: "hello.plan.json",
    packed: "hello.plan.scxq2.json",
    prompt: "hello",
  },
  {
    name: "caption",
    raw: "caption.plan.json",
    packed: "caption.plan.scxq2.json",
    prompt: "hello",
  },
];

function loadJSON(rel) {
  return JSON.parse(fs.readFileSync(new URL(rel, GOLDEN_DIR), "utf8"));
}

function assertEqual(actual, expected, label) {
  if (actual !== expected) {
    throw new Error(
      `${label} mismatch\n  expected: ${expected}\n  actual:   ${actual}`
    );
  }
}

function runFixture(fx) {
  const expected = EXPECTED[fx.raw];

  // ---- RAW PLAN ----
  const rawPlan = loadJSON(fx.raw);
  const rawOut = execute_plan(rawPlan, { prompt: fx.prompt });

  // ---- PACKED PLAN ----
  const packedPlan = loadJSON(fx.packed);
  const packedOut = execute_plan(packedPlan, { prompt: fx.prompt });

  // ---- PROOF PARITY ----
  const keys = Object.keys(expected);

  for (const k of keys) {
    assertEqual(rawOut.proof[k], expected[k], `RAW ${fx.name} ${k}`);
    assertEqual(packedOut.proof[k], expected[k], `PACKED ${fx.name} ${k}`);
  }

  // ---- RAW vs PACKED EQUALITY ----
  for (const k of keys) {
    assertEqual(
      rawOut.proof[k],
      packedOut.proof[k],
      `RAW vs PACKED ${fx.name} ${k}`
    );
  }

  console.log(`[PASS] ${fx.name} (raw + packed parity)`);
}

// -----------------------------------------------------

console.log("JSON-OS / ASX-R Shared Parity Test");
console.log("Node:", process.version);
console.log("----------------------------------");

for (const fx of FIXTURES) {
  runFixture(fx);
}

console.log("----------------------------------");
console.log("Basher ⇄ PWA ⇄ CI parity: OK");
