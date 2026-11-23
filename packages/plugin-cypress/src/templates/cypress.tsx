import { ast } from '@internals/ast'
import { resolveOperationTypeNames } from '@internals/shared'
import { code, defineTemplate, operationKey } from '@kubb/kit'
import { pluginTsName } from '@kubb/plugin-ts'
import { File } from '@kubb/renderer-jsx'
import { Request } from '../components/Request.tsx'
import type { PluginCypress } from '../types.ts'

/**
 * Built-in template for `@kubb/plugin-cypress`. Emits one typed
 * `cy.request()` wrapper per OpenAPI operation, ready to call inside Cypress
 * test specs and custom commands.
 */
export const cypressOperation = defineTemplate<PluginCypress>({
  kind: ast.node.kinds.operation,
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
          <File.Import key={imp.path} names={ast.imports.asType(imp)} root={meta.file.path} path={imp.path} />
        ))}
        <Request name={meta.name} node={node} resolver={tsResolver} baseURL={baseURL} />
      </File>
    )
  },
})
