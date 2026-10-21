# Start / stop — ClearInstall

## Start (localhost only)

```bash
cd projects/YYYY-MM-DD-clearinstall   # or this folder
npm install
npm start
```

Open http://127.0.0.1:8787/

The Vite preview/dev server is configured with `host: 127.0.0.1` (not `0.0.0.0`).

## Stop

Ctrl+C in that terminal.

## Do not expose publicly

Do not pass `--host 0.0.0.0` or open firewall ports unless you explicitly intend to.
