import { defineGenerator } from '@kubb/core'
import { File, jsxRendererSync } from '@kubb/renderer-jsx'
import { Operations } from '../components/Operations'
import type { PluginClient } from '../types'

export const operationsGenerator = defineGenerator<PluginClient>({
  name: 'client',
  renderer: jsxRendererSync,
  operations(nodes, ctx) {
    const { config, resolver, root } = ctx
    const { output, group } = ctx.options

    const name = 'operations'
    const file = resolver.resolveFile({ name, extname: '.ts' }, { root, output, group: group ?? undefined })

    return (
      <File
        baseName={file.baseName}
        path={file.path}
        meta={file.meta}
        banner={resolver.resolveBanner(ctx.meta, { output, config })}
        footer={resolver.resolveFooter(ctx.meta, { output, config })}
      >
        <Operations name={name} nodes={nodes} />
      </File>
    )
  },
})
