# Research — ClearInstall

**Date checked:** 2026-10-21 (America/Los_Angeles)

Representative scan of publicly accessible sources only. Not a crawl of the entire web. Sources that block or require login are skipped without bypass.

## Sources checked
- **hackernews** @ 2026-10-21T20:23:11.193Z: 20 items
- **devto** @ 2026-10-21T20:23:11.216Z: 15 items
- **github_search** @ 2026-10-21T20:23:11.815Z: 12 items
- **osv_malware_feed** @ 2026-10-21T20:23:12.920Z: 8 items
- **reddit_programming** @ 2026-10-21T20:23:13.039Z: 0 items — HTTP 403 (respecting block; no bypass)

## Evidence titles used for this idea
- (438) Today's PHP security release, and how we're strengthening security — https://thephp.foundation/blog/2026/10/21/todays-php-security-release-and-how-were-strengthening-php-security/
- (315) Compromised LiteLLM 1.107.0 on PyPI Installs a Credential Stealer and Backdoor — https://safedep.io/litellm-pypi-compromise-credential-stealer-backdoor/
- (191) Patch the Planet: global response coordination as agents uncover vulnerabilities — https://openai.com/index/coordinated-disclosure-of-critical-vulnerabilities/
- (62) Canary Tokens — https://canarytokens.org/
- (1) GHSA-3cv6-jpf6-8222: LiteLLM: Authenticated SSRF and provider-credential exfiltration via unvalidated request-body routing parameters — https://osv.dev/vulnerability/GHSA-3cv6-jpf6-8222
- (1) GHSA-3xr8-qfvj-9p9j: Arbitrary file deletion in litellm — https://osv.dev/vulnerability/GHSA-3xr8-qfvj-9p9j
- (1) GHSA-46cm-pfwv-cgf8: LiteLLM has Server-Side Template Injection vulnerability in /completions endpoint — https://osv.dev/vulnerability/GHSA-46cm-pfwv-cgf8
- (1) GHSA-4g5m-c9r5-49xf: LiteLLM: Local file read via request-supplied OIDC file references — https://osv.dev/vulnerability/GHSA-4g5m-c9r5-49xf

## Problem framing

Install-time execution is broader than `preinstall` / `postinstall` in `package.json`. Public reporting in 2026 documents npm worms that abuse `binding.gyp` command expansion so code runs during `node-gyp` configure even when lifecycle scripts look clean. Separately, compromised PyPI wheels (e.g. LiteLLM discussions on Hacker News the same day) and trust-anchor failures remind developers that dependency install is a privileged moment.

ClearInstall is an **original localhost checklist**: make those surfaces visible from a lockfile and from pasted GYP text, with optional OSV enrichment. It does not claim to replace commercial scanners or guarantee malware detection.
