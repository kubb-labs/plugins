import { ast } from '@internals/ast'
import { text, Url } from '@kubb/kit'
import type { ResolverTs } from '@kubb/plugin-ts'
import { functionPrinter } from '@kubb/plugin-ts'
import { Function, Type } from '@kubb/renderer-jsx'
import type { KubbReactNode } from '@kubb/renderer-jsx'
import type { KeyTransformer, KeyVariant, MemberTypeWrapper } from '../types.ts'
import { buildQueryKeyParams } from '../utils.ts'

export type QueryKeyProps = {
  name: string
  typeName: string
  node: ast.OperationNode
  tsResolver: ResolverTs
  transformer: KeyTransformer | null | undefined
  /**
   * @default 'query'
   */
  variant?: KeyVariant
  /**
   * Wraps each grouped request member type, used by vue-query for `MaybeRefOrGetter`.
   */
  memberTypeWrapper?: MemberTypeWrapper
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
export const queryKeyTransformer: KeyTransformer = ({ node, variant }) => {
  if (!node.path) return []
  const { path, query } = ast.http.groupParameters(node)
  // Embedding `infinite: true` inside the URL segment separates infinite queries in the cache
  // while preserving TanStack Query partial matching for base URL invalidation.
  const isInfinite = variant === 'infiniteQuery' || variant === 'suspenseInfiniteQuery'

  const urlFields = [`url: ${text.quote(Url.toPath(node.path))}`]
  if (path.length > 0) urlFields.push('params: path')
  if (isInfinite) urlFields.push('infinite: true')

  const result = [`{ ${urlFields.join(', ')} }`]
  if (query.length > 0) result.push('...(query ? [query] : [])')
  // A falsy body (`''`, `0`, `false`, `null`) is still an input, so only an absent one is left out.
  if (ast.http.requestBody.getSchema(node)) result.push('...(body !== undefined ? [body] : [])')

  return result
}

export function QueryKey({ name, node, tsResolver, typeName, transformer, variant = 'query', memberTypeWrapper, exportType }: QueryKeyProps): KubbReactNode {
  const paramsNode = buildQueryKeyParams(node, { resolver: tsResolver, memberTypeWrapper })
  const paramsSignature = declarationPrinter.print(paramsNode) ?? ''
  const keys = (transformer ?? queryKeyTransformer)({ node, casing: 'camelcase', variant })

  return (
    <>
      <Function.Arrow name={name} export params={paramsSignature} singleLine>
        {`[${keys.join(', ')}] as const`}
      </Function.Arrow>
      <Type name={typeName} export={exportType}>{`ReturnType<typeof ${name}>`}</Type>
    </>
  )
}
