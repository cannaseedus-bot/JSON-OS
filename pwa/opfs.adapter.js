// pwa/opfs.adapter.js
// OPFS File Plane v1 adapter (deterministic)

async function sha256Hex(bytes) {
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  const arr = Array.from(new Uint8Array(digest));
  return arr.map((b) => b.toString(16).padStart(2, "0")).join("");
}

function parseRef(ref) {
  const m = ref.match(/^file:\/\/(workspace|cache|artifact)\/(.+)$/);
  if (!m) throw new Error(`InvalidRef: ${ref}`);
  return { kind: m[1], path: m[2] };
}

async function getRootDir(kind) {
  const root = await navigator.storage.getDirectory();
  const dirName =
    kind === "workspace" ? "workspace" : kind === "cache" ? "cache" : "artifacts";
  return await root
    .getDirectoryHandle(".jsonos", { create: true })
    .then(async (d) => d.getDirectoryHandle(dirName, { create: true }));
}

async function getFileHandleByPath(rootDir, relPath, create) {
  const parts = relPath.split("/").filter(Boolean);
  let d = rootDir;
  for (let i = 0; i < parts.length - 1; i++) {
    d = await d.getDirectoryHandle(parts[i], { create });
  }
  return await d.getFileHandle(parts[parts.length - 1], { create });
}

export const OPFS = {
  async read(ref, maxBytes = 16777216) {
    const { kind, path } = parseRef(ref);
    const root = await getRootDir(kind);
    const fh = await getFileHandleByPath(root, path, false);
    const f = await fh.getFile();
    if (f.size > maxBytes) throw new Error(`ReadExceeded: ${f.size} > ${maxBytes}`);
    const ab = await f.arrayBuffer();
    const hash = await sha256Hex(ab);
    return { bytes: new Uint8Array(ab), hash, size: f.size };
  },

  async write(ref, bytes, maxBytes = 16777216) {
    const { kind, path } = parseRef(ref);
    if (bytes.byteLength > maxBytes)
      throw new Error(`WriteExceeded: ${bytes.byteLength} > ${maxBytes}`);
    const root = await getRootDir(kind);
    const fh = await getFileHandleByPath(root, path, true);
    const w = await fh.createWritable();
    await w.write(bytes);
    await w.close();
    const hash = await sha256Hex(bytes);
    return { hash, size: bytes.byteLength };
  },

  async list(refPrefix) {
    const { kind, path } = parseRef(refPrefix);
    const root = await getRootDir(kind);
    const parts = path.split("/").filter(Boolean);
    let d = root;
    for (const p of parts) d = await d.getDirectoryHandle(p, { create: false });

    const out = [];
    for await (const [name] of d.entries()) {
      out.push(name);
    }
    out.sort();
    return out;
  },

  async stat(ref) {
    const { kind, path } = parseRef(ref);
    const root = await getRootDir(kind);
    const fh = await getFileHandleByPath(root, path, false);
    const f = await fh.getFile();
    const ab = await f.arrayBuffer();
    const hash = await sha256Hex(ab);
    return { size: f.size, hash };
  },
};
