import { buildOperationComments } from '@internals/shared'
import { ast } from '@kubb/kit'
import { File, Function } from '@kubb/renderer-jsx'
import type { KubbReactNode } from '@kubb/renderer-jsx'
import { buildOperationBody } from '../builders/operationBody.ts'
import type { Auth } from '../builders/security.ts'
import type { ValidatorHooks } from '../builders/validator.ts'
import type { OperationTypeNames } from '../resolveOperationTypes.ts'
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
   * Per-operation security, resolved from the spec into inline `Auth` objects and serialized onto the
   * call config's `security` field for the runtime `auth` resolver to consume.
   */
  security?: Array<Auth>
}

/**
 * Renders one client operation: the grouped `<Name>Request` type and the function that forwards a
 * single `options` object to the resolved client and returns the `Unwrappable<RequestResult>`. The
 * type, signature, and call config are built with the AST factory, and only the jsx-renderer emits
 * the source.
 */
export function Operation({ name, node, types, validatorHooks, returnType, throwOnErrorDefault, security }: Props): KubbReactNode {
  if (!ast.isHttpOperationNode(node)) return null

  const body = buildOperationBody({ node, types, validatorHooks, security, returnType, throwOnErrorDefault })

  return (
    <File.Source name={name} isExportable isIndexable>
      <Function
        name={name}
        export
        generics={body.generics}
        params={body.paramsSignature}
        returnType={body.returnType}
        JSDoc={{ comments: buildOperationComments(node, { link: 'urlPath', linkPosition: 'beforeDeprecated', splitLines: true }) }}
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
