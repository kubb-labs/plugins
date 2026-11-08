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
 * functions and the SDK methods. The `throwOnError` fallback is applied after the `...config` spread.
 *
 * `mergeContentType` is `true` when the caller must destructure `contentType` from `options`, and
 * `eventStream` is `true` when the operation returns `text/event-stream`. Unless `returnType` is `'plain'`, a
 * stream's literal leaves the `response` validator to `toEventStream`, which runs it per event.
 */
export function buildCallConfig({
  node,
  validatorHooks,
  security,
  throwOnErrorDefault,
  returnType,
}: {
  node: ast.HttpOperationNode
  validatorHooks: ValidatorHooks | null
  security?: Array<Auth>
  throwOnErrorDefault: boolean
  returnType: ReturnTypeOption
}): { callConfig: string; mergeContentType: boolean; eventStream: boolean } {
  const eventStream = isEventStream(node)
  const securityLiteral = buildSecurityMetadata({ security })
  const stylesLiteral = buildStyles({ node })
  // Unless `returnType` is `'plain'`, `toEventStream` validates per event, so `response` stays out of the call config.
  const perEvent = eventStream && returnType !== 'plain'
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
    securityLiteral ? `security: ${securityLiteral}` : null,
    stylesLiteral ? `styles: ${stylesLiteral}` : null,
    validatorLiteral,
    contentTypeLiteral,
    buildResponseTypeLiteral(node),
    '...config',
    `throwOnError: config.throwOnError ?? ${throwOnErrorDefault}`,
  ]
    .filter(Boolean)
    .join(', ')} }`

  return { callConfig, mergeContentType, eventStream }
}
