import { ast } from 'kubb/kit'

/**
 * Collects the resolved target name of every pointer-carrying ref in a schema tree, in
 * first-occurrence order. Use this for name-only checks (e.g. redeclaration detection) where
 * `resolver.imports` would resolve file paths that are then discarded.
 */
export function collectRefNames(schema: ast.SchemaNode): Array<string> {
  return ast.collect(schema, {
    schema: (node) => {
      const refNode = ast.narrowSchema(node, 'ref')
      if (!refNode?.ref) return null

      return ast.resolveRefName(refNode)
    },
  })
}
