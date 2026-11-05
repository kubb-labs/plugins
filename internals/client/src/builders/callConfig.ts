import { getResponseType, isEventStream } from '@internals/shared'
import type { ast } from '@kubb/kit'
import type { ReturnTypeOption } from '../types.ts'
import { buildContentType } from './contentType.ts'
import { type Auth, buildSecurityMetadata } from './security.ts'
import { buildStyles } from './styles.ts'
import { buildValidatorLiteral, type ValidatorHooks } from './validator.ts'

/**
 * Builds the call config literal a generated operation forwards to the client, shared by the standalone
 * functions and the SDK methods. The `throwOnError` fallback is applied after the `...config` spread.
 *
 * `mergeContentType` is `true` when the caller must destructure `contentType` from `options`, and
 * `eventStream` is `true` when the operation returns `text/event-stream`. Unless `returnType` is `'plain'`, a
 * stream's literal spreads `...init` for the resume request and leaves the `response` validator to `toEventStream`.
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
  // Except for a plain custom client, a stream's response validator runs per event in `toEventStream`, which also resends the call with `init` after a drop.
  const resumable = eventStream && returnType !== 'plain'
  const validatorLiteral = buildValidatorLiteral(
    validatorHooks,
    resumable ? ['request', 'path', 'query', 'headers', 'error'] : ['request', 'path', 'query', 'headers', 'response', 'error'],
  )
  const { literal: contentTypeLiteral, merge: mergeContentType } = buildContentType({ node })
  const responseType = getResponseType(node)

  const callConfig = `{ ${[
    `method: '${node.method.toUpperCase()}'`,
    `url: '${node.path}'`,
    securityLiteral ? `security: ${securityLiteral}` : null,
    stylesLiteral ? `styles: ${stylesLiteral}` : null,
    validatorLiteral,
    contentTypeLiteral,
    responseType ? `responseType: '${responseType}'` : null,
    '...config',
    `throwOnError: config.throwOnError ?? ${throwOnErrorDefault}`,
    resumable ? '...init' : null,
  ]
    .filter(Boolean)
    .join(', ')} }`

  return { callConfig, mergeContentType, eventStream }
}
