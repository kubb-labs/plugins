import { buildOperationComments, getContentTypeInfo, getResponseType, isEventStream } from '@internals/shared'
import { Url } from '@internals/utils'
import { ast } from '@kubb/core'
import type { ResolverTs } from '@kubb/plugin-ts'
import type { ResolverZod } from '@kubb/plugin-zod'
import { File, Function } from '@kubb/renderer-jsx'
import type { KubbReactNode } from '@kubb/renderer-jsx/types'
import { buildReturnStatement } from '../builders/returnStatement.ts'
import { type Auth, buildSecurityMetadata } from '../builders/security.ts'
import { buildGroupedOptionsSignature } from '../builders/signature.ts'
import { buildSerializationMetadata } from '../builders/serialization.ts'
import { buildValidatorHooks } from '../builders/validator.ts'
import type { ValidatorOptions } from '../types.ts'

type Props = {
  /**
   * The generated function name.
   */
  name: string
  /**
   * The operation being generated.
   */
  node: ast.OperationNode
  /**
   * Resolver for the plugin-ts type names the signature references.
   */
  tsResolver: ResolverTs
  /**
   * Resolver for the zod schema names the validators reference, when `validator` is on.
   */
  zodResolver?: ResolverZod | null
  /**
   * The active validator option, driving the validator-hook wiring.
   */
  validator?: ValidatorOptions
  /**
   * Per-operation security, resolved from the spec into inline `Auth` objects and serialized onto the
   * call config's `security` field for the runtime `auth` resolver to consume.
   */
  security?: Array<Auth>
  isExportable?: boolean
  isIndexable?: boolean
}

/**
 * Renders one client operation: the grouped `<Name>Request` type and the function that forwards a
 * single `options` object to the resolved client and returns the `RequestResult`. The type, signature,
 * and call config are built with the AST factory, and only the jsx-renderer emits the source.
 */
export function Operation({ name, node, tsResolver, zodResolver, validator, security, isExportable = true, isIndexable = true }: Props): KubbReactNode {
  if (!ast.isHttpOperationNode(node)) return null

  const signature = buildGroupedOptionsSignature({ node, tsResolver })
  const validators = buildValidatorHooks({ node, validator, zodResolver })
  const securityLiteral = buildSecurityMetadata({ security })
  const serializationLiteral = buildSerializationMetadata({ node })

  const { defaultContentType } = getContentTypeInfo(node)
  const hasRequestBody = Boolean(node.requestBody?.content?.[0]?.schema)
  const contentTypeLiteral = hasRequestBody && defaultContentType !== 'application/json' ? `contentType: '${defaultContentType}'` : null

  const eventStream = isEventStream(node)
  const responseType = getResponseType(node)
  const responseTypeLiteral = responseType ? `responseType: '${responseType}'` : null

  const validatorEntries = [
    validators.request ? `request: ${validators.request}` : null,
    validators.response ? `response: ${validators.response}` : null,
    validators.error ? `error: ${validators.error}` : null,
  ].filter(Boolean)
  const validatorLiteral = validatorEntries.length ? `validator: { ${validatorEntries.join(', ')} }` : null

  const callConfig = `{ ${[
    `method: '${node.method.toUpperCase()}'`,
    `url: '${Url.toCasedTemplate(node.path, { casing: 'camelcase' })}'`,
    securityLiteral ? `security: ${securityLiteral}` : null,
    serializationLiteral ? `serialization: ${serializationLiteral}` : null,
    validatorLiteral,
    contentTypeLiteral,
    responseTypeLiteral,
    '...config',
  ]
    .filter(Boolean)
    .join(', ')} }`

  const eventType = `SuccessOf<${tsResolver.resolveResponsesName(node)}>`
  const returnType = eventStream ? `Promise<EventStreamResult<${eventType}>>` : signature.returnType
  const returnStatement = eventStream ? `return toEventStream<${eventType}>(request(${callConfig}))` : buildReturnStatement({ node, tsResolver, callConfig })

  return (
    <File.Source name={name} isExportable={isExportable} isIndexable={isIndexable}>
      <Function
        name={name}
        export={isExportable}
        generics={signature.generics}
        params={signature.paramsSignature}
        returnType={returnType}
        JSDoc={{ comments: buildOperationComments(node, { link: 'urlPath', linkPosition: 'beforeDeprecated', splitLines: true }) }}
      >
        {'const { client: request = client, ...config } = options'}
        <br />
        {returnStatement}
      </Function>
    </File.Source>
  )
}
