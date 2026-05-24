import { join } from 'node:path'
import { getContentTypeInfo } from '@internals/shared'
import { isValidVarName } from '@internals/utils'
import { ast } from '@kubb/core'

/**
 * Direction of a generated date transformer.
 * - `response` parses incoming ISO strings into `Date` objects.
 * - `request` serializes `Date` objects back into ISO strings.
 */
export type TransformDirection = 'response' | 'request'

/**
 * Subfolder (relative to the client output) that holds the generated transformer files.
 */
export const transformersDirName = 'transformers'

/**
 * Output used for the generated transformer files: the client output with the
 * `transformers` subfolder appended. Both the transformer generator and the client
 * generator call this so import paths line up.
 */
export function resolveTransformerOutput<T extends { path: string }>(output: T): T {
  return { ...output, path: join(output.path, transformersDirName) }
}

/**
 * Maps a TypeScript type name to its generated response-parser function name.
 * Mirrors how `@kubb/plugin-zod` exposes `.parse` for the response direction.
 */
export function parseFnName(typeName: string): string {
  return `parse${typeName}`
}

/**
 * Maps a TypeScript type name to its generated serializer function name.
 */
export function serializeFnName(typeName: string): string {
  return `serialize${typeName}`
}

/**
 * Options threaded through the recursive expression builder.
 */
export type BuildTransformOptions = {
  direction: TransformDirection
  /**
   * Resolves a referenced schema name to the transformer/serializer function to call.
   * The generator supplies this so refs delegate to sibling transformer files.
   */
  refFnName: (schemaName: string) => string
}

/**
 * A leaf schema is a runtime `Date` only when it is a `date`/`time` node whose
 * representation is `date` (i.e. the adapter ran with `dateType: 'date'`).
 * `datetime` nodes always stay strings and are never converted.
 */
function isDateLeaf(node: ast.SchemaNode): boolean {
  return (node.type === 'date' || node.type === 'time') && (node as { representation?: string }).representation === 'date'
}

function access(acc: string, key: string): string {
  return isValidVarName(key) ? `${acc}.${key}` : `${acc}[${JSON.stringify(key)}]`
}

function propKey(key: string): string {
  return isValidVarName(key) ? key : JSON.stringify(key)
}

/**
 * Returns `true` when a schema tree contains at least one `date`/`time` field
 * with `representation: 'date'`. Refs are followed through `node.schema` with a
 * path-scoped cycle guard so recursive schemas terminate.
 *
 * Object `additionalProperties`/`patternProperties` (records) and `union`/`intersection`
 * members are intentionally not inspected — those shapes are left untouched.
 */
export function containsDateField(node: ast.SchemaNode | undefined | null, seen: ReadonlySet<string> = new Set()): boolean {
  if (!node) return false
  if (isDateLeaf(node)) return true

  switch (node.type) {
    case 'ref': {
      const name = ast.resolveRefName(node)
      if (name && seen.has(name)) return false
      const next = name ? new Set([...seen, name]) : seen
      return containsDateField(node.schema ?? undefined, next)
    }
    case 'object': {
      const objectNode = node as ast.ObjectSchemaNode
      return (objectNode.properties ?? []).some((prop) => containsDateField(prop.schema, seen))
    }
    case 'array':
    case 'tuple': {
      const arrayNode = node as ast.ArraySchemaNode
      if ((arrayNode.items ?? []).some((item) => containsDateField(item, seen))) return true
      return containsDateField(arrayNode.rest, seen)
    }
    default:
      return false
  }
}

function buildLeaf(acc: string, node: ast.SchemaNode, direction: TransformDirection): string {
  if (direction === 'response') {
    return `toDate(${acc})`
  }
  if (node.type === 'time' || node.format === 'time') {
    return `toTimeISO(${acc})`
  }
  if (node.format === 'date') {
    return `toDateISO(${acc})`
  }
  return `toISO(${acc})`
}

/**
 * Builds a runtime expression that converts the date fields reachable from `acc`
 * (an `any`-typed accessor expression) according to the schema tree. Refs delegate
 * to sibling transformer functions instead of being inlined, which keeps output
 * small and handles recursive schemas.
 */
export function buildTransformExpression(acc: string, node: ast.SchemaNode, options: BuildTransformOptions): string {
  if (!containsDateField(node)) {
    return acc
  }

  if (isDateLeaf(node)) {
    return buildLeaf(acc, node, options.direction)
  }

  switch (node.type) {
    case 'ref': {
      const name = ast.resolveRefName(node)
      if (!name) return acc
      return `${options.refFnName(name)}(${acc})`
    }
    case 'object': {
      const objectNode = node as ast.ObjectSchemaNode
      const dateProps = (objectNode.properties ?? []).filter((prop) => containsDateField(prop.schema))
      if (dateProps.length === 0) {
        return acc
      }

      const assignments = dateProps.map((prop) => `${propKey(prop.name)}: ${buildTransformExpression(access(acc, prop.name), prop.schema, options)}`)
      return `${acc} == null ? ${acc} : { ...${acc}, ${assignments.join(', ')} }`
    }
    case 'array':
    case 'tuple': {
      const arrayNode = node as ast.ArraySchemaNode
      const itemNode = (arrayNode.items ?? [])[0] ?? arrayNode.rest
      if (!itemNode) return acc
      return `${acc}?.map((item: any) => ${buildTransformExpression('item', itemNode, options)})`
    }
    default:
      return acc
  }
}

/**
 * Builds the body of a generated transformer/serializer function. The function
 * signature is generic (`<T>(data: T): T`), so no generated type imports are
 * needed; the body casts to `any` to walk the runtime value.
 */
export function buildTransformerBody(node: ast.SchemaNode, options: BuildTransformOptions): string {
  const expression = buildTransformExpression('_data', node, options)
  if (expression === '_data') {
    return 'return data'
  }
  return [`const _data = data as any`, `return (${expression}) as T`].join('\n')
}

/**
 * Whether the request is sent as `FormData` (single multipart or multi-content-type
 * including multipart). Those requests serialize Dates through `buildFormData`, so the
 * generated `serialize*` transformer is skipped to avoid an unused import.
 */
export function requestUsesFormData(node: ast.OperationNode): boolean {
  const { isMultipleContentTypes, hasFormData, defaultContentType } = getContentTypeInfo(node)
  return (!isMultipleContentTypes && defaultContentType === 'multipart/form-data') || (isMultipleContentTypes && hasFormData)
}

/**
 * Resolves the `serialize*` function name for an operation's request body, or `null`
 * when there is no date-bearing JSON body to serialize.
 */
export function resolveRequestSerializeName(node: ast.OperationNode, resolveDataName: (node: ast.OperationNode) => string): string | null {
  const schema = node.requestBody?.content?.[0]?.schema
  if (!schema || requestUsesFormData(node) || !containsDateField(schema)) {
    return null
  }
  return serializeFnName(resolveDataName(node))
}

/**
 * Resolves the `transform*` function name for an operation's primary success response,
 * or `null` when there is no date-bearing response to transform.
 */
export function resolveResponseTransformName(
  node: ast.OperationNode,
  resolveResponseStatusName: (node: ast.OperationNode, statusCode: ast.StatusCode) => string,
): string | null {
  const success = node.responses.find((response) => {
    const code = Number(response.statusCode)
    return code >= 200 && code < 300
  })
  if (!success?.schema || !containsDateField(success.schema)) {
    return null
  }
  return parseFnName(resolveResponseStatusName(node, success.statusCode))
}

/**
 * Collects the directly-referenced schema names whose target contains date fields.
 * Used to emit imports for the sibling transformer functions a transformer delegates to.
 * Refs are not followed transitively (each referenced schema imports its own dependencies).
 */
export function collectDirectDateRefs(node: ast.SchemaNode): Array<string> {
  const names = new Set<string>()
  ast.collect<void>(node, {
    schema(child) {
      if (child.type === 'ref') {
        const name = ast.resolveRefName(child)
        if (name && containsDateField(child)) {
          names.add(name)
        }
      }
    },
  })
  return [...names]
}
