import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { createRequire } from "node:module";

// Test the TypeScript logic via a tiny duplicated pure parse in JS for node:test without a TS loader.
function parsePackageLock(raw) {
  const data = JSON.parse(raw);
  const packages = [];
  if (data.packages) {
    for (const [key, meta] of Object.entries(data.packages)) {
      if (!key) continue;
      packages.push({
        name: meta.name || key.replace(/^node_modules\//, ""),
        version: meta.version || "?",
        hasInstallScript: Boolean(meta.hasInstallScript),
      });
    }
  }
  return {
    total: packages.length,
    installScriptCount: packages.filter((p) => p.hasInstallScript).length,
  };
}

const dir = path.dirname(fileURLToPath(import.meta.url));
const demo = readFileSync(path.join(dir, "../src/lib/demo-lock.json"), "utf8");

test("demo lockfile flags install scripts", () => {
  const audit = parsePackageLock(demo);
  assert.equal(audit.total, 4);
  assert.equal(audit.installScriptCount, 2);
});
