import type { ast } from '@internals/ast'
import path from 'node:path'
import { operationKey, useKubb } from '@kubb/kit'
import type { Exclude, TemplateContext, Include, Override } from '@kubb/kit'
import { pluginClientName } from './resolveClient.ts'

/**
 * Shape of the value a generated operation function resolves to.
 * - `'full'`: the complete `{ status, data, error, contentType, request, response }` result.
 * - `'data'`: the bare success body when `throwOnError` is true, or the full result when it is false
 *   so callers can inspect `error`.
 * - `'plain'`: the client's own promise typed as `RequestResult`, with no `withUnwrap` / `unwrapResult`
 *   helper. Backs `@kubb/plugin-client`.
 */
export type ReturnTypeOption = 'full' | 'data' | 'plain'

/**
 * The resolved contract `<op>` for one operation: the generated function name, the file it lives in,
 * the client module path (where `RequestConfig` / `ResponseErrorConfig` come from), and the
 * registered client plugin's `returnType`.
 *
 * `clientPath` is the absolute `.kubb/client.ts` path for plugin-fetch, plugin-axios and plugin-ky, or
 * plugin-client's `importPath`: a relative one is resolved against the `<op>` file to an absolute
 * path, a package name or alias is kept verbatim. `clientPathIsFile` tells a consumer whether to
 * make it relative to the importing file.
 */
export type ClientOperation = {
  /** The local name a consumer calls. `moduleName` imports it, under an alias when a consumer binding would shadow the export. */
  name: string
  moduleName: ast.ModuleName
  path: string
  clientPath: string
  clientPathIsFile: boolean
  returnType: ReturnTypeOption
  /**
   * Whether the client's results carry the declared response headers. A custom `importPath` client keeps untyped headers.
   */
  typedHeaders: boolean
}

/**
 * The client plugin options a dependent reads, including the filters that scope them per operation.
 */
type ClientPluginOptions = {
  returnType?: ReturnTypeOption
  importPath?: string
  exclude?: Array<Exclude>
  include?: Array<Include>
  override?: Array<Override<Omit<ClientPluginOptions, 'override'>>>
}

// Names the hook and MCP handler bodies bind around the client call, which would shadow an operation of the same name.
const consumerBindings = new Set([
  'path',
  'query',
  'body',
  'headers',
  'cookies',
  'config',
  'signal',
  'variables',
  'options',
  'ctx',
  'res',
  'pageParam',
  'queryKey',
  'mutationKey',
  'withQueryKey',
])

function isRelativeImport(importPath: string): boolean {
  return importPath.startsWith('.')
}

// plugin-client resolves a relative `importPath` from its `<op>` file, so do the same here.
function resolveImportPath(options: { importPath: string; operationFile: string }): string {
  const { importPath, operationFile } = options
  return isRelativeImport(importPath) ? path.resolve(path.dirname(operationFile), importPath) : importPath
}

export type ResolveClientOperationOptions = { node: ast.OperationNode; pluginName: string }

/**
 * Resolves the contract client `<op>` a consumer (query hook, MCP handler) imports, from the registered contract client plugin
 * (plugin-fetch, plugin-axios, plugin-ky, or plugin-client). Returns `null` when the client plugin's `exclude` / `include` leaves this
 * operation out, since it then emits no `<op>` to import. plugin-fetch, plugin-axios and plugin-ky inject `.kubb/client.ts` at the global
 * output root, the same path consumers read `RequestConfig` / `ResponseErrorConfig` from. With plugin-client they come from
 * the user's `importPath` module instead.
 *
 * Call it from a generator. The result is cached in `ctx.memo` per client plugin and operation, so the query, mutation and
 * MCP generators share it. `returnType` and `importPath` come from the client plugin's options after its `override` entries,
 * and `ctx.file()` finds its file, so a dependent's call and import match the `<op>` actually emitted.
 * Throws `KUBB_PLUGIN_NOT_FOUND` when `pluginName` is not in the config.
 */
export function resolveClientOperation({ node, pluginName }: ResolveClientOperationOptions): ClientOperation | null {
  const ctx = useKubb<TemplateContext>()

  return ctx.memo(`${pluginName}:clientOperation:${node.operationId}`, () => {
    const resolver = ctx.getResolver(pluginName)
    const pluginOptions = (ctx.requirePlugin(pluginName).options ?? {}) as ClientPluginOptions
    const { exclude, include, override } = pluginOptions
    const operationOptions = resolver.default.options(node, { options: pluginOptions, exclude, include, override })
    if (!operationOptions) return null

    const importName = resolver.resolveName({ key: operationKey(node), name: resolver.name(node.operationId) })
    const name = consumerBindings.has(importName) ? `${importName}Request` : importName
    const file = ctx.file(node, { plugin: pluginName })
    const { importPath } = operationOptions

    return {
      name,
      moduleName: { name: importName, alias: name === importName ? undefined : name, space: 'value' as const },
      path: file.path,
      clientPath: importPath === undefined ? path.resolve(ctx.root, '.kubb/client.ts') : resolveImportPath({ importPath, operationFile: file.path }),
      clientPathIsFile: importPath === undefined || isRelativeImport(importPath),
      returnType: operationOptions.returnType ?? 'full',
      // Only a custom `@kubb/plugin-client` module lacks the typed-headers result; the transports re-export the runtime.
      typedHeaders: importPath === undefined || pluginName !== pluginClientName,
    }
  })
}
