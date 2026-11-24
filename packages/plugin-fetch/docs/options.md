# Options

Pass these options to `pluginFetch()`. Shared options link to [Shared plugin options](https://kubb.dev/docs/5.x/reference/plugin-options).

## Options overview

| Option                                                                    | Purpose                                                     | Default                                          |
| ------------------------------------------------------------------------- | ----------------------------------------------------------- | ------------------------------------------------ |
| [`output`](https://kubb.dev/docs/5.x/reference/plugin-options#output)     | Where files are written.                                    | `{ path: 'clients', barrel: { type: 'named' } }` |
| [`group`](https://kubb.dev/docs/5.x/reference/plugin-options#group)       | Split output by tag or path.                                | None                                             |
| [`baseURL`](#baseurl)                                                     | Base URL the client starts with.                            | None                                             |
| [`importPath`](#importpath)                                               | Module the operations import the client from.               | `.kubb/client.ts`                                |
| [`throwOnErrorDefault`](#throwonerrordefault)                             | Throw on a non-2xx response unless a call says otherwise.   | `true`                                           |
| [`validator`](#validator)                                                 | Validate requests and responses with Zod or Valibot.        | `false`                                          |
| [`auth`](#auth)                                                           | How generated functions take `auth`.                        | None                                             |
| [`auth.mode`](#auth)                                                      | Optional `auth`, or required when a token is needed.        | `'optional'`                                     |
| [`returnType`](#returntype)                                               | What a call resolves to.                                    | `'full'`                                         |
| [`sdk`](#sdk)                                                             | Generate classes instead of standalone functions.           | None                                             |
| [`sdk.mode`](#sdk)                                                        | One class per tag, or one class with every operation.       | `'tag'`                                          |
| [`sdk.name`](#sdk)                                                        | Name and file of the root or flat class.                    | None, or `'sdk'` with `mode: 'flat'`             |
| [`include`](https://kubb.dev/docs/5.x/reference/plugin-options#include)   | Keep only operations that match.                            | None                                             |
| [`exclude`](https://kubb.dev/docs/5.x/reference/plugin-options#exclude)   | Skip operations that match.                                 | `[]`                                             |
| [`override`](https://kubb.dev/docs/5.x/reference/plugin-options#override) | Options per pattern, except `throwOnErrorDefault`.          | `[]`                                             |
| [`resolver`](https://kubb.dev/docs/5.x/reference/plugin-options#resolver) | Generated names and paths, plus the [SDK names](#resolver). | `resolverClient`                                 |
| [`macros`](https://kubb.dev/docs/5.x/reference/plugin-options#macros)     | Rewrite AST nodes before printing.                          | `[]`, run after the built-in client macros       |

## Option details

### baseURL

The base URL the client starts with. `client.setConfig({ baseURL })` replaces it at runtime.

|          |          |
| -------- | -------- |
| Type     | `string` |
| Required | `false`  |

A `${...}` interpolation becomes a template literal, so it reads the environment at runtime:

```typescript
pluginFetch({ baseURL: '${process.env.API_URL}' })
```

> [!NOTE]
> The spec's top-level `servers` URL is never used. See [Set the base URL](https://kubb.dev/extensions/kubb-labs/plugin-fetch/guides/configure-requests#set-the-base-url).

### importPath

Module the generated operations import the client from, written exactly as given. Kubb still writes the full `.kubb/` runtime, including the `config.ts` your spec needs. Your module re-exports it and replaces only what you need, such as a pre-configured `client`.

|          |          |
| -------- | -------- |
| Type     | `string` |
| Required | `false`  |

The specifier must resolve from each generated file, so use a relative path, a package name, or an alias:

```typescript
pluginFetch({ importPath: '../../client' }) // from src/gen/clients/ to src/client.ts
```

```typescript
// src/client.ts
export * from './gen/.kubb/client.ts'
```

The module must export everything `.kubb/client.ts` exports, so start from `export *` and override from there. This binding sets up the client once, narrows `throwOnError` to `true`, and uses its own error type:

```typescript
// src/client.ts
import { createClient as createKubbClient } from './gen/.kubb/client.ts'
import type { DataShape, NativeRequest, NativeResponse, Options as KubbOptions } from './gen/.kubb/client.ts'

export * from './gen/.kubb/client.ts'

export class MyHttpError<TError = unknown> extends Error {
  constructor(readonly data: TError) {
    super('Request failed')
  }
}

export const client = createKubbClient({ baseURL: 'https://api.example.com' })
client.interceptors.error.use((error) => new MyHttpError(error))

// SDK classes call `createClient`, so start every new client from the configured one.
export const createClient: typeof createKubbClient = (config) => client.extend(config)

export type Options<TData extends DataShape, ThrowOnError extends boolean = true, TRequest = NativeRequest, TResponse = NativeResponse> = Omit<
  KubbOptions<TData, ThrowOnError, TRequest, TResponse>,
  'throwOnError'
> & { throwOnError?: ThrowOnError & true }

export type ResponseErrorConfig<TError = unknown> = MyHttpError<TError>
```

- Keep the type parameters of `Options`. Write the narrowed field as `ThrowOnError & true`: a plain `throwOnError?: true` does not compile in the generated functions.
- `ResponseErrorConfig` and `RequestConfig` reach the query hooks only. The generated functions take their result type from the runtime, and the error interceptor converts an error only when the call throws.

To write the whole client yourself, with no `.kubb/` runtime, use [`@kubb/plugin-client`](https://kubb.dev/extensions/kubb-labs/plugin-client).

### throwOnErrorDefault

The `throwOnError` a generated function or SDK method uses when the call leaves it out. Neither `override` nor `client.setConfig({ throwOnError })` changes it. Query hooks always pass `throwOnError: true`.

|          |           |
| -------- | --------- |
| Type     | `boolean` |
| Required | `false`   |
| Default  | `true`    |

```typescript
// with pluginFetch({ throwOnErrorDefault: false })
const result = await getPetById({ path: { petId: 1 } })
if (result.error !== undefined) console.error(result.status, result.error)
```

### validator

Checks requests and responses against the schemas of `@kubb/plugin-zod` or `@kubb/plugin-valibot`. Add `pluginZod()` for `'zod'` or `pluginValibot()` for `'valibot'`. A value that fails its schema throws a `ValidationError`.

|          |                                                                   |
| -------- | ----------------------------------------------------------------- |
| Type     | `false \| 'zod' \| 'valibot' \| { request?; params?; response? }` |
| Required | `false`                                                           |
| Default  | `false`                                                           |

::field-group

:::field{name="false"}
Default value. No validation. The response is cast to the generated type.
:::

:::field{name="'zod'"}
Validates the success body, and an error body against the schema of its status.
:::

:::field{name="'valibot'"}
Works as `'zod'`, with the schemas of `@kubb/plugin-valibot`.
:::

:::field{name="{ request?, params?, response? }"}
Opts in per part, with `'zod'` or `'valibot'` as the value. Use one library for every part. `request` checks the body and `params` the path, query, header, and cookie params before the send. `response` works as `'zod'`.
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

See [Turn validation off at runtime](https://kubb.dev/extensions/kubb-labs/plugin-fetch/guides/error-handling#turn-validation-off-at-runtime) and [Parameter validation](https://kubb.dev/extensions/kubb-labs/plugin-fetch/guides/serialization#parameter-validation).

### auth

Sets how generated functions take the `auth` option.

|          |                                       |
| -------- | ------------------------------------- |
| Type     | `{ mode?: 'optional' \| 'required' }` |
| Required | `false`                               |

::field-group

:::field{name="mode: 'optional'"}
Default value. Every generated function takes `auth` as an optional option. Use it when `client.setConfig({ auth })` supplies the token, and with the query plugins, which pass a partial config to the function.
:::

:::field{name="mode: 'required'"}
A generated function whose operation needs a security scheme takes `auth` as a required option, so a missing token fails at compile time. An operation without `security`, or one that allows `{}` (anonymous access), keeps `auth` optional.
:::

::

SDK classes take `auth` in their constructor and ignore this option.

```ts
// with pluginFetch({ auth: { mode: 'required' } })
await addPet({ body, auth: () => getToken() })
await addPet({ body }) // Type error: `auth` is missing
```

### returnType

What a generated function or SDK method resolves to. The query plugins and `@kubb/plugin-mcp` read it too.

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

See [Read headers with `returnType: 'data'`](https://kubb.dev/extensions/kubb-labs/plugin-fetch/guides/error-handling#read-headers-with-returntype-data).

### sdk

Generates classes instead of standalone functions. Each instance builds its own client from its config, so two environments are two instances.

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

Methods take the same options and return the same result as the standalone functions. Interceptors on the root class's `client` reach every tag:

```typescript
const api = new PetStore({ baseURL: 'https://petstore.swagger.io/v2' })
api.client.interceptors.request.use((request) => request)
await api.pet.getPetById({ path: { petId: 1 } })

const pets = new PetClient(api.client) // a tag class also accepts an existing client
```

> [!WARNING]
> The query plugins and `@kubb/plugin-mcp` call the standalone functions, so leave `sdk` unset for them.

### resolver

Adds three members to the shared [`resolver`](https://kubb.dev/docs/5.x/reference/plugin-options#resolver). Members you leave out keep `resolverClient`. Pass an array to merge several patches over `resolverClient`, left to right.

|          |                                 |
| -------- | ------------------------------- |
| Type     | `ResolverInput<ResolverClient>` |
| Required | `false`                         |

| Member               | Names                                                                 | Example                              |
| -------------------- | --------------------------------------------------------------------- | ------------------------------------ |
| `className(name)`    | The root class, the flat class, and the class of untagged operations. | `className('petStore')` → `PetStore` |
| `groupName(name)`    | A tag class.                                                          | `groupName('pet')` → `PetClient`     |
| `propertyName(name)` | The field a tag class has on the root class.                          | `propertyName('pet')` → `pet`        |
