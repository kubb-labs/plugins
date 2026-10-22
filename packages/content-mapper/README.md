# @kubb/content-mapper

Import an OpenAPI spec straight into TypeScript and get the types Kubb generates, with no generated files on disk.

```ts
import type { Order, Pet } from './petStore.yaml'

const pet: Pet = { name: 'Rex', photoUrls: [] }
```

It is a [TypeScript content mapper](https://github.com/microsoft/typescript-go/pull/4712). TypeScript 7.1 calls it for each spec file and type-checks the `@kubb/plugin-ts` output in its place.

> [!WARNING]
> Experimental. Content mappers need a TypeScript 7.1 build that supports `--runExternalCode` (`typescript@next` today). Imports are type-only: content-mapped files are not emitted to JavaScript, so values such as enum objects do not exist at run time.

## Setup

```bash
pnpm add -D kubb @kubb/content-mapper typescript@next
```

npm rejects `typescript@next` against the `typescript@^7.0.2` peer range of `@kubb/plugin-ts`, so add `--legacy-peer-deps` there.

Register the mapper for your spec extensions in `tsconfig.json`:

```json
{
  "contentMappers": [{ "package": "@kubb/content-mapper", "extensions": [".yaml"] }]
}
```

Run the type check with external code allowed:

```bash
tsc --noEmit --runExternalCode
```

VS Code passes `--runExternalCode` to the TypeScript language server only in trusted workspaces.

## Limits

- Only `@kubb/plugin-ts` runs, with its default options. `kubb.config.ts` is not read.
- Go to definition does not jump into the spec, and spec errors are reported at the start of the file.
- Each transform runs a full Kubb build of the spec.
