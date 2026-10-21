export type OsvHit = {
  packageName: string;
  version: string;
  ids: string[];
  error?: string;
};

export async function queryOsvBatch(
  pkgs: { name: string; version: string }[],
  limit = 25,
): Promise<OsvHit[]> {
  const slice = pkgs.slice(0, limit);
  const out: OsvHit[] = [];
  for (const p of slice) {
    try {
      const res = await fetch("https://api.osv.dev/v1/query", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          package: { name: p.name, ecosystem: "npm" },
          version: p.version.replace(/^[=v]/, ""),
        }),
      });
      if (!res.ok) {
        out.push({ packageName: p.name, version: p.version, ids: [], error: `HTTP ${res.status}` });
        continue;
      }
      const data = (await res.json()) as { vulns?: { id: string }[] };
      out.push({
        packageName: p.name,
        version: p.version,
        ids: (data.vulns || []).map((v) => v.id),
      });
    } catch (err) {
      out.push({
        packageName: p.name,
        version: p.version,
        ids: [],
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }
  return out;
}
