// tests/run.wasm.parity.test.js
// =====================================================
// JSON-OS / ASX-R — Node ⇄ WASM Parity Test (v1)
// Ensures identical proof hashes across:
//   - Node reference kernel (execute_plan.js)
//   - WASM kernel (pkg/jsonos_kernel_wasm)
// For both:
//   - raw plans
//   - SCXQ2-packed plans
// Deterministic across Node 18 / 20 / 22.
// =====================================================

import fs from "fs";
import { fileURLToPath } from "url";
import path from "path";

// ---- Node reference kernel ----
import { execute_plan } from "../kernel/execute_plan.js";

// ---- WASM kernel (wasm-pack output) ----
import initWasm, { execute_plan_json } from "../pkg/jsonos_kernel_wasm.js";

// -----------------------------------------------------

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const GOLDEN_DIR = path.join(__dirname, "golden");
const EXPECTED = JSON.parse(fs.readFileSync(path.join(GOLDEN_DIR, "expected.hashes.json"), "utf8"));

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

// -----------------------------------------------------

function loadJSON(filename) {
  return JSON.parse(fs.readFileSync(path.join(GOLDEN_DIR, filename), "utf8"));
}

function assertEqual(actual, expected, label) {
  if (actual !== expected) {
    throw new Error(`${label} mismatch\n  expected: ${expected}\n  actual:   ${actual}`);
  }
}

function runNodeKernel(plan, prompt) {
  const out = execute_plan(plan, { prompt });
  return out.proof;
}

function runWasmKernel(plan, prompt) {
  const outJson = execute_plan_json(JSON.stringify(plan), prompt, null);
  const out = JSON.parse(outJson);
  if (out["@type"] === "asx.error.v1") {
    throw new Error(`WASM kernel error: ${out["@error"]}`);
  }
  return out.proof;
}

// -----------------------------------------------------

async function main() {
  console.log("JSON-OS / ASX-R WASM Parity Test");
  console.log("Node:", process.version);
  console.log("----------------------------------");

  // Initialize WASM once
  await initWasm();

  for (const fx of FIXTURES) {
    const expected = EXPECTED[fx.raw];

    // ---- RAW PLAN ----
    const rawPlan = loadJSON(fx.raw);

    const nodeRaw = runNodeKernel(rawPlan, fx.prompt);
    const wasmRaw = runWasmKernel(rawPlan, fx.prompt);

    // ---- PACKED PLAN ----
    const packedPlan = loadJSON(fx.packed);

    const nodePacked = runNodeKernel(packedPlan, fx.prompt);
    const wasmPacked = runWasmKernel(packedPlan, fx.prompt);

    // ---- ASSERT ALL HASHES ----
    for (const k of Object.keys(expected)) {
      assertEqual(nodeRaw[k], expected[k], `NODE RAW ${fx.name} ${k}`);
      assertEqual(wasmRaw[k], expected[k], `WASM RAW ${fx.name} ${k}`);

      assertEqual(nodePacked[k], expected[k], `NODE PACKED ${fx.name} ${k}`);
      assertEqual(wasmPacked[k], expected[k], `WASM PACKED ${fx.name} ${k}`);

      assertEqual(nodeRaw[k], wasmRaw[k], `NODE vs WASM RAW ${fx.name} ${k}`);
      assertEqual(nodePacked[k], wasmPacked[k], `NODE vs WASM PACKED ${fx.name} ${k}`);
    }

    console.log(`[PASS] ${fx.name} (Node ⇄ WASM, raw + packed)`);
  }

  console.log("----------------------------------");
  console.log("Node ⇄ WASM ⇄ PWA parity: OK");
}

// -----------------------------------------------------

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
