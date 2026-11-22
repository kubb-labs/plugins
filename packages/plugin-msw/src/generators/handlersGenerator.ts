import { ast } from '@internals/ast'
import { namedFile } from '@internals/shared'
import { casing, code, defineGenerator } from '@kubb/kit'
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
    const handlersName = ctx.resolver.handler.listName()
    const createHandlersName = ctx.resolver.resolveName({ key: ['handlers', 'create'], name: casing.camel(handlersName, { prefix: 'create' }) })
    const file = namedFile({ name: handlersName })

    const own = ctx.from().resolver
    const handlerRefs = nodes.map((node) => own.handler.name(node))
    const imports = code.join(handlerRefs).imports.map((imp) => ({ ...imp, root: file.path }))
    const handlers = handlerRefs.map((ref) => `${ref}(undefined, options)`)

    return [
      ast.factory.createFile({
        ...file,
        imports,
        sources: [
          ast.factory.createSource({
            name: createHandlersName,
            export: true,
            nodes: [
              ast.factory.createText(`export function ${createHandlersName}(options?: { baseURL?: string }) {
  return [${handlers.join(', ')}] as const
}`),
            ],
          }),
          ast.factory.createSource({
            name: handlersName,
            export: true,
            nodes: [ast.factory.createText(`export const ${handlersName} = ${createHandlersName}()`)],
          }),
        ],
      }),
    ]
  },
})
