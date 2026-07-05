import { resolveClientOperation } from '@internals/client'
import { ast, defineGenerator } from 'kubb/kit'
import { pluginTsName } from '@kubb/plugin-ts'
import { File, jsxRenderer } from 'kubb/jsx'
import { McpHandler } from '../components/McpHandler.tsx'
import type { PluginMcp } from '../types.ts'

/**
 * Built-in operation generator for `@kubb/plugin-mcp`. Emits one MCP tool
 * handler per OpenAPI operation. The handler takes the grouped `{ path, query,
 * headers, body }` config and forwards it to the registered client plugin's
 * (`@kubb/plugin-axios` / `@kubb/plugin-fetch`) `<op>` function.
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

    // The registered contract client plugin owns the `<op>` the handler imports and calls.
    const contractOp = resolveClientOperation({ clientPlugin: { pluginName: client.pluginName }, driver, node, root, output })
    if (!contractOp) {
      return null
    }

    // The handler signature references the grouped `<Name>RequestConfig`.
    const requestConfigName = tsResolver.response.config(node)

    const meta = {
      name: resolver.handler.name(node),
      file: resolver.file(
        { name: node.operationId, extname: '.ts', tag: node.tags[0] ?? 'default', path: node.path },
        { root, output, group: group ?? undefined },
      ),
      fileTs: tsResolver.file(
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
        {meta.fileTs && requestConfigName && <File.Import name={[requestConfigName]} root={meta.file.path} path={meta.fileTs.path} isTypeOnly />}
        <File.Import name={['CallToolResult', 'ServerNotification', 'ServerRequest']} path={'@modelcontextprotocol/sdk/types'} isTypeOnly />
        <File.Import name={['RequestHandlerExtra']} path={'@modelcontextprotocol/sdk/shared/protocol'} isTypeOnly />

        <File.Import name={[contractOp.name]} root={meta.file.path} path={contractOp.path} />

        <McpHandler name={meta.name} clientName={contractOp.name} node={node} resolver={tsResolver} />
      </File>
    )
  },
})
