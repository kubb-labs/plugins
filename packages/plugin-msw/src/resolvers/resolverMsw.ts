import { camelCase } from '@internals/utils'
import { defineResolver } from '@kubb/core'
import type { PluginMsw } from '../types.ts'

/**
 * Naming convention resolver for MSW plugin.
 *
 * Provides default naming helpers using camelCase with a `handler` suffix.
 */
export const resolverMsw = defineResolver<PluginMsw>((ctx) => ({
  name: 'default',
  pluginName: 'plugin-msw',
  default(name, type) {
    return camelCase(name, { isFile: type === 'file' })
  },
  resolveName(name) {
    return camelCase(name, { suffix: 'handler' })
  },
  resolvePathName(name, type) {
    return ctx.default(name, type)
  },
  resolveHandlerName(node) {
    return ctx.resolveName(node.operationId)
  },
  resolveHandlersName() {
    return 'handlers'
  },
}))
