---
"@kubb/plugin-client": minor
"@kubb/plugin-cypress": minor
"@kubb/plugin-faker": minor
"@kubb/plugin-mcp": minor
"@kubb/plugin-msw": minor
"@kubb/plugin-react-query": minor
"@kubb/plugin-redoc": minor
"@kubb/plugin-ts": minor
"@kubb/plugin-vue-query": minor
"@kubb/plugin-zod": minor
---

Each plugin package now ships an `extension.yaml` file describing its options and metadata.

The file is self-contained — no `extends:` references — so third-party plugin authors can follow the same pattern in their own packages without access to this monorepo. Add `extension.yaml` to the `files` array in `package.json` and reference the unified schema for IDE validation:

```yaml
$schema: 'https://kubb.dev/schemas/extension.json'
kind: plugin
```

A `build:plugin-yaml` script resolves shared authoring templates and regenerates all ten files:

```bash
pnpm build:plugin-yaml
```
