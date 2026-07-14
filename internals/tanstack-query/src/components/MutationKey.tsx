import { type ast, Url } from 'kubb/kit'
import { createFunctionParameters, functionPrinter } from '@kubb/plugin-ts'
import { File, Function } from 'kubb/jsx'
import type { KubbReactNode } from 'kubb/jsx'
import type { Transformer } from '../types.ts'

type Props = {
  name: string
  node: ast.OperationNode
  transformer: Transformer | null | undefined
}

const declarationPrinter = functionPrinter({ mode: 'declaration' })

export const mutationKeyTransformer: Transformer = ({ node }) => {
  if (!node.path) return []
  return [`{ url: '${Url.toPath(node.path)}' }`]
}

export function MutationKey({ name, node, transformer }: Props): KubbReactNode {
  const paramsNode = createFunctionParameters({ params: [] })
  const paramsSignature = declarationPrinter.print(paramsNode) ?? ''
  const keys = (transformer ?? mutationKeyTransformer)({ node, casing: 'camelcase' })

  return (
    <File.Source name={name} isExportable isIndexable>
      <Function.Arrow name={name} export params={paramsSignature} singleLine>
        {`[${keys.join(', ')}] as const`}
      </Function.Arrow>
    </File.Source>
  )
}
