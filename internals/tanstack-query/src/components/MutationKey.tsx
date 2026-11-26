import type { ast } from '@internals/ast'
import { text, Url } from '@kubb/kit'
import { createFunctionParameters, functionPrinter } from '@kubb/plugin-ts'
import { Function, Type } from '@kubb/renderer-jsx'
import type { KubbReactNode } from '@kubb/renderer-jsx'
import type { KeyTransformer } from '../types.ts'

export type MutationKeyProps = {
  name: string
  node: ast.OperationNode
  transformer: KeyTransformer | null | undefined
  /**
   * Also emits `ReturnType<typeof name>` as an exported type alias of this name.
   */
  typeName?: string
}

const declarationPrinter = functionPrinter({ mode: 'declaration' })

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
export const mutationKeyTransformer: KeyTransformer = ({ node }) => {
  if (!node.path) return []
  return [`{ url: ${text.quote(Url.toPath(node.path))} }`]
}

export function MutationKey({ name, node, transformer, typeName }: MutationKeyProps): KubbReactNode {
  const paramsNode = createFunctionParameters({ params: [] })
  const paramsSignature = declarationPrinter.print(paramsNode) ?? ''
  // Mutations always use 'mutation' as they do not have suspense or infinite variants.
  const keys = (transformer ?? mutationKeyTransformer)({ node, casing: 'camelcase', variant: 'mutation' })

  return (
    <>
      <Function.Arrow name={name} export params={paramsSignature} singleLine>
        {`[${keys.join(', ')}] as const`}
      </Function.Arrow>
      {typeName && <Type export name={typeName}>{`ReturnType<typeof ${name}>`}</Type>}
    </>
  )
}
