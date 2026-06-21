import { createGroupConfig } from '@internals/shared'
import { resolverClient } from './resolver.ts'
import type { Options, ResolvedOptions } from './types.ts'

/**
 * Applies the client defaults to user options. Mirrors the destructuring defaults the plugins
 * use, so a documented default and the resolved value never drift.
 */
export function resolveOptions(options: Options): ResolvedOptions {
  const {
    output = { path: 'clients', barrel: { type: 'named' } },
    exclude = [],
    include,
    override = [],
    baseURL,
    parser = false,
    group,
    sdk,
    resolver: userResolver,
  } = options

  const shape = sdk?.shape ?? (sdk?.name ? 'class' : 'function')

  return {
    output,
    exclude,
    include,
    override,
    group: createGroupConfig(group),
    baseURL,
    parser,
    sdk: { shape, name: sdk?.name },
    resolver: userResolver ? { ...resolverClient, ...userResolver } : resolverClient,
  }
}
