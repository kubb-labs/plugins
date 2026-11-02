import type { ast } from '@kubb/kit'
import type { ResolverTs } from '@kubb/plugin-ts'
import { functionPrinter } from '@kubb/plugin-ts'
import { File, Function } from '@kubb/renderer-jsx'
import type { KubbReactNode } from '@kubb/renderer-jsx'
import { buildCallResultBody, buildQueryOptionsParams, buildClientCall } from '@internals/tanstack-query'
import type { ReturnTypeOption } from '@internals/client'

type Props = {
  name: string
  clientName: string
  node: ast.OperationNode
  tsResolver: ResolverTs
  /**
   * The registered client plugin's `returnType`, read by the caller off `resolveClientOperation`.
   *
   * @default 'full'
   */
  clientReturnType?: 'full' | 'data' | 'plain'
  returnType?: ReturnTypeOption
}

const declarationPrinter = functionPrinter({ mode: 'declaration' })

export function QueryOptions({ name, clientName, node, tsResolver, clientReturnType = 'full', returnType = 'data' }: Props): KubbReactNode {
  const paramsNode = buildQueryOptionsParams(node, { resolver: tsResolver })
  const paramsSignature = declarationPrinter.print(paramsNode) ?? ''
  const fetcherBody = buildCallResultBody(buildClientCall(node, { clientName, signal: false }), { clientReturnType, returnType })

  return (
    <File.Source name={name} isExportable isIndexable>
      <Function name={name} export params={paramsSignature}>
        {`
      return {
        fetcher: async () => {
          ${fetcherBody}
        },
      }
`}
      </Function>
    </File.Source>
  )
}
