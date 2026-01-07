// Minimal text compression shim to keep GAS demo deterministic.
function compress(text) {
  if (!text) return "";
  return String(text).replace(/\s+/g, " ").trim();
}
