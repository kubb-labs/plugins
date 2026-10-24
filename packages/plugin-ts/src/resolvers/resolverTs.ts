import { createCasedFile, createOperationParamResolver, createOperationResponseResolver } from '@internals/shared'
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
 * Patch for `pluginTs({ operationTypes: false })`: a body or response backed by a single `$ref` resolves to the referenced type (`Pet`).
 */
export function createRefResolverTs(enumOptions: ResolvedOptions['enum']) {
  function refType(resolver: ResolverTs, content: Array<ast.ContentNode> | undefined) {
    const entry = content?.length === 1 ? content[0]! : null
    const schemaName = entry && ast.isBareRef(entry.schema, entry.keysToOmit) ? ast.resolveRefName(entry.schema) : null
    if (!schemaName) return null
    const isEnum = ast.narrowSchema(ast.narrowSchema(entry!.schema, 'ref')?.schema ?? undefined, ast.schemaTypes.enum) !== null
    return { schemaName, typeName: enumTypeName({ resolver, name: schemaName, enumOptions, isEnum }) }
  }

  return {
    response: {
      body(node) {
        return refType(this, node.requestBody?.content)?.typeName ?? responseResolver.body.call(this, node)
      },
      status(node, statusCode) {
        return (
          refType(this, node.responses.find((res) => res.statusCode === statusCode)?.content)?.typeName ?? responseResolver.status.call(this, node, statusCode)
        )
      },
      ref(node, name) {
        const contents = [node.requestBody?.content, ...node.responses.map((res) => res.content)]
        return contents.map((content) => refType(this, content)).find((ref) => ref?.typeName === name)?.schemaName ?? null
      },
    },
  } satisfies ResolverPatch<ResolverTs>
}
