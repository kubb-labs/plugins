# Options

Pass these options to `pluginMcp()`. Shared options link to [Shared plugin options](https://kubb.dev/docs/5.x/reference/plugin-options), and this page gives only their default here.

## Options overview

| Option                                                                    | Purpose                                                                              | Default                                      |
| ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ | -------------------------------------------- |
| [`output`](https://kubb.dev/docs/5.x/reference/plugin-options#output)     | Where handlers are written.                                                          | `{ path: 'mcp', barrel: { type: 'named' } }` |
| [`group`](https://kubb.dev/docs/5.x/reference/plugin-options#group)       | Split output by tag or path.                                                         | None                                         |
| [`client`](#client)                                                       | Registered client plugin the handlers call.                                          | Detected                                     |
| [`include`](https://kubb.dev/docs/5.x/reference/plugin-options#include)   | Keep only operations that match.                                                     | None                                         |
| [`exclude`](https://kubb.dev/docs/5.x/reference/plugin-options#exclude)   | Skip operations that match.                                                          | `[]`                                         |
| [`override`](https://kubb.dev/docs/5.x/reference/plugin-options#override) | Apply different options per pattern.                                                 | `[]`                                         |
| [`resolver`](https://kubb.dev/docs/5.x/reference/plugin-options#resolver) | Customize generated names and file paths. See [resolver members](#resolver-members). | `resolverMcp`                                |
| [`macros`](https://kubb.dev/docs/5.x/reference/plugin-options#macros)     | Rewrite AST nodes before printing.                                                   | `[]`                                         |

> [!IMPORTANT]
> Keep `output.path` a folder name, such as the default `'mcp'`. The plugin writes `server.ts`, `start.ts`, and `.mcp.json` at its root, and single-file output (`output.mode: 'file'`, or a `path` with an extension) has no room for them. With `group`, only the handlers move into subfolders.

## Option details

### client

Selects the registered client plugin that the handlers call. When `client` is unset, the handlers call the only registered client plugin. Set transport options such as `baseURL` on that plugin, or in your own client module with `'client'`.

|          |                                          |
| -------- | ---------------------------------------- |
| Type     | `'fetch' \| 'axios' \| 'ky' \| 'client'` |
| Required | `false`                                  |

::field-group

:::field{name="'fetch'"}
The handlers call [`@kubb/plugin-fetch`](https://kubb.dev/extensions/kubb-labs/plugin-fetch).
:::

:::field{name="'axios'"}
The handlers call [`@kubb/plugin-axios`](https://kubb.dev/extensions/kubb-labs/plugin-axios).
:::

:::field{name="'ky'"}
The handlers call [`@kubb/plugin-ky`](https://kubb.dev/extensions/kubb-labs/plugin-ky).
:::

:::field{name="'client'"}
The handlers call [`@kubb/plugin-client`](https://kubb.dev/extensions/kubb-labs/plugin-client).
:::

::

> [!WARNING]
> The build fails when no client plugin is registered, when several are registered and `client` is unset, or when `client` names a plugin that is not registered.

See [Tool calls and results](https://kubb.dev/extensions/kubb-labs/plugin-mcp/guides/server#tool-calls-and-results).

## Resolver members

`resolver` takes one patch or an array of patches. An array merges over `resolverMcp` from left to right.

Members you leave out of a `resolver` patch keep `resolverMcp`. Besides the shared `name`, `file`, and `imports` members of [`resolver`](https://kubb.dev/docs/5.x/reference/plugin-options#resolver), `resolverMcp` has these:

```typescript [Partial override]
type ResolverMcpPatch = {
  handler?: {
    name?(node: OperationNode): string  // → 'showPetByIdHandler'
  }
  tool?: {
    name?(node: OperationNode): string  // → 'showPetById'
  }
}
```
