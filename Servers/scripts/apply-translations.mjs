#!/usr/bin/env node
/**
 * Apply hand-curated DE/FR translations to de.json + fr.json.
 *
 * Reads `/tmp/translation-batch.json` of shape:
 *   { "<en key>": { "de": "...", "fr": "..." }, ... }
 *
 * Merges into the existing dictionaries (overwrites English fallbacks where
 * the English value === the key). Preserves all other entries untouched.
 *
 * Usage:
 *   node scripts/apply-translations.mjs                     # default path
 *   node scripts/apply-translations.mjs <input.json>        # custom path
 */
import fs from "node:fs";
import path from "node:path";
import { SERVERS_ROOT } from "./lib/i18nScriptUtils.mjs";

const inputPath = process.argv[2] || "/tmp/translation-batch.json";
const batch = JSON.parse(fs.readFileSync(inputPath, "utf8"));

const dePath = path.join(SERVERS_ROOT, "locales", "de.json");
const frPath = path.join(SERVERS_ROOT, "locales", "fr.json");
const enPath = path.join(SERVERS_ROOT, "locales", "en.json");

const en = JSON.parse(fs.readFileSync(enPath, "utf8"));
const de = JSON.parse(fs.readFileSync(dePath, "utf8"));
const fr = JSON.parse(fs.readFileSync(frPath, "utf8"));

let deUpdated = 0;
let frUpdated = 0;
let skippedMissing = 0;
let skippedAlreadyTranslated = 0;

for (const [key, trans] of Object.entries(batch)) {
  if (!(key in en)) {
    skippedMissing++;
    continue;
  }
  if (typeof trans.de === "string" && trans.de !== en[key]) {
    if (de[key] !== trans.de) {
      de[key] = trans.de;
      deUpdated++;
    } else {
      skippedAlreadyTranslated++;
    }
  }
  if (typeof trans.fr === "string" && trans.fr !== en[key]) {
    if (fr[key] !== trans.fr) {
      fr[key] = trans.fr;
      frUpdated++;
    } else {
      skippedAlreadyTranslated++;
    }
  }
}

fs.writeFileSync(dePath, JSON.stringify(de, null, 2) + "\n");
fs.writeFileSync(frPath, JSON.stringify(fr, null, 2) + "\n");

console.log(`=== apply-translations from ${path.relative(SERVERS_ROOT, inputPath)} ===`);
console.log(`Batch entries: ${Object.keys(batch).length}`);
console.log(`DE updated: ${deUpdated}`);
console.log(`FR updated: ${frUpdated}`);
console.log(`Skipped (missing in en.json): ${skippedMissing}`);
console.log(`Skipped (no change): ${skippedAlreadyTranslated}`);
