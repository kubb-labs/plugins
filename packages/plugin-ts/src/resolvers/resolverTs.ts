import { createCasedFile, createOperationParamResolver, createOperationResponseResolver } from '@internals/shared'
import { ensureValidVarName, pascalCase } from '@internals/utils'
import { ast, createResolver, type ResolverPatch } from 'kubb/kit'
import type { PluginTs, ResolverTs } from '../types.ts'

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

// shortcut: a `$ref` to an `asConst` enum resolves to `PetStatus`, not the emitted `PetStatusKey`, so the operation file keeps an alias under that name; skip enum refs here if two operations sharing one enum collide in a barrel.
function refName(content: Array<ast.ContentNode> | undefined): string | null {
  const entries = content?.filter((entry) => entry.schema) ?? []
  if (entries.length !== 1 || entries[0]!.keysToOmit?.length) return null
  const ref = ast.narrowSchema(entries[0]!.schema, 'ref')
  return ref?.ref ? ast.resolveRefName(ref) : null
}

/**
 * Patch that `pluginTs({ operationTypes: false })` merges onto {@link resolverTs}. A request body or
 * response backed by a single `$ref` resolves to the referenced type (`Pet`) instead of its
 * per-operation alias, so every plugin reading this resolver references `Pet` directly.
 */
export const refResolverTs = {
  response: {
    body(node) {
      const name = refName(node.requestBody?.content)
      return name ? this.name(name) : responseResolver.body.call(this, node)
    },
    status(node, statusCode) {
      const name = refName(node.responses.find((res) => res.statusCode === statusCode)?.content)
      return name ? this.name(name) : responseResolver.status.call(this, node, statusCode)
    },
  },
} satisfies ResolverPatch<ResolverTs>
