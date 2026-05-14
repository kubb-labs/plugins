import type { ast } from '@kubb/core'
import { defineGenerator } from '@kubb/core'
import { File, jsxRenderer } from '@kubb/renderer-jsx'
import { Operations } from '../components/Operations'
import type { PluginClient } from '../types'

export const operationsGenerator = defineGenerator<PluginClient>({
  name: 'client',
  renderer: jsxRenderer,
  async operations(nodes, ctx) {
    const { config, resolver, adapter, root } = ctx
    const { output, group } = ctx.options

    const name = 'operations'
    const file = resolver.resolveFile({ name, extname: '.ts' }, { root, output, group })

    const collectedNodes: ast.OperationNode[] = []
    for await (const node of nodes) collectedNodes.push(node)

    return (
      <File
        baseName={file.baseName}
        path={file.path}
        meta={file.meta}
        banner={resolver.resolveBanner(adapter.inputNode, { output, config })}
        footer={resolver.resolveFooter(adapter.inputNode, { output, config })}
      >
        <Operations name={name} nodes={collectedNodes} />
      </File>
    )
  },
})
