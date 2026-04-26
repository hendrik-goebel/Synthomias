import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distIndexPath = path.resolve(__dirname, "../dist/index.html");
const html = await readFile(distIndexPath, "utf8");

const appScriptMatches = html.match(/<script\b[^>]*\bsrc=["'](?:\.\/)?js\/app\.js["'][^>]*><\/script>/g) ?? [];

assert.equal(
  appScriptMatches.length,
  1,
  `expected dist/index.html to contain exactly one app bootstrap script, found ${appScriptMatches.length}`,
);

console.log("production single bootstrap check passed");

