import { ast, defineGenerator } from 'kubb/kit'
import type { PluginMsw } from '../types'

/**
 * Aggregate generator enabled by `pluginMsw({ handlers: true })`. Emits a
 * `handlers.ts` file that re-exports every generated handler in operation
 * order, ready to spread into `setupServer(...handlers)` or
 * `setupWorker(...handlers)`.
 */
export const handlersGenerator = defineGenerator<PluginMsw>({
  name: 'plugin-msw',
  operations(nodes, ctx) {
    const { resolver, config, root } = ctx
    const { output, group } = ctx.options

    const handlersName = resolver.resolveHandlersName()
    const file = resolver.core.file({ name: resolver.core.fileName(handlersName), extname: '.ts' }, { root, output, group: group ?? undefined })

    const imports = nodes.map((node) => {
      const operationName = resolver.resolveHandlerName(node)
      const operationFile = resolver.core.file(
        { name: resolver.resolveName(node.operationId), extname: '.ts', tag: node.tags[0] ?? 'default', path: node.path },
        { root, output, group: group ?? undefined },
      )
      return ast.factory.createImport({ name: [operationName], root: file.path, path: operationFile.path })
    })

    const handlers = nodes.map((node) => `${resolver.resolveHandlerName(node)}()`)

    return [
      ast.factory.createFile({
        baseName: file.baseName,
        path: file.path,
        meta: file.meta,
        banner: resolver.core.banner(ctx.meta, { output, config, file: { path: file.path, baseName: file.baseName } }),
        footer: resolver.core.footer(ctx.meta, { output, config, file: { path: file.path, baseName: file.baseName } }),
        imports,
        sources: [
          ast.factory.createSource({
            name: handlersName,
            isIndexable: true,
            isExportable: true,
            nodes: [ast.factory.createText(`export const ${handlersName} = ${JSON.stringify(handlers).replaceAll('"', '')} as const`)],
          }),
        ],
      }),
    ]
  },
})
