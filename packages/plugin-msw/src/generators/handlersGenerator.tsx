import { defineGenerator } from '@kubb/core'
import { File, jsxRendererSync } from '@kubb/renderer-jsx'
import { Handlers } from '../components/Handlers.tsx'
import type { PluginMsw } from '../types'

/**
 * Aggregate generator enabled by `pluginMsw({ handlers: true })`. Emits a
 * `handlers.ts` file that re-exports every generated handler grouped by HTTP
 * method, ready to spread into `setupServer(...handlers)` or
 * `setupWorker(...handlers)`.
 */
export const handlersGenerator = defineGenerator<PluginMsw>({
  name: 'plugin-msw',
  renderer: jsxRendererSync,
  operations(nodes, ctx) {
    const { resolver, config, root } = ctx
    const { output, group } = ctx.options

    const handlersName = resolver.resolveHandlersName()
    const file = resolver.resolveFile({ name: resolver.resolvePathName(handlersName, 'file'), extname: '.ts' }, { root, output, group: group ?? undefined })

    const imports = nodes.map((node) => {
      const operationName = resolver.resolveHandlerName(node)
      const operationFile = resolver.resolveFile(
        { name: resolver.resolveName(node.operationId), extname: '.ts', tag: node.tags[0] ?? 'default', path: node.path },
        { root, output, group: group ?? undefined },
      )

      return <File.Import key={operationFile.path} name={[operationName]} root={file.path} path={operationFile.path} />
    })

    const handlers = nodes.map((node) => `${resolver.resolveHandlerName(node)}()`)

    return (
      <File
        baseName={file.baseName}
        path={file.path}
        meta={file.meta}
        banner={resolver.resolveBanner(ctx.meta, { output, config })}
        footer={resolver.resolveFooter(ctx.meta, { output, config })}
      >
        {imports}
        <Handlers name={handlersName} handlers={handlers} />
      </File>
    )
  },
})
