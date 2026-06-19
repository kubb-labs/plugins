import { getOperationParameters } from '@internals/shared'
import { Url } from '@internals/utils'
import type { ast } from '@kubb/core'
import type { PluginTs } from '@kubb/plugin-ts'
import { functionPrinter } from '@kubb/plugin-ts'
import { File, Function, Type } from '@kubb/renderer-jsx'
import type { KubbReactNode } from '@kubb/renderer-jsx/types'
import type { Transformer } from '../types.ts'
import { buildQueryKeyParams, getEnabledParamNames, markParamsOptional } from '../utils.ts'

type Props = {
  name: string
  typeName: string
  node: ast.OperationNode
  tsResolver: PluginTs['resolver']
  transformer: Transformer | null | undefined
}

const declarationPrinter = functionPrinter({ mode: 'declaration' })

export const queryKeyTransformer: Transformer = ({ node, casing }) => {
  if (!node.path) return []
  const hasQueryParams = getOperationParameters(node).query.length > 0
  const hasRequestBody = !!node.requestBody?.content?.[0]?.schema

  return [
    Url.toObject(node.path, { type: 'path', stringify: true, casing }),
    hasQueryParams ? '...(params ? [params] : [])' : null,
    hasRequestBody ? '...(data ? [data] : [])' : null,
  ].filter(Boolean) as Array<string>
}

export function QueryKey({ name, node, tsResolver, typeName, transformer }: Props): KubbReactNode {
  const baseParamsNode = buildQueryKeyParams(node, { resolver: tsResolver })
  const paramsNode = markParamsOptional(baseParamsNode, getEnabledParamNames(baseParamsNode))
  const paramsSignature = declarationPrinter.print(paramsNode) ?? ''
  const keys = (transformer ?? queryKeyTransformer)({ node, casing: 'camelcase' })

  return (
    <>
      <File.Source name={name} isExportable isIndexable>
        <Function.Arrow name={name} export params={paramsSignature} singleLine>
          {`[${keys.join(', ')}] as const`}
        </Function.Arrow>
      </File.Source>
      <File.Source name={typeName} isTypeOnly>
        <Type name={typeName}>{`ReturnType<typeof ${name}>`}</Type>
      </File.Source>
    </>
  )
}
