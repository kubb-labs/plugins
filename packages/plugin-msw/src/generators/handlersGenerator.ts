import { getFile, getFileLocation } from '@internals/shared'
import { ast, casing, defineGenerator } from '@kubb/kit'
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
    const { resolver } = ctx
    const location = getFileLocation(ctx)

    const handlersName = resolver.handler.listName()
    const createHandlersName = resolver.resolveName({ key: ['handlers', 'create'], name: casing.camel(handlersName, { prefix: 'create' }) })
    const file = resolver.file({ name: handlersName, extname: '.ts', ...location })

    const handlerNames = nodes.map((node) => resolver.handler.name(node))

    const imports = nodes.map((node, index) => {
      const operationName = handlerNames[index]!
      const operationFile = resolver.file({
        name: resolver.name(node.operationId),
        extname: '.ts',
        tag: node.tags[0] ?? 'default',
        path: node.path,
        ...location,
      })
      return ast.factory.createImport({ name: [operationName], root: file.path, path: operationFile.path })
    })

    const handlers = handlerNames.map((name) => `${name}(undefined, options)`)

    return [
      ast.factory.createFile({
        ...getFile(ctx, file),
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
