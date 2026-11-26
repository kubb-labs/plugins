import { ast } from '@internals/ast'
import { getChecks } from './schema.ts'
import type { TypeGuardsOptions } from './types.ts'

export type ConditionExpressionOptions = {
  schema: ast.SchemaNode | undefined
  /** The library's check that `value` matches `schema`, such as `schema.safeParse(value).success`. */
  matches: (schema: ast.SchemaNode) => string
}

/** The test of an `if`, `then` or `else` branch. Required `unknown` properties are checked with `in`, since an object schema accepts them as missing. */
export function conditionExpression({ schema, matches }: ConditionExpressionOptions): string {
  if (!schema) return 'true'
  const object = ast.schema.narrow(schema, ast.schema.types.object)
  const keyOnlyNames =
    object?.properties.filter((property) => property.required && property.schema.type === ast.schema.types.unknown).map((property) => property.name) ?? []
  const restSchema = object ? { ...object, properties: object.properties.filter((property) => !keyOnlyNames.includes(property.name)) } : schema
  // An object with no properties left still means "is an object", so only a key check stands alone.
  const isOnlyKeys =
    keyOnlyNames.length > 0 &&
    restSchema.type === 'object' &&
    restSchema.properties.length === 0 &&
    restSchema.additionalProperties === undefined &&
    !restSchema.patternProperties &&
    !restSchema.propertyNames &&
    getChecks(restSchema).length === 0

  return [
    keyOnlyNames.length > 0 && `typeof value === "object" && value !== null && ${JSON.stringify(keyOnlyNames)}.every((key) => key in value)`,
    !isOnlyKeys && matches(restSchema),
  ]
    .filter(Boolean)
    .join(' && ')
}

export type ContainsCount = { bounds: string; message: string }

/** The count test and error message of a `contains` check, or `null` when `minContains: 0` allows any count. */
export function getContainsCount({ min = 1, max }: Pick<NonNullable<ast.ArraySchemaNode['contains']>, 'min' | 'max'>): ContainsCount | null {
  if (min === 0 && max === undefined) return null
  return {
    bounds: [`count >= ${min}`, max !== undefined && `count <= ${max}`].filter(Boolean).join(' && '),
    message: max !== undefined ? `Array must contain ${min} to ${max} matching items` : `Array must contain at least ${min} matching items`,
  }
}

export type TypeGuards = { is: boolean; assert: boolean }

/** Which guards the `typeGuards` option turns on. An object enables each guard it does not set to `false`. */
export function resolveTypeGuards(typeGuards: TypeGuardsOptions | undefined): TypeGuards {
  if (typeof typeGuards === 'object') return { is: typeGuards.is ?? true, assert: typeGuards.assert ?? true }
  return { is: Boolean(typeGuards), assert: Boolean(typeGuards) }
}
