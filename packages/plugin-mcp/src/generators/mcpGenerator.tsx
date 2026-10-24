import { resolveClientOperation, resolveTypeResolver } from '@internals/client'
import { operationFileEntry, resolveDependencyOperationFile } from '@internals/shared'
import { ast, defineGenerator } from 'kubb/kit'
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
    const { resolver, driver, root, config } = ctx
    const { output, client, group } = ctx.options

    const types = resolveTypeResolver(driver, resolver.pluginName)
    const tsResolver = types.resolver

    // The registered contract client plugin owns the `<op>` the handler imports and calls.
    const contractOp = resolveClientOperation({ clientPlugin: { pluginName: client.pluginName }, driver, node, root, output, cache: ctx.cache })
    if (!contractOp) {
      return null
    }

    // The handler signature references the grouped `<Name>Options`.
    const optionsName = tsResolver.response.options(node)

    const meta = {
      name: resolver.handler.name(node),
      file: resolver.file({ ...operationFileEntry(node, node.operationId), root, output, group: group ?? undefined }),
      fileTs: resolveDependencyOperationFile({
        cache: ctx.cache,
        node,
        resolver: tsResolver,
        root,
        output: types.output ?? output,
        group: types.group,
      }),
    } as const

    return (
      <File
        baseName={meta.file.baseName}
        path={meta.file.path}
        meta={meta.file.meta}
        banner={resolver.default.banner(ctx.meta, { output, config, file: { path: meta.file.path, baseName: meta.file.baseName } })}
        footer={resolver.default.footer(ctx.meta, { output, config, file: { path: meta.file.path, baseName: meta.file.baseName } })}
      >
        {meta.fileTs && optionsName && <File.Import name={[optionsName]} root={meta.file.path} path={meta.fileTs.path} isTypeOnly />}
        <File.Import name={['CallToolResult', 'ServerContext']} path={'@modelcontextprotocol/server'} isTypeOnly />

        <File.Import name={[contractOp.name]} root={meta.file.path} path={contractOp.path} />

        <McpHandler name={meta.name} clientName={contractOp.name} node={node} resolver={tsResolver} returnType={contractOp.returnType} />
      </File>
    )
  },
})
