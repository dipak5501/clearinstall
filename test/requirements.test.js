import test from "node:test";
import assert from "node:assert/strict";

function parseRequirementsTxt(raw) {
  const entries = [];
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    if (trimmed.startsWith("-e ")) entries.push({ risk: "high", kind: "editable" });
    else if (/^git\+/i.test(trimmed)) entries.push({ risk: "high", kind: "direct_url" });
    else if (/^[A-Za-z0-9_.-]+\s*==/.test(trimmed)) entries.push({ risk: "low", kind: "pin" });
    else entries.push({ risk: "medium", kind: "other" });
  }
  return { entries, highRisk: entries.filter((e) => e.risk === "high").length };
}

test("flags editable and pins", () => {
  const a = parseRequirementsTxt("litellm==1.107.0\n-e ../mylib\ngit+https://example.com/x.git\n");
  assert.equal(a.highRisk, 2);
  assert.ok(a.entries.some((e) => e.kind === "pin"));
});
