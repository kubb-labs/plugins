import type { ast } from '@kubb/core'
import type { ResolverTs } from '@kubb/plugin-ts'
import type { ResolverZod } from '@kubb/plugin-zod'
import { File } from '@kubb/renderer-jsx'
import type { KubbReactNode } from '@kubb/renderer-jsx/types'
import type { PluginClient } from '../types.ts'
import { buildClassMethod } from '../utils.ts'

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
  parser: PluginClient['resolvedOptions']['parser'] | undefined
  children?: KubbReactNode
}

export function StaticClassClient({ name, isExportable = true, isIndexable = true, operations, parser, children }: Props): KubbReactNode {
  const methods = operations.map(({ node, name: methodName, tsResolver, zodResolver }) =>
    buildClassMethod({
      node,
      name: methodName,
      tsResolver,
      zodResolver,
      parser,
      isStatic: true,
    }),
  )

  const classCode = `export class ${name} {\n  static #config: Partial<RequestConfig> & { client?: ClientInstance } = {}\n\n${methods.join('\n\n')}\n}`

  return (
    <File.Source name={name} isExportable={isExportable} isIndexable={isIndexable}>
      {classCode}
      {children}
    </File.Source>
  )
}
