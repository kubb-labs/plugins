import type { OperationTypeNames } from '@internals/client'
import { buildOperationComments } from '@internals/shared'
import { buildJSDoc } from '@internals/utils'
import { ast } from '@kubb/kit'
import { File } from '@kubb/renderer-jsx'
import type { KubbReactNode } from '@kubb/renderer-jsx'
import { buildOperationBody } from '../builders/operationBody.ts'
import { buildStreamOverloads } from '../builders/overloads.ts'
import type { SecurityRequirement } from '../builders/security.ts'
import type { ValidatorHooks } from '../builders/validator.ts'
import type { ReturnTypeOption } from '../types.ts'

/**
 * Builds one instance method of a generated SDK class; a per-call `options.client` overrides `this.client`.
 */
export function buildSdkMethod({
  node,
  name,
  types,
  validatorHooks,
  security,
  baseURL,
  returnType,
  throwOnErrorDefault,
}: {
  node: ast.OperationNode
  name: string
  types: OperationTypeNames
  validatorHooks: ValidatorHooks | null
  security?: Array<SecurityRequirement>
  baseURL?: string
  returnType: ReturnTypeOption
  throwOnErrorDefault: boolean
}): string {
  if (!ast.http.isOperation(node)) return ''

  const body = buildOperationBody({ node, types, validatorHooks, security, baseURL, returnType, throwOnErrorDefault })
  const generics = body.generics.length ? `<${body.generics.join(', ')}>` : ''
  const jsdoc = buildJSDoc(buildOperationComments(node, { splitLines: true }))

  const destructure = body.mergeContentType
    ? 'const { client: apiClient = this.client, contentType, ...config } = options'
    : 'const { client: apiClient = this.client, ...config } = options'
  const methodBody = [destructure, '', body.statement].map((line) => (line ? `    ${line}` : '')).join('\n')

  return `${jsdoc}  public ${name}${generics}(${body.paramsSignature}): ${body.returnType} {\n${methodBody}\n  }`
}

type OperationData = {
  node: ast.OperationNode
  name: string
  types: OperationTypeNames
  validatorHooks: ValidatorHooks | null
  security?: Array<SecurityRequirement>
  baseURL?: string
  stream?: boolean
  accept?: string
  split?: 'json' | 'stream'
}

type Props = {
  name: string
  operations: Array<OperationData>
  returnType: ReturnTypeOption
  throwOnErrorDefault: boolean
}

/**
 * Renders one instance class per tag with one method per operation. The constructor takes a client
 * config object and builds its own client through `createClient`, so each environment is a separate
 * instance: `const api = new PetClient({ baseURL }); api.getPetById(...)`. It also takes an existing
 * client, which is how the root SDK shares one client across its tags. The client is public so callers
 * can add interceptors, and a per-call `client` option still overrides it for a one-off call.
 */
export function SdkClient({ name, operations, returnType, throwOnErrorDefault }: Props): KubbReactNode {
  const bodyOf = (op: OperationData) =>
    buildOperationBody({
      node: op.node as ast.HttpOperationNode,
      types: op.types,
      validatorHooks: op.validatorHooks,
      security: op.security,
      baseURL: op.baseURL,
      returnType,
      throwOnErrorDefault,
      stream: op.stream,
      accept: op.accept,
    })
  // A split JSON-or-stream operation is its JSON call followed by its stream call, printed as one overloaded method.
  const methods = operations.flatMap((op, index) => {
    if (op.split === 'stream') return []
    const next = operations[index + 1]
    if (op.split === 'json' && next?.split === 'stream') {
      return [
        buildStreamOverloads({
          name: op.name,
          comments: buildOperationComments(op.node, { splitLines: true }),
          json: bodyOf(op),
          stream: bodyOf(next),
          clientRef: 'this.client',
          method: true,
        }),
      ]
    }
    return [
      buildSdkMethod({
        node: op.node,
        name: op.name,
        types: op.types,
        validatorHooks: op.validatorHooks,
        security: op.security,
        baseURL: op.baseURL,
        returnType,
        throwOnErrorDefault,
      }),
    ]
  })

  const constructor = [
    '  readonly client: ClientInstance',
    '',
    '  constructor(config: ClientConfig | ClientInstance = {}) {',
    "    this.client = typeof config === 'function' ? config : createClient(config)",
    '  }',
  ].join('\n')

  const classCode = `export class ${name} {\n${constructor}\n\n${methods.join('\n\n')}\n}`

  return (
    <File.Source name={name} isExportable isIndexable>
      {classCode}
    </File.Source>
  )
}
