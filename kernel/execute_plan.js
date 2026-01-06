// kernel/execute_plan.js
// ===============================================
// JSON-OS / ASX-R — execute_plan reference (v1)
// Deterministic: SHA-256, canonical JSON, allowlisted ops.
// Supports raw plans OR SCXQ2 BLOB-packed plans.
// ===============================================

import crypto from "crypto";

const ALLOWLIST = new Set([
  "sys.set",
  "input.user",
  "idb.kql",
  "scxq2.decode",
  "img.fetch",
  "img.decode",
  "img.preprocess",
  "chat.run",
  "vision.run",
  "return",
]);

function sha256Hex(buf) {
  return crypto.createHash("sha256").update(buf).digest("hex");
}

function stableStringify(x) {
  // Canonical JSON: sorted keys, no whitespace, UTF-8, preserve unicode.
  if (x === null || typeof x !== "object") return JSON.stringify(x);
  if (Array.isArray(x)) return "[" + x.map(stableStringify).join(",") + "]";
  const keys = Object.keys(x).sort();
  return (
    "{" +
    keys
      .map((k) => JSON.stringify(k) + ":" + stableStringify(x[k]))
      .join(",") +
    "}"
  );
}

function canonHash(obj) {
  return sha256Hex(Buffer.from(stableStringify(obj), "utf8"));
}

function decodeScxq2Blob(payload) {
  // Format: "⟁SCXQ2⟁BLOB⟁" + base64url(no padding) of canonical JSON bytes
  const prefix = "⟁SCXQ2⟁BLOB⟁";
  if (typeof payload !== "string" || !payload.startsWith(prefix)) {
    throw asxError("InvalidSCXQ2Payload", "gate.decode", "Invalid SCXQ2 blob payload");
  }
  const b64url = payload.slice(prefix.length);
  const pad = "=".repeat((4 - (b64url.length % 4)) % 4);
  const b64 = (b64url + pad).replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(b64, "base64").toString("utf8");
}

export function decode_plan_if_packed(planOrPack) {
  if (!planOrPack || typeof planOrPack !== "object") return planOrPack;
  if (planOrPack["@type"] !== "scxq2.plan.pack.v1") return planOrPack;

  if (planOrPack["@encoding"] !== "scxq2.blob.v1") {
    throw asxError("UnsupportedPackEncoding", "gate.decode", "Unsupported SCXQ2 pack encoding");
  }

  const jsonText = decodeScxq2Blob(planOrPack["@payload_scxq2"]);
  const plan = JSON.parse(jsonText);

  // Optional integrity check if pack includes @plan_hash
  if (planOrPack["@plan_hash"]) {
    const ph = canonHash(plan);
    if (ph !== planOrPack["@plan_hash"]) {
      throw asxError("PlanHashMismatch", "gate.decode", "Packed plan hash mismatch");
    }
  }

  return plan;
}

function asxError(type, stage, message, details) {
  const e = {
    "@type": "asx.error.v1",
    "@error": type,
    "@stage": stage,
    "@message": message,
  };
  if (details && typeof details === "object") e["@details"] = details;
  const err = new Error(message);
  err.asx = e;
  return err;
}

function normalizePlan(plan) {
  // Minimal normalization (v1):
  // - ensure bounds exist
  // - temperature deterministic default = 0.0 if missing for chat.run
  if (!plan["@bounds"] || typeof plan["@bounds"] !== "object") {
    throw asxError("MissingBounds", "normalize", "Plan missing @bounds");
  }
  const steps = plan["@steps"];
  if (!Array.isArray(steps)) throw asxError("InvalidSteps", "normalize", "@steps must be array");

  for (const s of steps) {
    if (s["@op"] === "chat.run" && s["@temperature"] === undefined) s["@temperature"] = 0.0;
  }
  return plan;
}

function defaultAdapters() {
  // Deterministic stubs for golden vectors.
  const mx2lmModelHash = sha256Hex(Buffer.from("mx2lm:v1", "utf8"));
  const janusModelHash = sha256Hex(Buffer.from("janus_asx_v1", "utf8"));

  return {
    chat: (prompt, ctx, opts) => ({
      "@type": "inference.result.v1",
      "@text": "Hello.",
      "@tokens_used": 3,
      "@model_hash": mx2lmModelHash,
    }),
    vision: (input, prompt, task, opts) => ({
      "@type": "image.inference.result.v1",
      "@ok": true,
      "@caption": "A green terminal window with an atomic symbol.",
      "@model_hash": janusModelHash,
    }),
  };
}

function defaultIdb() {
  return {
    kql: (kqlText) => ({
      "@type": "idb.query.result.v1",
      "@ok": true,
      "@rows": [{ id: "img_001", blob_ref: "idb://blob/img_001", mime: "image/png" }],
    }),
  };
}

export function execute_plan(planOrPack, env = {}) {
  const plan = normalizePlan(decode_plan_if_packed(planOrPack));
  const planType = plan["@type"];
  if (planType !== "inference.plan.v1" && planType !== "image.plan.v1") {
    throw asxError("InvalidPlanType", "gate.plan", "Unsupported plan @type", { "@type": planType });
  }

  const bounds = plan["@bounds"];
  const steps = plan["@steps"];
  if (steps.length > bounds["@max_steps"]) {
    throw asxError("StepBudgetExceeded", "bounds.steps", "Step count exceeds plan bounds", {
      "@max_steps": bounds["@max_steps"],
      "@actual_steps": steps.length,
    });
  }

  const plan_hash = canonHash(plan);
  const adapters = env.adapters || defaultAdapters();
  const idb = env.idb || defaultIdb();

  const state = Object.create(null);
  const ctx_hashes = [];
  let image_hash = null;
  let output = null;

  for (const step of steps) {
    const op = step["@op"];
    if (!ALLOWLIST.has(op)) {
      throw asxError("DisallowedStepOp", "gate.op_allowlist", "Step op not in allowlist", {
        "@op": op,
      });
    }

    switch (op) {
      case "sys.set":
        state.__sys__ = step["@text"];
        break;

      case "input.user":
        state[step["@into"] || "prompt"] = env.prompt ?? "hello";
        break;

      case "idb.kql": {
        const res = idb.kql(step["@kql"]);
        state[step["@into"]] = res;
        ctx_hashes.push(canonHash(res));
        break;
      }

      case "scxq2.decode":
        // v1 reference: decode is a no-op unless user supplies env.scxq2
        if (!env.scxq2 || typeof env.scxq2.decode !== "function") {
          throw asxError("MissingSCXQ2Decoder", "gate.decode", "scxq2.decode requested but no decoder provided");
        }
        state[step["@into"]] = env.scxq2.decode(state[step["@from"]]);
        break;

      case "img.fetch": {
        // Deterministic bytes source (golden):
        const bytes = env.image_bytes || Buffer.from("img_001_png_bytes_v1", "utf8");
        state[step["@into"]] = bytes;
        image_hash = sha256Hex(bytes);
        break;
      }

      case "img.decode":
        // Deterministic placeholder tensor marker (not hashed; bytes already hashed)
        state[step["@into"]] = { "@type": "image.tensor.v1", "@from": step["@from"] };
        break;

      case "img.preprocess":
        state[step["@into"]] = { "@type": "image.tensor.v1", "@preprocessed": true };
        break;

      case "chat.run": {
        const prompt = state.prompt ?? env.prompt ?? "hello";
        const ctx = state.ctx || null;
        const out = adapters.chat(prompt, ctx, step);
        state[step["@into"]] = out;
        break;
      }

      case "vision.run": {
        const input = state[step["@input"]] || state.tensor || null;
        const out = adapters.vision(input, step["@prompt"], step["@task"], step);
        state[step["@into"]] = out;
        break;
      }

      case "return":
        output = state[step["@from"]];
        break;

      default:
        throw asxError("UnreachableOp", "gate", "Unreachable op");
    }

    if (op === "return") break;
  }

  if (!output) throw asxError("MissingReturn", "collapse", "Plan completed without return step");

  const output_hash = canonHash(output);

  // Context hash: H(concat(hashes))
  const ctx_concat = ctx_hashes.join("");
  const context_hash = ctx_hashes.length
    ? sha256Hex(Buffer.from(ctx_concat, "utf8"))
    : "0000000000000000000000000000000000000000000000000000000000000000";

  // Proof (text vs image)
  const proof =
    planType === "inference.plan.v1"
      ? {
          "@type": "inference.proof.v1",
          "plan_hash": plan_hash,
          "context_hash": context_hash,
          "model_hash": output["@model_hash"],
          "output_hash": output_hash,
        }
      : {
          "@type": "image.inference.proof.v1",
          "plan_hash": plan_hash,
          "context_hash": context_hash,
          "image_hash": image_hash,
          "model_hash": output["@model_hash"],
          "output_hash": output_hash,
        };

  return { result: output, proof };
}
