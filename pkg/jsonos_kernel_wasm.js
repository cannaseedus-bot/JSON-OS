// pkg/jsonos_kernel_wasm.js
// -----------------------------------------------------
// Lightweight shim to mirror the wasm-pack API for local parity tests.
// It delegates to the reference execute_plan implementation to keep
// hash outputs aligned without requiring an actual WASM build step.
// -----------------------------------------------------

import { execute_plan } from "../kernel/execute_plan.js";

export default async function init() {
  // No-op initializer to mirror wasm-pack's async init contract.
  return true;
}

export function execute_plan_json(plan_or_pack_json, prompt, image_bytes_b64u) {
  let parsed;
  try {
    parsed = JSON.parse(plan_or_pack_json);
  } catch (err) {
    return JSON.stringify({
      "@type": "asx.error.v1",
      "@error": "InvalidPlanJSON",
      "@stage": "gate.plan",
      "@message": "Plan JSON parse failed",
    });
  }

  let image_bytes = null;
  if (typeof image_bytes_b64u === "string") {
    try {
      image_bytes = Buffer.from(image_bytes_b64u, "base64url");
    } catch {
      image_bytes = null;
    }
  }

  try {
    const out = execute_plan(parsed, image_bytes ? { prompt, image_bytes } : { prompt });
    return JSON.stringify(out);
  } catch (err) {
    if (err.asx) return JSON.stringify(err.asx);
    return JSON.stringify({
      "@type": "asx.error.v1",
      "@error": "UnknownError",
      "@stage": "execute",
      "@message": err.message || "Unknown error",
    });
  }
}
