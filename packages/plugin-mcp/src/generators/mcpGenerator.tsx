import { resolveClientOperation, resolveOperationTypes } from '@internals/client'
import { getFile, getFileLocation, hasStreamVariant, isEventStream, operationFileEntry, resolveOperationFile } from '@internals/shared'
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
    if (isEventStream(node) || hasStreamVariant(node)) return null
    const { resolver, root } = ctx
    const { output, client } = ctx.options
    const location = getFileLocation(ctx)

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
      file: resolver.file({ ...operationFileEntry(node, node.operationId), ...location }),
      fileTs: resolveOperationFile({
        ctx,
        node,
        resolver: tsResolver,
        root,
        output: types.output ?? output,
        group: types.group,
      }),
    } as const

    return (
      <File {...getFile(ctx, meta.file)}>
        {meta.fileTs && optionsName && <File.Import name={[optionsName]} root={meta.file.path} path={meta.fileTs.path} isTypeOnly />}
        <File.Import name={['CallToolResult', 'ServerContext']} path={'@modelcontextprotocol/server'} isTypeOnly />

        <File.Import name={[contractOp.name]} root={meta.file.path} path={contractOp.path} />

        <McpHandler name={meta.name} clientName={contractOp.name} node={node} resolver={tsResolver} returnType={contractOp.returnType} />
      </File>
    )
  },
})
