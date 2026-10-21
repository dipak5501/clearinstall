import test from "node:test";
import assert from "node:assert/strict";

function scanBindingGyp(text) {
  const findings = [];
  text.split(/\r?\n/).forEach((line, idx) => {
    if (/<!\(/.test(line)) {
      findings.push({ line: idx + 1, severity: "high" });
    }
  });
  if (/"type"\s*:\s*"none"/i.test(text) && /<!\(/.test(text)) {
    findings.push({ line: 0, severity: "high" });
  }
  return findings;
}

test("detects command expansion", () => {
  const sample = '{ "sources": ["<!(node index.js && echo stub.c)"] , "type": "none" }';
  const f = scanBindingGyp(sample);
  assert.ok(f.some((x) => x.severity === "high"));
});
