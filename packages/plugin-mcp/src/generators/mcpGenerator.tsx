import path from 'node:path'
import { resolveOperationTypeNames } from '@internals/shared'
import { defineGenerator } from '@kubb/core'
import { pluginTsName } from '@kubb/plugin-ts'
import { File, jsxRendererSync } from '@kubb/renderer-jsx'
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
  renderer: jsxRendererSync,
  operation(node, ctx) {
    const { resolver, driver, root } = ctx
    const { output, client, paramsCasing, group } = ctx.options

    const pluginTs = driver.getPlugin(pluginTsName)

    if (!pluginTs) {
      return null
    }

    const tsResolver = driver.getResolver(pluginTsName)

    const importedTypeNames = resolveOperationTypeNames(node, tsResolver, { paramsCasing, responseStatusNames: 'error' })

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
        <File.Import name={['buildFormData']} root={meta.file.path} path={path.resolve(root, '.kubb/config.ts')} />
        {client.importPath ? (
          <>
            <File.Import name={['Client', 'RequestConfig', 'ResponseErrorConfig']} path={client.importPath} isTypeOnly />
            <File.Import name={'fetch'} path={client.importPath} />
            {client.dataReturnType === 'full' && <File.Import name={['ResponseConfig']} path={client.importPath} isTypeOnly />}
          </>
        ) : (
          <>
            <File.Import
              name={['Client', 'RequestConfig', 'ResponseErrorConfig']}
              root={meta.file.path}
              path={path.resolve(root, '.kubb/fetch.ts')}
              isTypeOnly
            />
            <File.Import name={['fetch']} root={meta.file.path} path={path.resolve(root, '.kubb/fetch.ts')} />
            {client.dataReturnType === 'full' && (
              <File.Import name={['ResponseConfig']} root={meta.file.path} path={path.resolve(root, '.kubb/fetch.ts')} isTypeOnly />
            )}
          </>
        )}

        <McpHandler
          name={meta.name}
          node={node}
          resolver={tsResolver}
          baseURL={client.baseURL}
          dataReturnType={client.dataReturnType || 'data'}
          paramsCasing={paramsCasing}
        />
      </File>
    )
  },
})
