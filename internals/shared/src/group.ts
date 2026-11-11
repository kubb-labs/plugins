import type { Group } from '@kubb/kit'

/**
 * Builds the `group` config a Kubb plugin passes to `ctx.setOptions`, applying the
 * shared default naming so every plugin groups output consistently:
 *
 * - `path` groups use the second path segment (`/pet/findByStatus` → `pet`).
 * - `tag` groups get no name here, so Kubb names them itself: the camelCased tag (`pet store` → `petStore`), nested in
 *   the folders of its OpenAPI 3.2 `parent` tags (`payment` with parent `store` → `store/payment`).
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

  if (group.name || group.type !== 'path') {
    return group
  }

  return {
    ...group,
    name: (ctx: { group: string }): string => `${ctx.group.split('/')[1]}`,
  } satisfies Group
}
