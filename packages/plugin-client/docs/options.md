# Options

Pass these options to `pluginClient()`. Shared options link to [Shared plugin options](https://kubb.dev/docs/5.x/reference/plugin-options).

## Options overview

| Option                                                                    | Purpose                                                                             | Default                                          |
| ------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- | ------------------------------------------------ |
| [`importPath`](#importpath)                                               | Import specifier of your client module.                                             | Required                                         |
| [`runtime`](#runtime)                                                     | Also write the `.kubb/` runtime with a transport's `client.ts`.                     | None                                             |
| [`returnType`](#returntype)                                               | What a generated function resolves to.                                              | `'plain'`                                        |
| [`throwOnErrorDefault`](#throwonerrordefault)                             | `throwOnError` value each call passes to your client.                               | `true`                                           |
| [`validator`](#validator)                                                 | Zod or Valibot schemas to pass to your client.                                      | `false`                                          |
| [`auth`](#auth)                                                           | How generated functions take `auth`.                                                | None                                             |
| [`auth.mode`](#auth)                                                      | Optional `auth`, or required when a token is needed.                                | `'optional'`                                     |
| [`output`](https://kubb.dev/docs/5.x/reference/plugin-options#output)     | Where files are written.                                                            | `{ path: 'clients', barrel: { type: 'named' } }` |
| [`group`](https://kubb.dev/docs/5.x/reference/plugin-options#group)       | Split output by tag or path.                                                        | None                                             |
| [`include`](https://kubb.dev/docs/5.x/reference/plugin-options#include)   | Keep only operations that match.                                                    | None                                             |
| [`exclude`](https://kubb.dev/docs/5.x/reference/plugin-options#exclude)   | Skip operations that match.                                                         | `[]`                                             |
| [`override`](https://kubb.dev/docs/5.x/reference/plugin-options#override) | Apply different options per pattern, except `returnType` and `throwOnErrorDefault`. | `[]`                                             |
| [`resolver`](https://kubb.dev/docs/5.x/reference/plugin-options#resolver) | Customize generated names and file paths. Takes one patch or an array of patches.   | `resolverClient`                                 |
| [`macros`](https://kubb.dev/docs/5.x/reference/plugin-options#macros)     | Rewrite AST nodes before printing.                                                  | `[]`, run after the built-in client macros       |

## Option details

### importPath

Import specifier of your client module, written into every generated import as given. It must resolve from the generated file: use a relative path, a package name, or an alias.

|          |          |
| -------- | -------- |
| Type     | `string` |
| Required | `true`   |

```typescript
pluginClient({ importPath: '../../../client' }) // from src/gen/clients/<tag>/ to src/client.ts
pluginClient({ importPath: '@my-org/api-client' }) // a package
```

Without `group`, files sit one folder higher, so use `../../client`. [Write your client](https://kubb.dev/extensions/kubb-labs/plugin-client/guides/write-your-client) lists the exports the module needs.

### runtime

Path to a transport's `client.ts` template. When set, Kubb also writes the `.kubb/` runtime, including the `config.ts` with the media types and serializers your spec needs. The generated operations still import from `importPath`, so your module can re-export the runtime and replace only some parts, such as a pre-configured `client`.

|          |          |
| -------- | -------- |
| Type     | `string` |
| Required | `false`  |

```typescript
import { fileURLToPath } from 'node:url'

pluginClient({
  importPath: '../../client', // from src/gen/clients/ to src/client.ts
  runtime: fileURLToPath(import.meta.resolve('@kubb/plugin-fetch/templates/client.ts')),
})
```

```typescript
// src/client.ts
export * from './gen/.kubb/client.ts'
```

Use the template of `@kubb/plugin-fetch`, `@kubb/plugin-axios`, or `@kubb/plugin-ky`, and install that package.

### returnType

What a generated function resolves to.

|          |                               |
| -------- | ----------------------------- |
| Type     | `'plain' \| 'full' \| 'data'` |
| Required | `false`                       |
| Default  | `'plain'`                     |

::field-group

:::field{name="'plain'"}
Default. Returns what your `client` returns.
:::

:::field{name="'full'"}
The caller can `await` the call or call `.unwrap()`. Your module must export `withUnwrap`, `resolveThrowOnError`, and the `Unwrappable` type.
:::

:::field{name="'data'"}
Resolves to the body when `throwOnError` is `true`, and to the full result when it is `false`. Your module must export `unwrapResult`, `resolveThrowOnError`, and the `UnwrappedResult` type.
:::

::

You can re-export these helpers from `@kubb/plugin-client/templates/core.ts`.

```typescript
pluginClient({ importPath: '../../client', returnType: 'full' })
// with integerType: 'number' on the adapter
// const pet = await getPetById({ path: { petId: 1 } }).unwrap()
```

### throwOnErrorDefault

The `throwOnError` value every generated function passes to your client, unless the call sets its own. Your client decides what the flag does.

|          |           |
| -------- | --------- |
| Type     | `boolean` |
| Required | `false`   |
| Default  | `true`    |

### validator

Passes Zod schemas from `@kubb/plugin-zod`, or Valibot schemas from `@kubb/plugin-valibot`, to your client on `config.validator`. Your client runs them. See [Validate requests and responses](https://kubb.dev/extensions/kubb-labs/plugin-client/guides/validate-requests-and-responses).

|          |                                                                   |
| -------- | ----------------------------------------------------------------- |
| Type     | `false \| 'zod' \| 'valibot' \| { request?; params?; response? }` |
| Required | `false`                                                           |
| Default  | `false`                                                           |

::field-group

:::field{name="false"}
Default. Passes nothing.
:::

:::field{name="'zod'"}
Passes the response and error schemas of `@kubb/plugin-zod`.
:::

:::field{name="'valibot'"}
Passes the response and error schemas of `@kubb/plugin-valibot`.
:::

:::field{name="{ request?, params?, response? }"}
Opts in per slot, with `'zod'` or `'valibot'` as the value. Use one library for every slot. `request` for the body, `params` for the path, query, header, and cookie schemas, and `response` for the response and error schemas. `params` also imports `toHeadersStandardSchema` from your module.
:::

::

> [!IMPORTANT]
> Add the plugin of the library to `plugins` when `validator` is set: `pluginZod()` for `'zod'`, `pluginValibot()` for `'valibot'`. Without it, generation stops with an error.

### auth

Sets how generated functions take the `auth` option.

|          |                                       |
| -------- | ------------------------------------- |
| Type     | `{ mode?: 'optional' \| 'required' }` |
| Required | `false`                               |

::field-group

:::field{name="mode: 'optional'"}
Default value. Every generated function takes `auth` as an optional option. Use it with the query-hook plugins, which pass a partial config to the function.
:::

:::field{name="mode: 'required'"}
A generated function whose operation needs a security scheme takes `auth` as a required option, so a missing token fails at compile time. An operation without `security`, or one that allows `{}` (anonymous access), keeps `auth` optional.
:::

::

With `mode: 'required'`, the required type is read from the `auth` key of your module's `Options`, so that type must have one.

```ts
// with pluginClient({ importPath: '../client', auth: { mode: 'required' } })
await addPet({ body, auth: () => getToken() })
await addPet({ body }) // Type error: `auth` is missing
```
