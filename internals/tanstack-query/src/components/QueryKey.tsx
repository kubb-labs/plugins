import { getOperationParameters } from '@internals/shared'
import { URLPath } from '@internals/utils'
import type { ast } from '@kubb/core'
import type { PluginTs } from '@kubb/plugin-ts'
import { functionPrinter } from '@kubb/plugin-ts'
import { File, Function, Type } from '@kubb/renderer-jsx'
import type { KubbReactNode } from '@kubb/renderer-jsx/types'
import type { Transformer } from '../types.ts'
import { buildQueryKeyParams } from '../utils.ts'

type Props = {
  name: string
  typeName: string
  node: ast.OperationNode
  tsResolver: PluginTs['resolver']
  paramsCasing: 'camelcase' | undefined
  pathParamsType: 'object' | 'inline'
  transformer: Transformer | null | undefined
}

const declarationPrinter = functionPrinter({ mode: 'declaration' })

export const queryKeyTransformer: Transformer = ({ node, casing }) => {
  const path = new URLPath(node.path, { casing })
  const hasQueryParams = getOperationParameters(node).query.length > 0
  const hasRequestBody = !!node.requestBody?.content?.[0]?.schema

  return [
    path.toObject({ type: 'path', stringify: true }),
    hasQueryParams ? '...(params ? [params] : [])' : null,
    hasRequestBody ? '...(data ? [data] : [])' : null,
  ].filter(Boolean) as string[]
}

export function QueryKey({ name, node, tsResolver, paramsCasing, pathParamsType, typeName, transformer }: Props): KubbReactNode {
  const paramsNode = buildQueryKeyParams(node, { pathParamsType, paramsCasing, resolver: tsResolver })
  const paramsSignature = declarationPrinter.print(paramsNode) ?? ''
  const keys = (transformer ?? queryKeyTransformer)({ node, casing: paramsCasing })

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
