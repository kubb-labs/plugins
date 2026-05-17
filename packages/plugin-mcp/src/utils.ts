import type { ast } from '@kubb/core'

export type ZodParam = {
  name: string
  schemaName: string
}

/**
 * Render a group param value — compose individual schemas into `z.object({ ... })`,
 * or use a schema name string directly.
 */
export function zodGroupExpr(entry: string | Array<ZodParam>): string {
  if (typeof entry === 'string') {
    return entry
  }
  const entries = entry.map((p) => `${JSON.stringify(p.name)}: ${p.schemaName}`)
  return `z.object({ ${entries.join(', ')} })`
}

/**
 * Convert a SchemaNode type to an inline Zod expression string.
 * Used as fallback when no named zod schema is available for a path parameter.
 */
export function zodExprFromSchemaNode(schema: ast.SchemaNode): string {
  let expr: string
  switch (schema.type) {
    case 'enum': {
      // namedEnumValues takes priority over enumValues
      const rawValues: Array<string | number | boolean> = schema.namedEnumValues?.length
        ? schema.namedEnumValues.map((v) => v.value)
        : (schema.enumValues ?? []).filter((v): v is string | number | boolean => v !== null)

      if (rawValues.length > 0 && rawValues.every((v) => typeof v === 'string')) {
        expr = `z.enum([${rawValues.map((v) => JSON.stringify(v)).join(', ')}])`
      } else if (rawValues.length > 0) {
        const literals = rawValues.map((v) => `z.literal(${JSON.stringify(v)})`)
        expr = literals.length === 1 ? literals[0]! : `z.union([${literals.join(', ')}])`
      } else {
        expr = 'z.string()'
      }
      break
    }
    case 'integer':
      expr = 'z.coerce.number()'
      break
    case 'number':
      expr = 'z.number()'
      break
    case 'boolean':
      expr = 'z.boolean()'
      break
    case 'array':
      expr = 'z.array(z.unknown())'
      break
    default:
      expr = 'z.string()'
  }

  if (schema.nullable) {
    expr = `${expr}.nullable()`
  }

  return expr
}
