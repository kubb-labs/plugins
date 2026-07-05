import { camelCase } from '@internals/utils'
import { defineResolver } from 'kubb/kit'
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
export const resolverMsw = defineResolver<PluginMsw>(() => ({
  pluginName: 'plugin-msw',
  name(name) {
    return camelCase(name, { suffix: 'handler' })
  },
  handler: {
    name(node) {
      return this.name(node.operationId)
    },
    listName() {
      return 'handlers'
    },
  },
}))
