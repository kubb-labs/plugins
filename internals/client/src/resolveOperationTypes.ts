import { type ast, Diagnostics, type Generator, type Group, type Output, type Resolver } from 'kubb/kit'
import { pluginTsName, type ResolverTs } from '@kubb/plugin-ts'
import { pluginZodName, type ResolverZod } from '@kubb/plugin-zod'
import type { ContractClientFactory } from './types.ts'

type GeneratorDriver = Parameters<NonNullable<Generator<ContractClientFactory>['operations']>>[1]['driver']

/**
 * The two per-operation type names a generated client references: the grouped input and the
 * per-status responses record its `RequestResult` is keyed on.
 */
export type OperationTypeNames = {
  response: {
    /**
     * Resolves the name of the operation's grouped `{ body, path, query, headers }` input type.
     */
    options(node: ast.OperationNode): string
    /**
     * Resolves the name of the operation's per-status responses record type.
     */
    responses(node: ast.OperationNode): string
  }
}

/**
 * Where a generated client sources its operation types, plus the resolver and output the file
 * declaring them is resolved with.
 */
export type OperationTypeSource = OperationTypeNames & {
  /**
   * Resolver of the plugin supplying the names, used to resolve the file they are exported from.
   */
  resolver: Pick<Resolver, 'file' | 'pluginName'>
  /**
   * The supplying plugin's own `output`, when it configured one.
   */
  output: Output | undefined
  /**
   * The supplying plugin's own `group`, when it configured one.
   */
  group: Group | undefined
}

/**
 * A `plugin-ts` shaped resolver whose operation type names point at the types `pluginZod({ inferred })`
 * exports next to each schema, so code written against `plugin-ts` names picks up the zod types.
 */
function toZodTypeResolver(resolver: ResolverZod): ResolverTs {
  const type = (name: string) => resolver.schema.type(name)

  return {
    ...resolver,
    // A class method, so a spread drops it, and it reads private fields, so it must run on `resolver`.
    file: resolver.file.bind(resolver),
    param: {
      name: (node: ast.OperationNode, p: ast.ParameterNode) => type(resolver.param.name(node, p)),
      path: (node: ast.OperationNode, p: ast.ParameterNode) => type(resolver.param.path(node, p)),
      query: (node: ast.OperationNode, p: ast.ParameterNode) => type(resolver.param.query(node, p)),
      headers: (node: ast.OperationNode, p: ast.ParameterNode) => type(resolver.param.headers(node, p)),
    },
    response: {
      body: (node: ast.OperationNode) => type(resolver.response.body(node)),
      status: (node: ast.OperationNode, statusCode: ast.StatusCode) => type(resolver.response.status(node, statusCode)),
      response: (node: ast.OperationNode) => type(resolver.response.response(node)),
      responses: (node: ast.OperationNode) => type(resolver.response.responses(node)),
      options: (node: ast.OperationNode) => resolver.response.options(node),
    },
  } as unknown as ResolverTs
}

/**
 * The resolver, `output`, and `group` a generated hook names its operation types with.
 *
 * `pluginZod({ inferred: 'codec' })` wins over `plugin-ts`: its request types read `z.input` and its
 * response types `z.output`, so a codec param takes its domain value. Otherwise `plugin-ts` supplies them,
 * and without it any `pluginZod({ inferred })` does. Throws `KUBB_MISSING_DEPENDENCY` for `pluginName`
 * when neither is available.
 */
export function resolveTypeResolver(
  driver: GeneratorDriver,
  pluginName: string,
): { resolver: ResolverTs; output: Output | undefined; group: Group | null | undefined } {
  const pluginTs = driver.getPlugin(pluginTsName)
  const pluginZod = driver.getPlugin(pluginZodName)

  if (pluginTs && pluginZod?.options?.inferred !== 'codec') {
    return { resolver: driver.getResolver(pluginTsName), output: pluginTs.options?.output, group: pluginTs.options?.group }
  }

  if (!pluginZod?.options?.inferred) {
    throw missingTypeSource(pluginName)
  }

  return { resolver: toZodTypeResolver(driver.getResolver(pluginZodName)), output: pluginZod.options.output, group: pluginZod.options.group }
}

function missingTypeSource(pluginName: string) {
  return new Diagnostics.Error({
    code: Diagnostics.code.missingDependency,
    severity: 'error',
    message: `Plugin "${pluginName}" has no source for operation types.`,
    help: `Add \`pluginTs()\` before "${pluginName}", or add \`pluginZod({ inferred: true })\`.`,
    location: { kind: 'config' },
    plugin: pluginName,
  })
}

/**
 * Picks the plugin a generated client takes its `Options` and `Responses` types from.
 *
 * `pluginZod({ inferred: 'codec' })` wins, so a codec param takes its domain value (see
 * {@link resolveTypeResolver}). Otherwise `plugin-ts` wins whenever it is in the pipeline, so existing
 * configs keep the types they generate today. Without it, `pluginZod({ inferred: true })` takes over:
 * its inferred options and responses types are built from the same shared schemas as the `plugin-ts`
 * ones. Throws `KUBB_MISSING_DEPENDENCY` for `pluginName` when neither is available, since the client
 * has nothing to type against.
 *
 * @example
 * ```ts
 * const types = resolveOperationTypes(ctx.driver, ctx.plugin.name)
 * types.response.options(node) // 'GetPetByIdOptions', or 'GetPetByIdOptionsSchemaType' from zod
 * ```
 */
export function resolveOperationTypes(driver: GeneratorDriver, pluginName: string): OperationTypeSource {
  const { resolver, output, group } = resolveTypeResolver(driver, pluginName)

  return { response: resolver.response, resolver, output, group: group ?? undefined }
}
