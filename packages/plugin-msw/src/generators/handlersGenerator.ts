import { ast } from '@internals/ast'
import { namedFile } from '@internals/shared'
import { casing, code, defineGenerator, from } from '@kubb/kit'
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

    const handlersName = resolver.handler.listName()
    const createHandlersName = resolver.resolveName({ key: ['handlers', 'create'], name: casing.camel(handlersName, { prefix: 'create' }) })
    const file = namedFile({ name: handlersName })

    const handlerNames = nodes.map((node) => resolver.handler.name(node))

    const own = from(ctx.plugin.name)
    const imports = code
      .join(nodes.map((node, index) => own.import(node, handlerNames[index]!)))
      .imports.map((imp) => ast.factory.createImport({ name: imp.name, path: imp.path, root: file.path }))

    const handlers = handlerNames.map((name) => `${name}(undefined, options)`)

    return [
      ast.factory.createFile({
        ...file,
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
