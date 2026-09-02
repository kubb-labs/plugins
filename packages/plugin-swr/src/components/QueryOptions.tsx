import type { ast } from 'kubb/kit'
import type { ResolverTs } from '@kubb/plugin-ts'
import { functionPrinter } from '@kubb/plugin-ts'
import { File, Function } from 'kubb/jsx'
import type { KubbReactNode } from 'kubb/jsx'
import { buildCallResultBody, buildQueryOptionsParams, buildClientCall } from '@internals/tanstack-query'

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
  returnType?: 'full' | 'data'
}

const declarationPrinter = functionPrinter({ mode: 'declaration' })

export function QueryOptions({ name, clientName, node, tsResolver, returnType = 'full' }: Props): KubbReactNode {
  const paramsNode = buildQueryOptionsParams(node, { resolver: tsResolver })
  const paramsSignature = declarationPrinter.print(paramsNode) ?? ''
  const fetcherBody = buildCallResultBody(buildClientCall(node, { clientName, signal: false }), { returnType })

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
