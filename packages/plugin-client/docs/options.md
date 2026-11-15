# Options

Pass these options to `pluginClient()`. Shared options link to [Shared plugin options](https://kubb.dev/docs/5.x/reference/plugin-options).

## Options overview

| Option                                                                    | Purpose                                                                             | Default                                          |
| ------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- | ------------------------------------------------ |
| [`importPath`](#importpath)                                               | Import specifier of your client module.                                             | Required                                         |
| [`returnType`](#returntype)                                               | What a generated function resolves to.                                              | `'plain'`                                        |
| [`throwOnErrorDefault`](#throwonerrordefault)                             | `throwOnError` value each call passes to your client.                               | `true`                                           |
| [`validator`](#validator)                                                 | Zod schemas to pass to your client.                                                 | `false`                                          |
| [`output`](https://kubb.dev/docs/5.x/reference/plugin-options#output)     | Where files are written.                                                            | `{ path: 'clients', barrel: { type: 'named' } }` |
| [`group`](https://kubb.dev/docs/5.x/reference/plugin-options#group)       | Split output by tag or path.                                                        | None                                             |
| [`include`](https://kubb.dev/docs/5.x/reference/plugin-options#include)   | Keep only operations that match.                                                    | None                                             |
| [`exclude`](https://kubb.dev/docs/5.x/reference/plugin-options#exclude)   | Skip operations that match.                                                         | `[]`                                             |
| [`override`](https://kubb.dev/docs/5.x/reference/plugin-options#override) | Apply different options per pattern, except `returnType` and `throwOnErrorDefault`. | `[]`                                             |
| [`resolver`](https://kubb.dev/docs/5.x/reference/plugin-options#resolver) | Customize generated names and file paths.                                           | `resolverClient`                                 |
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

Passes Zod schemas from `@kubb/plugin-zod` to your client on `config.validator`. Your client runs them. See [Validate requests and responses](https://kubb.dev/extensions/kubb-labs/plugin-client/guides/validate-requests-and-responses).

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
Opts in per slot: `request` for the body, `params` for the path, query, header, and cookie schemas, and `response` for the response and error schemas. `params` also imports `toHeadersStandardSchema` from your module.
:::

::

> [!IMPORTANT]
> Add `pluginZod()` to `plugins` when `validator` is set, or generation stops with an error.
