import { camelCase } from '@internals/utils'
import type { Group } from 'kubb/kit'

/**
 * Builds the `group` config a Kubb plugin passes to `ctx.setOptions`, applying the
 * shared default naming so every plugin groups output consistently:
 *
 * - `path` groups use the second path segment (`/pet/findByStatus` → `pet`).
 * - other groups use the camelCased group (`pet store` → `petStore`).
 *
 * A user-provided `group.name` always wins over the default namer, so callers stay in
 * control of their output folders. Returns `null` when grouping is disabled, matching the
 * per-plugin convention.
 *
 * @param group - The user-supplied group option, or `undefined` to disable grouping.
 *
 * @example
 * ```ts
 * createGroupConfig(group) // shared across every plugin
 * ```
 */
export function createGroupConfig(group: Group | undefined): Group | null {
  if (!group) {
    return null
  }

  const defaultName = (ctx: { group: string }): string => {
    if (group.type === 'path') {
      return `${ctx.group.split('/')[1]}`
    }

    return camelCase(ctx.group)
  }

  return {
    ...group,
    name: group.name ? group.name : defaultName,
  } satisfies Group
}
