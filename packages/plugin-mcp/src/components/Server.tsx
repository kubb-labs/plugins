import { getOperationParameters } from '@internals/shared'
import type { ast } from '@kubb/core'
import { createFunctionParameter, createFunctionParameters, createObjectBindingPattern, functionPrinter } from '@kubb/plugin-ts'
import { Const, File, Function } from '@kubb/renderer-jsx'
import type { KubbReactNode } from '@kubb/renderer-jsx/types'
import type { ZodParam } from '../utils.ts'
import { zodExprFromSchemaNode, zodGroupExpr } from '../utils.ts'

type Props = {
  /**
   * Variable name for the MCP server instance (e.g. 'server').
   */
  name: string
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
      queryParams?: string | Array<ZodParam> | null
      /**
       * Header params — individual schemas to compose into `z.object({ ... })`.
       */
      headerParams?: string | Array<ZodParam> | null
      requestName?: string | null
      responseName?: string | null
    }
    node: ast.OperationNode
  }>
}

const keysPrinter = functionPrinter({ mode: 'call' })

export function Server({ name, serverName, serverVersion, operations }: Props): KubbReactNode {
  const registrations = operations
    .map(({ tool, mcp, zod, node }) => {
      const { path: pathParams } = getOperationParameters(node)

      // Group params into the same `{ path, query, headers, body }` shape the contract `<op>`
      // expects, so the MCP tool input mirrors every other client consumer.
      const entries: Array<{ key: string; value: string }> = []

      if (pathParams.length) {
        const pathFields = pathParams
          .map((p) => {
            const zodParam = zod.pathParams.find((zp) => zp.name === p.name)
            return `${JSON.stringify(p.name)}: ${zodParam ? zodParam.schemaName : zodExprFromSchemaNode(p.schema)}`
          })
          .join(', ')
        entries.push({ key: 'path', value: `z.object({ ${pathFields} })` })
      }

      if (zod.queryParams) {
        entries.push({ key: 'query', value: zodGroupExpr(zod.queryParams) })
      }

      if (zod.headerParams) {
        entries.push({ key: 'headers', value: zodGroupExpr(zod.headerParams) })
      }

      if (zod.requestName) {
        entries.push({ key: 'body', value: zod.requestName })
      }

      const paramsNode = entries.length
        ? createFunctionParameters({
            params: [
              createFunctionParameter({
                name: createObjectBindingPattern({ elements: entries.map((e) => ({ name: e.key })) }),
                optional: false,
              }),
            ],
          })
        : null

      const destructured = paramsNode ? (keysPrinter.print(paramsNode) ?? '') : ''
      const inputSchema = entries.length ? `{ ${entries.map((e) => `${e.key}: ${e.value}`).join(', ')} }` : null
      const outputSchema = zod.responseName

      const config = [
        tool.title ? `title: ${JSON.stringify(tool.title)}` : null,
        `description: ${JSON.stringify(tool.description)}`,
        outputSchema ? `outputSchema: { data: ${outputSchema} }` : null,
      ]
        .filter(Boolean)
        .join(',\n  ')

      if (inputSchema) {
        return `
server.registerTool(${JSON.stringify(tool.name)}, {
  ${config},
  inputSchema: ${inputSchema},
}, async (${destructured}, request) => {
  return ${mcp.name}(${destructured}, request)
})
          `
      }

      return `
server.registerTool(${JSON.stringify(tool.name)}, {
  ${config},
}, async (request) => {
  return ${mcp.name}(request)
})
          `
    })
    .filter(Boolean)
    .join('\n')

  return (
    <File.Source name={name} isExportable isIndexable>
      <Function name="getServer" export>
        {`const server = new McpServer({
  name: '${serverName}',
  version: '${serverVersion}',
})
${registrations}
return server`}
      </Function>

      <Const name={'server'} export>
        {'getServer()'}
      </Const>

      <Function name="startServer" async export>
        {`try {
    const transport = new StdioServerTransport()
    await server.connect(transport)

  } catch (error) {
    console.error('Failed to start server:', error)
    process.exit(1)
  }`}
      </Function>
    </File.Source>
  )
}
