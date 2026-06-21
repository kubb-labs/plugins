import type { ast } from '@kubb/core'
import type { ResolverTs } from '@kubb/plugin-ts'
import type { ResolverZod } from '@kubb/plugin-zod'
import { File } from '@kubb/renderer-jsx'
import type { KubbReactNode } from '@kubb/renderer-jsx/types'
import { buildSdkMethod } from '../builders/sdkMethod.ts'
import type { ParserOptions } from '../types.ts'

type OperationData = {
  node: ast.OperationNode
  name: string
  tsResolver: ResolverTs
  zodResolver?: ResolverZod | null
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
 * Renders one class per tag with a `public static` method per operation. Each method is
 * self-contained — identical to the standalone function — so callers reach an operation as
 * `PetClient.getPetById(...)` without instantiating the class.
 */
export function SdkClient({ name, isExportable = true, isIndexable = true, operations, parser, children }: Props): KubbReactNode {
  const methods = operations.map(({ node, name: methodName, tsResolver, zodResolver }) =>
    buildSdkMethod({
      node,
      name: methodName,
      tsResolver,
      zodResolver,
      parser,
    }),
  )

  const classCode = `export class ${name} {\n${methods.join('\n\n')}\n}`

  return (
    <File.Source name={name} isExportable={isExportable} isIndexable={isIndexable}>
      {classCode}
      {children}
    </File.Source>
  )
}
