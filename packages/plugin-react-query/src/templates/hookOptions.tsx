import { ast } from '@internals/ast'
import { resolveClientOperation } from '@internals/client'
import { namedFile } from '@internals/shared'
import { hookFileName, matchesInfinite } from '@internals/tanstack-query'
import { defineTemplate } from '@kubb/kit'
import { File, Type } from '@kubb/renderer-jsx'
import { hookFileVariants } from '../resolvers/resolverReactQuery.ts'
import type { PluginReactQuery } from '../types'
import { classifyOperation } from '@internals/tanstack-query'

/**
 * Emits the `HookOptions` type used by `customOptions`. Enabled when
 * `pluginReactQuery({ customOptions: { ... } })`. The generated type lists
 * every hook keyed by name so user-supplied options stay in sync with the
 * generated hooks at compile time.
 */
export const hookOptionsOperations = defineTemplate<PluginReactQuery>({
  kind: ast.node.kinds.operations,
  render({ operations: nodes }, ctx) {
    const { output, customOptions, suspense, override, include, exclude, hooks, client } = ctx.options

    if (!customOptions || !hooks) return null

    const name = ctx.resolver.hook.optionsName()
    const resolvedFile = namedFile({ name })
    const hookOptionsFile = {
      ...resolvedFile,
      baseName: `${name}.ts` as const,
      path: resolvedFile.path.replace(/[^/\\]+\.ts$/, `${name}.ts`),
    }

    const optionsImports: Array<ast.ImportNode> = []
    const hookOptions: Record<string, string> = {}

    for (const node of nodes) {
      if (!ast.http.isOperation(node)) continue
      // The hook templates emit nothing for an operation the client plugin leaves out.
      if (!resolveClientOperation({ node, pluginName: client.pluginName })) continue
      // The options the per-operation templates get: this plugin's `override`, `include` and `exclude` applied.
      const operationOptions = ctx.resolver.default.options(node, { options: ctx.options, exclude, include, override })
      if (!operationOptions) continue
      const { query: nodeQuery, mutation: nodeMutation, infinite: nodeInfinite } = operationOptions
      const nodeInfiniteOptions = nodeInfinite && typeof nodeInfinite === 'object' ? nodeInfinite : null

      // A per-operation `query: false` skips the query hooks, matching the templates that emit them.
      const { isQuery, isMutation } = classifyOperation(node, { query: nodeQuery, mutation: nodeMutation })
      const isSuspense = !!suspense
      const isInfinite = isQuery && !!nodeInfiniteOptions && matchesInfinite(node, nodeInfiniteOptions)

      const enabled = {
        query: isQuery,
        suspenseQuery: isQuery && isSuspense,
        infiniteQuery: isInfinite,
        suspenseInfiniteQuery: isInfinite && isSuspense,
        mutation: isMutation,
      }

      for (const namespace of Object.keys(hookFileVariants) as Array<keyof typeof hookFileVariants>) {
        if (!enabled[namespace]) continue
        const ns = ctx.resolver[namespace]
        const optionsName = ns.optionsName(node)
        const hookName = ns.name(node)
        // Each hook's options live in that hook's own file.
        const { path } = ctx.file(node, { plugin: ctx.plugin.name, name: hookFileName({ resolver: ctx.resolver, node, variant: hookFileVariants[namespace] }) })
        optionsImports.push(ast.factory.createImport({ names: [{ name: optionsName, space: 'value' }], path }))
        hookOptions[hookName] = `Partial<ReturnType<typeof ${optionsName}>>`
      }
    }

    return (
      <File
        baseName={hookOptionsFile.baseName}
        path={hookOptionsFile.path}
        meta={hookOptionsFile.meta}
        banner={ctx.resolver.default.banner(ctx.meta, { output, config: ctx.config, file: { path: hookOptionsFile.path, baseName: hookOptionsFile.baseName } })}
        footer={ctx.resolver.default.footer(ctx.meta, { output, config: ctx.config, file: { path: hookOptionsFile.path, baseName: hookOptionsFile.baseName } })}
      >
        {optionsImports.map((imp) => (
          <File.Import key={imp.path} {...imp} root={hookOptionsFile.path} />
        ))}
        <Type export name={name}>
          {`{ ${Object.keys(hookOptions)
            .map((key) => `${JSON.stringify(key)}: ${hookOptions[key]}`)
            .join(', ')} }`}
        </Type>
      </File>
    )
  },
})
