import path from 'node:path'
import { getPrimarySuccessResponse } from '@internals/shared'
import { defineGenerator } from '@kubb/core'
import { pluginTsName } from '@kubb/plugin-ts'
import type { ResolverTs } from '@kubb/plugin-ts'
import { File, jsxRendererSync } from '@kubb/renderer-jsx'
import { DateTransformer, type TransformerFn } from '../components/DateTransformer.tsx'
import {
  buildTransformerBody,
  collectDirectDateRefs,
  containsDateField,
  requestUsesFormData,
  resolveTransformerOutput,
  serializeFnName,
  parseFnName,
} from '../dateTransformer.ts'
import type { PluginClient } from '../types.ts'

const helperNames = ['toDate', 'toISO', 'toDateISO', 'toTimeISO'] as const

function usedHelpers(bodies: Array<string>): Array<string> {
  return helperNames.filter((helper) => bodies.some((body) => body.includes(`${helper}(`)))
}

/**
 * Built-in generator for `@kubb/plugin-client` enabled by `coerceDates: true`.
 *
 * Emits one transformer file per named schema (and per operation for inline
 * request/response schemas). Each file exports `parse<Name>` (response:
 * ISO string → Date) and `serialize<Name>` (request: Date → ISO string).
 * Refs delegate to the sibling schema's transformers.
 */
export const dateTransformerGenerator = defineGenerator<PluginClient>({
  name: 'client-date-transformer',
  renderer: jsxRendererSync,
  schema(node, ctx) {
    const { config, root } = ctx
    const { output } = ctx.options

    if (!node.name || !containsDateField(node)) {
      return null
    }

    const pluginTs = ctx.driver.getPlugin(pluginTsName)
    const tsResolver = ctx.driver.getResolver(pluginTsName) as ResolverTs | undefined
    if (!pluginTs || !tsResolver) {
      return null
    }

    const transformerOutput = resolveTransformerOutput(output)
    const typeName = tsResolver.resolveTypeName(node.name)
    const file = tsResolver.resolveFile({ name: node.name, extname: '.ts' }, { root, output: transformerOutput })

    const functions: Array<TransformerFn> = [
      {
        name: parseFnName(typeName),
        body: buildTransformerBody(node, { direction: 'response', refFnName: (name) => parseFnName(tsResolver.resolveTypeName(name)) }),
      },
      {
        name: serializeFnName(typeName),
        body: buildTransformerBody(node, { direction: 'request', refFnName: (name) => serializeFnName(tsResolver.resolveTypeName(name)) }),
      },
    ]

    const bodies = functions.map((fn) => fn.body)
    const helpers = usedHelpers(bodies)
    const datesFile = path.resolve(root, '.kubb/dates.ts')

    const refImports = collectDirectDateRefs(node).map((refName) => {
      const refFile = tsResolver.resolveFile({ name: refName, extname: '.ts' }, { root, output: transformerOutput })
      const refTypeName = tsResolver.resolveTypeName(refName)
      const names = [parseFnName(refTypeName), serializeFnName(refTypeName)].filter((name) => bodies.some((body) => body.includes(`${name}(`)))
      if (names.length === 0) return null
      return <File.Import key={refName} name={names} root={file.path} path={refFile.path} />
    })

    return (
      <File
        baseName={file.baseName}
        path={file.path}
        meta={file.meta}
        banner={ctx.resolver.resolveBanner(ctx.meta, { output, config })}
        footer={ctx.resolver.resolveFooter(ctx.meta, { output, config })}
      >
        {helpers.length > 0 && <File.Import name={helpers} root={file.path} path={datesFile} />}
        {refImports}
        <DateTransformer functions={functions} />
      </File>
    )
  },
  operation(node, ctx) {
    const { config, root } = ctx
    const { output, group } = ctx.options

    const pluginTs = ctx.driver.getPlugin(pluginTsName)
    const tsResolver = ctx.driver.getResolver(pluginTsName) as ResolverTs | undefined
    if (!pluginTs || !tsResolver) {
      return null
    }

    const transformerOutput = resolveTransformerOutput(output)
    const functions: Array<TransformerFn> = []
    const refNames = new Set<string>()

    const requestSchema = node.requestBody?.content?.[0]?.schema
    if (requestSchema && !requestUsesFormData(node) && containsDateField(requestSchema)) {
      functions.push({
        name: serializeFnName(tsResolver.resolveDataName(node)),
        body: buildTransformerBody(requestSchema, { direction: 'request', refFnName: (name) => serializeFnName(tsResolver.resolveTypeName(name)) }),
      })
      for (const refName of collectDirectDateRefs(requestSchema)) refNames.add(refName)
    }

    const primarySuccess = getPrimarySuccessResponse(node)
    if (primarySuccess?.schema && containsDateField(primarySuccess.schema)) {
      functions.push({
        name: parseFnName(tsResolver.resolveResponseStatusName(node, primarySuccess.statusCode)),
        body: buildTransformerBody(primarySuccess.schema, { direction: 'response', refFnName: (name) => parseFnName(tsResolver.resolveTypeName(name)) }),
      })
      for (const refName of collectDirectDateRefs(primarySuccess.schema)) refNames.add(refName)
    }

    if (functions.length === 0) {
      return null
    }

    const file = tsResolver.resolveFile(
      { name: node.operationId, extname: '.ts', tag: node.tags[0] ?? 'default', path: node.path },
      { root, output: transformerOutput, group: group ?? undefined },
    )

    const bodies = functions.map((fn) => fn.body)
    const helpers = usedHelpers(bodies)
    const datesFile = path.resolve(root, '.kubb/dates.ts')

    const refImports = [...refNames].map((refName) => {
      const refFile = tsResolver.resolveFile({ name: refName, extname: '.ts' }, { root, output: transformerOutput })
      const refTypeName = tsResolver.resolveTypeName(refName)
      const names = [parseFnName(refTypeName), serializeFnName(refTypeName)].filter((name) => bodies.some((body) => body.includes(`${name}(`)))
      if (names.length === 0) return null
      return <File.Import key={refName} name={names} root={file.path} path={refFile.path} />
    })

    return (
      <File
        baseName={file.baseName}
        path={file.path}
        meta={file.meta}
        banner={ctx.resolver.resolveBanner(ctx.meta, { output, config })}
        footer={ctx.resolver.resolveFooter(ctx.meta, { output, config })}
      >
        {helpers.length > 0 && <File.Import name={helpers} root={file.path} path={datesFile} />}
        {refImports}
        <DateTransformer functions={functions} />
      </File>
    )
  },
})
