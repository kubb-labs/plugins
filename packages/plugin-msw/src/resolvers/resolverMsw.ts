import { camelCase, toFilePath } from '@internals/utils'
import { defineResolver } from '@kubb/core'
import type { PluginMsw } from '../types.ts'

/**
 * Default resolver used by `@kubb/plugin-msw`. Decides the names and file
 * paths for every generated MSW handler. Function names get a `Handler`
 * suffix; the aggregate export is always `handlers`.
 *
 * @example Resolve a handler name
 * ```ts
 * import { resolverMsw } from '@kubb/plugin-msw'
 *
 * resolverMsw.resolveName('addPet') // 'addPetHandler'
 * ```
 */
export const resolverMsw = defineResolver<PluginMsw>(() => ({
  name: 'default',
  pluginName: 'plugin-msw',
  default(name, type) {
    return type === 'file' ? toFilePath(name) : camelCase(name)
  },
  resolveName(name) {
    return camelCase(name, { suffix: 'handler' })
  },
  resolvePathName(name, type) {
    return this.default(name, type)
  },
  resolveHandlerName(node) {
    return this.resolveName(node.operationId)
  },
  resolveHandlersName() {
    return 'handlers'
  },
}))
