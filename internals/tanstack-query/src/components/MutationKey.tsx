import { type ast, Url } from '@kubb/kit'
import { createFunctionParameters, functionPrinter } from '@kubb/plugin-ts'
import { File, Function, Type } from '@kubb/renderer-jsx'
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
export const mutationKeyTransformer: Transformer = ({ node }) => {
  if (!node.path) return []
  return [`{ url: '${Url.toPath(node.path)}' }`]
}

export function MutationKey({ name, node, transformer, typeName }: Props): KubbReactNode {
  const paramsNode = createFunctionParameters({ params: [] })
  const paramsSignature = declarationPrinter.print(paramsNode) ?? ''
  // Mutations always use 'mutation' as they do not have suspense or infinite variants.
  const keys = (transformer ?? mutationKeyTransformer)({ node, casing: 'camelcase', variant: 'mutation' })

  return (
    <>
      <File.Source name={name} isExportable isIndexable>
        <Function.Arrow name={name} export params={paramsSignature} singleLine>
          {`[${keys.join(', ')}] as const`}
        </Function.Arrow>
      </File.Source>
      {typeName && (
        <File.Source name={typeName} isExportable isIndexable isTypeOnly>
          <Type export name={typeName}>{`ReturnType<typeof ${name}>`}</Type>
        </File.Source>
      )}
    </>
  )
}
