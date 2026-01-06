import fs from "fs";
import path from "path";
import crypto from "crypto";

const ROOT = process.cwd();

function sha256Hex(buf) {
  return crypto.createHash("sha256").update(buf).digest("hex");
}

function toRef(input) {
  if (input && input.startsWith("file://")) return input;
  const clean = (input || "").replace(/\\/g, "/").replace(/^\.\/+/, "");
  return `file://workspace/${clean}`;
}

function refToPath(ref) {
  const m = ref.match(/^file:\/\/(workspace|cache|artifact)\/(.+)$/);
  if (!m) throw new Error(`InvalidRef: ${ref}`);
  const kind = m[1];
  const rest = m[2];

  if (kind === "workspace") return path.join(ROOT, rest);
  if (kind === "cache") return path.join(ROOT, ".jsonos", "cache", rest);
  if (kind === "artifact") return path.join(ROOT, ".jsonos", "artifacts", rest);
  throw new Error(`InvalidRefKind: ${kind}`);
}

function ensureParent(p) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
}

export function basherFs(argv) {
  const [sub, target, ...rest] = argv;

  if (!sub || ["ls", "cat", "hash", "write", "stat"].indexOf(sub) === -1) {
    console.log("basher fs <ls|cat|hash|write|stat> <path|file://ref> [--max-bytes N]");
    process.exitCode = 2;
    return;
  }

  const ref = toRef(target || "");
  const p = refToPath(ref);

  if (sub === "ls") {
    const dir =
      fs.existsSync(p) && fs.statSync(p).isDirectory() ? p : path.dirname(p);
    if (!fs.existsSync(dir)) throw new Error(`NotFound: ${dir}`);
    const items = fs.readdirSync(dir).sort();
    for (const it of items) console.log(it);
    return;
  }

  if (sub === "cat") {
    const buf = fs.readFileSync(p);
    process.stdout.write(buf);
    return;
  }

  if (sub === "hash") {
    const buf = fs.readFileSync(p);
    console.log(sha256Hex(buf));
    return;
  }

  if (sub === "stat") {
    const st = fs.statSync(p);
    const out = {
      ref,
      bytes: st.size,
      mtime_ms: st.mtimeMs,
      sha256: sha256Hex(fs.readFileSync(p)),
    };
    console.log(JSON.stringify(out, null, 2));
    return;
  }

  if (sub === "write") {
    let maxBytes = null;
    for (let i = 0; i < rest.length; i++) {
      if (rest[i] === "--max-bytes") maxBytes = parseInt(rest[i + 1], 10);
    }
    const chunks = [];
    let total = 0;

    process.stdin.on("data", (c) => {
      total += c.length;
      if (maxBytes && total > maxBytes) {
        console.error(`WriteExceeded: >${maxBytes} bytes`);
        process.exit(3);
      }
      chunks.push(c);
    });

    process.stdin.on("end", () => {
      const buf = Buffer.concat(chunks);
      ensureParent(p);
      fs.writeFileSync(p, buf);
      console.log(sha256Hex(buf));
    });

    return;
  }
}
