import { getContentTypeInfo, getResponseContentTypeInfo } from '@internals/shared'
import { ast } from 'kubb/kit'

/**
 * Builds the `contentType` entry baked into the call config, or `null` for the JSON default.
 *
 * `merge` is `true` when the generated function must destructure `contentType` from `options` and
 * merge it over the baked request default, because the caller can also pick a response content type.
 */
export function buildContentType({ node }: { node: ast.HttpOperationNode }): { literal: string | null; merge: boolean } {
  const { defaultContentType } = getContentTypeInfo(node)
  const hasRequestBody = Boolean(node.requestBody?.content?.[0]?.schema)
  // Bake the request body content type only when it is not the JSON default. The first declared type is
  // the default for an operation with several request types; the caller overrides it on `contentType`.
  const requestContentType = hasRequestBody && defaultContentType !== 'application/json' ? defaultContentType : null

  if (!requestContentType) return { literal: null, merge: false }

  // When the caller can also pick a response content type, a partial `{ response }` would replace the
  // baked request default through `...config`, so merge the caller's choice over it instead.
  const merge = getResponseContentTypeInfo(node).isMultipleContentTypes

  return {
    merge,
    literal: merge
      ? `contentType: { request: '${requestContentType}', ...(typeof contentType === 'string' ? { request: contentType } : contentType) }`
      : `contentType: { request: '${requestContentType}' }`,
  }
}
