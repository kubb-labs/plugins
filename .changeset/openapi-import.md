---
'openapi-import': minor
---

Add `openapi-import`, an experimental TypeScript 7.1 content mapper. Register it in `tsconfig.json` and import types straight from an OpenAPI spec, with no generated files on disk.

```json
{
  "contentMappers": [{ "package": "openapi-import", "extensions": [".openapi.yaml"] }]
}
```

```ts
import type { Pet } from './petStore.openapi.yaml'
```

Run `tsc --runExternalCode` on a TypeScript build that supports content mappers (`typescript@next` today). Imports are type-only, and only `@kubb/plugin-ts` runs. Set `options.arrayType` on the `contentMappers` entry to choose `T[]` or `Array<T>`.

Go to definition, find references and hover link generated types and properties to their keys in the spec, and spec errors show on the key they point at.
