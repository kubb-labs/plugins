import { defineGenerator } from '@kubb/core'
import { File, jsxRenderer, Type } from '@kubb/renderer-jsx'
import type { KubbReactNode } from '@kubb/renderer-jsx/types'
import { difference } from 'remeda'
import type { PluginReactQuery } from '../types'
import { resolveOperationOverrides, transformName } from '../utils.ts'

type QueryOption = PluginReactQuery['resolvedOptions']['query']
type MutationOption = PluginReactQuery['resolvedOptions']['mutation']

export const hookOptionsGenerator = defineGenerator<PluginReactQuery>({
  name: 'react-query-hook-options',
  renderer: jsxRenderer,
  operations(nodes, ctx) {
    const { resolver, config, root, adapter } = ctx
    const { output, customOptions, query, mutation, suspense, infinite, group, transformers, override } = ctx.options

    if (!customOptions) return null

    const resolvedFile = resolver.resolveFile({ name: 'HookOptions', extname: '.ts' }, { root, output, group })
    const hookOptionsFile = {
      ...resolvedFile,
      baseName: 'HookOptions.ts' as const,
      path: resolvedFile.path.replace(/hookOptions\.ts$/, 'HookOptions.ts'),
    }

    const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

    const imports: KubbReactNode[] = []
    const hookOptions: Record<string, string> = {}

    for (const node of nodes) {
      const baseName = resolver.resolveName(node.operationId)
      const opOverrides = resolveOperationOverrides(node, override)
      const nodeQuery: QueryOption = 'query' in opOverrides ? (opOverrides.query as QueryOption) : query
      const nodeMutation: MutationOption = 'mutation' in opOverrides ? (opOverrides.mutation as MutationOption) : mutation
      const nodeInfinite = 'infinite' in opOverrides ? opOverrides.infinite : infinite
      const nodeInfiniteOptions = nodeInfinite && typeof nodeInfinite === 'object' ? nodeInfinite : undefined

      // v4 compat: query: false means "still a query but skip the useQuery hook"
      const isQueryOp =
        nodeQuery === false
          ? !!query && query.methods.some((m) => node.method.toLowerCase() === m.toLowerCase())
          : !!nodeQuery && nodeQuery.methods.some((m) => node.method.toLowerCase() === m.toLowerCase())
      const isMutationOp =
        nodeMutation !== false &&
        !isQueryOp &&
        difference(nodeMutation ? nodeMutation.methods : [], nodeQuery ? nodeQuery.methods : []).some(
          (m) => node.method.toLowerCase() === m.toLowerCase(),
        )
      const isSuspenseOp = !!suspense
      const isInfiniteOp = !!nodeInfiniteOptions

      if (isQueryOp) {
        const queryOptionsName = transformName(`${baseName}QueryOptions`, 'function', transformers)
        const queryHookName = transformName(`use${capitalize(baseName)}`, 'function', transformers)
        const queryHookFile = resolver.resolveFile(
          { name: queryHookName, extname: '.ts', tag: node.tags[0] ?? 'default', path: node.path },
          { root, output, group },
        )
        imports.push(<File.Import name={[queryOptionsName]} root={hookOptionsFile.path} path={queryHookFile.path} />)
        hookOptions[queryHookName] = `Partial<ReturnType<typeof ${queryOptionsName}>>`

        if (isSuspenseOp) {
          const suspenseOptionsName = transformName(`${baseName}SuspenseQueryOptions`, 'function', transformers)
          const suspenseHookName = transformName(`use${capitalize(baseName)}Suspense`, 'function', transformers)
          const suspenseHookFile = resolver.resolveFile(
            { name: suspenseHookName, extname: '.ts', tag: node.tags[0] ?? 'default', path: node.path },
            { root, output, group },
          )
          imports.push(<File.Import name={[suspenseOptionsName]} root={hookOptionsFile.path} path={suspenseHookFile.path} />)
          hookOptions[suspenseHookName] = `Partial<ReturnType<typeof ${suspenseOptionsName}>>`
        }

        if (isInfiniteOp) {
          // Validate queryParam
          const normalizeKey = (key: string) => key.replace(/\?$/, '')
          const queryParamKeys = node.parameters.filter((p) => p.in === 'query').map((p) => p.name)
          const hasQueryParam = nodeInfiniteOptions!.queryParam ? queryParamKeys.some((k) => normalizeKey(k) === nodeInfiniteOptions!.queryParam) : false

          if (hasQueryParam) {
            const infiniteOptionsName = transformName(`${baseName}InfiniteQueryOptions`, 'function', transformers)
            const infiniteHookName = transformName(`use${capitalize(baseName)}Infinite`, 'function', transformers)
            const infiniteHookFile = resolver.resolveFile(
              { name: infiniteHookName, extname: '.ts', tag: node.tags[0] ?? 'default', path: node.path },
              { root, output, group },
            )
            imports.push(<File.Import name={[infiniteOptionsName]} root={hookOptionsFile.path} path={infiniteHookFile.path} />)
            hookOptions[infiniteHookName] = `Partial<ReturnType<typeof ${infiniteOptionsName}>>`

            if (isSuspenseOp) {
              const suspenseInfiniteOptionsName = transformName(`${baseName}SuspenseInfiniteQueryOptions`, 'function', transformers)
              const suspenseInfiniteHookName = transformName(`use${capitalize(baseName)}SuspenseInfinite`, 'function', transformers)
              const suspenseInfiniteHookFile = resolver.resolveFile(
                { name: suspenseInfiniteHookName, extname: '.ts', tag: node.tags[0] ?? 'default', path: node.path },
                { root, output, group },
              )
              imports.push(<File.Import name={[suspenseInfiniteOptionsName]} root={hookOptionsFile.path} path={suspenseInfiniteHookFile.path} />)
              hookOptions[suspenseInfiniteHookName] = `Partial<ReturnType<typeof ${suspenseInfiniteOptionsName}>>`
            }
          }
        }
      }

      if (isMutationOp) {
        const mutationOptionsName = transformName(`${baseName}MutationOptions`, 'function', transformers)
        const mutationHookName = transformName(`use${capitalize(baseName)}`, 'function', transformers)
        const mutationHookFile = resolver.resolveFile(
          { name: mutationHookName, extname: '.ts', tag: node.tags[0] ?? 'default', path: node.path },
          { root, output, group },
        )
        imports.push(<File.Import name={[mutationOptionsName]} root={hookOptionsFile.path} path={mutationHookFile.path} />)
        hookOptions[mutationHookName] = `Partial<ReturnType<typeof ${mutationOptionsName}>>`
      }
    }

    const name = 'HookOptions'

    return (
      <File
        baseName={hookOptionsFile.baseName}
        path={hookOptionsFile.path}
        meta={hookOptionsFile.meta}
        banner={resolver.resolveBanner(adapter.inputNode, { output, config })}
        footer={resolver.resolveFooter(adapter.inputNode, { output, config })}
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
