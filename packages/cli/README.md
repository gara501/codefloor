# codefloor

CLI for [codefloor](../../README.md) architecture maps.

```bash
npx codefloor init
npx codefloor extract --out codefloor.json
npx codefloor extract --against codefloor.json
npx codefloor validate codefloor.json --root . --stale
npx codefloor build codefloor.json --out site
npx codefloor serve codefloor.json --port 4321
```

Exit codes: `0` ok, `1` validation or stale failure, `2` usage or I/O error. Set `DEBUG=codefloor` for stack traces.
