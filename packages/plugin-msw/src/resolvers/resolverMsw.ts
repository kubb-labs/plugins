import { camelCase } from '@internals/utils'
import { defineResolver } from '@kubb/core'
import type { PluginMsw } from '../types.ts'

export const resolverMsw = defineResolver<PluginMsw>(() => ({
  name: 'default',
  pluginName: 'plugin-msw',
  default(name, type) {
    return camelCase(name, { isFile: type === 'file' })
  },
  resolveName(name) {
    return camelCase(name, { suffix: 'handler' })
  },
}))
