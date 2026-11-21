import { ast } from '@internals/ast'
import { resolveOperationTypeNames } from '@internals/shared'
import { defineGenerator, operationKey } from '@kubb/kit'
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
    if (!ast.http.isOperation(node)) return null
    const { resolver } = ctx
    const { baseURL } = ctx.options

    ctx.requirePlugin(pluginTsName)

    const tsResolver = ctx.getResolver(pluginTsName)

    const importedTypeNames = [tsResolver.response.options(node), ...resolveOperationTypeNames(node, tsResolver, { includeParams: false })]
    const name = resolver.name(node.operationId)

    const meta = {
      name: resolver.resolveName({ key: operationKey(node), name }),
      file: ctx.file(node, { suffix: false }),
      fileTs: ctx.file(node, { plugin: tsResolver.pluginName }),
    } as const

    return (
      <File {...meta.file}>
        <File.Import name={importedTypeNames} root={meta.file.path} path={meta.fileTs.path} isTypeOnly />
        <Request name={meta.name} node={node} resolver={tsResolver} baseURL={baseURL} />
      </File>
    )
  },
})
