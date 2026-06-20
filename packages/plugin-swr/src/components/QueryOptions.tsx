import type { ast } from '@kubb/core'
import type { ResolverTs } from '@kubb/plugin-ts'
import { functionPrinter } from '@kubb/plugin-ts'
import { File, Function } from '@kubb/renderer-jsx'
import type { KubbReactNode } from '@kubb/renderer-jsx/types'
import { buildQueryOptionsParams, buildSlimClientCall } from '@internals/tanstack-query'

type Props = {
  name: string
  clientName: string
  node: ast.OperationNode
  tsResolver: ResolverTs
  slim?: boolean
}

const declarationPrinter = functionPrinter({ mode: 'declaration' })
const callPrinter = functionPrinter({ mode: 'call' })

export function getQueryOptionsParams(node: ast.OperationNode, options: { resolver: ResolverTs; slim?: boolean }): ast.FunctionParametersNode {
  return buildQueryOptionsParams(node, options)
}

export function QueryOptions({ name, clientName, node, tsResolver, slim = false }: Props): KubbReactNode {
  const paramsNode = getQueryOptionsParams(node, { resolver: tsResolver, slim })
  const paramsSignature = declarationPrinter.print(paramsNode) ?? ''
  const clientCallStr = callPrinter.print(paramsNode) ?? ''
  const fetcherBody = slim
    ? `const { data } = await ${buildSlimClientCall(node, { clientName, signal: false })}
          return data`
    : `return ${clientName}(${clientCallStr})`

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
