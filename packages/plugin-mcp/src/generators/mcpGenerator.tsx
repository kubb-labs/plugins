import path from 'node:path'
import { resolveOperationTypeNames } from '@internals/shared'
import { ast, defineGenerator } from '@kubb/core'
import { pluginTsName } from '@kubb/plugin-ts'
import { File, jsxRenderer } from '@kubb/renderer-jsx'
import { McpHandler } from '../components/McpHandler.tsx'
import type { PluginMcp } from '../types.ts'

/**
 * Built-in operation generator for `@kubb/plugin-mcp`. Emits one MCP tool
 * handler per OpenAPI operation, wiring the input Zod schema, the HTTP call,
 * and the response shape into a single function that an MCP server can
 * register as a callable tool.
 */
export const mcpGenerator = defineGenerator<PluginMcp>({
  name: 'mcp',
  renderer: jsxRenderer,
  operation(node, ctx) {
    if (!ast.isHttpOperationNode(node)) return null
    const { resolver, driver, root } = ctx
    const { output, client, group } = ctx.options

    const pluginTs = driver.getPlugin(pluginTsName)

    if (!pluginTs) {
      return null
    }

    const tsResolver = driver.getResolver(pluginTsName)

    // The handler only references the grouped params type — the request body data and the path/query
    // params — so the response and error-status names are left out of the imports.
    const responseName = tsResolver.resolveResponseName(node)
    const importedTypeNames = resolveOperationTypeNames(node, tsResolver, { responseStatusNames: false }).filter((name) => name !== responseName)

    const meta = {
      name: resolver.resolveHandlerName(node),
      file: resolver.resolveFile(
        { name: node.operationId, extname: '.ts', tag: node.tags[0] ?? 'default', path: node.path },
        { root, output, group: group ?? undefined },
      ),
      fileTs: tsResolver.resolveFile(
        { name: node.operationId, extname: '.ts', tag: node.tags[0] ?? 'default', path: node.path },
        {
          root,
          output: pluginTs.options?.output ?? output,
          group: pluginTs.options?.group ?? undefined,
        },
      ),
    } as const

    return (
      <File baseName={meta.file.baseName} path={meta.file.path} meta={meta.file.meta}>
        {meta.fileTs && importedTypeNames.length > 0 && (
          <File.Import name={Array.from(new Set(importedTypeNames)).sort()} root={meta.file.path} path={meta.fileTs.path} isTypeOnly />
        )}
        <File.Import name={['CallToolResult', 'ServerNotification', 'ServerRequest']} path={'@modelcontextprotocol/sdk/types'} isTypeOnly />
        <File.Import name={['RequestHandlerExtra']} path={'@modelcontextprotocol/sdk/shared/protocol'} isTypeOnly />
        {client.importPath ? (
          <File.Import name={'client'} path={client.importPath} />
        ) : (
          <File.Import name={['client']} root={meta.file.path} path={path.resolve(root, '.kubb/client.ts')} />
        )}

        <McpHandler name={meta.name} node={node} resolver={tsResolver} baseURL={client.baseURL} />
      </File>
    )
  },
})
