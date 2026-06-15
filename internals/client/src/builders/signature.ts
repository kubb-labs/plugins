import type { ast } from '@kubb/core'
import type { ResolverTs } from '@kubb/plugin-ts'
import { buildRequestResultGenerics } from './generics.ts'

/**
 * The pieces of a generated operation function's grouped-options signature.
 */
export type GroupedOptionsSignature = {
  /**
   * Name of the per-operation grouped data type (`<Name>Data`).
   */
  dataTypeName: string
  /**
   * Body of the per-operation grouped data type, with the contract key names
   * (`body` / `path` / `query` / `headers` / `url`) derived from the plugin-ts `<Name>RequestConfig`.
   */
  dataTypeDefinition: string
  /**
   * The single function parameter: `options: Options<<Name>Data, ThrowOnError>`.
   */
  paramsSignature: string
  /**
   * The function return type: `Promise<RequestResult<<Name>Responses, ThrowOnError>>`.
   */
  returnType: string
  /**
   * The function generics. One per-call `ThrowOnError` flag, defaulting to `true`.
   */
  generics: Array<string>
  /**
   * The plugin-ts type names the generated file imports (type-only).
   */
  importedTypeNames: Array<string>
}

/**
 * Builds the grouped-options signature for one operation: a single `options` object whose `TData`
 * carries a literal `url`, and a `RequestResult` return type keyed to the plugin-ts per-status
 * responses record. There are no positional arguments.
 *
 * The grouped data type reuses the plugin-ts `<Name>RequestConfig` through indexed access, so the
 * generated file only imports `<Name>RequestConfig` and `<Name>Responses` and never collides with
 * the per-direction type names.
 */
export function buildGroupedOptionsSignature({ node, tsResolver }: { node: ast.OperationNode; tsResolver: ResolverTs }): GroupedOptionsSignature {
  const requestConfigName = tsResolver.resolveRequestConfigName(node)
  const responsesName = tsResolver.resolveResponsesName(node)
  const dataTypeName = tsResolver.resolveDataName(node)
  const hasBody = Boolean(node.requestBody?.content?.[0]?.schema)
  const resultGenerics = buildRequestResultGenerics({ node, tsResolver })

  const dataTypeDefinition = [
    '{',
    `  body${hasBody ? '' : '?'}: ${requestConfigName}['data']`,
    `  path?: ${requestConfigName}['pathParams']`,
    `  query?: ${requestConfigName}['queryParams']`,
    `  headers?: ${requestConfigName}['headerParams']`,
    `  url: ${requestConfigName}['url']`,
    '}',
  ].join('\n')

  return {
    dataTypeName,
    dataTypeDefinition,
    paramsSignature: `options: Options<${dataTypeName}, ThrowOnError>`,
    returnType: `Promise<RequestResult<${resultGenerics}>>`,
    generics: ['ThrowOnError extends boolean = true'],
    importedTypeNames: [requestConfigName, responsesName],
  }
}
