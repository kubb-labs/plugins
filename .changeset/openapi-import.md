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

Run `tsc --runExternalCode` on a TypeScript build that supports content mappers (`typescript@next` today). The mapper runs every plugin in your `kubb.config.ts` and merges their output into one module, so `import { type Pet, petSchema } from './petStore.openapi.yaml'` types both. TypeScript watches the config and types the specs again when it changes. Without a config, only `@kubb/plugin-ts` runs, and `options.arrayType` on the `contentMappers` entry chooses `T[]` or `Array<T>`.

The module comes from `generateModule` in `unplugin-kubb`, so a bundler with `kubb()` loads the same exports at run time.

Go to definition, find references and hover link generated types and properties to their keys in the spec, renaming a schema type renames its key, and spec errors show on the key they point at.
