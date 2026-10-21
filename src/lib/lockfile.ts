export type LockPackage = {
  name: string;
  version: string;
  hasInstallScript: boolean;
  resolved?: string;
  pathKey: string;
};

export type LockAudit = {
  lockfileVersion: number | null;
  packages: LockPackage[];
  installScriptCount: number;
  total: number;
};

export function parsePackageLock(raw: string): LockAudit {
  const data = JSON.parse(raw) as {
    lockfileVersion?: number;
    packages?: Record<string, { version?: string; hasInstallScript?: boolean; resolved?: string; name?: string }>;
    dependencies?: Record<string, { version?: string; hasInstallScript?: boolean; resolved?: string }>;
  };

  const packages: LockPackage[] = [];

  if (data.packages && typeof data.packages === "object") {
    for (const [key, meta] of Object.entries(data.packages)) {
      if (!key || key === "") continue; // root
      const name = meta.name || key.replace(/^node_modules\//, "").replace(/\/node_modules\//g, " › ");
      packages.push({
        name,
        version: meta.version || "?",
        hasInstallScript: Boolean(meta.hasInstallScript),
        resolved: meta.resolved,
        pathKey: key,
      });
    }
  } else if (data.dependencies) {
    for (const [name, meta] of Object.entries(data.dependencies)) {
      packages.push({
        name,
        version: meta.version || "?",
        hasInstallScript: Boolean(meta.hasInstallScript),
        resolved: meta.resolved,
        pathKey: name,
      });
    }
  } else {
    throw new Error("Unrecognized lockfile shape (need package-lock.json v1–v3)");
  }

  packages.sort((a, b) => Number(b.hasInstallScript) - Number(a.hasInstallScript) || a.name.localeCompare(b.name));
  const installScriptCount = packages.filter((p) => p.hasInstallScript).length;
  return {
    lockfileVersion: data.lockfileVersion ?? null,
    packages,
    installScriptCount,
    total: packages.length,
  };
}
