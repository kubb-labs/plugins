import { defineResolver } from '@kubb/core'
import type { PluginVueQuery } from '../types.ts'
import { resolverVueQuery } from './resolverVueQuery.ts'

export const resolverVueQueryLegacy = defineResolver<PluginVueQuery>(() => ({
  ...resolverVueQuery,
  name: 'legacy',
  pluginName: 'plugin-vue-query',
}))
