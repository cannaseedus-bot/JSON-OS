# GAS scripts

These Google Apps Script (GAS) snippets are the remote counterparts for the
`tool://gas/invoke` adapter described in `README.md`. Each `.gs` file is
separated for clarity so you can drop them into a single Apps Script project.

## Files

- `tool_exec.gs` — Web App entrypoint that accepts `gas.tool.invoke.v1` payloads
  and echoes the sorted args as JSON.
- `infer.gs` — Deterministic stub used by `/infer` route examples; returns the
  prompt and token count.
- `weights.gs` — Static descriptor for sample weight metadata.
- `compress.gs` — Whitespace flattener to keep demo responses deterministic.
- `meshnet/Code.gs` — Optional GAS mesh signaling backend used by the MeshNet
  PWA sample.

## Install & deploy

1. Go to https://script.new (or Apps Script inside a Google Workspace project).
2. Create a new project and add the four files above, keeping the same names.
   (Optional) Add `meshnet/Code.gs` if you want the MeshNet PWA sample
   signaling backend.
3. Paste the contents from this folder into each matching file in the Apps Script
   editor.
4. From **Deploy > New deployment**, choose **Web app** and select:
   - **Execute as:** Me
   - **Who has access:** Anyone with the link (or your preferred scope)
5. Save the deployment. Copy the **web app URL**; this is the `execUrl` for the
   client-side GAS adapter. If you use an API key, add it as an `x-asx-key`
   header in your deployment or relay proxy.
6. Update your `server.json` or adapter configuration to point to that `execUrl`.
   The sample `/infer` route in `README.md` assumes these files are present.

## Usage notes

- `tool_exec.gs` is the only required entrypoint for the GAS adapter. The other
  scripts are deterministic helpers you can import or expand for richer routes.
- Keep responses deterministic (no timestamps or random data) so hashes match
  across Basher/PWA parity tests.
- If you automate deployment with `clasp`, keep the filenames identical so the
  route arrays in `server.json` stay valid.
