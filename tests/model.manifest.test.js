// tests/model.manifest.test.js
// -------------------------------------------------------------
// Sanity check for the model manifest builder.
// Creates a temporary HF-style directory, runs the CLI, and asserts
// the manifest structure + hashes are correct.
// -------------------------------------------------------------

import assert from "assert";
import crypto from "crypto";
import fs from "fs";
import os from "os";
import path from "path";
import { execFileSync } from "child_process";

function sha256Hex(buf) {
  return crypto.createHash("sha256").update(buf).digest("hex");
}

function withTempDir(fn) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "jsonos-model-"));
  try {
    return fn(dir);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

function writeFile(dir, name, contents) {
  const p = path.join(dir, name);
  fs.writeFileSync(p, contents);
  return p;
}

function loadManifest(p) {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

withTempDir((tmp) => {
  // Minimal HF-style payload
  writeFile(tmp, "config.json", JSON.stringify({ hidden_size: 8 }));
  writeFile(tmp, "tokenizer.json", JSON.stringify({ model: "test-tokenizer" }));
  writeFile(tmp, "tokenizer_config.json", JSON.stringify({ max_length: 16 }));
  writeFile(tmp, "model.safetensors", "weights-go-here");

  const out = path.join(tmp, "model.manifest.json");
  execFileSync("node", ["scripts/build-model-manifest.js", tmp, "--out", out], {
    stdio: "pipe",
  });

  const manifest = loadManifest(out);
  assert.strictEqual(manifest["@type"], "model.manifest.v1");
  assert.strictEqual(manifest.file_count, 4);
  assert.strictEqual(manifest.files.length, 4);

  const byName = Object.fromEntries(
    manifest.files.map((f) => [f.name, f])
  );

  const expectedHashes = {
    "config.json": sha256Hex(Buffer.from(JSON.stringify({ hidden_size: 8 }))),
    "tokenizer.json": sha256Hex(Buffer.from(JSON.stringify({ model: "test-tokenizer" }))),
    "tokenizer_config.json": sha256Hex(
      Buffer.from(JSON.stringify({ max_length: 16 }))
    ),
    "model.safetensors": sha256Hex(Buffer.from("weights-go-here")),
  };

  for (const [name, hash] of Object.entries(expectedHashes)) {
    assert.ok(byName[name], `missing ${name} entry`);
    assert.strictEqual(byName[name].sha256, hash);
  }

  const byteSum = manifest.files.reduce((acc, f) => acc + f.bytes, 0);
  assert.strictEqual(manifest.total_bytes, byteSum);
});
