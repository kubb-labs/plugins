/**
 * Resolves which plugin a consumer (react-query, vue-query, swr, fetch, axios, msw, mcp, cypress,
 * faker) sources its type names from, shared so the selection rules and diagnostics stay in one
 * place.
 *
 * A consumer imports its `Options` type from a registered type-source plugin instead of building one
 * itself:
 *
 * - `plugin-ts` — the default type source. Its resolver's `response.options(node)` names a real
 *   `type` declaration.
 * - `plugin-zod` — an alternative type source, but only when it has `inferred: true`. Its
 *   resolver's `response.options(node)` names a `z.infer<>` alias instead of a bare type.
 *
 * The `typeSource` string selects explicitly (`'ts'` / `'zod'`); when it is unset, a registered
 * `plugin-ts` wins even if `plugin-zod` is also registered, so adding zod-as-source support never
 * changes output for a project that already has both. `plugin-zod` is picked up automatically only
 * when `plugin-ts` is absent.
 */

const pluginTsName = 'plugin-ts'
const pluginZodName = 'plugin-zod'

/**
 * The type-source selector accepted by a consumer's `typeSource` option.
 */
export type TypeSourceSelector = 'ts' | 'zod'

/**
 * The resolved type-source strategy stored in a consumer plugin's options: the generated code
 * always imports its `Options` type from this registered plugin.
 */
export type ResolvedTypeSource = { kind: TypeSourceSelector; pluginName: string }

/**
 * The outcome of {@link resolveTypeSourcePlugin}.
 *
 * - `ts` / `zod` name the plugin whose resolver the consumer sources type names from.
 * - `error` carries a setup diagnostic.
 */
export type ResolveTypeSourceResult = ResolvedTypeSource | { kind: 'error'; message: string }

type TypeSourceCandidate = { name?: string; options?: { inferred?: boolean } }

/**
 * Applies the `typeSource` resolution rules. See the module comment for the strategy shape.
 *
 * @example
 * ```ts
 * resolveTypeSourcePlugin({ typeSource: undefined, plugins: [{ name: 'plugin-ts' }, { name: 'plugin-zod', options: { inferred: true } }] })
 * // { kind: 'ts', pluginName: 'plugin-ts' }
 * ```
 *
 * @example
 * ```ts
 * resolveTypeSourcePlugin({ typeSource: undefined, plugins: [{ name: 'plugin-zod', options: { inferred: true } }] })
 * // { kind: 'zod', pluginName: 'plugin-zod' }
 * ```
 */
export function resolveTypeSourcePlugin(options: {
  typeSource: TypeSourceSelector | undefined
  plugins: ReadonlyArray<TypeSourceCandidate>
}): ResolveTypeSourceResult {
  const { typeSource, plugins } = options
  const tsPlugin = plugins.find((plugin) => plugin.name === pluginTsName)
  const zodPlugin = plugins.find((plugin) => plugin.name === pluginZodName && plugin.options?.inferred === true)

  if (typeSource === 'ts') {
    if (!tsPlugin) {
      return {
        kind: 'error',
        message: "`typeSource: 'ts'` is set but `@kubb/plugin-ts` is not registered in `plugins`. Add it, or drop `typeSource` to use a different type source.",
      }
    }
    return { kind: 'ts', pluginName: pluginTsName }
  }

  if (typeSource === 'zod') {
    if (!zodPlugin) {
      return {
        kind: 'error',
        message:
          "`typeSource: 'zod'` is set but `@kubb/plugin-zod` is not registered with `inferred: true` in `plugins`. Add it with `inferred: true`, or drop `typeSource` to use a different type source.",
      }
    }
    return { kind: 'zod', pluginName: pluginZodName }
  }

  // `typeSource` unset: `plugin-ts` wins when registered, even alongside `plugin-zod`, so existing
  // projects keep today's output. `plugin-zod` only auto-activates when `plugin-ts` is absent.
  if (tsPlugin) {
    return { kind: 'ts', pluginName: pluginTsName }
  }
  if (zodPlugin) {
    return { kind: 'zod', pluginName: pluginZodName }
  }

  return {
    kind: 'error',
    message:
      'No type source is registered. Add `@kubb/plugin-ts`, or `@kubb/plugin-zod` with `inferred: true`, to `plugins` so the generated code has a type to import.',
  }
}

/**
 * Resolves the type source during a consumer plugin's setup hook. Extracts the plugin names and
 * options from the raw `plugins` config, applies {@link resolveTypeSourcePlugin}, and throws the
 * diagnostic on a misconfiguration so every consumer fails fast with the same message instead of
 * silently generating no files.
 */
export function resolveTypeSource(options: { typeSource: TypeSourceSelector | undefined; plugins?: ReadonlyArray<unknown> }): ResolvedTypeSource {
  const { typeSource, plugins = [] } = options
  const candidates = plugins as ReadonlyArray<TypeSourceCandidate>
  const resolved = resolveTypeSourcePlugin({ typeSource, plugins: candidates })
  if (resolved.kind === 'error') {
    throw new Error(resolved.message)
  }
  return resolved
}
