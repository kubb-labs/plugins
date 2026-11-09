import { getResponseType, getResponseTypeMap, isEventStream } from '@internals/shared'
import type { ast } from '@kubb/kit'
import type { ReturnTypeOption } from '../types.ts'
import { buildContentType } from './contentType.ts'
import { type Auth, buildSecurityMetadata } from './security.ts'
import { buildStyles } from './styles.ts'
import { buildValidatorLiteral, type ValidatorHooks } from './validator.ts'

/**
 * `responseType` baked into a call. One parser is a string. Several parsers become a map from content
 * type to parser so the runtime can choose from the response `Content-Type`.
 */
function buildResponseTypeLiteral(node: ast.HttpOperationNode): string | null {
  const responseType = getResponseType(node)
  if (responseType) return `responseType: '${responseType}'`

  const responseTypes = getResponseTypeMap(node)
  if (!responseTypes) return null

  const entries = Object.entries(responseTypes)
    .map(([contentType, type]) => `${JSON.stringify(contentType)}: '${type}'`)
    .join(', ')
  return `responseType: { ${entries} }`
}

/**
 * Builds the call config literal a generated operation forwards to the client, shared by the standalone
 * functions and the SDK methods. `baseURL` is the operation's own server and comes before the `...config` spread,
 * so a per-call `baseURL` still wins over it. The `validator` and `throwOnError` entries come after the `...config` spread, so a
 * per-call `validator` is merged per key with the generated one instead of replacing it. `styles` is merged the same
 * way, per parameter, unless `returnType` is `'plain'`.
 *
 * `mergeContentType` is `true` when the caller must destructure `contentType` from `options`, and
 * `eventStream` is `true` when the operation streams `text/event-stream` or JSON Lines. Unless `returnType` is `'plain'`, a
 * stream's literal leaves the `response` validator to `toEventStream`, which runs it per item.
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
  security?: Array<Auth>
  baseURL?: string
  throwOnErrorDefault: boolean
  returnType: ReturnTypeOption
}): { callConfig: string; mergeContentType: boolean; eventStream: boolean } {
  const eventStream = isEventStream(node)
  const securityLiteral = buildSecurityMetadata({ security })
  // A `'plain'` client is the user's own, which may type `styles` as `unknown`, so it keeps the generated styles as a default.
  const ownRuntime = returnType !== 'plain'
  const stylesLiteral = buildStyles({ node, merge: ownRuntime })
  const styles = stylesLiteral ? `styles: ${stylesLiteral}` : null
  // Unless `returnType` is `'plain'`, `toEventStream` validates per event, so `response` stays out of the call config.
  const perEvent = eventStream && ownRuntime
  const validatorLiteral = buildValidatorLiteral(validatorHooks, [
    'request',
    'path',
    'query',
    'headers',
    'cookies',
    ...(perEvent ? [] : ['response' as const]),
    'error',
  ])
  const { literal: contentTypeLiteral, merge: mergeContentType } = buildContentType({ node })

  const callConfig = `{ ${[
    `method: '${node.method.toUpperCase()}'`,
    `url: '${node.path}'`,
    baseURL ? `baseURL: ${JSON.stringify(baseURL)}` : null,
    securityLiteral ? `security: ${securityLiteral}` : null,
    ownRuntime ? null : styles,
    contentTypeLiteral,
    buildResponseTypeLiteral(node),
    '...config',
    ownRuntime ? styles : null,
    validatorLiteral,
    `throwOnError: config.throwOnError ?? ${throwOnErrorDefault}`,
  ]
    .filter(Boolean)
    .join(', ')} }`

  return { callConfig, mergeContentType, eventStream }
}
