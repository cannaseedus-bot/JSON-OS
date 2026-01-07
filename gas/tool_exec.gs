// GAS Tool Exec v1 — doPost handler
// Receives gas.tool.invoke.v1 and returns deterministic JSON/text
// This mirrors the adapter contract in README.md.
function doPost(e) {
  try {
    var payload = JSON.parse(e.postData.contents || "{}");
    if (payload["@type"] !== "gas.tool.invoke.v1") {
      return ContentService.createTextOutput("InvalidType").setMimeType(ContentService.MimeType.TEXT);
    }

    // Deterministic stub: echo args as JSON (sorted keys)
    var args = payload["@args"] || {};
    var keys = Object.keys(args).sort();
    var out = {};
    for (var i = 0; i < keys.length; i++) out[keys[i]] = args[keys[i]];

    return ContentService
      .createTextOutput(JSON.stringify(out))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput("Error:" + String(err)).setMimeType(ContentService.MimeType.TEXT);
  }
}
