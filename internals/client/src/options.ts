import { createGroupConfig } from '@internals/shared'
import { resolverClient } from './resolver.ts'
import type { Options, ResolvedOptions } from './types.ts'

/**
 * Applies the slim client defaults to user options. Mirrors the destructuring defaults the plugins
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
    resolver: userResolver,
  } = options

  return {
    output,
    exclude,
    include,
    override,
    group: createGroupConfig(group),
    baseURL,
    parser,
    resolver: userResolver ? { ...resolverClient, ...userResolver } : resolverClient,
  }
}
