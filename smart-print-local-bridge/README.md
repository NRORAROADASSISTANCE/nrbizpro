# NR BizPro Smart Print — Local Printer Bridge

This folder defines the optional local bridge needed for direct Windows printer selection from the web app.

## Why
Browsers intentionally do not expose the installed Windows printer list to ordinary web pages. The bridge runs on the customer's PC and accepts print jobs from the NRBizPro Smart Print page.

## Safety requirements
- Accept localhost requests only.
- Never upload document contents to a remote server.
- Keep the source file immutable.
- Print only after an explicit user action.
- Validate allowed paper sizes, copies and MIME types.
- Reject paths outside the app's temporary print directory.
- Delete temporary rendered files after the print job finishes or fails.
- Record only job metadata (time, paper, copies, printer, status), not document contents.

## API contract
`GET /health` → `{ "ok": true }`

`GET /printers` → `{ "printers": [{ "name": "...", "isDefault": true }] }`

`POST /print` body:
```json
{
  "printer": "Windows printer name",
  "paper": "A4",
  "copies": 1,
  "mode": "Color",
  "filePath": "C:\\NRBizPro\\print-temp\\job.pdf"
}
```

Response:
```json
{ "ok": true, "jobId": "...", "status": "queued" }
```

The web application should fall back to the normal system print dialog when `/health` is unavailable.

## Implementation note
The actual Windows service/installer must be signed and installed locally. Do not attempt to emulate printer enumeration in browser JavaScript.