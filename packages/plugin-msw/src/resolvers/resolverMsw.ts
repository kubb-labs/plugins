import { createHandlerResolver, resolveHandlerName } from '@internals/shared'
import { createResolver } from '@kubb/kit'
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
  name: resolveHandlerName,
  handler: {
    ...createHandlerResolver(),
    listName() {
      return this.resolveName({ key: ['handlers', 'list'], name: 'handlers' })
    },
  },
})
