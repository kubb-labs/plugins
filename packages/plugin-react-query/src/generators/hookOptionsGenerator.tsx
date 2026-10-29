import { operationFileEntry } from '@internals/shared'
import { matchesInfinite } from '@internals/tanstack-query'
import { ast, defineGenerator } from 'kubb/kit'
import { File, jsxRenderer, Type } from 'kubb/jsx'
import type { KubbReactNode } from 'kubb/jsx'
import type { PluginReactQuery } from '../types'
import { classifyOperation, resolveOperationOverrides } from '@internals/tanstack-query'

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

    const name = resolver.hook.optionsName()
    const resolvedFile = resolver.file({ name, extname: '.ts', root, output, group: group ?? undefined })
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

      // A per-operation `query: false` skips the query hooks, matching the generators that emit them.
      const { isQuery, isMutation } = classifyOperation(node, { query: nodeQuery, mutation: nodeMutation })
      const isSuspense = !!suspense
      const isInfinite = isQuery && !!nodeInfiniteOptions && matchesInfinite(node, nodeInfiniteOptions)

      const namespaces: Array<[{ name(node: ast.OperationNode): string; optionsName(node: ast.OperationNode): string }, boolean]> = [
        [resolver.query, isQuery],
        [resolver.suspenseQuery, isQuery && isSuspense],
        [resolver.infiniteQuery, isInfinite],
        [resolver.suspenseInfiniteQuery, isInfinite && isSuspense],
        [resolver.mutation, isMutation],
      ]

      for (const [ns, enabled] of namespaces) {
        if (!enabled) continue
        const optionsName = ns.optionsName(node)
        const hookName = ns.name(node)
        const hookFile = resolver.file({ ...operationFileEntry(node, hookName), root, output, group: group ?? undefined })
        imports.push(<File.Import name={[optionsName]} root={hookOptionsFile.path} path={hookFile.path} />)
        hookOptions[hookName] = `Partial<ReturnType<typeof ${optionsName}>>`
      }
    }

    return (
      <File
        baseName={hookOptionsFile.baseName}
        path={hookOptionsFile.path}
        meta={hookOptionsFile.meta}
        banner={resolver.default.banner(ctx.meta, { output, config, file: { path: hookOptionsFile.path, baseName: hookOptionsFile.baseName } })}
        footer={resolver.default.footer(ctx.meta, { output, config, file: { path: hookOptionsFile.path, baseName: hookOptionsFile.baseName } })}
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
