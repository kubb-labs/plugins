import {
  buildOptionsSchema,
  buildResponses,
  createCasedFile,
  createOperationParamResolver,
  createOperationResponseResolver,
  getOperationParameters,
  operationTypeImports,
} from '@internals/shared'
import { ensureValidVarName, pascalCase } from '@internals/utils'
import { ast, createResolver, type ResolverPatch } from 'kubb/kit'
import { printerTs, type PrinterTsNodes } from '../printers/printerTs.ts'
import type { PluginTs, ResolvedOptions, ResolverTs } from '../types.ts'
import { buildParams, buildResponseUnion, enumTypeName } from '../utils.ts'

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
  typeImports(node, name, params) {
    return operationTypeImports(this, node, name, params)
  },
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

type InlineResolverOptions = Pick<ResolvedOptions, 'optionalType' | 'arrayType' | 'enum'> & { nodes?: PrinterTsNodes }
type TypeSource = { schema: ast.SchemaNode; keysToOmit?: Array<string> | null }

/**
 * Patch for `pluginTs({ operationTypes: false })`: every operation type name resolves to the printed type itself
 * (`Pet`, `{ body?: Order; path?: never }`), so no operation file is emitted and consumers reuse the schema types.
 */
export function createInlineResolverTs({ nodes, ...options }: InlineResolverOptions) {
  // Printed type → the schemas it was printed from, so `typeImports` can import their `$ref` targets.
  const sourcesByType = new Map<string, Array<ast.SchemaNode>>()
  const typesByNode = new WeakMap<ast.OperationNode, Map<string, string>>()

  function enumNamesOf(schemas: Array<ast.SchemaNode>) {
    return new Set(
      schemas.flatMap((schema) =>
        ast.collectSync<string>(schema, {
          schema(node) {
            const ref = ast.narrowSchema(node, 'ref')
            // A ref without a resolved target is an adapter-promoted enum.
            const isEnum = ref?.ref && (ref.schema === undefined || ast.narrowSchema(ref.schema ?? undefined, ast.schemaTypes.enum))
            return isEnum ? (ast.resolveRefName(ref) ?? undefined) : undefined
          },
        }),
      ),
    )
  }

  function print(resolver: ResolverTs, sources: Array<TypeSource>): string {
    const schemas = sources.map(({ schema }) => schema)
    const printer = printerTs({ ...options, syntaxType: 'type', resolver, enumSchemaNames: enumNamesOf(schemas), nodes })
    const types = sources.map(({ schema, keysToOmit }) => {
      // Inline enums have no operation file to be declared in, so they print as literal unions.
      const printed = printer.print(ast.transform(schema, { schema: (node) => (node.type === 'enum' && node.name ? { ...node, name: undefined } : undefined) }))
      // Property JSDoc would repeat in every consumer that prints this type; the schema files keep theirs.
      const type = printed?.replace(/\/\*\*[\s\S]*?\*\/\s*/g, '') ?? 'unknown'
      return keysToOmit?.length ? `Omit<NonNullable<${type}>, ${keysToOmit.map((key) => `'${key}'`).join(' | ')}>` : type
    })
    const type = [...new Set(types)].join(' | ') || 'unknown'
    if (!sourcesByType.has(type)) sourcesByType.set(type, schemas)
    return type
  }

  function cached(node: ast.OperationNode, key: string, build: () => string): string {
    const types = typesByNode.get(node) ?? new Map<string, string>()
    typesByNode.set(node, types)
    if (!types.has(key)) types.set(key, build())
    return types.get(key)!
  }

  const contentSources = (content: Array<ast.ContentNode> | undefined): Array<TypeSource> =>
    (content ?? []).flatMap(({ schema, keysToOmit }) => (schema ? [{ schema, keysToOmit }] : []))
  const paramType = (location: 'path' | 'query' | 'header') =>
    function (this: ResolverTs, node: ast.OperationNode) {
      return cached(node, location, () => print(this, [{ schema: buildParams({ params: getOperationParameters(node)[location] }) }]))
    }

  return {
    param: { path: paramType('path'), query: paramType('query'), headers: paramType('header') },
    response: {
      body(node) {
        return cached(node, 'body', () => print(this, contentSources(node.requestBody?.content)))
      },
      status(node, statusCode) {
        return cached(node, `status ${statusCode}`, () => print(this, contentSources(node.responses.find((res) => res.statusCode === statusCode)?.content)))
      },
      options(node) {
        return cached(node, 'options', () => print(this, [{ schema: buildOptionsSchema(node, this, { inline: true }) }]))
      },
      responses(node) {
        return cached(node, 'responses', () => print(this, [{ schema: buildResponses(node, this, { inline: true }) }]))
      },
      response(node) {
        return cached(node, 'response', () => {
          const union = buildResponseUnion(node, { resolver: this })
          return union ? print(this, [{ schema: union }]) : 'unknown'
        })
      },
    },

    typeImports(node, name, { root, output, group }) {
      const schemas = sourcesByType.get(name)
      // Every operation type name comes from this patch, so an unknown name has nothing to import.
      if (!schemas) return []
      // Composite types (`XxxOptions`) reference other printed types by name, so follow those to their sources.
      const nested = schemas.flatMap((schema) =>
        ast.collectSync<string>(schema, {
          schema: (child) =>
            child.type === 'ref' && !child.ref && child.name && child.name !== name && sourcesByType.has(child.name) ? child.name : undefined,
        }),
      )
      const enumNames = enumNamesOf(schemas)
      const imports = schemas.flatMap((schema) =>
        this.imports({
          node: schema,
          root,
          output,
          group,
          name: (schemaName) => enumTypeName({ resolver: this, name: schemaName, enumOptions: options.enum, isEnum: enumNames.has(schemaName) }),
        }),
      )
      return [...imports, ...nested.flatMap((type) => this.typeImports(node, type, { root, output, group }))]
    },
  } satisfies ResolverPatch<ResolverTs>
}
