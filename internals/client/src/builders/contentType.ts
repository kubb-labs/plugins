import { getContentTypeInfo, getResponseContentTypeInfo, hasEventStreamContent } from '@internals/shared'
import { ast } from '@kubb/kit'

/**
 * Builds the `contentType` entry baked into the call config. It holds the request default when the operation has a body
 * and `response: 'text/event-stream'` when its response offers events, and is `null` with neither.
 *
 * `merge` is `true` when the generated function must destructure `contentType` from `options` and merge it over the
 * baked defaults, because the caller can also pick a response content type or a stream must keep its `Accept`.
 */
export function buildContentType({ node }: { node: ast.HttpOperationNode }): { literal: string | null; merge: boolean } {
  const { defaultContentType } = getContentTypeInfo(node)
  const hasRequestBody = Boolean(node.requestBody?.content?.[0]?.schema)
  // The first declared type is the default; the caller overrides it on `contentType`.
  const requestContentType = hasRequestBody ? defaultContentType : null
  // A response that offers a stream asks for `text/event-stream`, even next to JSON, so a client whose default `Accept` prefers
  // JSON, such as axios, gets events. The caller picks another type with `contentType.response`.
  const response = hasEventStreamContent(node) ? `response: 'text/event-stream'` : null

  if (!requestContentType) return { literal: response && `contentType: { ${response} }`, merge: false }

  // When the caller can also pick a response content type, or a stream must keep its `Accept`, a partial `contentType` would
  // replace the baked default through `...config`, so merge the caller's choice over it instead.
  const merge = Boolean(response) || getResponseContentTypeInfo(node).isMultipleContentTypes
  const defaults = [`request: '${requestContentType}'`, response].filter(Boolean).join(', ')

  return {
    merge,
    literal: merge
      ? `contentType: { ${defaults}, ...(typeof contentType === 'string' ? { request: contentType } : contentType) }`
      : `contentType: { ${defaults} }`,
  }
}
