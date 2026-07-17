import { resolveOperationTypeImports } from '@internals/shared'
import { ast, defineGenerator } from 'kubb/kit'
import { defaultOperationTypes, pluginTsName } from '@kubb/plugin-ts'
import { File, jsxRenderer } from 'kubb/jsx'
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
      name: resolver.name(node.operationId),
      file: resolver.file({ name: node.operationId, extname: '.ts', tag: node.tags[0] ?? 'default', path: node.path, root, output, group: group ?? undefined }),
      fileTs: tsResolver.file({
        name: node.operationId,
        extname: '.ts',
        tag: node.tags[0] ?? 'default',
        path: node.path,
        root,
        output: pluginTs.options?.output ?? output,
        group: pluginTs.options?.group ?? undefined,
      }),
    } as const

    const typeImportGroups = meta.fileTs
      ? resolveOperationTypeImports(node, tsResolver, {
          includeParams: false,
          operationTypes: pluginTs.options?.operationTypes ?? defaultOperationTypes,
          operationFilePath: meta.fileTs.path,
          root,
          output: pluginTs.options?.output ?? output,
          group: pluginTs.options?.group ?? undefined,
          extraNames: [tsResolver.response.options(node)],
        })
      : []

    return (
      <File
        baseName={meta.file.baseName}
        path={meta.file.path}
        meta={meta.file.meta}
        banner={resolver.default.banner(ctx.meta, { output, config, file: { path: meta.file.path, baseName: meta.file.baseName } })}
        footer={resolver.default.footer(ctx.meta, { output, config, file: { path: meta.file.path, baseName: meta.file.baseName } })}
      >
        {typeImportGroups.map((typeImport) => (
          <File.Import key={typeImport.path} name={typeImport.names} root={meta.file.path} path={typeImport.path} isTypeOnly />
        ))}
        <Request name={meta.name} node={node} resolver={tsResolver} baseURL={baseURL} />
      </File>
    )
  },
})
