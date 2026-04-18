import { defineGenerator } from '@kubb/core'
import { type PluginFaker, pluginFakerName } from '@kubb/plugin-faker'
import { type PluginTs, pluginTsName } from '@kubb/plugin-ts'
import { File, jsxRenderer } from '@kubb/renderer-jsx'
import { Mock, MockWithFaker, Response } from '../components'
import type { PluginMsw } from '../types'
import { getResponseTypes, getSuccessResponses, resolveFakerMeta, transformName } from '../utils.ts'

export const mswGenerator = defineGenerator<PluginMsw>({
  name: 'msw',
  renderer: jsxRenderer,
  operation(node, ctx) {
    const { driver, resolver, config, root, adapter } = ctx
    const { output, parser, baseURL, group, transformers } = ctx.options

    const fileName = resolver.resolveName(node.operationId)
    const mock = {
      name: transformName(fileName, 'function', transformers),
      file: resolver.resolveFile({ name: fileName, extname: '.ts', tag: node.tags[0] ?? 'default', path: node.path }, { root, output, group }),
    }

    const fakerPlugin = (parser === 'faker' ? driver.getPlugin(pluginFakerName) : undefined)
    const faker =
      parser === 'faker' && fakerPlugin
        ? resolveFakerMeta(node, {
            root,
            fakerResolver: fakerPlugin.resolver,
            fakerOutput: fakerPlugin.options?.output ?? {},
            fakerGroup: fakerPlugin.options?.group,
          })
        : undefined

    const pluginTs = driver.getPlugin(pluginTsName)
    if (!pluginTs) return null
    const tsResolver = pluginTs.resolver

    const type = {
      file: tsResolver.resolveFile(
        { name: node.operationId, extname: '.ts', tag: node.tags[0] ?? 'default', path: node.path },
        { root, output: pluginTs.options?.output ?? output, group: pluginTs.options?.group },
      ),
      responseName: tsResolver.resolveResponseName(node),
    }

    const types = getResponseTypes(node, tsResolver)
    const successResponses = getSuccessResponses(node)
    const hasSuccessSchema = successResponses.some((response) => !!response.schema)

    return (
      <File
        baseName={mock.file.baseName}
        path={mock.file.path}
        meta={mock.file.meta}
        banner={resolver.resolveBanner(adapter.inputNode, { output, config })}
        footer={resolver.resolveFooter(adapter.inputNode, { output, config })}
      >
        <File.Import name={['http']} path="msw" />
        <File.Import name={['ResponseResolver']} isTypeOnly path="msw" />
        <File.Import name={Array.from(new Set([type.responseName, ...types.map((t) => t[1])]))} path={type.file.path} root={mock.file.path} isTypeOnly />
        {parser === 'faker' && faker && <File.Import name={[faker.name]} root={mock.file.path} path={faker.file.path} />}

        {types
          .filter(([code]) => code !== 'default')
          .map(([code, typeName]) => {
            const response = node.responses.find((item) => item.statusCode === String(code))
            if (!response) return null
            return <Response typeName={typeName} response={response} name={mock.name} />
          })}

        {parser === 'faker' && faker && hasSuccessSchema ? (
          <MockWithFaker name={mock.name} typeName={type.responseName} fakerName={faker.name} node={node} baseURL={baseURL} />
        ) : (
          <Mock name={mock.name} typeName={type.responseName} node={node} baseURL={baseURL} />
        )}
      </File>
    )
  },
})
