import type { Exclude, Group, Include, Output, OutputOptions, Override } from '@kubb/kit'

/**
 * The options every plugin accepts: `output`, `group`, and the `exclude`, `include`, and `override` filters.
 * `TResolvedOptions` is the options object an `override` entry can set.
 */
export type PluginOptions<TResolvedOptions> = OutputOptions & {
  /**
   * Skip operations matching at least one entry in the list.
   */
  exclude?: Array<Exclude>
  /**
   * Restrict generation to operations matching at least one entry in the list.
   */
  include?: Array<Include>
  /**
   * Apply a different options object to operations matching a pattern.
   */
  override?: Array<Override<TResolvedOptions>>
}

/**
 * The common options after a plugin applies its defaults.
 */
export interface ResolvedPluginOptions<TResolvedOptions> {
  output: Output
  exclude: Array<Exclude>
  include: Array<Include> | undefined
  override: Array<Override<TResolvedOptions>>
  group: Group | null
}

/** Which side of a codec a printer writes: `encode` for a request the caller sends, `decode` for a response it reads. */
export type Direction = 'encode' | 'decode'

/** Coerces input before validation: `true` for every primitive, or one flag per kind. */
export type CoercionOptions = boolean | { dates?: boolean; strings?: boolean; numbers?: boolean }

/** Generates `is<Name>` and `assert<Name>` guards: `true` for both, or one flag per guard. */
export type TypeGuardsOptions = boolean | { is?: boolean; assert?: boolean }
