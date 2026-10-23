# ClearInstall

Local-first lockfile and install-surface auditor that makes npm/PyPI install-time risk visible — including binding.gyp command expansion — before you run install.

## Why this exists

Public signals on 2026-10-21 include compromised PyPI packages (LiteLLM), CA trust failures, and a year of npm worms that hide execution in lifecycle scripts or binding.gyp (not just package.json scripts).

**Intended users:** Solo developers and small teams who install dependencies on laptops/CI and want a localhost checklist without sending their full repo to a SaaS scanner.

**Original angle:** Original local tool focused on explaining install surfaces (hasInstallScript, binding.gyp <!(...) expansions, fresh publishes) plus optional OSV lookups. Not a clone of commercial scanner branding or UI.

## Features

- Parse `package-lock.json` (v2/v3) in the browser — your lockfile stays on this machine unless you opt into OSV lookups
- Flag packages marked `hasInstallScript` in the lockfile (install-time lifecycle risk)
- Scan pasted `binding.gyp` text for GYP command expansions like `<!(...)` that can run code during `node-gyp` configure
- Optional batch query to the public [OSV](https://osv.dev) API for known vulns (package name + version only)
- Export a Markdown audit report
- Bound to **127.0.0.1** by default

## Setup

```bash
npm install
npm test
npm run build
npm start          # http://127.0.0.1:8787/
```

Dev mode: `npm run dev` (same host/port).

## Stop

Press Ctrl+C in the terminal running `npm start` / `npm run dev`.

## Privacy

- Default mode never uploads your lockfile
- OSV mode sends only package names and versions to `api.osv.dev`
- No accounts, no telemetry, no public bind address

## Research

See [RESEARCH.md](./RESEARCH.md) for sources and the date checked (representative public scan).

## License

MIT

## Self-adaptation

This app continuously learns from a **representative** public-web scan on the Mac Studio (not the entire internet).

**Latest:** Enhancing ClearInstall with Trend Signals

By integrating public trend signals, ClearInstall can better identify and mitigate risks associated with npm/PyPI packages. This will help users ensure their local-first applications are secure before installation.

See `learning/LATEST.json` and `public/insights.json`.


