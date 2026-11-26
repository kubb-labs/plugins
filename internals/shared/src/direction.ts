import { ast } from '@internals/ast'
import type { Direction } from './types.ts'

/**
 * Runs the handler of a node once per direction, outside a printer, and reports whether the two outputs differ.
 * That difference is what makes a component need an `${name}InputSchema` variant. The handler must not read its children.
 */
export function variesByDirection<TOptions extends { direction?: Direction }>({
  node,
  handler,
  options,
}: {
  node: ast.SchemaNode
  handler: unknown
  options: TOptions
}): boolean {
  if (!handler) return false

  const call = (direction: Direction) => {
    const context = { options: { ...options, direction }, transform: () => null, base: () => null, import: () => {} }
    return (handler as (this: typeof context, node: ast.SchemaNode) => string | null).call(context, node)
  }

  return call('decode') !== call('encode')
}

/**
 * Whether the schema holds a node `varies` reports, so it decodes on responses and encodes on requests.
 * Follows a `$ref` through its resolved schema.
 */
export function containsDirectionalNode({
  node,
  varies,
  cache,
}: {
  node: ast.SchemaNode | undefined
  varies: (node: ast.SchemaNode) => boolean
  cache?: WeakMap<ast.SchemaNode, ast.SchemaNode | null>
}): boolean {
  if (!node) return false

  return ast.schema.find(node, { predicate: varies, follow: ['ref'], cache }) !== undefined
}

/**
 * Names of the `$ref` schemas a request schema reads from their `${name}InputSchema` variant.
 */
export function collectDirectionalRefNames({ node, contains }: { node: ast.SchemaNode; contains: (node: ast.SchemaNode) => boolean }): Array<string> {
  return ast.node.collect<string>(node, {
    schema: (n) => (n.type === ast.schema.types.ref && n.ref && contains(n) ? (ast.ref.getName(n) ?? undefined) : undefined),
  })
}
