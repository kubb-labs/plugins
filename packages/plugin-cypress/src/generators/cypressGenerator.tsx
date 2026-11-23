import { ast } from '@internals/ast'
import { resolveOperationTypeNames, typeNames } from '@internals/shared'
import { code, defineGenerator, defineTemplate, operationKey } from '@kubb/kit'
import { pluginTsName } from '@kubb/plugin-ts'
import { File, jsxRenderer } from '@kubb/renderer-jsx'
import { Request } from '../components/Request.tsx'
import type { PluginCypress } from '../types.ts'

/**
 * Built-in template for `@kubb/plugin-cypress`. Emits one typed
 * `cy.request()` wrapper per OpenAPI operation, ready to call inside Cypress
 * test specs and custom commands.
 */
export const cypressOperation = defineTemplate<PluginCypress>({
  kind: 'Operation',
  render(node, ctx) {
    if (!ast.http.isOperation(node)) return null
    const { baseURL } = ctx.options

    const types = ctx.from(pluginTsName)
    const tsResolver = ctx.getResolver(pluginTsName)
    const { imports } = code.join([
      types.resolver.response.options(node),
      ...resolveOperationTypeNames(node, tsResolver, { includeParams: false }).map((typeName) => types.ref(node, typeName)),
    ])
    const name = ctx.resolver.name(node.operationId)

    const meta = {
      name: ctx.resolver.resolveName({ key: operationKey(node), name }),
      file: ctx.file(node),
    } as const

    return (
      <File {...meta.file}>
        {imports.map((imp) => (
          <File.Import key={imp.path} names={typeNames(imp)} path={imp.path} root={meta.file.path} />
        ))}
        <Request name={meta.name} node={node} resolver={tsResolver} baseURL={baseURL} />
      </File>
    )
  },
})

/**
 * @deprecated Register `cypressOperation` with `addTemplate`.
 */
export const cypressGenerator = defineGenerator<PluginCypress>({
  name: 'cypress',
  renderer: jsxRenderer,
  operation: (node, ctx) => cypressOperation.render(node, ctx),
})
