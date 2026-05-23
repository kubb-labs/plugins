import { defineGenerator } from '@kubb/core'
import { File, jsxRendererSync } from '@kubb/renderer-jsx'
import { Operations } from '../components/Operations'
import type { PluginClient } from '../types'

/**
 * Generates an `operations.ts` file that re-exports every operation grouped
 * by HTTP method. Enabled when `pluginClient({ operations: true })`. Useful
 * for building meta-tooling on top of the generated client (route
 * registries, API explorers).
 */
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
        banner={resolver.resolveBanner(ctx.meta, { output, config, file: { path: file.path, baseName: file.baseName } })}
        footer={resolver.resolveFooter(ctx.meta, { output, config, file: { path: file.path, baseName: file.baseName } })}
      >
        <Operations name={name} nodes={nodes} />
      </File>
    )
  },
})
