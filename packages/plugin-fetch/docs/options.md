# Options

Pass these options to `pluginFetch()`. Shared options link to [Shared plugin options](https://kubb.dev/docs/5.x/reference/plugin-options).

## Options overview

| Option                                                                    | Purpose                                                                    | Default                                          |
| ------------------------------------------------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------ |
| [`output`](https://kubb.dev/docs/5.x/reference/plugin-options#output)     | Where files are written: `path`, `mode`, `barrel`, `banner`, `footer`.     | `{ path: 'clients', barrel: { type: 'named' } }` |
| [`group`](https://kubb.dev/docs/5.x/reference/plugin-options#group)       | Split output by tag or path: `type`, `name`.                               | None                                             |
| [`baseURL`](#baseurl)                                                     | Base URL the generated client starts with.                                 | None                                             |
| [`throwOnErrorDefault`](#throwonerrordefault)                             | Throw on a non-2xx response unless a call says otherwise.                  | `true`                                           |
| [`validator`](#validator)                                                 | Validate request bodies, params, and responses with Zod.                   | `false`                                          |
| [`returnType`](#returntype)                                               | Shape of the value a generated call resolves to.                           | `'full'`                                         |
| [`sdk`](#sdk)                                                             | Generate a class-based SDK instead of standalone functions.                | None                                             |
| [`sdk.mode`](#sdk)                                                        | One class per tag, or one class with every operation.                      | `'tag'`                                          |
| [`sdk.name`](#sdk)                                                        | Name and file of the root class, or of the flat class.                     | None, or `'sdk'` with `mode: 'flat'`             |
| [`include`](https://kubb.dev/docs/5.x/reference/plugin-options#include)   | Keep only operations that match.                                           | None                                             |
| [`exclude`](https://kubb.dev/docs/5.x/reference/plugin-options#exclude)   | Skip operations that match.                                                | `[]`                                             |
| [`override`](https://kubb.dev/docs/5.x/reference/plugin-options#override) | Apply different options per pattern, except `throwOnErrorDefault`.         | `[]`                                             |
| [`resolver`](https://kubb.dev/docs/5.x/reference/plugin-options#resolver) | Customize generated names and file paths, plus the [SDK names](#resolver). | `resolverClient`                                 |
| [`macros`](https://kubb.dev/docs/5.x/reference/plugin-options#macros)     | Rewrite AST nodes before printing.                                         | `[]`, run after the built-in client macros       |

## Option details

### baseURL

The `baseURL` the generated client starts with, written into `.kubb/config.ts`. `client.setConfig({ baseURL })` replaces it at runtime. The spec's top-level `servers` URL is never used. [Set the base URL](https://kubb.dev/extensions/kubb-labs/plugin-fetch/guides/configure-requests#set-the-base-url) shows which base URL a call picks.

|          |          |
| -------- | -------- |
| Type     | `string` |
| Required | `false`  |

A `${...}` interpolation is written as a template literal, so it reads the environment at runtime:

```typescript
pluginFetch({ baseURL: '${process.env.API_URL}' })
```

### throwOnErrorDefault

The `throwOnError` a generated function or SDK method uses when the call leaves it out, and the default of its `ThrowOnError` type parameter. Neither `override` nor `client.setConfig({ throwOnError })` changes it. Query hooks always pass `throwOnError: true`.

|          |           |
| -------- | --------- |
| Type     | `boolean` |
| Required | `false`   |
| Default  | `true`    |

```typescript
// with pluginFetch({ throwOnErrorDefault: false })
const result = await getPetById({ path: { petId: 1 } })
if (result.error) console.error(result.status, result.error)
```

### validator

Checks requests and responses against the schemas of `@kubb/plugin-zod`, so add `pluginZod()` too. A value that fails its schema throws a `ParseError`.

|          |                                                                           |
| -------- | ------------------------------------------------------------------------- |
| Type     | `false \| 'zod' \| { request?: 'zod'; params?: 'zod'; response?: 'zod' }` |
| Required | `false`                                                                   |
| Default  | `false`                                                                   |

::field-group

:::field{name="false"}
Default value. No validation. The response is cast to the generated type.
:::

:::field{name="'zod'"}
Validates the success body, and an error body against the schema of its status.
:::

:::field{name="{ request?: 'zod', params?: 'zod', response?: 'zod' }"}
Opts in per part. `request` checks the body and `params` the path, query, header, and cookie params before the send. `response` works as `'zod'`.
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
  plugins: [pluginTs(), pluginZod(), pluginFetch({ validator: { request: 'zod', params: 'zod', response: 'zod' } })],
})
```

With `params`, the call sends what each `<operation>PathSchema`, `QuerySchema`, `HeadersSchema`, or `CookiesSchema` returns:

- A codec param such as a `Date` goes out in its wire form.
- Path and query keys the spec does not declare are stripped, such as a cache-buster.
- Undeclared headers pass through, and declared ones match in any casing. Client-level `headers` are checked too, and `auth` values are not.

With codecs, pair `request` and `params` with [`pluginZod({ inferred: 'codec' })`](https://kubb.dev/extensions/kubb-labs/plugin-zod/options#inferred), so the request types accept domain values such as a `Date`. [Turn validation off at runtime](https://kubb.dev/extensions/kubb-labs/plugin-fetch/guides/error-handling#turn-validation-off-at-runtime) skips the checks.

### returnType

What a generated function or SDK method resolves to. The query plugins and `@kubb/plugin-mcp` read it too, including a per-operation value from [`override`](https://kubb.dev/docs/5.x/reference/plugin-options#override).

|          |                    |
| -------- | ------------------ |
| Type     | `'full' \| 'data'` |
| Required | `false`            |
| Default  | `'full'`           |

::field-group

:::field{name="'full'"}
Default value. The full result: `{ status, data, error, contentType, headers, request, response }`.
:::

:::field{name="'data'"}
The success body. With `throwOnError: false`, the full result, so the caller can tell an error from a success.
:::

::

```typescript
pluginFetch({ returnType: 'data' })

const pet = await getPetById({ path: { petId: 1 } }) // Pet, not { status, data, ... }
```

To read a header such as `ETag` under `'data'`, pass `throwOnError: false` and call `result.headers.get('etag')`.

### sdk

Generates classes instead of standalone functions. Each instance builds its own client from its config, so two environments are two instances. The query plugins and `@kubb/plugin-mcp` call the standalone functions, so leave `sdk` unset for them.

|          |                                             |
| -------- | ------------------------------------------- |
| Type     | `{ mode?: 'tag' \| 'flat'; name?: string }` |
| Required | `false`                                     |

::field-group

:::field{name="mode: 'tag'"}
Default value. One class per tag, such as `PetClient`. With `name`, a root class also shares one client with every tag: `new PetStore(config).pet.getPetById(...)`. Throws [`KUBB_INVALID_PLUGIN_OPTIONS`](https://kubb.dev/docs/5.x/reference/diagnostics#kubb-invalid-plugin-options) with single-file output.
:::

:::field{name="mode: 'flat'"}
One class named by `name`, with every operation as a method. Without `name`, the class is `Sdk` in `sdk.ts`. Works with single-file output.
:::

::

Methods take the same options and return the same result as the standalone functions. The read-only `client` field holds the class's client, so interceptors on the root class reach every tag. A tag class also accepts an existing client:

```typescript
const api = new PetStore({ baseURL: 'https://petstore.swagger.io/v2' })
api.client.interceptors.request.use((request) => request)
await api.pet.getPetById({ path: { petId: 1 } })

const pets = new PetClient(api.client)
```

### resolver

Adds three members to the shared [`resolver`](https://kubb.dev/docs/5.x/reference/plugin-options#resolver). Members you leave out keep `resolverClient`.

|          |                                 |
| -------- | ------------------------------- |
| Type     | `ResolverPatch<ResolverClient>` |
| Required | `false`                         |

| Member               | Names                                                                 | Example                              |
| -------------------- | --------------------------------------------------------------------- | ------------------------------------ |
| `className(name)`    | The root class, the flat class, and the class of untagged operations. | `className('petStore')` → `PetStore` |
| `groupName(name)`    | A tag class.                                                          | `groupName('pet')` → `PetClient`     |
| `propertyName(name)` | The field a tag class has on the root class.                          | `propertyName('pet')` → `pet`        |
