import { camelCase } from '@internals/utils'
import type { Group } from '@kubb/core'

/**
 * Builds the `group` config a Kubb plugin passes to `ctx.setOptions`, applying the
 * shared default naming so every plugin groups output consistently:
 *
 * - `path` groups use the second path segment (`/pet/findByStatus` → `pet`).
 * - other groups use `${camelCase(group)}${suffix}` (e.g. `petController`).
 *
 * Returns `null` when grouping is disabled, matching the per-plugin convention.
 *
 * @param group - The user-supplied group option, or `undefined` to disable grouping.
 * @param options.suffix - Appended to non-`path` group names, e.g. `'Controller'` or `'Requests'`.
 * @param options.honorName - When `true`, a user-provided `group.name` overrides the default namer.
 *
 * @example
 * ```ts
 * createGroupConfig(group, { suffix: 'Controller' })                  // plugin-ts, plugin-zod
 * createGroupConfig(group, { suffix: 'Controller', honorName: true }) // plugin-faker, plugin-client, …
 * createGroupConfig(group, { suffix: 'Requests', honorName: true })   // plugin-cypress, plugin-mcp
 * ```
 */
export function createGroupConfig(group: Group | undefined, options: { suffix: string; honorName?: boolean }): Group | null {
  if (!group) {
    return null
  }

  const defaultName = (ctx: { group: string }): string => {
    if (group.type === 'path') {
      return `${ctx.group.split('/')[1]}`
    }

    return `${camelCase(ctx.group)}${options.suffix}`
  }

  return {
    ...group,
    name: options.honorName && group.name ? group.name : defaultName,
  } satisfies Group
}
