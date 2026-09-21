import { resolve } from 'node:path'
import { getOperationParameters, operationFileEntry, resolveDependencyOperationFile } from '@internals/shared'
import { pluginTsName } from '@kubb/plugin-ts'
import { File, jsxRenderer } from 'kubb/jsx'
import { ast, defineGenerator } from 'kubb/kit'
import { Request } from '../components/Request.tsx'
import type { PluginPlaywright } from '../types.ts'

/**
 * Emits typed HTTP helpers with OpenAPI parameters, JSON bodies, and native fetch options.
 */
export const playwrightGenerator = defineGenerator<PluginPlaywright>({
  name: 'playwright',
  renderer: jsxRenderer,
  operation(node, ctx) {
    if (!ast.isHttpOperationNode(node) || node.parameters.some((param) => param.in === 'cookie')) return null

    const content = node.requestBody?.content?.[0]
    const mediaType = content?.contentType.split(';')[0]?.trim().toLowerCase()
    if (node.requestBody && mediaType !== 'application/json' && !mediaType?.endsWith('+json')) return null

    const { config, resolver, driver, root } = ctx
    const { output, baseURL } = ctx.options
    const pluginTs = driver.getPlugin(pluginTsName)
    if (!pluginTs) return null

    const tsResolver = driver.getResolver(pluginTsName)
    const responseType = tsResolver.response.response(node)
    const { path, query, header } = getOperationParameters(node)
    const pathType = path[0] ? tsResolver.param.path(node, path[0]) : undefined
    const queryType = query[0] ? tsResolver.param.query(node, query[0]) : undefined
    const headersType = header[0] ? tsResolver.param.headers(node, header[0]) : undefined
    const bodyType = content?.schema ? tsResolver.response.body(node) : undefined
    const importedTypeNames = [responseType, pathType, queryType, headersType, bodyType].filter((name) => name !== undefined)
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
        <File.Import name={importedTypeNames} root={file.path} path={fileTs.path} isTypeOnly />
        <File.Import name={['playwrightRequest']} root={file.path} path={resolve(root, '.kubb/playwright.ts')} />
        <File.Import name={['RequestConfig']} root={file.path} path={resolve(root, '.kubb/playwright.ts')} isTypeOnly />
        <Request
          name={resolver.name(node.operationId)}
          node={node}
          responseType={responseType}
          pathType={pathType}
          queryType={queryType}
          headersType={headersType}
          bodyType={bodyType}
          contentType={content?.contentType}
          baseURL={baseURL}
        />
      </File>
    )
  },
})
