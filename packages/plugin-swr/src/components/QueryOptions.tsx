import type { ast } from '@kubb/core'
import type { ResolverTs } from '@kubb/plugin-ts'
import { functionPrinter } from '@kubb/plugin-ts'
import { File, Function } from '@kubb/renderer-jsx'
import type { KubbReactNode } from '@kubb/renderer-jsx/types'
import { buildQueryOptionsParams, getEnabledParamNames, injectNonNullAssertions, markParamsOptional } from '@internals/tanstack-query'
import { buildQueryKeyParams } from '../utils.ts'

type Props = {
  name: string
  clientName: string
  node: ast.OperationNode
  tsResolver: ResolverTs
}

const declarationPrinter = functionPrinter({ mode: 'declaration' })
const callPrinter = functionPrinter({ mode: 'call' })

export function getQueryOptionsParams(node: ast.OperationNode, options: { resolver: ResolverTs }): ast.FunctionParametersNode {
  return buildQueryOptionsParams(node, options)
}

export function QueryOptions({ name, clientName, node, tsResolver }: Props): KubbReactNode {
  const queryKeyParamsNode = buildQueryKeyParams(node, { resolver: tsResolver })
  const enabledNames = getEnabledParamNames(queryKeyParamsNode)

  const paramsNode = markParamsOptional(getQueryOptionsParams(node, { resolver: tsResolver }), enabledNames)
  const paramsSignature = declarationPrinter.print(paramsNode) ?? ''
  const clientCallStr = injectNonNullAssertions(callPrinter.print(paramsNode) ?? '', enabledNames)

  return (
    <File.Source name={name} isExportable isIndexable>
      <Function name={name} export params={paramsSignature}>
        {`
      return {
        fetcher: async () => {
          return ${clientName}(${clientCallStr})
        },
      }
`}
      </Function>
    </File.Source>
  )
}
