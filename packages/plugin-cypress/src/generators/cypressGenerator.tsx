import { resolveResponseRef } from '@internals/shared'
import { ast, defineGenerator } from '@kubb/core'
import { pluginTsName } from '@kubb/plugin-ts'
import { File, jsxRenderer } from '@kubb/renderer-jsx'
import { Request } from '../components/Request.tsx'
import type { PluginCypress } from '../types.ts'

/**
 * Built-in generator for `@kubb/plugin-cypress`. Emits one typed
 * `cy.request()` wrapper per OpenAPI operation, ready to call inside Cypress
 * test specs and custom commands.
 */
export const cypressGenerator = defineGenerator<PluginCypress>({
  name: 'cypress',
  renderer: jsxRenderer,
  operation(node, ctx) {
    if (!ast.isHttpOperationNode(node)) return null
    const { config, resolver, driver, root } = ctx
    const { output, baseURL, group } = ctx.options

    const pluginTs = driver.getPlugin(pluginTsName)

    if (!pluginTs) {
      return null
    }

    const tsResolver = driver.getResolver(pluginTsName)

    const meta = {
      name: resolver.resolveName(node.operationId),
      file: resolver.resolveFile(
        { name: node.operationId, extname: '.ts', tag: node.tags[0] ?? 'default', path: node.path },
        { root, output, group: group ?? undefined },
      ),
      fileTs: tsResolver.resolveFile(
        { name: node.operationId, extname: '.ts', tag: node.tags[0] ?? 'default', path: node.path },
        {
          root,
          output: pluginTs.options?.output ?? output,
          group: pluginTs.options?.group ?? undefined,
        },
      ),
    } as const

    // The Cypress wrapper only references the aggregate `RequestConfig` (body) and `Response`
    // (return) types. `RequestConfig` always lives in the operation file; `Response` lives in a
    // component's model file when it inlines to a single `$ref`.
    const responseRef = resolveResponseRef(node)
    const responseFilePath = responseRef
      ? tsResolver.resolveFile(
          { name: responseRef.rawName, extname: '.ts' },
          { root, output: pluginTs.options?.output ?? output, group: pluginTs.options?.group ?? undefined },
        ).path
      : meta.fileTs.path
    const typeImports =
      responseFilePath === meta.fileTs.path
        ? [{ path: meta.fileTs.path, names: [tsResolver.resolveRequestConfigName(node), tsResolver.resolveResponseName(node)] }]
        : [
            { path: meta.fileTs.path, names: [tsResolver.resolveRequestConfigName(node)] },
            { path: responseFilePath, names: [tsResolver.resolveResponseName(node)] },
          ]

    return (
      <File
        baseName={meta.file.baseName}
        path={meta.file.path}
        meta={meta.file.meta}
        banner={resolver.resolveBanner(ctx.meta, { output, config, file: { path: meta.file.path, baseName: meta.file.baseName } })}
        footer={resolver.resolveFooter(ctx.meta, { output, config, file: { path: meta.file.path, baseName: meta.file.baseName } })}
      >
        {typeImports.map((imp) => (
          <File.Import key={imp.path} name={imp.names} root={meta.file.path} path={imp.path} isTypeOnly />
        ))}
        <Request name={meta.name} node={node} resolver={tsResolver} baseURL={baseURL} />
      </File>
    )
  },
})
