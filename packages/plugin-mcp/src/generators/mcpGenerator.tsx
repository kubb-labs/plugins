import { ast } from '@internals/ast'
import { resolveClientOperation, resolveOperationTypes } from '@internals/client'
import { getStream } from '@internals/shared'
import { defineGenerator, from } from '@kubb/kit'
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
    const { resolver } = ctx
    const { client } = ctx.options

    const types = resolveOperationTypes()
    const tsResolver = types.resolver

    // The registered contract client plugin owns the `<op>` the handler imports and calls.
    const contractOp = resolveClientOperation(node, client.pluginName)
    if (!contractOp) {
      return null
    }

    // The handler signature references the grouped `<Name>Options`.
    const options = from('types').import(node, tsResolver.response.options(node)).import

    const meta = {
      name: resolver.handler.name(node),
      file: ctx.file(node),
    } as const

    return (
      <File {...meta.file}>
        {options && <File.Import name={options.name} root={meta.file.path} path={options.path} isTypeOnly />}
        <File.Import name={['CallToolResult', 'ServerContext']} path={'@modelcontextprotocol/server'} isTypeOnly />

        <File.Import name={[contractOp.name]} root={meta.file.path} path={contractOp.path} />

        <McpHandler name={meta.name} clientName={contractOp.name} node={node} resolver={tsResolver} returnType={contractOp.returnType} />
      </File>
    )
  },
})
