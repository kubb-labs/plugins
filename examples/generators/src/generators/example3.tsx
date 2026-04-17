import { defineGenerator } from '@kubb/core'
import type { PluginClient } from '@kubb/plugin-client'
import { Const, File, Function, Jsx, jsxRenderer } from '@kubb/renderer-jsx'

const pascalCase = (str: string) =>
  str
    .split(/[\s_-]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join('')

const toURL = (path: string) => path.replaceAll('{', ':').replaceAll('}', '')

export const example3 = defineGenerator<PluginClient>({
  name: 'client-operation',
  renderer: jsxRenderer,
  operation(node, ctx) {
    const { resolver, root } = ctx
    const { output } = ctx.options
    const file = resolver.resolveFile({ name: node.operationId, extname: '.tsx', tag: node.tags[0] ?? 'default', path: node.path }, { root, output })

    const componentName = pascalCase(node.operationId)
    const href = toURL(node.path)

    return (
      <File baseName={file.baseName} path={file.path} meta={file.meta}>
        <File.Source>
          <Function name={componentName} export>
            <Const name="href">{`'${href}'`}</Const>
            <br />
            <br />
            <Jsx>{`return (
  <>
    <a href={href}>Open ${node.method}</a>
  </>
)`}</Jsx>
          </Function>
        </File.Source>
      </File>
    )
  },
})
