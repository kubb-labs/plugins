# Run an MCP server

Generate an MCP server from your OpenAPI spec, start it, and connect Claude Code or Claude Desktop to its tools.

::steps{level="2"}

## Generate the server

Register `pluginTs`, `pluginZod`, and one client plugin next to `pluginMcp`, then run `kubb generate`. When only one client plugin is registered, Kubb detects it.

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

Install the runtime dependencies and a TypeScript runner:

```shell [Terminal]
npm install @modelcontextprotocol/server@^2 zod@^4.2 axios@^1.20.0
npm install -D tsx
```

## Start the server

Run the generated entry from the project root:

```shell [Terminal]
npx tsx src/gen/mcp/start.ts
```

The server reads MCP messages from stdin, prints nothing on startup, and logs transport errors to stderr. Press `Ctrl+C` to stop it. You do not need to keep it running, because an MCP client starts it.

## Connect Claude Code

Claude Code reads `.mcp.json` from the project root. Copy the `mcpServers` entry from the generated file into it.

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

| Tool field  | Comes from                                                                                                                        |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Name        | The `operationId`, with each character outside `a-z`, `A-Z`, `0-9`, `_` and `-` replaced by `_`, cut at 64 characters             |
| Title       | The operation `summary`                                                                                                           |
| Description | The operation `description`, or one built from the method and path: `Make a GET request to /pets/{petId}`                         |
| Input       | The Zod schemas of the parameters and the request body                                                                            |
| Output      | The success body, as `{ data: body }` structured content and as the JSON text of `body`. A success with no body gives empty text. |

MCP clients reject other tool names, so `pets.list/v2` becomes `pets_list_v2`. When two operations end up with the same name, the later one gets a `_2` suffix, then `_3`.

Each handler forwards the MCP cancellation signal to the client and throws for a non-2xx response, which the assistant sees as a tool error. Operations that stream their response get no tool.

See [Tool calls and results](#tool-calls-and-results).

## Claude Desktop

Claude Desktop does not start servers from your project folder, so its entry needs an absolute path to `start.ts`. First generate the server and install the runtime, as in the steps above.

::steps{level="3"}

### Register the server

Open Claude Desktop's `Settings → Developer → Edit Config`. This opens `claude_desktop_config.json`, on macOS under `~/Library/Application Support/Claude/` and on Windows under `%APPDATA%\Claude\`.

Copy the entry from `src/gen/mcp/.mcp.json` into its `mcpServers` object, next to any existing servers. Change the `args` path to the absolute path of `start.ts`:

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

Quit Claude Desktop completely and reopen it. Open `Manage connectors`, select your server, and check that the tools match your operations. Ask Claude to run one operation, and review its request before you approve the API call.

::

## Use your own entry file

To run setup code first, such as loading environment variables, import `startServer` from `server.ts` in your own entry file. Point `args` at that file instead of `start.ts`.

```typescript [mcp.ts]
import { startServer } from './src/gen/mcp/server'

startServer()
```

## Select a client

When several client plugins are registered, set [`client`](https://kubb.dev/extensions/kubb-labs/plugin-mcp/options#client). Give each client plugin its own output folder, so their files do not overwrite each other.

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

Add these entries next to `pluginTs` and `pluginZod` in `plugins`. The handlers then import from `clients-axios`.

## Less common cases

### Tool calls and results

Configure transport settings such as `baseURL` on the client plugin. With `client: 'client'`, set them in your own client module, because `pluginClient` takes no `baseURL`.

Each handler calls the client function with:

- The grouped `path`, `query`, `headers`, `body`, and `cookies` options that the operation has.
- The MCP cancellation signal.
- `throwOnError: true`, so a non-2xx response throws and surfaces as a tool error, whatever the client's `throwOnErrorDefault`.

The tool response body depends on the client's `returnType`:

| Client `returnType`                                                         | Tool response body       |
| --------------------------------------------------------------------------- | ------------------------ |
| `'full'` (the client default), or the plain result of `@kubb/plugin-client` | `res.data`               |
| `'data'`                                                                    | The resolved call result |

In the tool list, an `int64` field shows as an integer and a binary field as a value without a type, because `bigint` and `Blob` have no JSON Schema form.

### Streaming operations

Operations that stream their response, such as `text/event-stream` or JSON Lines, get no tool, because a tool returns one JSON result.
