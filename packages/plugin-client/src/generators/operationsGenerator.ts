import { Url } from '@internals/utils'
import { ast, defineGenerator } from '@kubb/core'
import type { PluginClient } from '../types'

/**
 * Generates an `operations.ts` file that re-exports every operation grouped
 * by HTTP method. Enabled when `pluginClient({ operations: true })`. Useful
 * for building meta-tooling on top of the generated client (route
 * registries, API explorers).
 */
export const operationsGenerator = defineGenerator<PluginClient>({
  name: 'client',
  operations(nodes, ctx) {
    const { config, resolver, root } = ctx
    const { output, group } = ctx.options

    const name = 'operations'
    const file = resolver.resolveFile({ name, extname: '.ts' }, { root, output, group: group ?? undefined })

    const operationsObject: Record<string, { path: string; method: string }> = {}
    for (const node of nodes) {
      if (!ast.isHttpOperationNode(node)) continue
      operationsObject[node.operationId] = {
        path: Url.toPath(node.path),
        method: node.method.toLowerCase(),
      }
    }

    return [
      ast.factory.createFile({
        baseName: file.baseName,
        path: file.path,
        meta: file.meta,
        banner: resolver.resolveBanner(ctx.meta, { output, config, file: { path: file.path, baseName: file.baseName } }),
        footer: resolver.resolveFooter(ctx.meta, { output, config, file: { path: file.path, baseName: file.baseName } }),
        sources: [
          ast.factory.createSource({
            name,
            isExportable: true,
            isIndexable: true,
            nodes: [ast.factory.createConst({ name, export: true, nodes: [ast.factory.createText(JSON.stringify(operationsObject, undefined, 2))] })],
          }),
        ],
      }),
    ]
  },
})
