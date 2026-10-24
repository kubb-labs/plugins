# Options

Pass these options to `pluginClient()`. Shared options link to [Shared plugin options](https://kubb.dev/docs/5.x/reference/plugin-options).

## Options overview

| Option                                                                    | Purpose                                                                | Default                                          |
| ------------------------------------------------------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------ |
| [`importPath`](#importpath)                                               | Import specifier of your client module.                                | Required                                         |
| [`output`](https://kubb.dev/docs/5.x/reference/plugin-options#output)     | Where files are written: `path`, `mode`, `barrel`, `banner`, `footer`. | `{ path: 'clients', barrel: { type: 'named' } }` |
| [`group`](https://kubb.dev/docs/5.x/reference/plugin-options#group)       | Split output by tag or path: `type`, `name`.                           | None                                             |
| [`throwOnErrorDefault`](#throwonerrordefault)                             | Default `throwOnError` value passed to your client.                    | `true`                                           |
| [`validator`](#validator)                                                 | Pass Zod schemas to your client.                                       | `false`                                          |
| [`include`](https://kubb.dev/docs/5.x/reference/plugin-options#include)   | Keep only operations that match.                                       | None                                             |
| [`exclude`](https://kubb.dev/docs/5.x/reference/plugin-options#exclude)   | Skip operations that match.                                            | `[]`                                             |
| [`override`](https://kubb.dev/docs/5.x/reference/plugin-options#override) | Apply different options per pattern.                                   | `[]`                                             |
| [`resolver`](https://kubb.dev/docs/5.x/reference/plugin-options#resolver) | Customize generated names and file paths.                              | `resolverClient`                                 |
| [`macros`](https://kubb.dev/docs/5.x/reference/plugin-options#macros)     | Rewrite AST nodes before printing.                                     | `[]`, run after the built-in client macros       |

## Option details

### importPath

Import specifier of your client module. The plugin writes it into every generated import exactly as given, so it must resolve from the generated file. Use a relative path, a package name, or an alias.

|          |          |
| -------- | -------- |
| Type     | `string` |
| Required | `true`   |

```typescript
pluginClient({ importPath: '../../../client' }) // relative to src/gen/clients/<tag>/
pluginClient({ importPath: '@my-org/api-client' }) // a package
```

With `group: { type: 'tag' }` and `output.path: 'clients'`, a generated file sits in `src/gen/clients/<tag>/`, so `../../../client` points at `src/client.ts`. Without `group` it is `../../client`.

The module must export `client`, plus the `Options` and `RequestResult` types. See [write your client](https://kubb.dev/extensions/kubb-labs/plugin-client/guides/write-your-client).

### throwOnErrorDefault

Default for the `throwOnError` field that every generated function passes to your client. A call that sets `throwOnError` itself wins. Your client decides what the flag does: the [example client](https://kubb.dev/extensions/kubb-labs/plugin-client/guides/write-your-client) throws on a non-2xx status when it is `true` and returns the error as a value when it is `false`.

|          |           |
| -------- | --------- |
| Type     | `boolean` |
| Required | `false`   |
| Default  | `true`    |

The setting applies to the whole plugin, so you cannot set it in `override`.

### validator

Passes Zod schemas from `@kubb/plugin-zod` to your client on `config.validator`. The plugin does not run the schemas. Your client reads `config.validator` and runs them. See [validate requests and responses](https://kubb.dev/extensions/kubb-labs/plugin-client/guides/validate-requests-and-responses).

|          |                                                                           |
| -------- | ------------------------------------------------------------------------- |
| Type     | `false \| 'zod' \| { request?: 'zod'; params?: 'zod'; response?: 'zod' }` |
| Required | `false`                                                                   |
| Default  | `false`                                                                   |

::field-group

:::field{name="false"}
Default value. Passes nothing.
:::

:::field{name="'zod'"}
Passes the response and error schemas.
:::

:::field{name="{ request?: 'zod', params?: 'zod', response?: 'zod' }"}
Opts in per direction. `request` passes the request body schema, `params` the path, query, and header params schemas, and `response` the response and error schemas.
:::

::

> [!IMPORTANT]
> Add `pluginZod()` to the plugins list when `validator` is set. Generation stops with an error if it is missing.

With `params: 'zod'`, generated calls also import `toHeadersStandardSchema` from your [`importPath`](#importpath) module, so that module must export it. See [validate requests and responses](https://kubb.dev/extensions/kubb-labs/plugin-client/guides/validate-requests-and-responses).
