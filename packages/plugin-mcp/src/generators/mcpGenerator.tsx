import path from 'node:path'
import { Operation, resolveClientOperation } from '@internals/client'
import { camelCase } from '@internals/utils'
import { ast, defineGenerator } from '@kubb/core'
import { pluginTsName } from '@kubb/plugin-ts'
import { File, jsxRenderer } from '@kubb/renderer-jsx'
import { McpHandler } from '../components/McpHandler.tsx'
import type { PluginMcp } from '../types.ts'

/**
 * Built-in operation generator for `@kubb/plugin-mcp`. Emits one MCP tool
 * handler per OpenAPI operation. The handler takes the grouped `{ path, query,
 * headers, body }` config and forwards it to a contract client `<op>`: a
 * registered plugin-axios / plugin-fetch function in `contract` mode, or an
 * inline contract client rendered into the handler file otherwise.
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

    // A registered contract client plugin owns the `<op>`; contract-inline renders its own client
    // into this handler file.
    const contractOp =
      client.kind === 'contract' ? resolveClientOperation({ clientPlugin: { pluginName: client.pluginName }, driver, node, root, output }) : null
    const clientPath = path.resolve(root, '.kubb/client.ts')
    const inlineClientName = camelCase(node.operationId)
    const calledClientName = contractOp ? contractOp.name : inlineClientName

    // The handler signature references the grouped `<Name>RequestConfig`; the inline op also needs
    // the `<Name>Responses` aggregate for its return type.
    const importedTypeNames = [
      tsResolver.resolveRequestConfigName(node),
      client.kind === 'contract-inline' ? tsResolver.resolveResponsesName(node) : null,
    ].filter((name): name is string => Boolean(name))

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

        {contractOp && <File.Import name={[contractOp.name]} root={meta.file.path} path={contractOp.path} />}

        {client.kind === 'contract-inline' && (
          <>
            <File.Import name={['client']} root={meta.file.path} path={clientPath} />
            <File.Import name={['Options', 'RequestResult']} root={meta.file.path} path={clientPath} isTypeOnly />
          </>
        )}

        {client.kind === 'contract-inline' && <Operation name={inlineClientName} node={node} tsResolver={tsResolver} parser={false} />}

        <McpHandler name={meta.name} clientName={calledClientName} node={node} resolver={tsResolver} />
      </File>
    )
  },
})
