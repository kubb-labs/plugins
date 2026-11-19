import { ast, Url } from '@kubb/kit'
import { Function, Type } from '@kubb/renderer-jsx'
import type { KubbReactNode } from '@kubb/renderer-jsx'
import type { Transformer } from '../types.ts'

type Props = {
  name: string
  node: ast.OperationNode
  transformer: Transformer | null | undefined
  /**
   * Also emits `ReturnType<typeof name>` as an exported type alias of this name.
   */
  typeName?: string
}

/**
 * Default `mutationKey` builder. Call it from a custom builder to extend the default key.
 *
 * @remarks The returned segments may change between releases. Spread them instead of reading single entries.
 *
 * @example
 * ```ts
 * mutationKey: (props) => [JSON.stringify(props.node.operationId), ...mutationKeyTransformer(props)]
 * ```
 */
export const mutationKeyTransformer: Transformer = ({ node }) => {
  if (!node.path) return []
  return [`{ url: '${Url.toPath(node.path)}' }`]
}

export function MutationKey({ name, node, transformer, typeName }: Props): KubbReactNode {
  const paramsNode = ast.factory.createFunctionParameters({ params: [] })
  // Mutations always use 'mutation' as they do not have suspense or infinite variants.
  const keys = (transformer ?? mutationKeyTransformer)({ node, casing: 'camelcase', variant: 'mutation' })

  return (
    <>
      <Function.Arrow name={name} export params={paramsNode} singleLine>
        {`[${keys.join(', ')}] as const`}
      </Function.Arrow>
      {typeName && <Type export name={typeName}>{`ReturnType<typeof ${name}>`}</Type>}
    </>
  )
}
