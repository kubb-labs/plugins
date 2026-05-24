import { groupOperationTypeImports, resolveOperationTypeImports } from '@internals/shared'
import { defineGenerator } from '@kubb/core'
import { defaultOperationTypes, pluginTsName } from '@kubb/plugin-ts'
import { File, jsxRendererSync } from '@kubb/renderer-jsx'
import { Request } from '../components/Request.tsx'
import type { PluginCypress } from '../types.ts'

/**
 * Built-in generator for `@kubb/plugin-cypress`. Emits one typed
 * `cy.request()` wrapper per OpenAPI operation, ready to call inside Cypress
 * test specs and custom commands.
 */
export const cypressGenerator = defineGenerator<PluginCypress>({
  name: 'cypress',
  renderer: jsxRendererSync,
  operation(node, ctx) {
    const { config, resolver, driver, root } = ctx
    const { output, baseURL, dataReturnType, paramsCasing, paramsType, pathParamsType, group } = ctx.options

    const pluginTs = driver.getPlugin(pluginTsName)

    if (!pluginTs) {
      return null
    }

    const tsResolver = driver.getResolver(pluginTsName)

    const typeImports = resolveOperationTypeImports(node, tsResolver, {
      paramsCasing,
      operationTypes: pluginTs.options?.operationTypes ?? defaultOperationTypes,
    })

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

    return (
      <File
        baseName={meta.file.baseName}
        path={meta.file.path}
        meta={meta.file.meta}
        banner={resolver.resolveBanner(ctx.meta, { output, config, file: { path: meta.file.path, baseName: meta.file.baseName } })}
        footer={resolver.resolveFooter(ctx.meta, { output, config, file: { path: meta.file.path, baseName: meta.file.baseName } })}
      >
        {meta.fileTs &&
          groupOperationTypeImports(
            typeImports,
            meta.fileTs.path,
            (schemaName) =>
              tsResolver.resolveFile(
                { name: schemaName, extname: '.ts' },
                { root, output: pluginTs.options?.output ?? output, group: pluginTs.options?.group ?? undefined },
              ).path,
          ).map((typeImport) => <File.Import key={typeImport.path} name={typeImport.names} root={meta.file.path} path={typeImport.path} isTypeOnly />)}
        <Request
          name={meta.name}
          node={node}
          resolver={tsResolver}
          dataReturnType={dataReturnType}
          paramsCasing={paramsCasing}
          paramsType={paramsType}
          pathParamsType={pathParamsType}
          baseURL={baseURL}
        />
      </File>
    )
  },
})
