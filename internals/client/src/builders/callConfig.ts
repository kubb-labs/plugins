import { getResponseType, isEventStream } from '@internals/shared'
import type { ast } from 'kubb/kit'
import { buildContentType } from './contentType.ts'
import { type Auth, buildSecurityMetadata } from './security.ts'
import { buildStyles } from './styles.ts'
import { buildValidatorLiteral, type ValidatorHooks } from './validator.ts'

/**
 * Builds the call config literal a generated operation forwards to the client, shared by the standalone
 * functions and the SDK methods. The `throwOnError` fallback is applied after the `...config` spread.
 *
 * `mergeContentType` is `true` when the caller must destructure `contentType` from `options`, and
 * `eventStream` is `true` when the operation returns `text/event-stream`.
 */
export function buildCallConfig({
  node,
  validatorHooks,
  security,
  throwOnErrorDefault,
}: {
  node: ast.HttpOperationNode
  validatorHooks: ValidatorHooks | null
  security?: Array<Auth>
  throwOnErrorDefault: boolean
}): { callConfig: string; mergeContentType: boolean; eventStream: boolean } {
  const securityLiteral = buildSecurityMetadata({ security })
  const stylesLiteral = buildStyles({ node })
  const validatorLiteral = buildValidatorLiteral(validatorHooks, ['request', 'path', 'query', 'headers', 'response', 'error'])
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
  ]
    .filter(Boolean)
    .join(', ')} }`

  return { callConfig, mergeContentType, eventStream: isEventStream(node) }
}
