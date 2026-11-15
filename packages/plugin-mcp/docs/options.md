# Options

Pass these options to `pluginMcp()`. Shared options link to [Shared plugin options](https://kubb.dev/docs/5.x/reference/plugin-options), and this page gives only their default here.

## Options overview

| Option                                                                    | Purpose                                                                              | Default                                      |
| ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ | -------------------------------------------- |
| [`output`](https://kubb.dev/docs/5.x/reference/plugin-options#output)     | Where handlers are written: `path`, `mode`, `barrel`, `banner`, `footer`.            | `{ path: 'mcp', barrel: { type: 'named' } }` |
| [`group`](https://kubb.dev/docs/5.x/reference/plugin-options#group)       | Split output by tag or path.                                                         | None                                         |
| [`client`](#client)                                                       | Registered client plugin the handlers call.                                          | Detected                                     |
| [`include`](https://kubb.dev/docs/5.x/reference/plugin-options#include)   | Keep only operations that match.                                                     | None                                         |
| [`exclude`](https://kubb.dev/docs/5.x/reference/plugin-options#exclude)   | Skip operations that match.                                                          | `[]`                                         |
| [`override`](https://kubb.dev/docs/5.x/reference/plugin-options#override) | Apply different options per pattern.                                                 | `[]`                                         |
| [`resolver`](https://kubb.dev/docs/5.x/reference/plugin-options#resolver) | Customize generated names and file paths. See [resolver members](#resolver-members). | `resolverMcp`                                |
| [`macros`](https://kubb.dev/docs/5.x/reference/plugin-options#macros)     | Rewrite AST nodes before printing.                                                   | `[]`                                         |

> [!IMPORTANT]
> Keep `output.path` a folder name, such as the default `'mcp'`. The plugin writes `server.ts`, `start.ts`, and `.mcp.json` at its root, next to the handlers, and single-file output (`output.mode: 'file'`, or a `path` with an extension) has no room for them. With `group`, handlers move into subfolders and those three files stay at the root.

## Option details

### client

Selects the registered client plugin that the handlers call. Configure transport settings such as `baseURL` on that client plugin. With `'client'`, set them in your own client module, because `pluginClient` takes no `baseURL`.

|          |                                  |
| -------- | -------------------------------- |
| Type     | `'fetch' \| 'axios' \| 'client'` |
| Required | `false`                          |

When `client` is unset, the handlers call the only registered client plugin.

::field-group

:::field{name="'fetch'"}
The handlers call [`@kubb/plugin-fetch`](https://kubb.dev/extensions/kubb-labs/plugin-fetch).
:::

:::field{name="'axios'"}
The handlers call [`@kubb/plugin-axios`](https://kubb.dev/extensions/kubb-labs/plugin-axios).
:::

:::field{name="'client'"}
The handlers call [`@kubb/plugin-client`](https://kubb.dev/extensions/kubb-labs/plugin-client).
:::

::

The build fails when no client plugin is registered, when several are registered and `client` is unset, or when `client` names a plugin that is not registered.

Each handler passes grouped `{ path, query, headers, body }` options, the MCP cancellation signal, and `throwOnError: true`, so a non-2xx response throws and surfaces as a tool error, whatever the client's `throwOnErrorDefault`.

| Client `returnType`                                                         | Tool response body       |
| --------------------------------------------------------------------------- | ------------------------ |
| `'full'` (the client default), or the plain result of `@kubb/plugin-client` | `res.data`               |
| `'data'`                                                                    | The resolved call result |

## Resolver members

A `resolver` patch overrides generated names. Members you leave out keep `resolverMcp`. Next to the shared `name`, `file`, and `imports` members described under [`resolver`](https://kubb.dev/docs/5.x/reference/plugin-options#resolver), `resolverMcp` has these:

```typescript [Partial override]
type ResolverMcpPatch = {
  handler?: {
    name?(node: OperationNode): string  // → 'showPetByIdHandler'
  }
}
```
