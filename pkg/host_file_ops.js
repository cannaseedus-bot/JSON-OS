// pkg/host_file_ops.js
import fs from "fs";
import path from "path";
import crypto from "crypto";

const ROOT = process.cwd();

function sha256Hex(buf) {
  return crypto.createHash("sha256").update(buf).digest("hex");
}

function refToPath(ref) {
  const m = ref.match(/^file:\/\/(workspace|cache|artifact)\/(.+)$/);
  if (!m) throw new Error(`InvalidRef: ${ref}`);
  const kind = m[1],
    rest = m[2];

  if (kind === "workspace") return path.join(ROOT, rest);
  if (kind === "cache") return path.join(ROOT, ".jsonos", "cache", rest);
  return path.join(ROOT, ".jsonos", "artifacts", rest);
}

function b64uEncode(buf) {
  return Buffer.from(buf)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

export function host_file_read(ref, maxBytes) {
  const p = refToPath(ref);
  const buf = fs.readFileSync(p);
  if (buf.length > maxBytes) throw new Error(`ReadExceeded`);
  return {
    bytes_b64u: b64uEncode(buf),
    sha256: sha256Hex(buf),
    bytes: buf.length,
  };
}

export function host_file_write(ref, bytes_b64u, maxBytes) {
  const p = refToPath(ref);
  const pad = "=".repeat((4 - (bytes_b64u.length % 4)) % 4);
  const b64 = (bytes_b64u + pad).replace(/-/g, "+").replace(/_/g, "/");
  const buf = Buffer.from(b64, "base64");
  if (buf.length > maxBytes) throw new Error(`WriteExceeded`);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, buf);
  return { sha256: sha256Hex(buf), bytes: buf.length };
}

export function host_file_list(refPrefix) {
  const p = refToPath(refPrefix);
  const dir =
    fs.existsSync(p) && fs.statSync(p).isDirectory() ? p : path.dirname(p);
  const items = fs.readdirSync(dir).sort();
  return { items };
}

export function host_file_stat(ref) {
  const p = refToPath(ref);
  const st = fs.statSync(p);
  const buf = fs.readFileSync(p);
  return { bytes: st.size, sha256: sha256Hex(buf) };
}
