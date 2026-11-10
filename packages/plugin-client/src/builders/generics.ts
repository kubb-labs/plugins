import type { ast } from '@kubb/kit'
import type { OperationTypeNames } from '@internals/client'
import type { ReturnTypeOption } from '../types.ts'

/**
 * Builds the `RequestResult` generic arguments for one operation: the per-status responses record
 * plus the per-call `ThrowOnError` flag. `SuccessOf` / `ErrorOf` split the record inside the
 * runtime, so this only names the record and threads `ThrowOnError`.
 *
 * @example
 * `buildRequestResultGenerics({ node, types }) // 'AddPetResponses, ThrowOnError'`
 */
export function buildRequestResultGenerics({ node, types }: { node: ast.OperationNode; types: OperationTypeNames }): string {
  return `${types.response.responses(node)}, ThrowOnError`
}

/**
 * Builds the full return type an operation's function signature uses: `Unwrappable<RequestResult>`
 * for the default `returnType: 'full'`, already a promise so no further wrapping is needed, a plain
 * `Promise<RequestResult>` for the internal `'plain'` shape, or a
 * `Promise` of the runtime's `UnwrappedResult` when `returnType: 'data'` narrows a resolved call
 * down to the bare success body.
 *
 * @example
 * `buildResultType({ node, types, returnType: 'data' }) // 'Promise<UnwrappedResult<AddPetResponses, ThrowOnError>>'`
 */
export function buildResultType({ node, types, returnType }: { node: ast.OperationNode; types: OperationTypeNames; returnType: ReturnTypeOption }): string {
  const generics = buildRequestResultGenerics({ node, types })
  if (returnType === 'data') return `Promise<UnwrappedResult<${generics}>>`
  const headers = buildResponseHeadersType({ node, types })
  const result = headers ? `WithHeaders<RequestResult<${generics}>, ${headers}>` : `RequestResult<${generics}>`
  if (returnType === 'plain') return `Promise<${result}>`
  return `Unwrappable<${result}>`
}

/**
 * The `{ status: headers }` record of the responses that declare `headers`, for `WithHeaders`, or `null` when none does.
 *
 * @example
 * `buildResponseHeadersType({ node, types }) // "{ '200': ListPetsStatus200Headers }"`
 */
export function buildResponseHeadersType({ node, types }: { node: ast.OperationNode; types: OperationTypeNames }): string | null {
  const entries = node.responses.filter((response) => response.headers?.length).map((response) => `'${response.statusCode}': ${types.response.headers(node, response.statusCode)}`)
  return entries.length ? `{ ${entries.join('; ')} }` : null
}

/**
 * The type names of the headers an operation's responses declare, which its file imports for `WithHeaders`.
 */
export function getResponseHeadersTypeNames({ node, types }: { node: ast.OperationNode; types: OperationTypeNames }): Array<string> {
  return node.responses.filter((response) => response.headers?.length).map((response) => types.response.headers(node, response.statusCode))
}
