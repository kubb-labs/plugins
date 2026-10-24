import { createCasedFile, createOperationParamResolver, createOperationResponseResolver, typeKeywords } from '@internals/shared'
import { ensureValidVarName, pascalCase } from '@internals/utils'
import { ast, createResolver, type ResolverPatch } from 'kubb/kit'
import type { PluginTs, ResolvedOptions, ResolverTs } from '../types.ts'
import { enumTypeName } from '../utils.ts'

/**
 * Default resolver used by `@kubb/plugin-ts`. Decides the names and file paths
 * for every generated TypeScript type. Import this in other plugins that need
 * to reference the exact names `plugin-ts` produces without duplicating the
 * casing/file-layout rules.
 *
 * The `default` helpers are supplied by `createResolver`. This plugin overrides the top-level `name`
 * to use PascalCase for value and type names and `file` to write PascalCase file paths (dotted names
 * become `/`-joined), and groups the operation-specific naming under the `param`, `response`, and
 * `enum` namespaces.
 *
 * @example Resolve a type and file name
 * ```ts
 * import { resolverTs } from '@kubb/plugin-ts'
 *
 * resolverTs.name('list pets')                     // 'ListPets'
 * resolverTs.response.status(node, 200)            // 'ListPetsStatus200'
 * ```
 */
export const resolverTs = createResolver<PluginTs>({
  pluginName: 'plugin-ts',
  name(name) {
    return ensureValidVarName(pascalCase(name))
  },
  file: createCasedFile(pascalCase),
  param: createOperationParamResolver(),
  response: {
    ...createOperationResponseResolver(),
    options(node) {
      return this.name(`${node.operationId} Options`)
    },
  },
  enum: {
    keyName(node, enumTypeSuffix = 'key') {
      return `${this.name(node.name ?? '')}${enumTypeSuffix}`
    },
  },
})

const responseResolver = createOperationResponseResolver()

/**
 * Patch for `pluginTs({ operationTypes: false })`: a body or response whose content types all reference one `$ref` resolves to the referenced type (`Pet`).
 */
export function createRefResolverTs(enumOptions: ResolvedOptions['enum']) {
  type RefType = { schemaName: string | null; typeName: string }
  const refsByNode = new WeakMap<ast.OperationNode, { body: RefType | null; status: Map<ast.StatusCode, RefType | null> }>()

  function refType(resolver: ResolverTs, content: Array<ast.ContentNode> | undefined, { body = false } = {}): RefType | null {
    const [first] = content ?? []
    if (content?.length === 1 && first?.schema && typeKeywords.has(first.schema.type)) return { schemaName: null, typeName: first.schema.type }
    // Only fields that change the TS type block inlining (a body's `optional` moves to the `body?` key of `XxxOptions`), and a
    // ref without a resolved target (an adapter-promoted enum) keeps its alias.
    const refs = (content ?? []).map((entry) => {
      const ref = ast.narrowSchema(entry.schema, 'ref')
      return ref && ref.schema !== undefined && !entry.keysToOmit?.length && !ref.nullable && !ref.nullish && (body || !ref.optional) ? ref : null
    })
    const schemaNames = new Set(refs.map((ref) => ast.resolveRefName(ref)))
    const [schemaName] = schemaNames
    if (!refs.length || schemaNames.size !== 1 || !schemaName) return null
    const isEnum = ast.narrowSchema(refs[0]!.schema ?? undefined, ast.schemaTypes.enum) !== null
    return { schemaName, typeName: enumTypeName({ resolver, name: schemaName, enumOptions, isEnum }) }
  }

  function refsOf(resolver: ResolverTs, node: ast.OperationNode) {
    let refs = refsByNode.get(node)
    if (!refs) {
      refs = {
        body: refType(resolver, node.requestBody?.content, { body: true }),
        status: new Map(node.responses.map((res) => [res.statusCode, refType(resolver, res.content)])),
      }
      refsByNode.set(node, refs)
    }
    return refs
  }

  return {
    response: {
      body(node) {
        return refsOf(this, node).body?.typeName ?? responseResolver.body.call(this, node)
      },
      status(node, statusCode) {
        return refsOf(this, node).status.get(statusCode)?.typeName ?? responseResolver.status.call(this, node, statusCode)
      },
      ref(node, name) {
        const { body, status } = refsOf(this, node)
        return [body, ...status.values()].find((ref) => ref?.typeName === name)?.schemaName ?? null
      },
    },
  } satisfies ResolverPatch<ResolverTs>
}
