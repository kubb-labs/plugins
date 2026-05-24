import { getOperationParameters, operationFileEntry } from '@internals/shared'
import { defineGenerator } from '@kubb/core'
import { File, jsxRendererSync, Type } from '@kubb/renderer-jsx'
import type { KubbReactNode } from '@kubb/renderer-jsx/types'
import { difference } from 'remeda'
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
  renderer: jsxRendererSync,
  operations(nodes, ctx) {
    const { resolver, config, root } = ctx
    const { output, customOptions, query, mutation, suspense, infinite, group, override } = ctx.options

    if (!customOptions) return null

    const name = resolver.resolveHookOptionsName()
    const resolvedFile = resolver.resolveFile({ name, extname: '.ts' }, { root, output, group: group ?? undefined })
    const hookOptionsFile = {
      ...resolvedFile,
      baseName: `${name}.ts` as const,
      path: resolvedFile.path.replace(/[^/\\]+\.ts$/, `${name}.ts`),
    }

    const imports: Array<KubbReactNode> = []
    const hookOptions: Record<string, string> = {}

    for (const node of nodes) {
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
      const isMutationOp =
        nodeMutation !== false &&
        !isQueryOp &&
        difference(nodeMutation ? nodeMutation.methods : [], nodeQuery ? nodeQuery.methods : []).some((m) => node.method.toLowerCase() === m.toLowerCase())
      const isSuspenseOp = !!suspense
      const isInfiniteOp = !!nodeInfiniteOptions

      if (isQueryOp) {
        const queryOptionsName = resolver.resolveQueryOptionsName(node)
        const queryHookName = resolver.resolveQueryName(node)
        const queryHookFile = resolver.resolveFile(operationFileEntry(node, queryHookName), { root, output, group: group ?? undefined })
        imports.push(<File.Import name={[queryOptionsName]} root={hookOptionsFile.path} path={queryHookFile.path} />)
        hookOptions[queryHookName] = `Partial<ReturnType<typeof ${queryOptionsName}>>`

        if (isSuspenseOp) {
          const suspenseOptionsName = resolver.resolveSuspenseQueryOptionsName(node)
          const suspenseHookName = resolver.resolveSuspenseQueryName(node)
          const suspenseHookFile = resolver.resolveFile(operationFileEntry(node, suspenseHookName), { root, output, group: group ?? undefined })
          imports.push(<File.Import name={[suspenseOptionsName]} root={hookOptionsFile.path} path={suspenseHookFile.path} />)
          hookOptions[suspenseHookName] = `Partial<ReturnType<typeof ${suspenseOptionsName}>>`
        }

        if (isInfiniteOp) {
          // Validate queryParam
          const normalizeKey = (key: string) => key.replace(/\?$/, '')
          const queryParamKeys = getOperationParameters(node).query.map((p) => p.name)
          const hasQueryParam = nodeInfiniteOptions!.queryParam ? queryParamKeys.some((k) => normalizeKey(k) === nodeInfiniteOptions!.queryParam) : false

          if (hasQueryParam) {
            const infiniteOptionsName = resolver.resolveInfiniteQueryOptionsName(node)
            const infiniteHookName = resolver.resolveInfiniteQueryName(node)
            const infiniteHookFile = resolver.resolveFile(operationFileEntry(node, infiniteHookName), { root, output, group: group ?? undefined })
            imports.push(<File.Import name={[infiniteOptionsName]} root={hookOptionsFile.path} path={infiniteHookFile.path} />)
            hookOptions[infiniteHookName] = `Partial<ReturnType<typeof ${infiniteOptionsName}>>`

            if (isSuspenseOp) {
              const suspenseInfiniteOptionsName = resolver.resolveSuspenseInfiniteQueryOptionsName(node)
              const suspenseInfiniteHookName = resolver.resolveSuspenseInfiniteQueryName(node)
              const suspenseInfiniteHookFile = resolver.resolveFile(operationFileEntry(node, suspenseInfiniteHookName), {
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
        const mutationHookFile = resolver.resolveFile(operationFileEntry(node, mutationHookName), { root, output, group: group ?? undefined })
        imports.push(<File.Import name={[mutationOptionsName]} root={hookOptionsFile.path} path={mutationHookFile.path} />)
        hookOptions[mutationHookName] = `Partial<ReturnType<typeof ${mutationOptionsName}>>`
      }
    }

    return (
      <File
        baseName={hookOptionsFile.baseName}
        path={hookOptionsFile.path}
        meta={hookOptionsFile.meta}
        banner={resolver.resolveBanner(ctx.meta, { output, config, file: { path: hookOptionsFile.path, baseName: hookOptionsFile.baseName } })}
        footer={resolver.resolveFooter(ctx.meta, { output, config, file: { path: hookOptionsFile.path, baseName: hookOptionsFile.baseName } })}
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
