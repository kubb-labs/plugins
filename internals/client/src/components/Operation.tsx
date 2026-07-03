import { buildOperationComments, getContentTypeInfo, getResponseContentTypeInfo, getResponseType, isEventStream } from '@internals/shared'
import { Url } from '@internals/utils'
import { ast } from 'kubb/kit'
import type { ResolverTs } from '@kubb/plugin-ts'
import type { ResolverZod } from '@kubb/plugin-zod'
import { File, Function } from 'kubb/jsx'
import type { KubbReactNode } from 'kubb/jsx'
import { buildParamsRemap } from '../builders/paramsRemap.ts'
import { buildReturnStatement } from '../builders/returnStatement.ts'
import { type Auth, buildSecurityMetadata } from '../builders/security.ts'
import { buildGroupedOptionsSignature } from '../builders/signature.ts'
import { buildStyles } from '../builders/styles.ts'
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
  const stylesLiteral = buildStyles({ node })

  const { defaultContentType } = getContentTypeInfo(node)
  const hasRequestBody = Boolean(node.requestBody?.content?.[0]?.schema)
  // Bake the request body content type only when it is not the JSON default. The first declared type is
  // the default for an operation with several request types; the caller overrides it on `contentType`.
  const bakedRequestContentType = hasRequestBody && defaultContentType !== 'application/json' ? defaultContentType : null
  // When the caller can also pick a response content type, a partial `{ response }` would replace the
  // baked request default through `...config`, so merge the caller's choice over it instead.
  const mergeContentType = Boolean(bakedRequestContentType) && getResponseContentTypeInfo(node).isMultipleContentTypes
  const contentTypeLiteral = !bakedRequestContentType
    ? null
    : mergeContentType
      ? `contentType: { request: '${bakedRequestContentType}', ...(typeof contentType === 'string' ? { request: contentType } : contentType) }`
      : `contentType: { request: '${bakedRequestContentType}' }`

  const eventStream = isEventStream(node)
  const responseType = getResponseType(node)
  const responseTypeLiteral = responseType ? `responseType: '${responseType}'` : null

  const validatorEntries = [
    validators.request ? `request: ${validators.request}` : null,
    validators.response ? `response: ${validators.response}` : null,
    validators.error ? `error: ${validators.error}` : null,
  ].filter(Boolean)
  const validatorLiteral = validatorEntries.length ? `validator: { ${validatorEntries.join(', ')} }` : null

  // The remap entries sit after `...config` so they override the camelCased groups the caller passes in.
  const callConfig = `{ ${[
    `method: '${node.method.toUpperCase()}'`,
    `url: '${Url.toCasedTemplate(node.path, { casing: 'camelcase' })}'`,
    securityLiteral ? `security: ${securityLiteral}` : null,
    stylesLiteral ? `styles: ${stylesLiteral}` : null,
    validatorLiteral,
    contentTypeLiteral,
    responseTypeLiteral,
    '...config',
    ...buildParamsRemap({ node }),
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
        {mergeContentType ? 'const { client: request = client, contentType, ...config } = options' : 'const { client: request = client, ...config } = options'}
        <br />
        {returnStatement}
      </Function>
    </File.Source>
  )
}
