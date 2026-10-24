# Options

Pass these options to `pluginFetch()`. Shared options link to [Shared plugin options](https://kubb.dev/docs/5.x/reference/plugin-options).

## Options overview

| Option                                                                    | Purpose                                                                | Default                                          |
| ------------------------------------------------------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------ |
| [`output`](https://kubb.dev/docs/5.x/reference/plugin-options#output)     | Where files are written: `path`, `mode`, `barrel`, `banner`, `footer`. | `{ path: 'clients', barrel: { type: 'named' } }` |
| [`group`](https://kubb.dev/docs/5.x/reference/plugin-options#group)       | Split output by tag or path: `type`, `name`.                           | None                                             |
| [`baseURL`](#baseurl)                                                     | Base URL prepended to every request.                                   | None                                             |
| [`throwOnErrorDefault`](#throwonerrordefault)                             | Default error behavior and return type for generated operations.       | `true`                                           |
| [`validator`](#validator)                                                 | Validate request bodies, params, and responses with Zod.               | `false`                                          |
| [`sdk`](#sdk)                                                             | Generate a class-based SDK instead of functions.                       | None                                             |
| [`returnType`](#returntype)                                               | Shape of the value a generated call resolves to.                       | `'full'`                                         |
| [`include`](https://kubb.dev/docs/5.x/reference/plugin-options#include)   | Keep only operations that match.                                       | None                                             |
| [`exclude`](https://kubb.dev/docs/5.x/reference/plugin-options#exclude)   | Skip operations that match.                                            | `[]`                                             |
| [`override`](https://kubb.dev/docs/5.x/reference/plugin-options#override) | Apply different options per pattern.                                   | `[]`                                             |
| [`resolver`](#resolver)                                                   | Customize generated names and file paths.                              | `resolverClient`                                 |
| [`macros`](https://kubb.dev/docs/5.x/reference/plugin-options#macros)     | Rewrite AST nodes before printing.                                     | `[]`, run after the built-in client macros       |

## Option details

### baseURL

Base URL prepended to every request. When omitted, each request uses the operation's relative path from the spec. A value with a `${...}` interpolation is emitted as a template literal in the generated client config, so `baseURL: '${process.env.API_URL}'` reads the environment variable at runtime.

|          |          |
| -------- | -------- |
| Type     | `string` |
| Required | `false`  |

### throwOnErrorDefault

Set `throwOnErrorDefault: false` to return documented error responses as values by default. It sets the fallback on each generated request and the default `ThrowOnError` type parameter on functions and SDK methods. It applies to the whole plugin, so `override` cannot set it. A call that passes `throwOnError` still wins. With `throwOnError: true`, a non-2xx response throws and the return type narrows to successful responses. Query hooks always pass `throwOnError: true`.

|          |           |
| -------- | --------- |
| Type     | `boolean` |
| Required | `false`   |
| Default  | `true`    |

```typescript
// with pluginFetch({ throwOnErrorDefault: false })
const result = await getPetById({ path: { petId: 1 } })
if (result.status !== 200) console.error(result.status, result.error)
```

### validator

Validates request bodies, path, query, and header params, and response bodies with schemas from `@kubb/plugin-zod`, so add `pluginZod()` too. An invalid value makes the generated function throw a `ParseError`.

|          |                                                                           |
| -------- | ------------------------------------------------------------------------- |
| Type     | `false \| 'zod' \| { request?: 'zod'; params?: 'zod'; response?: 'zod' }` |
| Required | `false`                                                                   |
| Default  | `false`                                                                   |

::field-group

:::field{name="false"}
Default value. Does no validation and returns the response cast to the generated type.
:::

:::field{name="'zod'"}
Validates the success response body, and the error body when a non-2xx call does not throw.
:::

:::field{name="{ request?: 'zod', params?: 'zod', response?: 'zod' }"}
Opts in per direction. `request` validates the request body and `params` validates the path, query, and header params before the call. `response` validates the response body after it.
:::

::

```typescript [kubb.config.ts]
import { defineConfig } from 'kubb/config'
import { pluginTs } from '@kubb/plugin-ts'
import { pluginZod } from '@kubb/plugin-zod'
import { pluginFetch } from '@kubb/plugin-fetch'

export default defineConfig({
  input: './petStore.yaml',
  output: { path: './src/gen' },
  plugins: [
    pluginTs(),
    pluginZod(),
    pluginFetch({ validator: { request: 'zod', params: 'zod', response: 'zod' } }),
  ],
})
```

`params` runs each group through its generated `<operation>PathSchema`, `QuerySchema`, or `HeadersSchema`, and sends what the schema returns. A codec param such as a `Date` goes out in its wire form, and an invalid param fails before the request. Values added by `auth` are not validated.

Only the params your OpenAPI spec declares are sent. Path and query keys the spec does not declare are stripped, so a key such as an undocumented filter or a cache-buster never reaches the URL. Declare it in the spec, or leave `params` off. Headers are the exception: client-level `headers` (such as `Authorization` or tracing headers) are merged with the call's headers before validation, so headers the spec does not declare pass through unchanged, and declared header params match in any casing.

Pair `request` and `params` with `pluginZod({ inferred: 'codec' })` when the schemas use codecs, so the request types accept the domain values (such as a `Date`) that the validators encode. See [`inferred`](https://kubb.dev/extensions/kubb-labs/plugin-zod/options#inferred).

### sdk

Generates a class-based SDK. Each instance takes its own client config, so environments can use separate clients. Leave `sdk` unset to keep the standalone functions that query plugins call.

|          |                                             |
| -------- | ------------------------------------------- |
| Type     | `{ mode?: 'tag' \| 'flat'; name?: string }` |
| Required | `false`                                     |

::field-group

:::field{name="'tag'"}
Default value for `sdk.mode`. Generates one class per tag, such as `PetClient`. Set `sdk.name` to also get a root class that shares one config, used as `new PetStore(config).pet.getPetById(...)`.
:::

:::field{name="'flat'"}
Generates one class named by `sdk.name`, with every operation as a method. Supports single-file output.
:::

::

`mode: 'tag'` needs one file per tag, so it throws [`KUBB_INVALID_PLUGIN_OPTIONS`](https://kubb.dev/docs/5.x/reference/diagnostics#kubb-invalid-plugin-options) with single-file output. Use `mode: 'flat'` for a single file.

Methods take the same grouped options and return the same result as the standalone functions. See [Call operations](https://kubb.dev/extensions/kubb-labs/plugin-fetch/guides/calling-operations).

```typescript
const pet = new PetClient({ baseURL: 'https://petstore.swagger.io/v2' })
const { data } = await pet.getPetById({ path: { petId: 1 } })
```

### returnType

Shape of the value a generated call resolves to.

|          |                    |
| -------- | ------------------ |
| Type     | `'full' \| 'data'` |
| Required | `false`            |
| Default  | `'full'`           |

::field-group

:::field{name="'full'"}
Default value. Returns `{ status, data, error, contentType, request, response }`.
:::

:::field{name="'data'"}
Returns the success body when `throwOnError` is `true`. With `throwOnError: false`, returns the full result so callers can tell errors from successes.
:::

::

```typescript
pluginFetch({ returnType: 'data' })

const pet = await getPetById({ path: { petId: 1 } }) // Pet, not { status, data, ... }
```

It applies to the functions and the SDK. The query plugins and `@kubb/plugin-mcp` read it too, including a per-operation value set through [`override`](https://kubb.dev/docs/5.x/reference/plugin-options#override). To read headers such as `ETag` under `'data'`, pass `throwOnError: false` and call `result.response.headers.get('etag')`.

### resolver

Overrides generated file and symbol names. Omitted members keep `resolverClient`. The shared members (`name`, `file`, `imports`) and the `this` context are described under [`resolver`](https://kubb.dev/docs/5.x/reference/plugin-options#resolver).

|          |                                 |
| -------- | ------------------------------- |
| Type     | `ResolverPatch<ResolverClient>` |
| Required | `false`                         |

```typescript [Partial override]
type ResolverClientPatch = {
  name?(name: string): string
  file?: {
    baseName?(params: { name: string; extname: string }): string
    path?(params: { baseName: string; output: Output }): string
  }
  imports?(options: ResolveImportsOptions): Array<ImportNode>
  className?(name: string): string
  groupName?(name: string): string     // → 'PetClient'
  propertyName?(name: string): string
}
```
