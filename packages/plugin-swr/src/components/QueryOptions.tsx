import type { ast } from 'kubb/kit'
import type { ResolverTs } from '@kubb/plugin-ts'
import { functionPrinter } from '@kubb/plugin-ts'
import { File, Function } from 'kubb/jsx'
import type { KubbReactNode } from 'kubb/jsx'
import { buildQueryOptionsParams, buildClientCall } from '@internals/tanstack-query'

type Props = {
  name: string
  clientName: string
  node: ast.OperationNode
  tsResolver: ResolverTs
}

const declarationPrinter = functionPrinter({ mode: 'declaration' })

export function QueryOptions({ name, clientName, node, tsResolver }: Props): KubbReactNode {
  const paramsNode = buildQueryOptionsParams(node, { resolver: tsResolver })
  const paramsSignature = declarationPrinter.print(paramsNode) ?? ''
  const fetcherBody = `const { data } = await ${buildClientCall(node, { clientName, signal: false })}
          return data`

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
