import { getOperationParameters } from '@internals/shared'
import { Url as UrlHelper } from '@internals/utils'
import { ast } from '@kubb/core'
import type { ResolverTs } from '@kubb/plugin-ts'
import { functionPrinter } from '@kubb/plugin-ts'
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

function buildUrlParamsNode({ node, tsResolver }: GetParamsProps): ast.FunctionParametersNode {
  const { path: pathParams } = getOperationParameters(node, { paramsCasing: 'original' })

  if (pathParams.length === 0) {
    return ast.factory.createFunctionParameters({ params: [] })
  }

  return ast.factory.createFunctionParameters({
    params: [ast.factory.createFunctionParameter({ name: 'path', type: `${tsResolver.resolveRequestConfigName(node)}['path']` })],
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
