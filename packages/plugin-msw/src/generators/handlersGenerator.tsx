import { defineGenerator } from '@kubb/core'
import { File, jsxRenderer } from '@kubb/renderer-jsx'
import { Handlers } from '../components/Handlers.tsx'
import type { PluginMsw } from '../types'
import { transformName } from '../utils.ts'

export const handlersGenerator = defineGenerator<PluginMsw>({
  name: 'plugin-msw',
  renderer: jsxRenderer,
  operations(nodes, ctx) {
    const { resolver, config, root, adapter } = ctx
    const { output, group, transformers } = ctx.options

    const file = resolver.resolveFile({ name: 'handlers', extname: '.ts' }, { root, output, group })

    const imports = nodes.map((node) => {
      const operationName = transformName(resolver.resolveName(node.operationId), 'function', transformers)
      const operationFile = resolver.resolveFile(
        { name: resolver.resolveName(node.operationId), extname: '.ts', tag: node.tags[0] ?? 'default', path: node.path },
        { root, output, group },
      )

      return <File.Import key={operationFile.path} name={[operationName]} root={file.path} path={operationFile.path} />
    })

    const handlers = nodes.map((node) => `${transformName(resolver.resolveName(node.operationId), 'function', transformers)}()`)

    return (
      <File
        baseName={file.baseName}
        path={file.path}
        meta={file.meta}
        banner={resolver.resolveBanner(adapter.inputNode, { output, config })}
        footer={resolver.resolveFooter(adapter.inputNode, { output, config })}
      >
        {imports}
        <Handlers name={'handlers'} handlers={handlers} />
      </File>
    )
  },
})
