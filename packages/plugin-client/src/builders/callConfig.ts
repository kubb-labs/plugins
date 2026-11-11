import { getEventStream, hasTextEventData } from '@internals/shared'

import { ast, code } from '@kubb/kit'
import type { ReturnTypeOption } from '../types.ts'
import { buildContentType } from './contentType.ts'
import { buildSecurityMetadata, type SecurityRequirement } from './security.ts'
import { buildStyles } from './styles.ts'
import { buildValidatorLiteral, type ValidatorHooks } from './validator.ts'

/**
 * `parseAs: 'blob'` when every success content type is binary, so a download is a `Blob` whatever its media type, and
 * also when the server sends no `Content-Type`. Any other body is decoded by its media type at runtime.
 */
function buildParseAsLiteral(node: ast.HttpOperationNode): string | null {
  const content = ast.http.responses.primary(node)?.content ?? []
  return content.length > 0 && content.every((entry) => entry.schema?.type === 'blob') ? `parseAs: 'blob'` : null
}

/**
 * Builds the call config literal a generated operation forwards to the client, shared by the standalone
 * functions and the SDK methods. The operation's own `baseURL` comes before the `...config` spread, so a per-call one wins. The
 * `validator` and `throwOnError` entries come after it, so a per-call `validator` is merged per key with the generated one instead
 * of replacing it. `styles` is merged the same way, per parameter, unless `returnType` is `'plain'`.
 *
 * `mergeContentType` is `true` when the caller must destructure `contentType` from `options`, and
 * `eventStream` is `true` when the operation streams `text/event-stream` or JSON Lines. A Server-Sent Events call
 * carries its `eventShape`, which tells the runtime what the `response` validator checks on each event, and `rawData` when
 * the document types each event's `data` as a string, so the runtime keeps it as text.
 */
export function buildCallConfig({
  node,
  validatorHooks,
  security,
  baseURL,
  throwOnErrorDefault,
  returnType,
}: {
  node: ast.HttpOperationNode
  validatorHooks: ValidatorHooks | null
  security?: Array<SecurityRequirement>
  baseURL?: string
  throwOnErrorDefault: boolean
  returnType: ReturnTypeOption
}): { callConfig: string; mergeContentType: boolean; eventStream: boolean } {
  const stream = getEventStream(node)
  const securityLiteral = buildSecurityMetadata({ security })
  // A `'plain'` client is the user's own, which may type `styles` as `unknown`, so it keeps the generated styles as a default.
  const ownRuntime = returnType !== 'plain'
  const stylesLiteral = buildStyles({ node, merge: ownRuntime })
  const styles = stylesLiteral ? `styles: ${stylesLiteral}` : null
  const validatorLiteral = buildValidatorLiteral(validatorHooks, ['request', 'path', 'query', 'headers', 'cookies', 'response', 'error'])
  const { literal: contentTypeLiteral, merge: mergeContentType } = buildContentType({ node })
  // The runtime's call types `throwOnError` as the operation's `ThrowOnError`, which the shared helper keeps. A `'plain'`
  // client takes a boolean.
  const throwOnError = ownRuntime
    ? `throwOnError: resolveThrowOnError(config.throwOnError, ${throwOnErrorDefault})`
    : `throwOnError: config.throwOnError ?? ${throwOnErrorDefault}`

  const rawData = hasTextEventData(node)
  const callConfig = `{ ${[
    `method: ${code.string(node.method.toUpperCase())}`,
    `url: ${code.string(node.path)}`,
    baseURL ? `baseURL: ${JSON.stringify(baseURL)}` : null,
    securityLiteral ? `security: ${securityLiteral}` : null,
    ownRuntime ? null : styles,
    contentTypeLiteral,
    buildParseAsLiteral(node),
    stream === 'event' || stream === 'data' ? `eventShape: '${stream}'` : null,
    rawData ? `rawData: ${code.literal(rawData)}` : null,
    '...config',
    ownRuntime ? styles : null,
    validatorLiteral,
    throwOnError,
  ]
    .filter(Boolean)
    .join(', ')} }`

  return { callConfig, mergeContentType, eventStream: stream !== null }
}
