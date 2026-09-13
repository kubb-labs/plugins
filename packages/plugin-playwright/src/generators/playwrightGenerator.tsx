import { getOperationParameters, operationFileEntry, resolveDependencyOperationFile } from '@internals/shared'
import { pluginTsName } from '@kubb/plugin-ts'
import { File, jsxRenderer } from 'kubb/jsx'
import { ast, defineGenerator } from 'kubb/kit'
import { Request } from '../components/Request.tsx'
import type { PluginPlaywright } from '../types.ts'

/**
 * Emits typed helpers for GET operations with path parameters and a native response.
 */
export const playwrightGenerator = defineGenerator<PluginPlaywright>({
  name: 'playwright',
  renderer: jsxRenderer,
  operation(node, ctx) {
    if (!ast.isHttpOperationNode(node) || node.method !== 'GET' || node.parameters.some((param) => param.in !== 'path') || node.requestBody) return null

    const { config, resolver, driver, root } = ctx
    const { output, baseURL } = ctx.options
    const pluginTs = driver.getPlugin(pluginTsName)
    if (!pluginTs) return null

    const tsResolver = driver.getResolver(pluginTsName)
    const responseType = tsResolver.response.response(node)
    const { path } = getOperationParameters(node)
    const pathType = path[0] ? tsResolver.param.path(node, path[0]) : undefined
    const file = resolver.file({ ...operationFileEntry(node, node.operationId), root, output })
    const fileTs = resolveDependencyOperationFile({
      cache: ctx.cache,
      node,
      resolver: tsResolver,
      root,
      output: pluginTs.options?.output ?? output,
      group: pluginTs.options?.group,
    })

    return (
      <File
        baseName={file.baseName}
        path={file.path}
        meta={file.meta}
        banner={resolver.default.banner(ctx.meta, { output, config, file })}
        footer={resolver.default.footer(ctx.meta, { output, config, file })}
      >
        <File.Import name={['APIRequestContext', 'APIResponse']} path="@playwright/test" isTypeOnly />
        <File.Import name={pathType ? [responseType, pathType] : [responseType]} root={file.path} path={fileTs.path} isTypeOnly />
        <Request name={resolver.name(node.operationId)} node={node} responseType={responseType} pathType={pathType} baseURL={baseURL} />
      </File>
    )
  },
})
