import { ast } from '@kubb/core'
import { functionPrinter, type ResolverTs, renderType } from '@kubb/plugin-ts'
import { buildRequestResultGenerics } from './generics.ts'

const declarationPrinter = functionPrinter({ mode: 'declaration' })

/**
 * The pieces of a generated operation function's grouped-options signature.
 */
export type GroupedOptionsSignature = {
  /**
   * Name of the per-operation grouped data type (`<Name>Data`).
   */
  dataTypeName: string
  /**
   * Rendered body of the per-operation grouped data type, with the contract key names
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
 * The grouped data type is an AST type literal whose members index into the plugin-ts
 * `<Name>RequestConfig`, so the generated file only imports `<Name>RequestConfig` and `<Name>Responses`
 * and never collides with the per-direction type names.
 */
export function buildGroupedOptionsSignature({ node, tsResolver }: { node: ast.OperationNode; tsResolver: ResolverTs }): GroupedOptionsSignature {
  const requestConfigName = tsResolver.resolveRequestConfigName(node)
  const responsesName = tsResolver.resolveResponsesName(node)
  const dataTypeName = tsResolver.resolveDataName(node)
  const hasBody = Boolean(node.requestBody?.content?.[0]?.schema)
  const resultGenerics = buildRequestResultGenerics({ node, tsResolver })

  const indexed = (indexType: string) => ast.factory.createIndexedAccessType({ objectType: requestConfigName, indexType })
  const dataTypeDefinition = renderType(
    ast.factory.createTypeLiteral({
      members: [
        { name: 'body', type: indexed('data'), optional: !hasBody },
        { name: 'path', type: indexed('pathParams'), optional: true },
        { name: 'query', type: indexed('queryParams'), optional: true },
        { name: 'headers', type: indexed('headerParams'), optional: true },
        { name: 'url', type: indexed('url'), optional: false },
      ],
    }),
  )

  const paramsSignature =
    declarationPrinter.print(
      ast.factory.createFunctionParameters({
        params: [ast.factory.createFunctionParameter({ name: 'options', type: `Options<${dataTypeName}, ThrowOnError>` })],
      }),
    ) ?? ''

  return {
    dataTypeName,
    dataTypeDefinition,
    paramsSignature,
    returnType: `Promise<RequestResult<${resultGenerics}>>`,
    generics: ['ThrowOnError extends boolean = true'],
    importedTypeNames: [requestConfigName, responsesName],
  }
}
