#!/usr/bin/env node
// scripts/build-model-manifest.js
// -------------------------------------------------------------
// Build a reproducible manifest for a Hugging Face style model
// directory (e.g., config.json, tokenizer.json, model.safetensors).
// The manifest records sha256 + byte size for recognized files and
// is safe to run on multi-gigabyte checkpoints thanks to streaming.
// -------------------------------------------------------------

import crypto from "crypto";
import fs from "fs";
import path from "path";

const DEFAULT_NAMES = new Set([
  "config.json",
  "tokenizer.json",
  "tokenizer_config.json",
  "special_tokens_map.json",
  "generation_config.json",
  "added_tokens.json",
  "merges.txt",
  "merges",
  "vocab.json",
  "chat_template.jinja",
]);

const DEFAULT_PATTERNS = [
  /^model.*\.safetensors$/i,
  /^pytorch_model.*\.bin$/i,
  /^.*\.gguf$/i,
];

function usage() {
  console.log(`usage: node scripts/build-model-manifest.js <model_dir> [--out <file>] [--include name1,name2] [--all] [--stdout]

Required:
  <model_dir>         Path to a folder containing model files (config.json, tokenizer.json, model.safetensors, etc.)

Options:
  --out <file>        Where to write the manifest (default: <model_dir>/model.manifest.json)
  --include names     Comma-separated additional file names to include
  --all               Include every file in the directory (not just known model assets)
  --stdout            Also print the manifest JSON to stdout
`);
}

function getFlagValue(args, flag) {
  const idx = args.indexOf(flag);
  if (idx === -1) return null;
  return args[idx + 1] && !args[idx + 1].startsWith("--") ? args[idx + 1] : null;
}

async function hashFile(filePath) {
  const stat = await fs.promises.stat(filePath);
  if (!stat.isFile()) return null;

  return await new Promise((resolve, reject) => {
    const hash = crypto.createHash("sha256");
    const stream = fs.createReadStream(filePath);
    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("error", reject);
    stream.on("end", () =>
      resolve({
        bytes: stat.size,
        sha256: hash.digest("hex"),
      })
    );
  });
}

async function collectFiles(dir, includeAll, extraNames) {
  const entries = await fs.promises.readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (!entry.isFile()) continue;
    const name = entry.name;
    const isDefaultName = DEFAULT_NAMES.has(name);
    const matchesPattern = DEFAULT_PATTERNS.some((re) => re.test(name));
    const isExtra = extraNames.has(name);
    if (!includeAll && !isDefaultName && !matchesPattern && !isExtra) continue;
    files.push(name);
  }

  return files.sort();
}

async function buildManifest(modelDir, options) {
  const absDir = path.resolve(modelDir);
  const includeAll = options.includeAll || false;
  const extraNames = options.extraNames || new Set();
  const files = await collectFiles(absDir, includeAll, extraNames);

  if (!files.length) {
    throw new Error("No model files found (use --all or --include to widen the search).");
  }

  const manifest = {
    "@type": "model.manifest.v1",
    "@generated_at": new Date().toISOString(),
    "source_dir": absDir,
    "files": [],
    "file_count": 0,
    "total_bytes": 0,
  };

  for (const name of files) {
    const fullPath = path.join(absDir, name);
    const hashed = await hashFile(fullPath);
    if (!hashed) continue;
    manifest.files.push({
      name,
      bytes: hashed.bytes,
      sha256: hashed.sha256,
    });
    manifest.total_bytes += hashed.bytes;
    manifest.file_count += 1;
  }

  return manifest;
}

async function main() {
  const args = process.argv.slice(2);
  if (!args.length || args.includes("--help") || args.includes("-h")) {
    usage();
    process.exit(args.length ? 0 : 1);
  }

  const modelDir = args.find((a) => !a.startsWith("--"));
  if (!modelDir) {
    usage();
    process.exit(1);
  }

  const outPathFlag = getFlagValue(args, "--out");
  const outPath = outPathFlag
    ? path.resolve(outPathFlag)
    : path.join(path.resolve(modelDir), "model.manifest.json");
  const includeRaw = getFlagValue(args, "--include");
  const includeAll = args.includes("--all");
  const printStdout = args.includes("--stdout");
  const extraNames = new Set(
    (includeRaw || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
  );

  const manifest = await buildManifest(modelDir, { includeAll, extraNames });

  await fs.promises.mkdir(path.dirname(outPath), { recursive: true });
  await fs.promises.writeFile(outPath, JSON.stringify(manifest, null, 2));
  console.log(`Wrote manifest: ${outPath}`);
  console.log(`Files: ${manifest.file_count} | Total bytes: ${manifest.total_bytes}`);

  if (printStdout) {
    process.stdout.write(JSON.stringify(manifest, null, 2) + "\n");
  }
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
