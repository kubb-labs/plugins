import { getResponseHeadersTypeNames, type OperationTypeNames, type OperationTypeSource } from '@internals/client'
import { operationKey, resolveOperationFile, splitEventStream } from '@internals/shared'
import { ast, type Generator } from '@kubb/kit'
import { pluginZodName } from '@kubb/plugin-zod'
import type { ContractClientFactory } from '../types.ts'
import { getOperationSecurity, isAuthRequired, type SecurityRequirement } from './security.ts'
import { buildValidatorHooks, type ValidatorHooks } from './validator.ts'
import { isValidatorEnabled } from './validatorOptions.ts'

export type GeneratorContext = Parameters<NonNullable<Generator<ContractClientFactory>['operations']>>[1]

export type StreamSelector = { name: string; value: boolean }

export type OperationData = {
  node: ast.HttpOperationNode
  name: string
  types: OperationTypeNames
  typeFile: ast.FileNode
  /**
   * `null` unless `validator` turns a direction on.
   */
  zodFile: ast.FileNode | null
  validatorHooks: ValidatorHooks
  /**
   * The names of the headers types the result references.
   */
  headerTypeNames: Array<string>
  /**
   * Every type name the call references from the type file.
   */
  importedTypeNames: Array<string>
  /**
   * The request body property one call of a split JSON-or-stream operation sets, such as `{ name: 'stream', value: true }`.
   */
  streamSelector?: StreamSelector
  security?: Array<SecurityRequirement>
  authRequired: boolean
  baseURL?: string
}

/**
 * Resolves what the function and SDK generators both print for one operation: its name, the files its types and zod
 * schemas come from, and its validator hooks, security, base URL and response headers types.
 */
export function resolveOperationData({ node, ctx, types }: { node: ast.HttpOperationNode; ctx: GeneratorContext; types: OperationTypeSource }): OperationData {
  const { driver, resolver, root } = ctx
  const { output, validator, importPath } = ctx.options
  const pluginZod = isValidatorEnabled(validator) ? driver.getPlugin(pluginZodName) : null
  const zodResolver = pluginZod ? driver.getResolver(pluginZodName) : null

  const headerTypeNames = getResponseHeadersTypeNames({ node, types })

  return {
    node,
    name: resolver.resolveName({ key: operationKey(node), name: resolver.name(node.operationId) }),
    types,
    typeFile: resolveOperationFile({ ctx, node, resolver: types.resolver, root, output: types.output ?? output, group: types.group }),
    zodFile:
      zodResolver && pluginZod?.options
        ? resolveOperationFile({
            ctx,
            node,
            resolver: zodResolver,
            root,
            output: pluginZod.options.output ?? output,
            group: pluginZod.options.group ?? undefined,
          })
        : null,
    validatorHooks: buildValidatorHooks({ node, validator, zodResolver }),
    headerTypeNames,
    importedTypeNames: [types.response.options(node), types.response.responses(node), ...headerTypeNames],
    // The fetch and axios clients write `securitySchemes` into `.kubb/client.ts`. A custom client module has none.
    security: getOperationSecurity({ auth: node.auth, schemes: ctx.meta.auth, hoist: importPath === undefined }),
    authRequired: ctx.options.auth.mode === 'required' && isAuthRequired({ auth: node.auth, schemes: ctx.meta.auth }),
    baseURL: ast.http.getBaseURL(
      ast.server.get({ servers: node.servers, index: (ctx.adapter.options as { server?: { index?: number } } | undefined)?.server?.index }),
    ),
  }
}

/**
 * Resolves the calls one operation generates. A JSON-or-stream operation, whose primary success response offers
 * `text/event-stream` next to another typed content type, gets two: `<name>` without the stream and `<name>Stream` with
 * typed events. Each narrows the responses record to its own variant, and sets the `stream` body property when the body
 * has one, so that property is left out of its options type.
 */
export function resolveOperationCalls({
  node,
  ctx,
  types,
}: {
  node: ast.HttpOperationNode
  ctx: GeneratorContext
  types: OperationTypeSource
}): Array<OperationData> {
  const data = resolveOperationData({ node, ctx, types })
  const split = splitEventStream(node)
  if (!split) return [data]

  const options = types.response.options(node)
  const responses = types.response.responses(node)
  const status = `'${split.statusCode}'`
  const streamItem = types.contentVariant(node, split.statusCode, split.suffix)
  // One remaining content type is named like the stream variant. Several stay the record's `{ contentType; data }` union.
  const restItem = split.restSuffix
    ? types.contentVariant(node, split.statusCode, split.restSuffix)
    : `Exclude<${responses}[${status}], { contentType: 'text/event-stream' }>`
  const optionsType = split.selector
    ? `Omit<${options}, 'body'> & { body${node.requestBody?.required ? '' : '?'}: Omit<NonNullable<${options}['body']>, '${split.selector}'> }`
    : options
  const callTypes = (responsesType: string): OperationTypeNames => ({
    response: { options: () => optionsType, responses: () => responsesType, headers: types.response.headers?.bind(types.response) },
  })
  const selector = (value: boolean) => (split.selector ? { name: split.selector, value } : undefined)

  return [
    {
      ...data,
      node: split.rest,
      importedTypeNames: split.restSuffix ? [...data.importedTypeNames, restItem] : data.importedTypeNames,
      types: callTypes(`Omit<${responses}, ${status}> & { ${status}: ${restItem} }`),
      streamSelector: selector(false),
    },
    {
      ...data,
      node: split.stream,
      name: `${data.name}Stream`,
      types: callTypes(`Omit<${responses}, ${status}> & { ${status}: ${streamItem} }`),
      importedTypeNames: [...data.importedTypeNames, streamItem],
      streamSelector: selector(true),
    },
  ]
}
