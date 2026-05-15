import { collectOperations, defineGenerator } from '@kubb/core'
import { File, jsxRenderer } from '@kubb/renderer-jsx'
import { Operations } from '../components/Operations'
import type { PluginClient } from '../types'

export const operationsGenerator = defineGenerator<PluginClient>({
  name: 'client',
  renderer: jsxRenderer,
  async operations(nodes, ctx) {
    const allNodes = await collectOperations(nodes)
    const { config, resolver, root, inputNode } = ctx
    const { output, group } = ctx.options

    const name = 'operations'
    const file = resolver.resolveFile({ name, extname: '.ts' }, { root, output, group })

    return (
      <File
        baseName={file.baseName}
        path={file.path}
        meta={file.meta}
        banner={resolver.resolveBanner(inputNode, { output, config })}
        footer={resolver.resolveFooter(inputNode, { output, config })}
      >
        <Operations name={name} nodes={allNodes} />
      </File>
    )
  },
})
