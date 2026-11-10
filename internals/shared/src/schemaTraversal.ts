import { ast } from '@kubb/kit'

/**
 * Converts a child schema to printer output. Plugins instantiate it with their own output type:
 * `string` for the zod and faker printers, `ts.TypeNode` for the TypeScript printer. A printer's
 * `this.transform` fits directly, so its `null` for an empty result carries through to `output`.
 */
export type SchemaTransform<TOutput> = (schema: ast.SchemaNode) => TOutput

/**
 * A union or intersection member, or an array or tuple item, paired with its transformed output.
 */
export type MappedSchema<TOutput> = {
  /**
   * The original child schema, kept so the printer can read its metadata for leaf formatting.
   */
  schema: ast.SchemaNode
  /**
   * The child schema after being run through the transform.
   */
  output: TOutput
}

/**
 * An object property paired with its transformed output.
 */
export type MappedProperty<TOutput> = {
  /**
   * The property name as written on the schema, before any identifier quoting.
   */
  name: string
  /**
   * The original property node, kept so the printer can read `required`, `schema`, and metadata.
   */
  property: ast.PropertyNode
  /**
   * The property schema after being run through the transform.
   */
  output: TOutput
}

/**
 * Maps each property of an object schema to its transformed output. Pairs every result with the
 * original property so the printer keeps full control over modifiers, getters, and key syntax.
 *
 * @example
 * ```ts
 * const entries = mapSchemaProperties(node, (schema) => this.transform(schema))
 * // entries: [{ name: 'id', property, output: 'z.number()' }, ...]
 * ```
 */
export function mapSchemaProperties<TOutput>(node: ast.ObjectSchemaNode, transform: SchemaTransform<TOutput>): Array<MappedProperty<TOutput>> {
  return node.properties.map((property) => ({ name: property.name, property, output: transform(property.schema) }))
}

/**
 * Maps each member of a union or intersection schema to its transformed output, pairing every
 * result with the original member.
 */
export function mapSchemaMembers<TOutput>(
  node: ast.UnionSchemaNode | ast.IntersectionSchemaNode,
  transform: SchemaTransform<TOutput>,
): Array<MappedSchema<TOutput>> {
  return (node.members ?? []).map((schema) => ({ schema, output: transform(schema) }))
}

/**
 * Maps each item of an array or tuple schema to its transformed output, pairing every result with
 * the original item.
 */
export function mapSchemaItems<TOutput>(node: ast.ArraySchemaNode, transform: SchemaTransform<TOutput>): Array<MappedSchema<TOutput>> {
  return (node.items ?? []).map((schema) => ({ schema, output: transform(schema) }))
}

/**
 * Schemas the AST visitors skip: each `conditionals` entry, an array's `contains.schema` and, unless `content` is
 * `false`, a string's `content.schema`, found anywhere in `node`, including inside each other.
 */
function collectUnwalkedSchemas(node: ast.SchemaNode, { content = true }: { content?: boolean } = {}): Array<ast.SchemaNode> {
  const found = new Set<ast.SchemaNode>()
  const queue = [node]
  while (queue.length > 0) {
    const children = ast.collectSync<Array<ast.SchemaNode | undefined>>(queue.pop()!, {
      schema: (child) => [
        ...(child.conditionals ?? []).flatMap((entry) => [entry.if, entry.then, entry.else]),
        ast.narrowSchema(child, ast.schemaTypes.array)?.contains?.schema ?? ast.narrowSchema(child, ast.schemaTypes.tuple)?.contains?.schema,
        content ? ast.narrowSchema(child, ast.schemaTypes.string)?.content?.schema : undefined,
      ],
    })
    for (const child of children.flat()) {
      if (!child || found.has(child)) continue
      found.add(child)
      queue.push(child)
    }
  }
  return [...found]
}

/**
 * `node`, joined with {@link collectUnwalkedSchemas} in a union when there are any, so `resolver.imports` also
 * imports the schemas a printer prints for `conditionals`, `contains` or a string's `content`.
 */
export function withUnwalkedSchemas(node: ast.SchemaNode, options?: { content?: boolean }): ast.SchemaNode {
  const unwalked = collectUnwalkedSchemas(node, options)
  return unwalked.length > 0 ? ast.factory.createSchema({ type: 'union', members: [node, ...unwalked] }) : node
}
