import { getOperationParameters, operationFileEntry } from '@internals/shared'
import { ast, defineGenerator } from 'kubb/kit'
import { File, jsxRenderer, Type } from 'kubb/jsx'
import type { KubbReactNode } from 'kubb/jsx'
import type { PluginReactQuery } from '../types'
import { resolveOperationOverrides } from '../utils.ts'

type QueryOption = PluginReactQuery['resolvedOptions']['query']
type MutationOption = PluginReactQuery['resolvedOptions']['mutation']

/**
 * Emits the `HookOptions` type used by `customOptions`. Enabled when
 * `pluginReactQuery({ customOptions: { ... } })`. The generated type lists
 * every hook keyed by name so user-supplied options stay in sync with the
 * generated hooks at compile time.
 */
export const hookOptionsGenerator = defineGenerator<PluginReactQuery>({
  name: 'react-query-hook-options',
  renderer: jsxRenderer,
  operations(nodes, ctx) {
    const { resolver, config, root } = ctx
    const { output, customOptions, query, mutation, suspense, infinite, group, override, hooks } = ctx.options

    if (!customOptions || !hooks) return null

    const name = resolver.resolveHookOptionsName()
    const resolvedFile = resolver.core.file({ name, extname: '.ts' }, { root, output, group: group ?? undefined })
    const hookOptionsFile = {
      ...resolvedFile,
      baseName: `${name}.ts` as const,
      path: resolvedFile.path.replace(/[^/\\]+\.ts$/, `${name}.ts`),
    }

    const imports: Array<KubbReactNode> = []
    const hookOptions: Record<string, string> = {}

    for (const node of nodes) {
      if (!ast.isHttpOperationNode(node)) continue
      const opOverrides = resolveOperationOverrides(node, override)
      const nodeQuery: QueryOption = 'query' in opOverrides ? (opOverrides.query as QueryOption) : query
      const nodeMutation: MutationOption = 'mutation' in opOverrides ? (opOverrides.mutation as MutationOption) : mutation
      const nodeInfinite = 'infinite' in opOverrides ? opOverrides.infinite : infinite
      const nodeInfiniteOptions = nodeInfinite && typeof nodeInfinite === 'object' ? nodeInfinite : null

      // query: false means "still a query but skip the useQuery hook"
      const isQueryOp =
        nodeQuery === false
          ? !!query && query.methods.some((m) => node.method.toLowerCase() === m.toLowerCase())
          : !!nodeQuery && nodeQuery.methods.some((m) => node.method.toLowerCase() === m.toLowerCase())
      const nodeQueryMethods = new Set(nodeQuery ? nodeQuery.methods : [])
      const isMutationOp =
        nodeMutation !== false &&
        !isQueryOp &&
        (nodeMutation ? nodeMutation.methods : []).some((m) => !nodeQueryMethods.has(m) && node.method.toLowerCase() === m.toLowerCase())
      const isSuspenseOp = !!suspense
      const isInfiniteOp = !!nodeInfiniteOptions

      if (isQueryOp) {
        const queryOptionsName = resolver.resolveQueryOptionsName(node)
        const queryHookName = resolver.resolveQueryName(node)
        const queryHookFile = resolver.core.file(operationFileEntry(node, queryHookName), { root, output, group: group ?? undefined })
        imports.push(<File.Import name={[queryOptionsName]} root={hookOptionsFile.path} path={queryHookFile.path} />)
        hookOptions[queryHookName] = `Partial<ReturnType<typeof ${queryOptionsName}>>`

        if (isSuspenseOp) {
          const suspenseOptionsName = resolver.resolveSuspenseQueryOptionsName(node)
          const suspenseHookName = resolver.resolveSuspenseQueryName(node)
          const suspenseHookFile = resolver.core.file(operationFileEntry(node, suspenseHookName), { root, output, group: group ?? undefined })
          imports.push(<File.Import name={[suspenseOptionsName]} root={hookOptionsFile.path} path={suspenseHookFile.path} />)
          hookOptions[suspenseHookName] = `Partial<ReturnType<typeof ${suspenseOptionsName}>>`
        }

        if (isInfiniteOp) {
          // Validate queryParam
          const normalizeKey = (key: string) => key.replace(/\?$/, '')
          const queryParamKeys = getOperationParameters(node, { paramsCasing: 'original' }).query.map((p) => p.name)
          const hasQueryParam = nodeInfiniteOptions!.queryParam ? queryParamKeys.some((k) => normalizeKey(k) === nodeInfiniteOptions!.queryParam) : false

          if (hasQueryParam) {
            const infiniteOptionsName = resolver.resolveInfiniteQueryOptionsName(node)
            const infiniteHookName = resolver.resolveInfiniteQueryName(node)
            const infiniteHookFile = resolver.core.file(operationFileEntry(node, infiniteHookName), { root, output, group: group ?? undefined })
            imports.push(<File.Import name={[infiniteOptionsName]} root={hookOptionsFile.path} path={infiniteHookFile.path} />)
            hookOptions[infiniteHookName] = `Partial<ReturnType<typeof ${infiniteOptionsName}>>`

            if (isSuspenseOp) {
              const suspenseInfiniteOptionsName = resolver.resolveSuspenseInfiniteQueryOptionsName(node)
              const suspenseInfiniteHookName = resolver.resolveSuspenseInfiniteQueryName(node)
              const suspenseInfiniteHookFile = resolver.core.file(operationFileEntry(node, suspenseInfiniteHookName), {
                root,
                output,
                group: group ?? undefined,
              })
              imports.push(<File.Import name={[suspenseInfiniteOptionsName]} root={hookOptionsFile.path} path={suspenseInfiniteHookFile.path} />)
              hookOptions[suspenseInfiniteHookName] = `Partial<ReturnType<typeof ${suspenseInfiniteOptionsName}>>`
            }
          }
        }
      }

      if (isMutationOp) {
        const mutationOptionsName = resolver.resolveMutationOptionsName(node)
        const mutationHookName = resolver.resolveMutationName(node)
        const mutationHookFile = resolver.core.file(operationFileEntry(node, mutationHookName), { root, output, group: group ?? undefined })
        imports.push(<File.Import name={[mutationOptionsName]} root={hookOptionsFile.path} path={mutationHookFile.path} />)
        hookOptions[mutationHookName] = `Partial<ReturnType<typeof ${mutationOptionsName}>>`
      }
    }

    return (
      <File
        baseName={hookOptionsFile.baseName}
        path={hookOptionsFile.path}
        meta={hookOptionsFile.meta}
        banner={resolver.core.banner(ctx.meta, { output, config, file: { path: hookOptionsFile.path, baseName: hookOptionsFile.baseName } })}
        footer={resolver.core.footer(ctx.meta, { output, config, file: { path: hookOptionsFile.path, baseName: hookOptionsFile.baseName } })}
      >
        {imports}
        <File.Source name={name} isExportable isIndexable isTypeOnly>
          <Type export name={name}>
            {`{ ${Object.keys(hookOptions)
              .map((key) => `${JSON.stringify(key)}: ${hookOptions[key]}`)
              .join(', ')} }`}
          </Type>
        </File.Source>
      </File>
    )
  },
})
