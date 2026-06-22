import type { ast } from '@kubb/core'
import type { ResolverTs } from '@kubb/plugin-ts'
import type { ResolverZod } from '@kubb/plugin-zod'
import { File } from '@kubb/renderer-jsx'
import type { KubbReactNode } from '@kubb/renderer-jsx/types'
import { buildSdkMethod } from '../builders/sdkMethod.ts'
import type { SecurityRequirement, SecurityScheme } from '../builders/security.ts'
import type { ParserOptions } from '../types.ts'

type OperationData = {
  node: ast.OperationNode
  name: string
  tsResolver: ResolverTs
  zodResolver?: ResolverZod | null
  security?: Array<SecurityRequirement>
  schemes?: Record<string, SecurityScheme>
}

type Props = {
  name: string
  isExportable?: boolean
  isIndexable?: boolean
  operations: Array<OperationData>
  parser: ParserOptions | undefined
  children?: KubbReactNode
}

/**
 * Renders one instance class per tag with one method per operation. The constructor takes a client
 * config object and builds its own client through `createClient`, so each environment is a separate
 * instance: `const api = new PetClient({ baseURL }); api.getPetById(...)`. A per-call `client` option
 * still overrides the instance client for a one-off call.
 */
export function SdkClient({ name, isExportable = true, isIndexable = true, operations, parser, children }: Props): KubbReactNode {
  const methods = operations.map(({ node, name: methodName, tsResolver, zodResolver, security, schemes }) =>
    buildSdkMethod({
      node,
      name: methodName,
      tsResolver,
      zodResolver,
      parser,
      security,
      schemes,
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
