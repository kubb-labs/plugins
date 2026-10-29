import type { GeneratorContext } from 'kubb/kit'

type MetaContext = Pick<GeneratorContext, 'memo' | 'meta'>

/**
 * `ctx.meta.circularNames` as a set, built once per build and shared by every plugin.
 */
export function getCircularNames(ctx: MetaContext): ReadonlySet<string> {
  return ctx.memo('circularNames:set', () => new Set(ctx.meta.circularNames))
}

/**
 * `ctx.meta.enumNames` as a set, built once per build and shared by every plugin.
 */
export function getEnumNames(ctx: MetaContext): ReadonlySet<string> {
  return ctx.memo('enumNames:set', () => new Set(ctx.meta.enumNames))
}

declare global {
  namespace Kubb {
    interface MemoRegistry {
      circularNames: ReadonlySet<string>
      enumNames: ReadonlySet<string>
    }
  }
}
