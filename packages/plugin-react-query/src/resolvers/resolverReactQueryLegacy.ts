import { defineResolver } from '@kubb/core'
import type { PluginReactQuery } from '../types.ts'
import { resolverReactQuery } from './resolverReactQuery.ts'

/**
 * Legacy resolver for `@kubb/plugin-react-query` that reproduces the naming conventions
 * used in Kubb v4. Use this resolver directly when you need legacy naming.
 *
 * The naming logic is identical to the default resolver — the only difference
 * is the `name` field (`'legacy'` vs `'default'`) so the driver can
 * distinguish presets.
 */
export const resolverReactQueryLegacy = defineResolver<PluginReactQuery>(() => ({
  ...resolverReactQuery,
  name: 'legacy',
  pluginName: 'plugin-react-query',
}))
