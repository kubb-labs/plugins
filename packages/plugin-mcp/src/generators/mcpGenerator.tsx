import { ast } from '@internals/ast'
import { resolveClientOperation, resolveOperationTypes } from '@internals/client'
import { getStream } from '@internals/shared'
import { defineGenerator, defineTemplate } from '@kubb/kit'
import { File, jsxRenderer } from '@kubb/renderer-jsx'
import { McpHandler } from '../components/McpHandler.tsx'
import type { PluginMcp } from '../types.ts'

/**
 * Built-in operation template for `@kubb/plugin-mcp`. Emits one MCP tool
 * handler per OpenAPI operation. The handler takes the grouped `{ path, query,
 * headers, body }` config and forwards it to the registered client plugin's
 * (`@kubb/plugin-axios` / `@kubb/plugin-fetch`) `<op>` function.
 */
export const mcpOperation = defineTemplate<PluginMcp>({
  kind: 'Operation',
  render(node, ctx) {
    if (!ast.http.isOperation(node)) return null
    // A stream has no single JSON body to return as tool output, like the query plugins skip it.
    const stream = getStream(node)
    if (stream?.shape || stream?.hasVariant) return null
    const { client } = ctx.options

    const types = resolveOperationTypes()
    const tsResolver = types.resolver

    // The registered contract client plugin owns the `<op>` the handler imports and calls.
    const contractOp = resolveClientOperation({ node, pluginName: client.pluginName })
    if (!contractOp) {
      return null
    }

    // The handler signature references the grouped `<Name>Options`.
    const options = ctx.from('types').resolver.response.options(node).import

    const meta = {
      name: ctx.resolver.handler.name(node),
      file: ctx.file(node),
    } as const

    return (
      <File {...meta.file}>
        {options && <File.Import names={ast.imports.asType(options)} root={meta.file.path} path={options.path} />}
        <File.Import
          names={[
            { name: 'CallToolResult', space: 'type' },
            { name: 'ServerContext', space: 'type' },
          ]}
          path={'@modelcontextprotocol/server'}
        />

        <File.Import names={[{ name: contractOp.name, space: 'value' }]} root={meta.file.path} path={contractOp.path} />

        <McpHandler name={meta.name} clientName={contractOp.name} node={node} resolver={tsResolver} returnType={contractOp.returnType} />
      </File>
    )
  },
})

/**
 * @deprecated Register `mcpOperation` with `addTemplate`.
 */
export const mcpGenerator = defineGenerator<PluginMcp>({
  name: 'mcp',
  renderer: jsxRenderer,
  operation: (node, ctx) => mcpOperation.render(node, ctx),
})
