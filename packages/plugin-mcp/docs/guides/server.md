# Run an MCP server

Generate and start an MCP server with typed tools and an HTTP client.

::steps{level="2"}

## Generate the server

Register TypeScript types, Zod schemas, and an Axios or Fetch client alongside `pluginMcp`. A single registered client is detected automatically.

```typescript [kubb.config.ts]
import { defineConfig } from 'kubb/config'
import { pluginTs } from '@kubb/plugin-ts'
import { pluginZod } from '@kubb/plugin-zod'
import { pluginAxios } from '@kubb/plugin-axios'
import { pluginMcp } from '@kubb/plugin-mcp'

export default defineConfig({
  input: './petStore.yaml',
  output: { path: './src/gen' },
  plugins: [
    pluginTs({ output: { path: 'types', mode: 'directory' } }),
    pluginZod(),
    pluginAxios({ baseURL: 'https://petstore.swagger.io/v2' }),
    pluginMcp({ output: { path: 'mcp', mode: 'directory' } }),
  ],
})
```

Run `kubb generate`. The plugin writes tool handlers, `server.ts`, `start.ts`, and `.mcp.json`. Each generated handler calls its HTTP operation, forwards the cancellation signal, and throws for non-2xx responses. Tool results include text content and structured response data. `server.ts` registers tools with Zod input and output schemas, and `start.ts` calls its `startServer()` to serve them over stdio. The tool list shows an `int64` field as an integer and a binary field as a value without a type, because `bigint` and `Blob` have no JSON Schema form. Operations that stream their response, such as `text/event-stream` or JSON Lines, get no tool, because a tool returns one JSON result.

## Start the server

Install the generated server's runtime dependencies and a TypeScript runner:

```shell [Terminal]
npm install @modelcontextprotocol/server@^2 zod@^4.2 axios@^1.20.0
npm install -D tsx
```

Run the generated entry from the project root:

```shell [Terminal]
npx tsx src/gen/mcp/start.ts
```

The server reads MCP messages from stdin, prints nothing on startup, and logs transport errors to stderr. Press `Ctrl+C` to stop it.

## Connect a client

The generated `.mcp.json` runs the same command:

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

The server name comes from `info.title` in your OpenAPI spec. MCP clients start the command from their own working directory, so the `args` path is relative to the Kubb `root`, not to the `.mcp.json` folder. Claude Code reads `.mcp.json` from the project root, so copy the entry under `mcpServers` into that file. For a client that starts in another folder, such as Claude Desktop, use an absolute path to `start.ts`.

::

## Use your own entry file

To run setup code first, such as loading environment variables, import `startServer` from the generated `server.ts` in your own entry file and point `args` at that file instead of `start.ts`.

```typescript [mcp.ts]
import { startServer } from './src/gen/mcp/server'

startServer()
```

## Select a client

When both HTTP plugins are registered, set [`client`](https://kubb.dev/extensions/kubb-labs/plugin-mcp/options#client) explicitly. Give each client a different output directory so their generated files do not overwrite each other.

```typescript [kubb.config.ts]
import { pluginAxios } from '@kubb/plugin-axios'
import { pluginFetch } from '@kubb/plugin-fetch'
import { pluginMcp } from '@kubb/plugin-mcp'

const clients = [
  pluginAxios({ output: { path: 'clients-axios', mode: 'directory' } }),
  pluginFetch({ output: { path: 'clients-fetch', mode: 'directory' } }),
  pluginMcp({ output: { path: 'mcp', mode: 'directory' }, client: 'axios' }),
]
```

Add these entries alongside `pluginTs` and `pluginZod` in `defineConfig.plugins`. The handlers import operations from `clients-axios`.
