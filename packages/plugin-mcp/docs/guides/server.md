# Run an MCP server

Generate an MCP server from your OpenAPI spec, start it, and connect Claude Code or Claude Desktop to its tools.

::steps{level="2"}

## Generate the server

Register TypeScript types, Zod schemas, and one client plugin next to `pluginMcp`, then run `kubb generate`. A single client plugin is detected automatically.

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

The plugin writes one handler per operation, plus `server.ts`, `start.ts`, and `.mcp.json` in `src/gen/mcp/`.

## Install the runtime

Install the server's runtime dependencies and a TypeScript runner:

```shell [Terminal]
npm install @modelcontextprotocol/server@^2 zod@^4.2 axios@^1.20.0
npm install -D tsx
```

## Start the server

Run the generated entry from the project root:

```shell [Terminal]
npx tsx src/gen/mcp/start.ts
```

The server reads MCP messages from stdin, prints nothing on startup, and logs transport errors to stderr. Press `Ctrl+C` to stop it. You do not need to keep it running: an MCP client starts it.

## Connect Claude Code

The generated `.mcp.json` runs the same command. Claude Code reads `.mcp.json` from the project root, so copy the entry under `mcpServers` into that file.

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

The server name comes from `info.title` in your spec. The `args` path is relative to the Kubb `root`, not to the `.mcp.json` folder, because MCP clients start the command from their own working directory.

::

## What the tools look like

`server.ts` registers one tool per operation:

| Tool field  | Comes from                                                                                                        |
| ----------- | ----------------------------------------------------------------------------------------------------------------- |
| Name        | The `operationId`                                                                                                 |
| Title       | The operation `summary`                                                                                           |
| Description | The operation `description`, or one built from the method and path, such as `Make a GET request to /pets/{petId}` |
| Input       | The Zod schemas of the path, query, header, and cookie parameters and the request body                            |
| Output      | `{ data }` with the success response, as structured content and as JSON text                                      |

Each handler forwards the MCP cancellation signal to the client and throws for a non-2xx response, which the assistant sees as a tool error. In the tool list, an `int64` field shows as an integer and a binary field as a value without a type, because `bigint` and `Blob` have no JSON Schema form. Operations that stream their response, such as `text/event-stream` or JSON Lines, get no tool.

## Claude Desktop

Claude Desktop does not start servers from your project folder, so its entry needs an absolute path to `start.ts`. Generate the server and install the runtime first, as in the steps above.

::steps{level="3"}

### Register the server

Open Claude Desktop's `Settings → Developer → Edit Config`. This opens `claude_desktop_config.json`, on macOS under `~/Library/Application Support/Claude/` and on Windows under `%APPDATA%\Claude\`. It is the same file the [Kubb MCP server](https://kubb.dev/docs/5.x/ai/mcp#client-configuration) uses.

Copy the entry from `src/gen/mcp/.mcp.json` into the file's `mcpServers` object, next to any existing servers. Change the path in `args` to the absolute path of the generated `start.ts`:

:::code-group

```json [macOS]
{
  "mcpServers": {
    "Swagger Petstore": {
      "type": "stdio",
      "command": "npx",
      "args": ["tsx", "/absolute/path/to/project/src/gen/mcp/start.ts"]
    }
  }
}
```

```json [Windows]
{
  "mcpServers": {
    "Swagger Petstore": {
      "type": "stdio",
      "command": "npx",
      "args": ["tsx", "C:\\path\\to\\project\\src\\gen\\mcp\\start.ts"]
    }
  }
}
```

:::

In Windows JSON paths, escape each backslash as `\\`.

### Use the generated tools

Quit Claude Desktop completely and reopen it. Open `Manage connectors`, select your server, and check that the tools match the operations in your spec. Ask Claude to run one of those operations, and review its request before you approve the API call.

::

## Use your own entry file

To run setup code first, such as loading environment variables, import `startServer` from the generated `server.ts` in your own entry file. Point `args` at that file instead of `start.ts`.

```typescript [mcp.ts]
import { startServer } from './src/gen/mcp/server'

startServer()
```

## Select a client

When several client plugins are registered, set [`client`](https://kubb.dev/extensions/kubb-labs/plugin-mcp/options#client). Give each client its own output folder so their files do not overwrite each other.

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

Add these entries next to `pluginTs` and `pluginZod` in `plugins`. The handlers then import their operations from `clients-axios`.
