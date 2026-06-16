#!/usr/bin/env node
// Sync resume.pdf from the canonical Google Doc.
//
//   node scripts/sync-resume.mjs
//
// The Doc is the source of truth — edit it in Google Docs, then run this to
// pull the latest export into resume.pdf. Exits non-zero on failure and leaves
// the existing resume.pdf untouched unless a valid PDF was fetched.
//
// The Doc must be shared as "Anyone with the link can view" for the public
// export endpoint to work without auth.

import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const DOC_ID = "1IQ2zf6hZmLppXkN6F-lKzBlSPmlWLR5eePtlPNZVHw4";
const URL = `https://docs.google.com/document/d/${DOC_ID}/export?format=pdf`;
const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "resume.pdf");

const res = await fetch(URL, { redirect: "follow" });
if (!res.ok) {
  console.error(`✗ export failed: HTTP ${res.status} — is the Doc shared "anyone with link can view"?`);
  process.exit(1);
}
const buf = Buffer.from(await res.arrayBuffer());
if (buf.subarray(0, 5).toString() !== "%PDF-") {
  console.error("✗ response was not a PDF (got a login/HTML page?). Check the Doc sharing settings.");
  process.exit(1);
}
writeFileSync(OUT, buf);
console.log(`✓ resume.pdf updated from Google Doc (${buf.length} bytes)`);
