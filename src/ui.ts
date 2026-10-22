import demoLock from "./lib/demo-lock.json";
import { parsePackageLock, type LockAudit } from "./lib/lockfile";
import { scanBindingGyp, type GypFinding } from "./lib/gyp";
import { queryOsvBatch, type OsvHit } from "./lib/osv";
import { buildMarkdownReport } from "./lib/report";
import { parseRequirementsTxt, type ReqAudit } from "./lib/requirements";

type State = {
  audit: LockAudit | null;
  gyp: GypFinding[];
  osv: OsvHit[];
  reqs: ReqAudit | null;
  error: string;
  busy: boolean;
};

export function mount(root: HTMLElement) {
  const state: State = { audit: null, gyp: [], osv: [], reqs: null, error: "", busy: false };

  root.innerHTML = `
    <main class="app">
      <h1 class="brand">ClearInstall</h1>
      <p class="lede">See what your lockfile and requirements admit will run at install time — including <span class="mono">binding.gyp</span> command expansions — on localhost only.</p>
      <div class="grid">
        <section class="panel">
          <h2>Lockfile</h2>
          <input id="file" type="file" accept=".json,application/json,.txt,text/plain" />
          <div class="row">
            <button type="button" id="demo">Load demo lockfile</button>
            <button type="button" class="secondary" id="osv" disabled>OSV check (opt-in)</button>
            <button type="button" class="secondary" id="export" disabled>Export Markdown</button>
          </div>
          <div id="stats"></div>
          <div id="table"></div>
        </section>
        <section class="panel">
          <h2>binding.gyp paste</h2>
          <textarea id="gyp" placeholder="Paste binding.gyp contents here"></textarea>
          <div class="row">
            <button type="button" id="scanGyp">Scan GYP</button>
            <button type="button" class="secondary" id="sampleGyp">Sample suspicious GYP</button>
          </div>
          <div id="gypOut"></div>
        </section>
        <section class="panel" style="grid-column: 1 / -1">
          <h2>requirements.txt (PyPI)</h2>
          <textarea id="reqs" placeholder="Paste requirements.txt — flags editable, VCS, and unpinned lines"></textarea>
          <div class="row">
            <button type="button" id="scanReqs">Scan requirements</button>
            <button type="button" class="secondary" id="demoReqs">Load demo (LiteLLM pin)</button>
          </div>
          <div id="reqsOut"></div>
        </section>
        <section class="panel" style="grid-column: 1 / -1">
          <h2>Hardening checklist</h2>
          <ul class="footnote" style="color:var(--ink); line-height:1.7">
            <li>Set <code>ignore-scripts=true</code> in project <code>.npmrc</code> unless you intentionally allow install scripts.</li>
            <li>Prefer <code>npm ci</code> with a committed lockfile over floating ranges.</li>
            <li>Treat unexpected <code>binding.gyp</code> in non-native packages as high priority review.</li>
            <li>For PyPI: prefer exact <code>==</code> pins; avoid <code>-e</code> and raw <code>git+</code> lines on shared machines.</li>
          </ul>
        </section>
      </div>
      <section class="panel" id="insights-panel" style="grid-column:1/-1;margin-top:1rem"><h2>Web insights</h2><div id="insights-body" class="footnote">Loading…</div></section>
      <p class="footnote">Default mode keeps files in this browser tab. OSV opt-in sends package names and versions only to api.osv.dev. Bound to 127.0.0.1.</p>
      <pre class="report" id="report" hidden></pre>
      <p id="err" class="footnote" style="color:var(--danger)"></p>
    </main>
  `;

  const file = root.querySelector("#file") as HTMLInputElement;
  const demo = root.querySelector("#demo") as HTMLButtonElement;
  const osvBtn = root.querySelector("#osv") as HTMLButtonElement;
  const exportBtn = root.querySelector("#export") as HTMLButtonElement;
  const gyp = root.querySelector("#gyp") as HTMLTextAreaElement;
  const scanGypBtn = root.querySelector("#scanGyp") as HTMLButtonElement;
  const sampleGyp = root.querySelector("#sampleGyp") as HTMLButtonElement;
  const reqsEl = root.querySelector("#reqs") as HTMLTextAreaElement;
  const scanReqs = root.querySelector("#scanReqs") as HTMLButtonElement;
  const demoReqs = root.querySelector("#demoReqs") as HTMLButtonElement;

  const render = () => {
    (root.querySelector("#err") as HTMLElement).textContent = state.error;
    osvBtn.disabled = !state.audit || state.busy;
    exportBtn.disabled = !state.audit && state.gyp.length === 0 && !state.reqs;

    const stats = root.querySelector("#stats")!;
    const table = root.querySelector("#table")!;
    if (!state.audit) {
      stats.innerHTML = "";
      table.innerHTML = "<p class='footnote'>Drop a package-lock.json or load the demo.</p>";
    } else {
      stats.innerHTML = `
        <div class="stats">
          <div class="stat"><b>${state.audit.total}</b><span>packages</span></div>
          <div class="stat"><b>${state.audit.installScriptCount}</b><span>hasInstallScript</span></div>
          <div class="stat"><b>${state.audit.lockfileVersion ?? "?"}</b><span>lockfile version</span></div>
        </div>`;
      const rows = state.audit.packages
        .slice(0, 80)
        .map((p) => {
          const badge = p.hasInstallScript
            ? '<span class="badge warn">install script</span>'
            : '<span class="badge ok">quiet</span>';
          return `<tr><td class="mono">${escapeHtml(p.name)}</td><td class="mono">${escapeHtml(p.version)}</td><td>${badge}</td></tr>`;
        })
        .join("");
      table.innerHTML = `<table><thead><tr><th>Package</th><th>Version</th><th>Install surface</th></tr></thead><tbody>${rows}</tbody></table>`;
    }

    const gypOut = root.querySelector("#gypOut")!;
    if (!state.gyp.length) gypOut.innerHTML = "";
    else {
      gypOut.innerHTML = state.gyp
        .map((f) => {
          const cls = f.severity === "high" ? "danger" : f.severity === "medium" ? "warn" : "ok";
          return `<p><span class="badge ${cls}">${f.severity}</span> line ${f.line || "—"} — ${escapeHtml(f.reason)}<br><code>${escapeHtml(f.excerpt)}</code></p>`;
        })
        .join("");
    }

    const reqsOut = root.querySelector("#reqsOut")!;
    if (!state.reqs) reqsOut.innerHTML = "";
    else {
      reqsOut.innerHTML =
        `<div class="stats"><div class="stat"><b>${state.reqs.entries.length}</b><span>entries</span></div><div class="stat"><b>${state.reqs.highRisk}</b><span>high risk</span></div></div>` +
        state.reqs.entries
          .map((e) => {
            const cls = e.risk === "high" ? "danger" : e.risk === "medium" ? "warn" : "ok";
            return `<p><span class="badge ${cls}">${e.risk}</span> <code>${escapeHtml(e.name)}</code> <span class="mono">${escapeHtml(e.spec)}</span> — ${escapeHtml(e.note)}</p>`;
          })
          .join("");
    }
  };

  const applyLock = (raw: string) => {
    try {
      state.audit = parsePackageLock(raw);
      state.osv = [];
      state.error = "";
    } catch (err) {
      state.error = err instanceof Error ? err.message : String(err);
      state.audit = null;
    }
    render();
  };

  file.addEventListener("change", async () => {
    const f = file.files?.[0];
    if (!f) return;
    applyLock(await f.text());
  });
  demo.addEventListener("click", () => applyLock(JSON.stringify(demoLock, null, 2)));
  scanGypBtn.addEventListener("click", () => {
    state.gyp = scanBindingGyp(gyp.value);
    state.error = "";
    render();
  });
  sampleGyp.addEventListener("click", () => {
    gyp.value = [
      "{",
      '  "targets": [',
      "    {",
      '      "target_name": "Setup",',
      '      "type": "none",',
      '      "sources": ["' + "<" + "!(node index.js > /dev/null 2>&1 && echo stub.c)" + '"]',
      "    }",
      "  ]",
      "}",
    ].join("\n");
    state.gyp = scanBindingGyp(gyp.value);
    render();
  });
  scanReqs.addEventListener("click", () => {
    state.reqs = parseRequirementsTxt(reqsEl.value);
    state.error = "";
    render();
  });
  demoReqs.addEventListener("click", () => {
    reqsEl.value =
      "# demo inspired by public PyPI compromise discussions\nlitellm==1.106.0\nrequests>=2.31.0\n-e ../local-plugin\ngit+https://github.com/example/tool.git@main\n";
    state.reqs = parseRequirementsTxt(reqsEl.value);
    render();
  });
  osvBtn.addEventListener("click", async () => {
    if (!state.audit) return;
    state.busy = true;
    render();
    const targets = state.audit.packages.filter((p) => p.hasInstallScript).slice(0, 15);
    state.osv = await queryOsvBatch(
      targets.map((p) => ({ name: p.name.split(" › ").pop() || p.name, version: p.version })),
    );
    state.busy = false;
    const report = root.querySelector("#report") as HTMLElement;
    report.hidden = false;
    report.textContent = buildMarkdownReport({
      audit: state.audit,
      gyp: state.gyp,
      osv: state.osv,
      reqs: state.reqs,
    });
    render();
  });
  exportBtn.addEventListener("click", () => {
    const md = buildMarkdownReport({
      audit: state.audit,
      gyp: state.gyp,
      osv: state.osv,
      reqs: state.reqs,
    });
    const report = root.querySelector("#report") as HTMLElement;
    report.hidden = false;
    report.textContent = md;
    const blob = new Blob([md], { type: "text/markdown" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "clearinstall-report.md";
    a.click();
  });

  loadInsights(root);
  render();
}

async function loadInsights(root: HTMLElement) {
  try {
    const res = await fetch("/insights.json", { cache: "no-store" });
    if (!res.ok) return;
    const data = await res.json();
    const el = root.querySelector("#insights-body");
    if (!el) return;
    const acts = (data.actions || []).map((a: string) => "<li>" + escapeHtml(a) + "</li>").join("");
    el.innerHTML = "<p><strong>" + escapeHtml(data.headline || "") + "</strong></p><p>" + escapeHtml(data.summary || "") + "</p><ul>" + acts + "</ul>";
  } catch { /* ignore */ }
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}
