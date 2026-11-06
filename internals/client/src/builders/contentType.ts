import { getContentTypeInfo, getResponseContentTypeInfo, isEventStream } from '@internals/shared'
import { ast } from '@kubb/kit'

/**
 * Builds the `contentType` entry baked into the call config, or `null` without a request body.
 *
 * `merge` is `true` when the generated function must destructure `contentType` from `options` and
 * merge it over the baked request default, because the caller can also pick a response content type.
 */
export function buildContentType({ node }: { node: ast.HttpOperationNode }): { literal: string | null; merge: boolean } {
  const { defaultContentType } = getContentTypeInfo(node)
  const hasRequestBody = Boolean(node.requestBody?.content?.[0]?.schema)
  // The first declared type is the default; the caller overrides it on `contentType`.
  const requestContentType = hasRequestBody ? defaultContentType : null
  // A stream asks for `text/event-stream`, so a client whose default `Accept` prefers JSON, such as axios, gets events.
  const response = isEventStream(node) ? `response: 'text/event-stream'` : null

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
