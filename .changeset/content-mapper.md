---
'@kubb/content-mapper': minor
---

Add `@kubb/content-mapper`, an experimental TypeScript 7.1 content mapper. Register it in `tsconfig.json` and import types straight from an OpenAPI spec, with no generated files on disk.

```json
{
  "contentMappers": [{ "package": "@kubb/content-mapper", "extensions": [".yaml"] }]
}
```

```ts
import type { Pet } from './petStore.yaml'
```

Run `tsc --runExternalCode` on a TypeScript build that supports content mappers (`typescript@next` today). Imports are type-only, and only `@kubb/plugin-ts` runs, with its default options.
