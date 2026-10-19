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
  /**
   * Wraps each grouped request member type, used by vue-query for `MaybeRefOrGetter`.
   */
  memberTypeWrapper?: (type: string) => string
  /**
   * Exports and indexes the `typeName` alias too (default `false`).
   */
  exportType?: boolean
}

const declarationPrinter = functionPrinter({ mode: 'declaration' })

/**
 * Default `queryKey` builder. Call it from a custom builder to extend the default key.
 *
 * @remarks The returned segments may change between releases. Spread them instead of reading single entries.
 *
 * @example
 * ```ts
 * queryKey: (props) => [JSON.stringify(props.node.operationId), ...queryKeyTransformer(props)]
 * ```
 */
export const queryKeyTransformer: Transformer = ({ node, variant }) => {
  if (!node.path) return []
  const { path, query } = getOperationParameters(node)
  // Embedding `infinite: true` inside the URL segment separates infinite queries in the cache
  // while preserving TanStack Query partial matching for base URL invalidation.
  const isInfinite = variant === 'infiniteQuery' || variant === 'suspenseInfiniteQuery'

  const urlFields = [`url: '${Url.toPath(node.path)}'`]
  if (path.length > 0) urlFields.push('params: path')
  if (isInfinite) urlFields.push('infinite: true')

  const result = [`{ ${urlFields.join(', ')} }`]
  if (query.length > 0) result.push('...(query ? [query] : [])')
  // A falsy body (`''`, `0`, `false`, `null`) is still an input, so only an absent one is left out.
  if (node.requestBody?.content?.[0]?.schema) result.push('...(body !== undefined ? [body] : [])')

  return result
}

export function QueryKey({ name, node, tsResolver, typeName, transformer, variant = 'query', memberTypeWrapper, exportType }: Props): KubbReactNode {
  const paramsNode = buildQueryKeyParams(node, { resolver: tsResolver, memberTypeWrapper })
  const paramsSignature = declarationPrinter.print(paramsNode) ?? ''
  const keys = (transformer ?? queryKeyTransformer)({ node, casing: 'camelcase', variant })

  return (
    <>
      <File.Source name={name} isExportable isIndexable>
        <Function.Arrow name={name} export params={paramsSignature} singleLine>
          {`[${keys.join(', ')}] as const`}
        </Function.Arrow>
      </File.Source>
      <File.Source name={typeName} isExportable={exportType} isIndexable={exportType} isTypeOnly>
        <Type name={typeName} export={exportType}>{`ReturnType<typeof ${name}>`}</Type>
      </File.Source>
    </>
  )
}
