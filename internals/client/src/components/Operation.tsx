import { buildOperationComments, getResponseType, isEventStream } from '@internals/shared'
import { ast } from 'kubb/kit'
import type { ResolverZod } from '@kubb/plugin-zod'
import { File, Function } from 'kubb/jsx'
import type { KubbReactNode } from 'kubb/jsx'
import { buildContentType } from '../builders/contentType.ts'
import { buildReturnStatement } from '../builders/returnStatement.ts'
import { type Auth, buildSecurityMetadata } from '../builders/security.ts'
import { buildGroupedOptionsSignature } from '../builders/signature.ts'
import { buildStyles } from '../builders/styles.ts'
import { buildValidatorHooks } from '../builders/validator.ts'
import type { OperationTypeNames } from '../resolveOperationTypes.ts'
import type { ReturnTypeOption, ValidatorOptions } from '../types.ts'

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
   * The operation type names the signature references, from `plugin-ts` or `plugin-zod`'s inferred
   * types.
   */
  types: OperationTypeNames
  /**
   * Resolver for the zod schema names the validators reference, when `validator` is on.
   */
  zodResolver?: ResolverZod | null
  /**
   * The active validator option, driving the validator-hook wiring.
   */
  validator?: ValidatorOptions
  /**
   * Shape of the value the generated function resolves to.
   */
  returnType: ReturnTypeOption
  throwOnErrorDefault: boolean
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
 * single `options` object to the resolved client and returns the `Unwrappable<RequestResult>`. The
 * type, signature, and call config are built with the AST factory, and only the jsx-renderer emits
 * the source.
 */
export function Operation({
  name,
  node,
  types,
  zodResolver,
  validator,
  returnType,
  throwOnErrorDefault,
  security,
  isExportable = true,
  isIndexable = true,
}: Props): KubbReactNode {
  if (!ast.isHttpOperationNode(node)) return null

  const signature = buildGroupedOptionsSignature({ node, types, returnType, throwOnErrorDefault })
  const validators = buildValidatorHooks({ node, validator, zodResolver })
  const securityLiteral = buildSecurityMetadata({ security })
  const stylesLiteral = buildStyles({ node })

  const { literal: contentTypeLiteral, merge: mergeContentType } = buildContentType({ node })

  const eventStream = isEventStream(node)
  const responseType = getResponseType(node)
  const responseTypeLiteral = responseType ? `responseType: '${responseType}'` : null

  const validatorEntries = [
    validators.request ? `request: ${validators.request}` : null,
    validators.path ? `path: ${validators.path}` : null,
    validators.query ? `query: ${validators.query}` : null,
    validators.headers ? `headers: ${validators.headers}` : null,
    validators.response ? `response: ${validators.response}` : null,
    validators.error ? `error: ${validators.error}` : null,
  ].filter(Boolean)
  const validatorLiteral = validatorEntries.length ? `validator: { ${validatorEntries.join(', ')} }` : null

  const callConfig = `{ ${[
    `method: '${node.method.toUpperCase()}'`,
    `url: '${node.path}'`,
    securityLiteral ? `security: ${securityLiteral}` : null,
    stylesLiteral ? `styles: ${stylesLiteral}` : null,
    validatorLiteral,
    contentTypeLiteral,
    responseTypeLiteral,
    '...config',
    `throwOnError: config.throwOnError ?? ${throwOnErrorDefault}`,
  ]
    .filter(Boolean)
    .join(', ')} }`

  const eventType = `SuccessOf<${types.response.responses(node)}>`
  const functionReturnType = eventStream ? `Promise<EventStreamResult<${eventType}>>` : signature.returnType
  const returnStatement = eventStream
    ? `return toEventStream<${eventType}>(request(${callConfig}))`
    : buildReturnStatement({ node, types, callConfig, returnType, throwOnErrorDefault })

  return (
    <File.Source name={name} isExportable={isExportable} isIndexable={isIndexable}>
      <Function
        name={name}
        export={isExportable}
        generics={signature.generics}
        params={signature.paramsSignature}
        returnType={functionReturnType}
        JSDoc={{ comments: buildOperationComments(node, { link: 'urlPath', linkPosition: 'beforeDeprecated', splitLines: true }) }}
      >
        {mergeContentType ? 'const { client: request = client, contentType, ...config } = options' : 'const { client: request = client, ...config } = options'}
        <br />
        {returnStatement}
      </Function>
    </File.Source>
  )
}
