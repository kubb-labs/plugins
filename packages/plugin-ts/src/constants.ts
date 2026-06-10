import type { PluginTs } from './types.ts'

type OptionalType = PluginTs['resolvedOptions']['optionalType']
type EnumType = PluginTs['resolvedOptions']['enum']['type']

/**
 * `optionalType` values that cause a property's type to include `| undefined`.
 */
export const OPTIONAL_ADDS_UNDEFINED = new Set<OptionalType>(['undefined', 'questionTokenAndUndefined'] as const)

/**
 * `optionalType` values that render the property key with a `?` token.
 */
export const OPTIONAL_ADDS_QUESTION_TOKEN = new Set<OptionalType>(['questionToken', 'questionTokenAndUndefined'] as const)

/**
 * `enum.type` values that append a `typeSuffix` to the generated enum type alias.
 */
export const ENUM_TYPES_WITH_KEY_SUFFIX = new Set<EnumType>(['asConst'] as const)

/**
 * `enum.type` values that require a runtime value declaration (object, enum, or literal).
 */
export const ENUM_TYPES_WITH_RUNTIME_VALUE = new Set<EnumType | undefined>(['enum', 'asConst', 'constEnum', 'literal', undefined] as const)

/**
 * `enum.type` values whose type declaration is type-only (no runtime value emitted for the type alias).
 */
export const ENUM_TYPES_WITH_TYPE_ONLY = new Set<EnumType | undefined>(['asConst', 'literal', undefined] as const)

/**
 * Ordering priority for function parameters: lower = sorted earlier.
 */
export const PARAM_RANK = {
  required: 0,
  optional: 1,
  withDefault: 2,
  rest: 3,
} as const
