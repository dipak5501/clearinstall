export type ReqEntry = {
  name: string;
  spec: string;
  kind: "pin" | "range" | "direct_url" | "editable" | "path" | "other";
  risk: "high" | "medium" | "low";
  note: string;
};

export type ReqAudit = {
  entries: ReqEntry[];
  highRisk: number;
};

/** Parse a subset of requirements.txt useful for install-surface review. */
export function parseRequirementsTxt(raw: string): ReqAudit {
  const entries: ReqEntry[] = [];
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    if (trimmed.startsWith("-r ") || trimmed.startsWith("--requirement")) continue;

    if (trimmed.startsWith("-e ") || trimmed.startsWith("--editable")) {
      entries.push({
        name: trimmed.slice(trimmed.indexOf(" ") + 1),
        spec: trimmed,
        kind: "editable",
        risk: "high",
        note: "Editable install runs local/VCS code at install time.",
      });
      continue;
    }
    if (/^(git\+|hg\+|svn\+|bzr\+)/i.test(trimmed) || /\+ssh:\/\//i.test(trimmed)) {
      entries.push({
        name: trimmed.slice(0, 80),
        spec: trimmed,
        kind: "direct_url",
        risk: "high",
        note: "VCS/direct URL dependency — install executes remote checkout hooks/setup.",
      });
      continue;
    }
    if (trimmed.startsWith(".") || trimmed.startsWith("/") || trimmed.startsWith("file:")) {
      entries.push({
        name: trimmed,
        spec: trimmed,
        kind: "path",
        risk: "high",
        note: "Local path install — setup.py/pyproject scripts may run.",
      });
      continue;
    }

    const m = trimmed.match(/^([A-Za-z0-9_.-]+)\s*([=<>!~]=?.*)?$/);
    if (m) {
      const spec = (m[2] || "").trim() || "*";
      const exact = /^==/.test(spec);
      entries.push({
        name: m[1],
        spec,
        kind: exact ? "pin" : "range",
        risk: exact ? "low" : "medium",
        note: exact
          ? "Pinned version — still verify wheel/sdist install hooks if auditing deeply."
          : "Unpinned/range — newer releases can change install behavior overnight.",
      });
      continue;
    }

    entries.push({
      name: trimmed.slice(0, 60),
      spec: trimmed,
      kind: "other",
      risk: "medium",
      note: "Unrecognized requirements line — review manually.",
    });
  }
  return { entries, highRisk: entries.filter((e) => e.risk === "high").length };
}
