export type GypFinding = {
  line: number;
  excerpt: string;
  severity: "high" | "medium" | "info";
  reason: string;
};

const EXPANSION = /<!\?\(|<![@(]/g;

export function scanBindingGyp(text: string): GypFinding[] {
  const findings: GypFinding[] = [];
  const lines = text.split(/\r?\n/);
  lines.forEach((line, idx) => {
    if (/<!\(/.test(line)) {
      findings.push({
        line: idx + 1,
        excerpt: line.trim().slice(0, 200),
        severity: "high",
        reason: "GYP command expansion <!(...) runs a shell command during configure — a known install-time execution path even without package.json lifecycle scripts.",
      });
    } else if (/<%|<_!/.test(line) || /action.*command/i.test(line)) {
      findings.push({
        line: idx + 1,
        excerpt: line.trim().slice(0, 200),
        severity: "medium",
        reason: "Possible build action / expansion syntax; review before allowing node-gyp rebuild.",
      });
    }
  });

  if (/"type"\s*:\s*"none"/i.test(text) && /<!\(/.test(text)) {
    findings.push({
      line: 0,
      excerpt: 'type: "none" combined with command expansion',
      severity: "high",
      reason: "A type:none target with command expansion is a common pattern in reported Phantom-Gyp style abuse: side effects without compiling native code.",
    });
  }

  if (findings.length === 0 && /binding\.gyp|targets/i.test(text)) {
    findings.push({
      line: 0,
      excerpt: "(no command expansion detected)",
      severity: "info",
      reason: "No <!(...) expansions found in pasted text. Still treat unexpected binding.gyp in non-native packages as suspicious.",
    });
  }

  return findings;
}

// silence unused in some bundlers
void EXPANSION;
