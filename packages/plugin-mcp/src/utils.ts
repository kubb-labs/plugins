import type { ast } from 'kubb/kit'

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
  const baseExpr = (() => {
    if (schema.type === 'enum') {
      const rawValues: Array<string | number | boolean> = schema.namedEnumValues?.length
        ? schema.namedEnumValues.map((v) => v.value)
        : (schema.enumValues ?? []).filter((v): v is string | number | boolean => v !== null)

      if (rawValues.length > 0 && rawValues.every((v) => typeof v === 'string')) {
        return `z.enum([${rawValues.map((v) => JSON.stringify(v)).join(', ')}])`
      }
      if (rawValues.length > 0) {
        const literals = rawValues.map((v) => `z.literal(${JSON.stringify(v)})`)
        return literals.length === 1 ? literals[0]! : `z.union([${literals.join(', ')}])`
      }
      return 'z.string()'
    }
    if (schema.type === 'integer') return 'z.coerce.number()'
    if (schema.type === 'number') return 'z.number()'
    if (schema.type === 'boolean') return 'z.boolean()'
    if (schema.type === 'array') return 'z.array(z.unknown())'
    return 'z.string()'
  })()

  return schema.nullable ? `${baseExpr}.nullable()` : baseExpr
}
