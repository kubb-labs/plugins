import { defineGenerator } from '@kubb/core'
import { File, jsxRenderer } from '@kubb/renderer-jsx'
import { Handlers } from '../components/Handlers.tsx'
import type { PluginMsw } from '../types'

export const handlersGenerator = defineGenerator<PluginMsw>({
  name: 'plugin-msw',
  renderer: jsxRenderer,
  async operations(nodes, ctx) {
    const { resolver, config, root, adapter } = ctx
    const { output, group } = ctx.options

    const handlersName = resolver.resolveHandlersName()
    const file = resolver.resolveFile({ name: resolver.resolvePathName(handlersName, 'file'), extname: '.ts' }, { root, output, group })

    const collected: Array<{ operationName: string; operationFile: ReturnType<typeof resolver.resolveFile> }> = []
    for await (const node of nodes) {
      collected.push({
        operationName: resolver.resolveHandlerName(node),
        operationFile: resolver.resolveFile(
          { name: resolver.resolveName(node.operationId), extname: '.ts', tag: node.tags[0] ?? 'default', path: node.path },
          { root, output, group },
        ),
      })
    }

    const imports = collected.map(({ operationName, operationFile }) => (
      <File.Import key={operationFile.path} name={[operationName]} root={file.path} path={operationFile.path} />
    ))

    const handlers = collected.map(({ operationName }) => `${operationName}()`)

    return (
      <File
        baseName={file.baseName}
        path={file.path}
        meta={file.meta}
        banner={resolver.resolveBanner(adapter.inputNode, { output, config })}
        footer={resolver.resolveFooter(adapter.inputNode, { output, config })}
      >
        {imports}
        <Handlers name={handlersName} handlers={handlers} />
      </File>
    )
  },
})
