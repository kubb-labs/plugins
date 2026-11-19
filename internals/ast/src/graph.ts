import { ast, type SchemaNode } from '@kubb/ast'

export const getImportedNames = ast.graph.getImportedNames
export const getRefNames = ast.graph.getRefNames
export const getUsedNames = ast.graph.getUsedNames
export const getCircularNames = ast.graph.getCircularNames

/** Whether a schema, or anything inside it, refers to one of `circularSchemas`, other than `excludeName`. */
export function containsCircular(
  node: SchemaNode | undefined,
  { circularSchemas, excludeName }: { circularSchemas: ReadonlySet<string>; excludeName?: string },
): boolean {
  if (!node || circularSchemas.size === 0) return false
  for (const name of getRefNames(node)) if (name !== excludeName && circularSchemas.has(name)) return true
  return false
}
