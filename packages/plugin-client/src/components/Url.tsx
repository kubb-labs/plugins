import { getOperationParameters } from '@internals/shared'
import { Url as UrlHelper } from '@internals/utils'
import { ast } from '@kubb/core'
import type { FunctionParametersNode, ResolverTs } from '@kubb/plugin-ts'
import { createFunctionParameter, createFunctionParameters, functionPrinter } from '@kubb/plugin-ts'
import { Const, File, Function } from '@kubb/renderer-jsx'
import type { KubbReactNode } from '@kubb/renderer-jsx/types'

type Props = {
  name: string
  isExportable?: boolean
  isIndexable?: boolean

  baseURL: string | null | undefined
  node: ast.OperationNode
  tsResolver: ResolverTs
}

type GetParamsProps = {
  node: ast.OperationNode
  tsResolver: ResolverTs
}

const declarationPrinter = functionPrinter({ mode: 'declaration' })

function buildUrlParamsNode({ node, tsResolver }: GetParamsProps): FunctionParametersNode {
  const { path: pathParams } = getOperationParameters(node, { paramsCasing: 'original' })

  if (pathParams.length === 0) {
    return createFunctionParameters({ params: [] })
  }

  return createFunctionParameters({
    params: [createFunctionParameter({ name: 'path', type: `${tsResolver.resolveRequestConfigName(node)}['path']` })],
  })
}

export function Url({ name, isExportable = true, isIndexable = true, baseURL, node, tsResolver }: Props): KubbReactNode {
  if (!ast.isHttpOperationNode(node)) return null

  const paramsNode = buildUrlParamsNode({
    node,
    tsResolver,
  })
  const paramsSignature = declarationPrinter.print(paramsNode) ?? ''

  return (
    <File.Source name={name} isExportable={isExportable} isIndexable={isIndexable}>
      <Function name={name} export={isExportable} params={paramsSignature}>
        <Const
          name={'res'}
        >{`{ method: '${node.method.toUpperCase()}', url: ${UrlHelper.toGroupedTemplateString(node.path, { prefix: baseURL })} as const }`}</Const>
        <br />
        return res
      </Function>
    </File.Source>
  )
}
