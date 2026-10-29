import { buildOperationComments } from '@internals/shared'
import { buildJSDoc } from '@internals/utils'
import { ast } from '@kubb/kit'
import { File } from '@kubb/renderer-jsx'
import type { KubbReactNode } from '@kubb/renderer-jsx'
import { buildCallConfig } from '../builders/callConfig.ts'
import { buildEventStreamReturn, buildReturnStatement } from '../builders/returnStatement.ts'
import type { Auth } from '../builders/security.ts'
import { buildGroupedOptionsSignature } from '../builders/signature.ts'
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

  const signature = buildGroupedOptionsSignature({ node, types, returnType, throwOnErrorDefault })
  const { callConfig, mergeContentType, eventStream } = buildCallConfig({ node, validatorHooks, security, throwOnErrorDefault })
  const eventStreamReturn = eventStream ? buildEventStreamReturn({ node, types, callConfig }) : null
  const methodReturnType = eventStreamReturn?.returnType ?? signature.returnType
  const returnStatement = eventStreamReturn?.statement ?? buildReturnStatement({ node, types, callConfig, returnType, throwOnErrorDefault })
  const generics = signature.generics.length ? `<${signature.generics.join(', ')}>` : ''
  const jsdoc = buildJSDoc(buildOperationComments(node, { link: 'urlPath', linkPosition: 'beforeDeprecated', splitLines: true }))

  const destructure = mergeContentType
    ? 'const { client: request = this.client, contentType, ...config } = options'
    : 'const { client: request = this.client, ...config } = options'
  const methodBody = [destructure, '', returnStatement].map((line) => (line ? `    ${line}` : '')).join('\n')

  return `${jsdoc}  public ${name}${generics}(${signature.paramsSignature}): ${methodReturnType} {\n${methodBody}\n  }`
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
