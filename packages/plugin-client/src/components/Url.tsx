import { buildParamsMapping, getOperationParameters } from '@internals/shared'
import { isValidVarName, Url as UrlHelper } from '@internals/utils'
import { createOperationParams } from '@kubb/ast/utils'
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

export function buildUrlParamsNode({ node, tsResolver }: GetParamsProps): ast.FunctionParametersNode {
  // Build a URL-only node with only path params (no body, query, header)
  const urlNode: ast.OperationNode = {
    ...node,
    parameters: node.parameters.filter((p) => p.in === 'path'),
    requestBody: undefined,
  }

  return createOperationParams(urlNode, {
    paramsType: 'object',
    pathParamsType: 'object',
    paramsCasing: 'camelcase',
    resolver: tsResolver,
  })
}

export function Url({ name, isExportable = true, isIndexable = true, baseURL, node, tsResolver }: Props): KubbReactNode {
  if (!ast.isHttpOperationNode(node)) return null

  const paramsNode = buildUrlParamsNode({
    node,
    tsResolver,
  })
  const paramsSignature = declarationPrinter.print(paramsNode) ?? ''

  const { path: originalPathParams } = getOperationParameters(node)
  const { path: casedPathParams } = getOperationParameters(node, { paramsCasing: 'camelcase' })
  const pathParamsMapping = buildParamsMapping(originalPathParams, casedPathParams)

  return (
    <File.Source name={name} isExportable={isExportable} isIndexable={isIndexable}>
      <Function name={name} export={isExportable} params={paramsSignature}>
        {pathParamsMapping &&
          Object.entries(pathParamsMapping)
            .filter(([originalName, camelCaseName]) => isValidVarName(originalName) && originalName !== camelCaseName)
            .map(([originalName, camelCaseName]) => `const ${originalName} = ${camelCaseName}`)
            .join('\n')}
        {pathParamsMapping && Object.keys(pathParamsMapping).length > 0 && <br />}
        <Const name={'res'}>{`{ method: '${node.method.toUpperCase()}', url: ${UrlHelper.toTemplateString(node.path, { prefix: baseURL })} as const }`}</Const>
        <br />
        return res
      </Function>
    </File.Source>
  )
}
