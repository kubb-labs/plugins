import { buildOperationComments } from '@internals/shared'
import { buildJSDoc } from '@internals/utils'
import { ast } from '@kubb/kit'
import { File } from '@kubb/renderer-jsx'
import type { KubbReactNode } from '@kubb/renderer-jsx'
import { buildOperationBody } from '../builders/operationBody.ts'
import type { Auth } from '../builders/security.ts'
import type { ValidatorHooks } from '../builders/validator.ts'
import type { OperationTypeNames } from '../resolveOperationTypes.ts'
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
  returnType,
  throwOnErrorDefault,
}: {
  node: ast.OperationNode
  name: string
  types: OperationTypeNames
  validatorHooks: ValidatorHooks | null
  security?: Array<Auth>
  returnType: ReturnTypeOption
  throwOnErrorDefault: boolean
}): string {
  if (!ast.isHttpOperationNode(node)) return ''

  const body = buildOperationBody({ node, types, validatorHooks, security, returnType, throwOnErrorDefault })
  const generics = body.generics.length ? `<${body.generics.join(', ')}>` : ''
  const jsdoc = buildJSDoc(buildOperationComments(node, { link: 'urlPath', linkPosition: 'beforeDeprecated', splitLines: true }))

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
  security?: Array<Auth>
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
 * instance: `const api = new PetClient({ baseURL }); api.getPetById(...)`. A per-call `client` option
 * still overrides the instance client for a one-off call.
 */
export function SdkClient({ name, operations, returnType, throwOnErrorDefault }: Props): KubbReactNode {
  const methods = operations.map(({ node, name: methodName, types, validatorHooks, security }) =>
    buildSdkMethod({
      node,
      name: methodName,
      types,
      validatorHooks,
      security,
      returnType,
      throwOnErrorDefault,
    }),
  )

  const constructor = [
    '  private readonly client: ClientInstance',
    '',
    '  constructor(config: ClientConfig = {}) {',
    '    this.client = createClient(config)',
    '  }',
  ].join('\n')

  const classCode = `export class ${name} {\n${constructor}\n\n${methods.join('\n\n')}\n}`

  return (
    <File.Source name={name} isExportable isIndexable>
      {classCode}
    </File.Source>
  )
}
