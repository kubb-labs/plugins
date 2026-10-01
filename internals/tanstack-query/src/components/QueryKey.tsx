import { getOperationParameters } from '@internals/shared'
import { type ast, Url } from 'kubb/kit'
import type { PluginTs } from '@kubb/plugin-ts'
import { functionPrinter } from '@kubb/plugin-ts'
import { File, Function, Type } from 'kubb/jsx'
import type { KubbReactNode } from 'kubb/jsx'
import type { KeyVariant, Transformer } from '../types.ts'
import { buildQueryKeyParams } from '../utils.ts'

type Props = {
  name: string
  typeName: string
  node: ast.OperationNode
  tsResolver: PluginTs['resolver']
  transformer: Transformer | null | undefined
  /**
   * @default 'query'
   */
  variant?: KeyVariant
}

const declarationPrinter = functionPrinter({ mode: 'declaration' })

export const queryKeyTransformer: Transformer = ({ node, variant }) => {
  if (!node.path) return []
  const hasPathParams = getOperationParameters(node).path.length > 0
  const hasQueryParams = getOperationParameters(node).query.length > 0
  const hasRequestBody = !!node.requestBody?.content?.[0]?.schema
  const isInfinite = variant === 'infiniteQuery' || variant === 'suspenseInfiniteQuery'

  const urlFields = [`url: '${Url.toPath(node.path)}'`, hasPathParams ? 'params: path' : null, isInfinite ? 'infinite: true' : null].filter(Boolean)

  return [`{ ${urlFields.join(', ')} }`, hasQueryParams ? '...(query ? [query] : [])' : null, hasRequestBody ? '...(body ? [body] : [])' : null].filter(
    Boolean,
  ) as Array<string>
}

export function QueryKey({ name, node, tsResolver, typeName, transformer, variant = 'query' }: Props): KubbReactNode {
  const paramsNode = buildQueryKeyParams(node, { resolver: tsResolver })
  const paramsSignature = declarationPrinter.print(paramsNode) ?? ''
  const keys = (transformer ?? queryKeyTransformer)({ node, casing: 'camelcase', variant })

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
