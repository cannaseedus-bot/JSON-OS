// Deterministic inference stub for /infer route examples.
// Accepts a payload with a `prompt` field and returns a minimal JSON-ready object.
function infer(payload) {
  var data = payload || {};
  var prompt = data.prompt || "";
  var tokens = prompt.length ? prompt.trim().split(/\s+/).length : 0;

  return {
    "@type": "infer.result.v1",
    "prompt": prompt,
    "echo": prompt,
    "tokens_used": tokens
  };
}
