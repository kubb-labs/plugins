import { resolveClientOperation, resolveOperationTypes } from '@internals/client'
import { operationFileEntry, getStream } from '@internals/shared'
import { ast, defineGenerator } from '@kubb/kit'
import { File, jsxRenderer } from '@kubb/renderer-jsx'
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
    if (!ast.http.isOperation(node)) return null
    // A stream has no single JSON body to return as tool output, like the query plugins skip it.
    const stream = getStream(node)
    if (stream?.shape || stream?.hasVariant) return null
    const { resolver, root, config } = ctx
    const { output, client, group } = ctx.options

    const types = resolveOperationTypes(ctx, resolver.pluginName)
    const tsResolver = types.resolver

    // The registered contract client plugin owns the `<op>` the handler imports and calls.
    const contractOp = resolveClientOperation({ clientPlugin: { pluginName: client.pluginName }, ctx, node, root, output })
    if (!contractOp) {
      return null
    }

    // The handler signature references the grouped `<Name>Options`.
    const optionsName = tsResolver.response.options(node)

    const meta = {
      name: resolver.handler.name(node),
      file: resolver.file({ ...operationFileEntry(node, node.operationId), root, output, group: group ?? undefined }),
    } as const

    return (
      <File
        baseName={meta.file.baseName}
        path={meta.file.path}
        meta={meta.file.meta}
        banner={resolver.default.banner(ctx.meta, { output, config, file: { path: meta.file.path, baseName: meta.file.baseName } })}
        footer={resolver.default.footer(ctx.meta, { output, config, file: { path: meta.file.path, baseName: meta.file.baseName } })}
      >
        {optionsName && <File.Import name={[optionsName]} plugin={tsResolver.pluginName} isTypeOnly />}
        <File.Import name={['CallToolResult', 'ServerContext']} path={'@modelcontextprotocol/server'} isTypeOnly />

        <File.Import name={[contractOp.name]} plugin={contractOp.plugin} />

        <McpHandler name={meta.name} clientName={contractOp.name} node={node} resolver={tsResolver} returnType={contractOp.returnType} />
      </File>
    )
  },
})
