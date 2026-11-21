import { casing, createResolver, operationKey } from '@kubb/kit'
import type { PluginMsw } from '../types.ts'

/**
 * Default resolver used by `@kubb/plugin-msw`. Decides the names and file
 * paths for every generated MSW handler. Function names get a `Handler`
 * suffix; the aggregate export is always `handlers`.
 *
 * The top-level `name` applies the `handler` suffix, and `file` falls back to the built-in
 * `toFilePath` casing. Operation-specific naming is grouped under the `handler` namespace.
 *
 * @example Resolve a handler name
 * ```ts
 * import { resolverMsw } from '@kubb/plugin-msw'
 *
 * resolverMsw.name('addPet') // 'addPetHandler'
 * ```
 */
export const resolverMsw = createResolver<PluginMsw>({
  pluginName: 'plugin-msw',
  file: {
    suffix: false,
    name(node) {
      return node.kind === 'Operation' ? this.name(node.operationId) : undefined
    },
  },
  name(name) {
    return this.memo(`name:${name}`, () => casing.camel(name, { suffix: 'handler' }))
  },
  handler: {
    name(node) {
      const name = this.name(node.operationId)
      return this.resolveName({ key: operationKey(node, 'handler', 'name'), name })
    },
    listName() {
      return this.resolveName({ key: ['handlers', 'list'], name: 'handlers' })
    },
  },
})
