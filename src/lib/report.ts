import type { LockAudit } from "./lockfile";
import type { GypFinding } from "./gyp";
import type { OsvHit } from "./osv";
import type { ReqAudit } from "./requirements";

export function buildMarkdownReport(opts: {
  audit: LockAudit | null;
  gyp: GypFinding[];
  osv: OsvHit[];
  reqs?: ReqAudit | null;
}): string {
  const lines: string[] = [];
  lines.push("# ClearInstall audit report");
  lines.push("");
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push("");
  if (opts.audit) {
    lines.push("## Lockfile");
    lines.push(`- lockfileVersion: ${opts.audit.lockfileVersion}`);
    lines.push(`- packages: ${opts.audit.total}`);
    lines.push(`- hasInstallScript: ${opts.audit.installScriptCount}`);
    lines.push("");
    lines.push("| Package | Version | Install script |");
    lines.push("| --- | --- | --- |");
    for (const p of opts.audit.packages.filter((x) => x.hasInstallScript).slice(0, 100)) {
      lines.push(`| ${p.name} | ${p.version} | yes |`);
    }
    lines.push("");
  }
  if (opts.gyp.length) {
    lines.push("## binding.gyp scan");
    for (const f of opts.gyp) {
      lines.push(`- [${f.severity}] line ${f.line || "—"}: ${f.reason}`);
      lines.push(`  \`${f.excerpt}\``);
    }
    lines.push("");
  }
  if (opts.reqs?.entries?.length) {
    lines.push("## requirements.txt");
    lines.push(`- entries: ${opts.reqs.entries.length}`);
    lines.push(`- high risk: ${opts.reqs.highRisk}`);
    for (const e of opts.reqs.entries) {
      lines.push(`- [${e.risk}] ${e.name} ${e.spec} — ${e.note}`);
    }
    lines.push("");
  }
  if (opts.osv.length) {
    lines.push("## OSV (optional)");
    for (const h of opts.osv) {
      if (h.error) lines.push(`- ${h.packageName}@${h.version}: error ${h.error}`);
      else if (h.ids.length) lines.push(`- ${h.packageName}@${h.version}: ${h.ids.join(", ")}`);
    }
  }
  lines.push("");
  lines.push("_Representative local checklist — not a guarantee of safety._");
  return lines.join("\n");
}
