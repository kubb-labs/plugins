import { camelCase } from '@internals/utils'
import { defineResolver } from '@kubb/core'
import type { PluginVueQuery } from '../types.ts'

export const resolverVueQuery = defineResolver<PluginVueQuery>((ctx) => ({
  name: 'default',
  pluginName: 'plugin-vue-query',
  default(name, type) {
    return camelCase(name, { isFile: type === 'file' })
  },
  resolveName(name) {
    return ctx.default(name, 'function')
  },
}))
