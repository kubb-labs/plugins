# MCP

The MCP plugin turns each operation into a typed MCP tool that AI assistants can call. Each tool validates its input and output with the Zod schemas from `@kubb/plugin-zod`, and its handler calls the function a client plugin generates for that operation.

Next to the handlers, the plugin writes three files at the root of its `output.path`:

| File        | Role                                                                            |
| ----------- | ------------------------------------------------------------------------------- |
| `server.ts` | Registers one tool per operation and exports `startServer()`.                   |
| `start.ts`  | Calls `startServer()` to serve the tools over stdio.                            |
| `.mcp.json` | A server entry that runs `start.ts`, ready to copy into your MCP client config. |

## Setup

- Add `@kubb/plugin-zod`, a client plugin (`@kubb/plugin-fetch`, `@kubb/plugin-axios`, or `@kubb/plugin-client`), and `@kubb/plugin-ts`. `@kubb/plugin-ts` is optional with `pluginZod({ inferred: 'codec' })`. Leave `sdk` unset on the client plugin.
- Install `@modelcontextprotocol/server` v2 and `zod` 4.2 or a later v4 release in the app that runs the server. Add `axios` too when you use `@kubb/plugin-axios`.
- Install a TypeScript runner such as `tsx`. The generated `.mcp.json` runs `npx tsx`, which downloads `tsx` from npm when it is missing.

## Options worth knowing

| Option                                                                      | Default  | What it does                                                                                                 |
| --------------------------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------ |
| [`client`](https://kubb.dev/extensions/kubb-labs/plugin-mcp/options#client) | Detected | Picks `'fetch'`, `'axios'`, or `'client'` when several client plugins are registered.                        |
| [`exclude`](https://kubb.dev/docs/5.x/reference/plugin-options#exclude)     | `[]`     | Skips operations. Use it for a binary request body, because an MCP client sends JSON and cannot send a file. |
| [`output.path`](https://kubb.dev/docs/5.x/reference/plugin-options#output)  | `'mcp'`  | Must name a folder, because single-file output has no place for `server.ts`, `start.ts`, and `.mcp.json`.    |

Operations that stream their response, such as `text/event-stream` or JSON Lines, get no tool, because a tool returns one JSON result.

## Example

The config below generates an MCP server whose tools call the Petstore API through `@kubb/plugin-fetch`. The `.mcp.json` names the server after the spec's `info.title`:

::code-group

```typescript [kubb.config.ts]
import { defineConfig } from 'kubb/config'
import { pluginTs } from '@kubb/plugin-ts'
import { pluginZod } from '@kubb/plugin-zod'
import { pluginFetch } from '@kubb/plugin-fetch'
import { pluginMcp } from '@kubb/plugin-mcp'

export default defineConfig({
  input: './petStore.yaml',
  output: { path: './src/gen' },
  plugins: [
    pluginTs(),
    pluginZod(),
    pluginFetch({ baseURL: 'https://petstore.swagger.io/v2' }),
    pluginMcp({ output: { path: 'mcp', mode: 'directory' } }),
  ],
})
```

```json [src/gen/mcp/.mcp.json]
{
  "mcpServers": {
    "Swagger Petstore": {
      "type": "stdio",
      "command": "npx",
      "args": ["tsx", "./src/gen/mcp/start.ts"]
    }
  }
}
```

::

The `args` path points at `start.ts` relative to the Kubb `root`, because MCP clients start the command from their own working directory. The [Run an MCP server](https://kubb.dev/extensions/kubb-labs/plugin-mcp/guides/server) guide covers starting the server and connecting Claude Code or Claude Desktop.
