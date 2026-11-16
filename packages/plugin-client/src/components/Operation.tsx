import type { OperationTypeNames } from '@internals/client'
import { buildOperationComments } from '@internals/shared'
import { ast } from '@kubb/kit'
import { File, Function } from '@kubb/renderer-jsx'
import type { KubbReactNode } from '@kubb/renderer-jsx'
import { buildOperationBody } from '../builders/operationBody.ts'
import type { OperationData } from '../builders/operationData.ts'
import { buildStreamOverloads } from '../builders/overloads.ts'
import type { SecurityRequirement } from '../builders/security.ts'
import type { ValidatorHooks } from '../builders/validator.ts'
import type { ReturnTypeOption } from '../types.ts'

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
   * The operation's validator hooks, built once by the generator and shared with its zod imports.
   */
  validatorHooks: ValidatorHooks | null
  /**
   * Shape of the value the generated function resolves to.
   */
  returnType: ReturnTypeOption
  throwOnErrorDefault: boolean
  /**
   * Per-operation security, resolved from the spec into inline security requirements and serialized onto the
   * call config's `security` field for the runtime `auth` resolver to consume.
   */
  security?: Array<SecurityRequirement>
  authRequired?: boolean
  /** The operation's own server URL from a path-level or operation-level `servers` entry, emitted as the call's default `baseURL`. */
  baseURL?: string
  stream?: boolean
  accept?: string
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
  validatorHooks,
  returnType,
  throwOnErrorDefault,
  security,
  authRequired,
  baseURL,
  stream,
  accept,
}: Props): KubbReactNode {
  if (!ast.http.isOperation(node)) return null

  const body = buildOperationBody({ node, types, validatorHooks, security, authRequired, baseURL, returnType, throwOnErrorDefault, stream, accept })

  return (
    <File.Source name={name} isExportable isIndexable>
      <Function
        name={name}
        export
        generics={body.generics}
        params={body.paramsSignature}
        returnType={body.returnType}
        JSDoc={{ comments: buildOperationComments(node, { splitLines: true }) }}
      >
        {body.mergeContentType
          ? 'const { client: apiClient = client, contentType, ...config } = options'
          : 'const { client: apiClient = client, ...config } = options'}
        <br />
        {body.statement}
      </Function>
    </File.Source>
  )
}

type StreamOverloadsProps = {
  /**
   * The JSON call and the stream call of a split JSON-or-stream operation, in that order.
   */
  calls: [OperationData, OperationData]
  returnType: ReturnTypeOption
  throwOnErrorDefault: boolean
}

/**
 * Renders a JSON-or-stream operation as one function with a `stream: true` overload for the typed events and a JSON
 * overload, see `buildStreamOverloads`.
 */
export function StreamOverloads({ calls, returnType, throwOnErrorDefault }: StreamOverloadsProps): KubbReactNode {
  const [json, stream] = calls.map((call) =>
    buildOperationBody({
      node: call.node,
      types: call.types,
      validatorHooks: call.validatorHooks,
      security: call.security,
      authRequired: call.authRequired,
      baseURL: call.baseURL,
      returnType,
      throwOnErrorDefault,
      stream: call.stream,
      accept: call.accept,
    }),
  )

  return (
    <File.Source name={calls[0].name} isExportable isIndexable>
      {buildStreamOverloads({
        name: calls[0].name,
        comments: buildOperationComments(calls[0].node, { splitLines: true }),
        json: json!,
        stream: stream!,
        clientRef: 'client',
      })}
    </File.Source>
  )
}
