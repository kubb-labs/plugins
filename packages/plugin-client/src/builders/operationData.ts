import { getResponseHeadersTypeNames, type OperationTypeNames, type OperationTypeSource } from '@internals/client'
import { getPerContentTypeName, getResponseContentTypeInfo, operationKey, resolveOperationFile, splitEventStream } from '@internals/shared'
import { ast, type Generator } from '@kubb/kit'
import { pluginZodName } from '@kubb/plugin-zod'
import type { ContractClientFactory } from '../types.ts'
import { getOperationSecurity, isAuthRequired, type SecurityRequirement } from './security.ts'
import { buildValidatorHooks, type ValidatorHooks } from './validator.ts'
import { isValidatorEnabled } from './validatorOptions.ts'

export type GeneratorContext = Parameters<NonNullable<Generator<ContractClientFactory>['operations']>>[1]

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
   * The `stream` body property one call of a split JSON-or-stream operation sets.
   */
  stream?: boolean
  /**
   * The media type the JSON call of a split operation asks for, so a server that picks by `Accept` skips the stream.
   */
  accept?: string
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
 * Leaves `stream` out of an options type's body. It distributes over a union of options, such as one per request content
 * type, and over a union body, so each member keeps its own fields. Emitted once in each file that has a split call.
 */
export const omitStreamFieldType =
  "type OmitStreamField<T> = T extends unknown ? { [K in keyof T]: K extends 'body' ? (T[K] extends infer B ? (B extends object ? Omit<B, 'stream'> : B) : never) : T[K] } : never"

function getOperationNames(ctx: GeneratorContext): Set<string> {
  return ctx.memo(`${ctx.plugin.name}:operationNames`, () => {
    const operations = (ctx.driver.inputNode?.operations ?? []).filter(ast.http.isOperation)
    return new Set(operations.map((operation) => ctx.resolver.resolveName({ key: operationKey(operation), name: ctx.resolver.name(operation.operationId) })))
  })
}

/**
 * Resolves the calls one operation generates. A JSON-or-stream operation, whose primary success response offers
 * `text/event-stream` next to another typed content type, gets two: `<name>` without the stream and `<name>Stream` with
 * typed events. Each narrows the responses record to its own variant and asks for its own media type, and sets the
 * `stream` body property when the body has one, so that property is left out of its options type. When another operation
 * already has the `<name>Stream` name, the operation keeps one call and a warning is reported.
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

  const streamName = `${data.name}Stream`
  if (getOperationNames(ctx).has(streamName)) {
    ctx.warn(`Operation "${node.operationId}" offers JSON or an event stream, but "${streamName}" is already an operation name, so it keeps one call.`, {
      help: `Rename one of the two operations so the stream call can be named "${streamName}".`,
    })
    return [data]
  }

  const options = types.response.options(node)
  const responses = types.response.responses(node)
  const status = `'${split.statusCode}'`
  const streamItem = types.contentVariant(node, split.statusCode, split.suffix)
  // One remaining content type is named like the stream variant. Several stay the record's `{ contentType; data }` union.
  const restItem = split.restSuffix ? types.contentVariant(node, split.statusCode, split.restSuffix) : null
  const optionsType = split.selector ? `OmitStreamField<${options}>` : options
  // Each call validates its own variant, since a union of both can parse an event as the JSON body and drop its fields.
  // Only the split status streams, so the stream call always takes its variant. The JSON call keeps the whole success
  // schema when another success status has a body too, since no one generated schema covers both.
  const zodResolver = data.validatorHooks.response ? ctx.driver.getResolver(pluginZodName) : null
  const onlySuccess = ast.http.responses.filterSuccess(node).filter((response) => response.content?.some((entry) => entry.schema)).length === 1
  const variantHooks = (suffix: string | null, isStream: boolean): ValidatorHooks => {
    const hooks = data.validatorHooks
    if (!zodResolver || !hooks.response || !suffix || !(isStream || onlySuccess)) return hooks
    const response = getPerContentTypeName(zodResolver.response.status(node, split.statusCode), suffix)
    return { ...hooks, response, importedZodNames: hooks.importedZodNames.map((name) => (name === hooks.response ? response : name)) }
  }
  const callTypes = (responsesType: string): OperationTypeNames => ({
    response: { options: () => optionsType, responses: () => responsesType, headers: types.response.headers?.bind(types.response) },
  })

  return [
    {
      ...data,
      node: split.rest,
      importedTypeNames: restItem ? [...data.importedTypeNames, restItem] : data.importedTypeNames,
      types: callTypes(
        `Omit<${responses}, ${status}> & { ${status}: ${restItem ?? `Exclude<${responses}[${status}], { contentType: 'text/event-stream' }>`} }`,
      ),
      accept: ast.mediaType.getBase(getResponseContentTypeInfo(split.rest).defaultContentType),
      validatorHooks: variantHooks(split.restSuffix, false),
      stream: split.selector ? false : undefined,
    },
    {
      ...data,
      node: split.stream,
      name: streamName,
      validatorHooks: variantHooks(split.suffix, true),
      types: callTypes(`Omit<${responses}, ${status}> & { ${status}: ${streamItem} }`),
      importedTypeNames: [...data.importedTypeNames, streamItem],
      stream: split.selector ? true : undefined,
    },
  ]
}

declare global {
  namespace Kubb {
    interface MemoRegistry {
      /**
       * The resolved function names of every operation in the document, per client plugin.
       */
      operationNames: Set<string>
    }
  }
}
