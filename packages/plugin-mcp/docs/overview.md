# MCP

The MCP plugin turns each operation in your OpenAPI spec into a typed MCP tool that AI assistants can call, validated with `@kubb/plugin-zod` schemas.

Each tool handler calls the function a client plugin generates for that operation.

Next to the handlers, the plugin writes three files at the root of its `output.path`:

| File        | Role                                                                            |
| ----------- | ------------------------------------------------------------------------------- |
| `server.ts` | Registers one tool per operation and exports `startServer()`.                   |
| `start.ts`  | Calls `startServer()` to serve the tools over stdio.                            |
| `.mcp.json` | A server entry that runs `start.ts`, ready to copy into your MCP client config. |

## Setup

- Add `@kubb/plugin-zod`, one client plugin (`@kubb/plugin-fetch`, `@kubb/plugin-axios`, `@kubb/plugin-ky`, or `@kubb/plugin-client`), and `@kubb/plugin-ts`. `@kubb/plugin-ts` is optional with `pluginZod({ inferred: 'codec' })`. Leave `sdk` unset on the client plugin.
- Install `@modelcontextprotocol/server` v2 and `zod` 4.2 or a later v4 release in the app that runs the server. Add `axios` or `ky` too when you use `@kubb/plugin-axios` or `@kubb/plugin-ky`.
- Install a TypeScript runner such as `tsx`. The generated `.mcp.json` runs `npx tsx`, which downloads `tsx` from npm when it is missing.

## Options worth knowing

| Option                                                                      | Default  | What it does                                                                                               |
| --------------------------------------------------------------------------- | -------- | ---------------------------------------------------------------------------------------------------------- |
| [`client`](https://kubb.dev/extensions/kubb-labs/plugin-mcp/options#client) | Detected | Picks `'fetch'`, `'axios'`, `'ky'`, or `'client'` when several client plugins are registered.              |
| [`exclude`](https://kubb.dev/docs/5.x/reference/plugin-options#exclude)     | `[]`     | Skips operations, such as one with a binary request body. An MCP client sends JSON and cannot send a file. |
| [`output.path`](https://kubb.dev/docs/5.x/reference/plugin-options#output)  | `'mcp'`  | Must name a folder for `server.ts`, `start.ts`, and `.mcp.json`.                                           |

Operations that stream their response get no tool.

See [Streaming operations](https://kubb.dev/extensions/kubb-labs/plugin-mcp/guides/server#streaming-operations).

## Example

This config generates an MCP server whose tools call the Petstore API through `@kubb/plugin-fetch`. The `.mcp.json` names the server after the spec's `info.title`:

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

Next, [run the server](https://kubb.dev/extensions/kubb-labs/plugin-mcp/guides/server) and connect Claude Code or Claude Desktop.
