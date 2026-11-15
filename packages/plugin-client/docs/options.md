# Options

Pass these options to `pluginClient()`. Rows for shared options link to [Shared plugin options](https://kubb.dev/docs/5.x/reference/plugin-options) and give this plugin's default.

## Options overview

| Option                                                                    | Purpose                                                                | Default                                          |
| ------------------------------------------------------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------ |
| [`importPath`](#importpath)                                               | Import specifier of your client module.                                | Required                                         |
| [`returnType`](#returntype)                                               | Shape of the value a generated function resolves to.                   | `'plain'`                                        |
| [`throwOnErrorDefault`](#throwonerrordefault)                             | `throwOnError` value each call passes to your client.                  | `true`                                           |
| [`validator`](#validator)                                                 | Pass Zod schemas to your client.                                       | `false`                                          |
| [`validator.request`](#validator)                                         | Pass the request body schema.                                          | None                                             |
| [`validator.params`](#validator)                                          | Pass the path, query, header, and cookie schemas.                      | None                                             |
| [`validator.response`](#validator)                                        | Pass the response and error schemas.                                   | None                                             |
| [`output`](https://kubb.dev/docs/5.x/reference/plugin-options#output)     | Where files are written: `path`, `mode`, `barrel`, `banner`, `footer`. | `{ path: 'clients', barrel: { type: 'named' } }` |
| [`group`](https://kubb.dev/docs/5.x/reference/plugin-options#group)       | Split output by tag or path: `type`, `name`.                           | None                                             |
| [`include`](https://kubb.dev/docs/5.x/reference/plugin-options#include)   | Keep only operations that match.                                       | None                                             |
| [`exclude`](https://kubb.dev/docs/5.x/reference/plugin-options#exclude)   | Skip operations that match.                                            | `[]`                                             |
| [`override`](https://kubb.dev/docs/5.x/reference/plugin-options#override) | Apply different options per pattern.                                   | `[]`                                             |
| [`resolver`](https://kubb.dev/docs/5.x/reference/plugin-options#resolver) | Customize generated names and file paths.                              | `resolverClient`                                 |
| [`macros`](https://kubb.dev/docs/5.x/reference/plugin-options#macros)     | Rewrite AST nodes before printing.                                     | `[]`, run after the built-in client macros       |

## Option details

### importPath

Import specifier of your client module. The plugin writes it into every generated import exactly as given, so it must resolve from the generated file. A relative path, a package name, or an alias works.

|          |          |
| -------- | -------- |
| Type     | `string` |
| Required | `true`   |

```typescript
pluginClient({ importPath: '../../../client' }) // from src/gen/clients/<tag>/ to src/client.ts
pluginClient({ importPath: '@my-org/api-client' }) // a package
```

Without `group`, a generated file sits one folder higher, so the same module is `../../client`. [Write your client](https://kubb.dev/extensions/kubb-labs/plugin-client/guides/write-your-client) lists what the module must export.

### returnType

Shape of the value a generated function resolves to. It applies to the whole plugin, so `override` cannot set it.

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
Wraps the call in `withUnwrap`, so the caller can `await` it or call `.unwrap()`. Your module must export `withUnwrap`, `resolveThrowOnError`, and the `Unwrappable` type.
:::

:::field{name="'data'"}
Passes the call through `unwrapResult`, so it resolves to the body when `throwOnError` is `true`, and to the full result when it is `false`. Your module must export `unwrapResult`, `resolveThrowOnError`, and the `UnwrappedResult` type.
:::

::

`@kubb/plugin-client/templates/core.ts` exports all of these, so your module can re-export them from there.

```typescript
pluginClient({ importPath: '../../client', returnType: 'full' })
// const pet = await getPetById({ path: { petId: 1 } }).unwrap()
```

The example sets [`integerType: 'number'`](https://kubb.dev/extensions/kubb-labs/adapter-oas/options#integertype) on the adapter. With the default, an `int64` id such as `petId` is a `bigint` and takes `1n`.

### throwOnErrorDefault

The `throwOnError` value every generated function passes to your client. A call that sets `throwOnError` wins. Your client decides what the flag does. It applies to the whole plugin, so `override` cannot set it.

|          |           |
| -------- | --------- |
| Type     | `boolean` |
| Required | `false`   |
| Default  | `true`    |

### validator

Passes Zod schemas from `@kubb/plugin-zod` to your client on `config.validator`. The plugin does not run them: your client does. See [Validate requests and responses](https://kubb.dev/extensions/kubb-labs/plugin-client/guides/validate-requests-and-responses).

|          |                                                                           |
| -------- | ------------------------------------------------------------------------- |
| Type     | `false \| 'zod' \| { request?: 'zod'; params?: 'zod'; response?: 'zod' }` |
| Required | `false`                                                                   |
| Default  | `false`                                                                   |

::field-group

:::field{name="false"}
Default. Passes nothing.
:::

:::field{name="'zod'"}
Passes the response and error schemas.
:::

:::field{name="{ request?: 'zod', params?: 'zod', response?: 'zod' }"}
Opts in per slot. `request` passes the request body schema, `params` the path, query, header, and cookie schemas, and `response` the response and error schemas. With `params`, generated calls also import `toHeadersStandardSchema` from your `importPath` module.
:::

::

> [!IMPORTANT]
> Add `pluginZod()` to `plugins` when `validator` is set. Generation stops with an error without it.
