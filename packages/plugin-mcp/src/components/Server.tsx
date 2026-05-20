import { getOperationParameters } from '@internals/shared'
import { ast } from '@kubb/core'
import { functionPrinter } from '@kubb/plugin-ts'
import { Const, File, Function } from '@kubb/renderer-jsx'
import type { KubbReactNode } from '@kubb/renderer-jsx/types'
import type { PluginMcp } from '../types.ts'
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
   * How to style your params.
   */
  paramsCasing?: PluginMcp['resolvedOptions']['paramsCasing']
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

const keysPrinter = functionPrinter({ mode: 'keys' })

export function Server({ name, serverName, serverVersion, paramsCasing, operations }: Props): KubbReactNode {
  return (
    <File.Source name={name} isExportable isIndexable>
      <Const name={'server'} export>
        {`
          new McpServer({
  name: '${serverName}',
  version: '${serverVersion}',
})
          `}
      </Const>

      {operations
        .map(({ tool, mcp, zod, node }) => {
          const { path: pathParams } = getOperationParameters(node, { paramsCasing })

          const pathEntries: Array<{ key: string; value: string }> = []
          const otherEntries: Array<{ key: string; value: string }> = []

          for (const p of pathParams) {
            const zodParam = zod.pathParams.find((zp) => zp.name === p.name)
            pathEntries.push({ key: p.name, value: zodParam ? zodParam.schemaName : zodExprFromSchemaNode(p.schema) })
          }

          if (zod.requestName) {
            otherEntries.push({ key: 'data', value: zod.requestName })
          }

          if (zod.queryParams) {
            otherEntries.push({ key: 'params', value: zodGroupExpr(zod.queryParams) })
          }

          if (zod.headerParams) {
            otherEntries.push({ key: 'headers', value: zodGroupExpr(zod.headerParams) })
          }

          otherEntries.sort((a, b) => a.key.localeCompare(b.key))
          const entries = [...pathEntries, ...otherEntries]

          const paramsNode = entries.length
            ? ast.createFunctionParameters({
                params: [
                  ast.createParameterGroup({
                    properties: entries.map((e) => ast.createFunctionParameter({ name: e.key, optional: false })),
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
        .filter(Boolean)}

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
