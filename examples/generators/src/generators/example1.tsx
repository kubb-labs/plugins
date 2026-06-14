import { ast, defineGenerator } from '@kubb/core'
import type { PluginClient } from '@kubb/plugin-client'

const toURL = (path: string) => path.replaceAll('{', ':').replaceAll('}', '')

export const example1 = defineGenerator<PluginClient>({
  name: 'client-operation',
  async operation(node, ctx) {
    if (!ast.isHttpOperationNode(node)) return null
    const { resolver, root } = ctx
    const { output } = ctx.options
    const file = resolver.resolveFile({ name: node.operationId, extname: '.ts', tag: node.tags[0] ?? 'default', path: node.path }, { root, output })

    return [
      ast.factory.createFile({
        baseName: file.baseName,
        path: file.path,
        meta: file.meta,
        sources: [
          ast.factory.createSource({
            nodes: [
              ast.factory.createText(`export const ${node.operationId} = {
  method: '${node.method}',
  url: '${toURL(node.path)}'
}`),
            ],
          }),
        ],
      }),
    ]
  },
})
