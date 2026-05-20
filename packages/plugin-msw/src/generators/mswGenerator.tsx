import { getOperationSuccessResponses, resolveResponseTypes } from '@internals/shared'
import { defineGenerator } from '@kubb/core'
import { pluginFakerName } from '@kubb/plugin-faker'
import { pluginTsName } from '@kubb/plugin-ts'
import { File, jsxRendererSync } from '@kubb/renderer-jsx'
import { Mock, MockWithFaker, Response } from '../components'
import type { PluginMsw } from '../types'
import { resolveFakerMeta } from '../utils.ts'

export const mswGenerator = defineGenerator<PluginMsw>({
  name: 'msw',
  renderer: jsxRendererSync,
  operation(node, ctx) {
    const { driver, resolver, config, root } = ctx
    const { output, parser, baseURL, group } = ctx.options

    const fileName = resolver.resolveName(node.operationId)
    const mock = {
      name: resolver.resolveHandlerName(node),
      file: resolver.resolveFile({ name: fileName, extname: '.ts', tag: node.tags[0] ?? 'default', path: node.path }, { root, output, group }),
    }

    const fakerPlugin = parser === 'faker' ? driver.getPlugin(pluginFakerName) : undefined
    const faker =
      parser === 'faker' && fakerPlugin
        ? resolveFakerMeta(node, {
            root,
            fakerResolver: driver.getResolver(pluginFakerName),
            fakerOutput: fakerPlugin.options?.output ?? output,
            fakerGroup: fakerPlugin.options?.group,
          })
        : undefined

    const pluginTs = driver.getPlugin(pluginTsName)
    if (!pluginTs) return null
    const tsResolver = driver.getResolver(pluginTsName)

    const type = {
      file: tsResolver.resolveFile(
        { name: node.operationId, extname: '.ts', tag: node.tags[0] ?? 'default', path: node.path },
        { root, output: pluginTs.options?.output ?? output, group: pluginTs.options?.group },
      ),
      responseName: tsResolver.resolveResponseName(node),
    }

    const types = resolveResponseTypes(node, tsResolver)
    const successResponses = getOperationSuccessResponses(node)
    const hasSuccessSchema = successResponses.some((response) => !!response.schema)

    const requestName = node.requestBody?.content?.[0]?.schema ? tsResolver.resolveDataName(node) : undefined

    return (
      <File
        baseName={mock.file.baseName}
        path={mock.file.path}
        meta={mock.file.meta}
        banner={resolver.resolveBanner(ctx.meta, { output, config })}
        footer={resolver.resolveFooter(ctx.meta, { output, config })}
      >
        <File.Import name={['http']} path="msw" />
        <File.Import name={['HttpResponseResolver']} isTypeOnly path="msw" />
        <File.Import
          name={Array.from(new Set([type.responseName, ...types.map((t) => t[1]), ...(requestName ? [requestName] : [])]))}
          path={type.file.path}
          root={mock.file.path}
          isTypeOnly
        />
        {parser === 'faker' && faker && <File.Import name={[faker.name]} root={mock.file.path} path={faker.file.path} />}

        {types
          .filter(([code]) => code !== 'default')
          .map(([code, typeName]) => {
            const response = node.responses.find((item) => item.statusCode === String(code))
            if (!response) return null
            return <Response key={typeName} typeName={typeName} response={response} name={mock.name} />
          })}

        {parser === 'faker' && faker && hasSuccessSchema ? (
          <MockWithFaker name={mock.name} typeName={type.responseName} requestTypeName={requestName} fakerName={faker.name} node={node} baseURL={baseURL} />
        ) : (
          <Mock name={mock.name} typeName={type.responseName} requestTypeName={requestName} node={node} baseURL={baseURL} />
        )}
      </File>
    )
  },
})
