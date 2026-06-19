import path from 'node:path'
import { ast, defineGenerator } from '@kubb/core'
import type { PluginClient } from '@kubb/plugin-client'
import { Client } from '@kubb/plugin-client'
import { pluginTsName } from '@kubb/plugin-ts'
import { File, jsxRenderer } from '@kubb/renderer-jsx'

const toURL = (path: string) => path.replaceAll('{', ':').replaceAll('}', '')

export const clientStaticGenerator = defineGenerator<PluginClient>({
  name: 'client',
  renderer: jsxRenderer,
  operation(node, ctx) {
    if (!ast.isHttpOperationNode(node)) return null
    const { config, driver, resolver } = ctx
    const { output, importPath, dataReturnType, pathParamsType, paramsType, paramsCasing, parser } = ctx.options
    const baseURL = ctx.meta.baseURL

    const pluginTs = driver.getPlugin(pluginTsName)
    if (!pluginTs) return null

    const tsResolver = driver.getResolver(pluginTsName)
    const root = path.resolve(config.root, config.output.path)

    const transformedNode = node
    const name = resolver.resolveName(transformedNode.operationId)

    const clientFile = resolver.resolveFile(
      { name: transformedNode.operationId, extname: '.ts', tag: transformedNode.tags[0] ?? 'default', path: transformedNode.path },
      { root, output, group: ctx.options.group ?? undefined },
    )

    const typeFile = tsResolver.resolveFile(
      { name: transformedNode.operationId, extname: '.ts', tag: transformedNode.tags[0] ?? 'default', path: transformedNode.path },
      { root, output: pluginTs.options?.output ?? output, group: pluginTs.options?.group ?? undefined },
    )

    const requestName = transformedNode.requestBody?.content?.[0]?.schema ? tsResolver.resolveDataName(transformedNode) : null
    const responseName = tsResolver.resolveResponseName(transformedNode)
    const pathParamsName =
      transformedNode.parameters.filter((p) => p.in === 'path').length > 0
        ? tsResolver.resolvePathParamsName(transformedNode, transformedNode.parameters.filter((p) => p.in === 'path')[0]!)
        : null
    const queryParamsName =
      transformedNode.parameters.filter((p) => p.in === 'query').length > 0
        ? tsResolver.resolveQueryParamsName(transformedNode, transformedNode.parameters.filter((p) => p.in === 'query')[0]!)
        : null
    const headerParamsName =
      transformedNode.parameters.filter((p) => p.in === 'header').length > 0
        ? tsResolver.resolveHeaderParamsName(transformedNode, transformedNode.parameters.filter((p) => p.in === 'header')[0]!)
        : null

    const errorTypeNames = transformedNode.responses
      .filter((r) => {
        const code = Number.parseInt(r.statusCode, 10)
        return code >= 400 || r.statusCode === 'default'
      })
      .map((r) => tsResolver.resolveResponseStatusName(transformedNode, r.statusCode))
      .filter(Boolean) as Array<string>

    const successTypeNames = transformedNode.responses
      .filter((r) => {
        const code = Number.parseInt(r.statusCode, 10)
        return code >= 200 && code < 300
      })
      .map((r) => tsResolver.resolveResponseStatusName(transformedNode, r.statusCode))
      .filter(Boolean) as Array<string>

    const typeImportNames = [requestName, responseName, pathParamsName, queryParamsName, headerParamsName, ...errorTypeNames, ...successTypeNames].filter(
      Boolean,
    ) as Array<string>

    const banner = resolver.resolveBanner(ctx.meta, { output, config })
    const footer = resolver.resolveFooter(ctx.meta, { output, config })

    return (
      <File baseName={clientFile.baseName} path={clientFile.path} meta={clientFile.meta} banner={banner} footer={footer}>
        {importPath ? (
          <>
            <File.Import name={'client'} path={importPath} />
            <File.Import name={['Client', 'RequestConfig', 'ResponseErrorConfig']} path={importPath} isTypeOnly />
          </>
        ) : (
          <>
            <File.Import name={['client']} root={clientFile.path} path={path.resolve(config.root, config.output.path, '.kubb/client.ts')} />
            <File.Import
              name={['Client', 'RequestConfig', 'ResponseErrorConfig']}
              root={clientFile.path}
              path={path.resolve(config.root, config.output.path, '.kubb/client.ts')}
              isTypeOnly
            />
          </>
        )}

        <File.Import name={typeImportNames} root={clientFile.path} path={typeFile.path} isTypeOnly />

        <Client
          name={name}
          baseURL={baseURL}
          dataReturnType={dataReturnType}
          pathParamsType={pathParamsType}
          paramsType={paramsType}
          paramsCasing={paramsCasing}
          node={transformedNode}
          tsResolver={tsResolver}
          parser={parser}
          zodResolver={null}
        />
        <File.Source>
          {`${name}.method = "${transformedNode.method}" as const
${name}.url = "${toURL(transformedNode.path)}" as const
${name}.operationId = "${name}" as const
${name}.request = {} as ${requestName || 'never'}
${name}.response = {} as ${responseName || 'never'}
${name}.pathParams = {} as ${pathParamsName || 'never'}
${name}.queryParams = {} as ${queryParamsName || 'never'}`}
        </File.Source>
      </File>
    )
  },
})
