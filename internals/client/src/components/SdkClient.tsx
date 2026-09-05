import type { ast } from 'kubb/kit'
import type { ResolverZod } from '@kubb/plugin-zod'
import { File } from 'kubb/jsx'
import type { KubbReactNode } from 'kubb/jsx'
import { buildSdkMethod } from '../builders/sdkMethod.ts'
import type { Auth } from '../builders/security.ts'
import type { OperationTypeNames } from '../resolveOperationTypes.ts'
import type { ReturnTypeOption, ValidatorOptions } from '../types.ts'

type OperationData = {
  node: ast.OperationNode
  name: string
  types: OperationTypeNames
  zodResolver?: ResolverZod | null
  security?: Array<Auth>
}

type Props = {
  name: string
  isExportable?: boolean
  isIndexable?: boolean
  operations: Array<OperationData>
  validator: ValidatorOptions | undefined
  returnType: ReturnTypeOption
  children?: KubbReactNode
}

/**
 * Renders one instance class per tag with one method per operation. The constructor takes a client
 * config object and builds its own client through `createClient`, so each environment is a separate
 * instance: `const api = new PetClient({ baseURL }); api.getPetById(...)`. A per-call `client` option
 * still overrides the instance client for a one-off call.
 */
export function SdkClient({ name, isExportable = true, isIndexable = true, operations, validator, returnType, children }: Props): KubbReactNode {
  const methods = operations.map(({ node, name: methodName, types, zodResolver, security }) =>
    buildSdkMethod({
      node,
      name: methodName,
      types,
      zodResolver,
      validator,
      security,
      returnType,
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
    <File.Source name={name} isExportable={isExportable} isIndexable={isIndexable}>
      {classCode}
      {children}
    </File.Source>
  )
}
