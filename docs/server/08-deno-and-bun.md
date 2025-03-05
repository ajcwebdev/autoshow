# Deno and Bun

Add either of the following to your `scripts` in `package.json`.

```json
{
  "scripts": {
    "bun": "bun --env-file=.env --no-warnings src/commander.ts",
    "deno": "deno run --allow-sys --allow-read --allow-run --allow-write --allow-env --unstable-sloppy-imports src/commander.ts"
  }
}
```