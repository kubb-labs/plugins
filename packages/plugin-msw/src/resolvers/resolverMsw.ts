import { camelCase, toFilePath } from '@internals/utils'
import { defineResolver } from 'kubb/kit'
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
  core: {
    name(name) {
      return camelCase(name)
    },
    fileName(name) {
      return toFilePath(name)
    },
  },
  resolveName(name) {
    return camelCase(name, { suffix: 'handler' })
  },
  resolveHandlerName(node) {
    return this.resolveName(node.operationId)
  },
  resolveHandlersName() {
    return 'handlers'
  },
}))
