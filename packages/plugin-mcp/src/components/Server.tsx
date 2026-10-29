import type { ast } from '@kubb/kit'
import { Const, File, Function } from '@kubb/renderer-jsx'
import type { KubbReactNode } from '@kubb/renderer-jsx'

type ZodParam = {
  name: string
  schemaName: string
}

/**
 * Composes individual param schemas into `z.object({ ... })`.
 */
const zodObject = (params: Array<ZodParam>) => `z.object({ ${params.map((p) => `${JSON.stringify(p.name)}: ${p.schemaName}`).join(', ')} })`

type Props = {
  /**
   * Human-readable server name passed to `new McpServer({ name })`.
   */
  serverName: string
  /**
   * Semantic version string passed to `new McpServer({ version })`.
   */
  serverVersion: string
  /**
   * Operations to register as MCP tools, each carrying its handler,
   * zod schema, and AST node metadata.
   */
  operations: Array<{
    tool: {
      name: string
      title?: string
      description: string
    }
    mcp: {
      name: string
      file: ast.FileNode
    }
    zod: {
      pathParams: Array<ZodParam>
      /**
       * Query params — individual schemas to compose into `z.object({ ... })`.
       */
      queryParams?: Array<ZodParam> | null
      /**
       * Header params — individual schemas to compose into `z.object({ ... })`.
       */
      headerParams?: Array<ZodParam> | null
      requestName?: string | null
      responseName?: string | null
    }
  }>
}

export function Server({ serverName, serverVersion, operations }: Props): KubbReactNode {
  const registrations = operations
    .map(({ tool, mcp, zod }) => {
      // Group params into the same `{ path, query, headers, body }` shape the contract `<op>`
      // expects, so the MCP tool input mirrors every other client consumer.
      const entries: Array<{ key: string; value: string }> = []

      if (zod.pathParams.length) {
        entries.push({ key: 'path', value: zodObject(zod.pathParams) })
      }

      if (zod.queryParams) {
        entries.push({ key: 'query', value: zodObject(zod.queryParams) })
      }

      if (zod.headerParams) {
        entries.push({ key: 'headers', value: zodObject(zod.headerParams) })
      }

      if (zod.requestName) {
        entries.push({ key: 'body', value: zod.requestName })
      }

      const destructured = `{ ${entries.map((e) => e.key).join(', ')} }`
      const inputSchema = entries.length ? `z.object({ ${entries.map((e) => `${e.key}: ${e.value}`).join(', ')} })` : null
      const outputSchema = zod.responseName

      const config = [
        tool.title ? `title: ${JSON.stringify(tool.title)}` : null,
        `description: ${JSON.stringify(tool.description)}`,
        outputSchema ? `outputSchema: z.object({ data: ${outputSchema} })` : null,
      ]
        .filter(Boolean)
        .join(',\n  ')

      if (inputSchema) {
        return `
server.registerTool(${JSON.stringify(tool.name)}, {
  ${config},
  inputSchema: ${inputSchema},
}, async (${destructured}, ctx) => {
  return ${mcp.name}(${destructured}, ctx)
})
          `
      }

      return `
server.registerTool(${JSON.stringify(tool.name)}, {
  ${config},
}, async (ctx) => {
  return ${mcp.name}(ctx)
})
          `
    })
    .filter(Boolean)
    .join('\n')

  return (
    <>
      <File.Source name="getServer" isExportable isIndexable>
        <Function name="getServer" export>
          {`const server = new McpServer({
  name: '${serverName}',
  version: '${serverVersion}',
})
${registrations}
return server`}
        </Function>
      </File.Source>

      <File.Source name="server" isExportable isIndexable>
        <Const name={'server'} export>
          {'getServer()'}
        </Const>
      </File.Source>

      <File.Source name="startServer" isExportable isIndexable>
        <Function name="startServer" async export>
          {`return serveStdio(getServer, {
    onerror: (error) => console.error('MCP server error:', error),
  })`}
        </Function>
      </File.Source>
    </>
  )
}
