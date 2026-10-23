# openapi-import

Import an OpenAPI spec straight into TypeScript and get what the plugins in your `kubb.config.ts` generate, with no generated files on disk.

```ts
import { type Pet, petSchema } from './petStore.openapi.yaml'

const pet: Pet = petSchema.parse({ name: 'Rex', photoUrls: [] })
```

It is a [TypeScript content mapper](https://github.com/microsoft/typescript-go/pull/4712). TypeScript 7.1 calls it for each spec file and type-checks the output of every plugin in `kubb.config.ts`, merged into one module, in its place.

> [!WARNING]
> Experimental. Content mappers need a TypeScript 7.1 build that supports `--runExternalCode` (`typescript@next` today). TypeScript does not emit content-mapped files to JavaScript, so values such as `petSchema` only exist at run time when a bundler loads the spec with [`unplugin-kubb`](https://github.com/kubb-labs/kubb/tree/main/packages/unplugin-kubb). Both use `generateModule` from `unplugin-kubb`, so the import has the same exports in `tsc` and in the bundle.

## Setup

```bash
pnpm add -D kubb openapi-import typescript@next
```

npm rejects `typescript@next` against the `typescript@^7.0.2` peer range of `@kubb/plugin-ts`, so add `--legacy-peer-deps` there.

Name your specs with an `.openapi.yaml` extension, such as `petStore.openapi.yaml`, and register that extension in `tsconfig.json`:

```json
{
  "contentMappers": [{ "package": "openapi-import", "extensions": [".openapi.yaml", ".openapi.yml"] }]
}
```

TypeScript sends every file with a registered extension that `include` matches to the mapper, not only the files you import. A plain `.yaml` would also pick up files such as `docker-compose.yaml` and fail on them, and it would block other content mappers from `.yaml`. JSON specs cannot be mapped: TypeScript treats any extension ending in `.json` as built-in.

Add a `kubb.config.ts` with the plugins you want, the way the Kubb CLI finds it (from the `tsconfig.json` folder up):

```ts
import { pluginTs } from '@kubb/plugin-ts'
import { pluginZod } from '@kubb/plugin-zod'
import { defineConfig } from 'kubb/config'

export default defineConfig({
  input: './petStore.openapi.yaml',
  output: { path: './src/gen' },
  plugins: [pluginTs(), pluginZod()],
})
```

The config's adapter and plugins run on each imported spec. Its `output` and hooks are not used, and the barrel plugin is left out. With several configs, a spec uses the one whose `input` is that spec, else the first. Without a `kubb.config.ts`, only `@kubb/plugin-ts` runs.

TypeScript watches the config file and types every spec again when it changes.

For values at run time, add `kubb()` from `kubb/vite` (or another bundler entry) without arguments. It loads the same `kubb.config.ts`.

Run the type check with external code allowed:

```bash
tsc --noEmit --runExternalCode
```

VS Code passes `--runExternalCode` to the TypeScript language server only in trusted workspaces.

## Editor support

Generated names link back to the keys they came from in the spec. Go to definition and find references cross from TypeScript into the YAML, and hovering a key in the YAML shows its generated type. Renaming a schema type that is named exactly like its key, such as `Pet`, renames the key in the spec. Update the `$ref`s to it yourself: each one left behind shows as an unresolved `$ref`.

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

Set options on the `contentMappers` entry. They apply only without a `kubb.config.ts`; with one, set plugin options there. TypeScript reports an unknown key or an invalid value on `tsconfig.json`.

```json
{
  "contentMappers": [
    {
      "package": "openapi-import",
      "extensions": [".openapi.yaml"],
      "options": { "arrayType": "generic" }
    }
  ]
}
```

| Option      | Values                 | Default   | Description                                                              |
| ----------- | ---------------------- | --------- | ------------------------------------------------------------------------ |
| `arrayType` | `'array'`, `'generic'` | `'array'` | Prints arrays as `T[]` or `Array<T>`, like the `@kubb/plugin-ts` option. |

See [`examples/openapi-import`](https://github.com/kubb-labs/plugins/tree/main/examples/openapi-import) for a working setup.

## Limits

- The module only holds the file each plugin writes its code to. Code a plugin writes to another file, such as a bundled client runtime, is left out, so point imports like the client's `importPath` at a package or a path relative to the spec.
- Properties of operation types (path parameters, inline response bodies) do not link to the spec, and renaming a property does not rename its key in the spec.
- A changed spec runs a full Kubb build: about 0.4 s and 155 MB for a 10 KB spec, about 2.6 s and 245 MB for a 1.4 MB spec. A repeated request for unchanged content reuses the last result.

## Supporting Kubb

Kubb is an open source project, and its development is funded entirely by sponsors. If you would like to become a sponsor, please consider:

- [Become a Sponsor on GitHub](https://github.com/sponsors/stijnvanhulle)

<p align="center">
  <a href="https://github.com/sponsors/stijnvanhulle">
    <img src="https://raw.githubusercontent.com/stijnvanhulle/sponsors/main/sponsors.svg" alt="My sponsors" />
  </a>
</p>
