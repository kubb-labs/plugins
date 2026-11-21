import { ast } from '@internals/ast'
import { casing, defineGenerator } from '@kubb/kit'
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

    const handlersName = resolver.handler.listName()
    const createHandlersName = resolver.resolveName({ key: ['handlers', 'create'], name: casing.camel(handlersName, { prefix: 'create' }) })
    const file = resolver.file({ name: handlersName, extname: '.ts', root, output, group: group ?? undefined })

    const handlerNames = nodes.map((node) => resolver.handler.name(node))

    const imports = nodes.map((node, index) => {
      const operationName = handlerNames[index]!
      const operationFile = ctx.file(node, { name: resolver.name(node.operationId), suffix: false })
      return ast.factory.createImport({ name: [operationName], root: file.path, path: operationFile.path })
    })

    const handlers = handlerNames.map((name) => `${name}(undefined, options)`)

    return [
      ast.factory.createFile({
        baseName: file.baseName,
        path: file.path,
        meta: file.meta,
        banner: resolver.default.banner(ctx.meta, { output, config, file: { path: file.path, baseName: file.baseName } }),
        footer: resolver.default.footer(ctx.meta, { output, config, file: { path: file.path, baseName: file.baseName } }),
        imports,
        sources: [
          ast.factory.createSource({
            name: createHandlersName,
            isIndexable: true,
            isExportable: true,
            nodes: [
              ast.factory.createText(`export function ${createHandlersName}(options?: { baseURL?: string }) {
  return [${handlers.join(', ')}] as const
}`),
            ],
          }),
          ast.factory.createSource({
            name: handlersName,
            isIndexable: true,
            isExportable: true,
            nodes: [ast.factory.createText(`export const ${handlersName} = ${createHandlersName}()`)],
          }),
        ],
      }),
    ]
  },
})
