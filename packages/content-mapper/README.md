# @kubb/content-mapper

Import an OpenAPI spec straight into TypeScript and get the types Kubb generates, with no generated files on disk.

```ts
import type { Order, Pet } from './petStore.openapi.yaml'

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

Name your specs with an `.openapi.yaml` extension, such as `petStore.openapi.yaml`, and register that extension in `tsconfig.json`:

```json
{
  "contentMappers": [{ "package": "@kubb/content-mapper", "extensions": [".openapi.yaml", ".openapi.yml"] }]
}
```

TypeScript sends every file with a registered extension that `include` matches to the mapper, not only the files you import. A plain `.yaml` would also pick up files such as `docker-compose.yaml` and fail on them, and it would block other content mappers from `.yaml`. JSON specs cannot be mapped: TypeScript treats any extension ending in `.json` as built-in.

Run the type check with external code allowed:

```bash
tsc --noEmit --runExternalCode
```

## Editor support

Generated names link back to the keys they came from in the spec. Go to definition and find references cross from TypeScript into the YAML, and hovering a key in the YAML shows its generated type.

| Generated name                                                | Jumps to                                                                  |
| ------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `Pet`                                                         | `components.schemas.Pet`                                                  |
| `Pet['name']`                                                 | `properties.name` under `Pet`, nested objects and arrays of them included |
| `orderStatusEnum`, `OrderStatusEnumKey`                       | the `status` property the enum came from                                  |
| `GetPetByIdResponse`, `GetPetByIdOptions`                     | the `get` operation under `/pet/{petId}`                                  |
| `GetPetByIdPath`, `FindPetsByStatusQuery`, `DeletePetHeaders` | the operation's `parameters`                                              |
| `GetPetByIdStatus404`                                         | `responses.404`                                                           |
| `AddPetBody`                                                  | the operation's `requestBody`                                             |

Spec errors, such as an unresolved `$ref`, show on the key or value they point at.

## Options

Set options on the `contentMappers` entry. TypeScript reports an unknown key or an invalid value on `tsconfig.json`.

```json
{
  "contentMappers": [
    {
      "package": "@kubb/content-mapper",
      "extensions": [".openapi.yaml"],
      "options": { "arrayType": "generic" }
    }
  ]
}
```

| Option      | Values                 | Default   | Description                                                              |
| ----------- | ---------------------- | --------- | ------------------------------------------------------------------------ |
| `arrayType` | `'array'`, `'generic'` | `'array'` | Prints arrays as `T[]` or `Array<T>`, like the `@kubb/plugin-ts` option. |

VS Code passes `--runExternalCode` to the TypeScript language server only in trusted workspaces.

See [`examples/content-mapper`](https://github.com/kubb-labs/plugins/tree/main/examples/content-mapper) for a working setup.

## Limits

- Only `@kubb/plugin-ts` runs, and `arrayType` is its only option you can set. `kubb.config.ts` is not read.
- Properties of operation types (path parameters, inline response bodies) do not link to the spec, and renaming a type does not rename the key in the spec.
- Each transform runs a full Kubb build of the spec.
