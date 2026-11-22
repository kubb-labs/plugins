import { ast } from '@internals/ast'
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
    const { output, group } = ctx.options

    const handlersName = ctx.resolver.handler.listName()
    const createHandlersName = ctx.resolver.resolveName({ key: ['handlers', 'create'], name: casing.camel(handlersName, { prefix: 'create' }) })
    const file = ctx.resolver.file({ name: handlersName, extname: '.ts', root: ctx.root, output, group: group ?? undefined })

    const own = ctx.from().resolver
    const handlerRefs = nodes.map((node) => own.handler.name(node))
    const imports = code.join(handlerRefs).imports.map((imp) => ({ ...imp, root: file.path }))
    const handlers = handlerRefs.map((ref) => `${ref}(undefined, options)`)

    return [
      ast.factory.createFile({
        baseName: file.baseName,
        path: file.path,
        meta: file.meta,
        banner: ctx.resolver.default.banner(ctx.meta, { output, config: ctx.config, file: { path: file.path, baseName: file.baseName } }),
        footer: ctx.resolver.default.footer(ctx.meta, { output, config: ctx.config, file: { path: file.path, baseName: file.baseName } }),
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
