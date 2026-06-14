import { Url } from '@internals/utils'
import { ast } from '@kubb/core'
import { functionPrinter } from '@kubb/plugin-ts'
import { File, Function } from '@kubb/renderer-jsx'
import type { KubbReactNode } from '@kubb/renderer-jsx/types'
import type { Transformer } from '../types.ts'

type Props = {
  name: string
  node: ast.OperationNode
  paramsCasing: 'camelcase' | undefined
  pathParamsType: 'object' | 'inline'
  transformer: Transformer | null | undefined
}

const declarationPrinter = functionPrinter({ mode: 'declaration' })

export const mutationKeyTransformer: Transformer = ({ node }) => {
  if (!node.path) return []
  return [`{ url: '${Url.toPath(node.path)}' }`]
}

export function MutationKey({ name, paramsCasing, node, transformer }: Props): KubbReactNode {
  const paramsNode = ast.factory.createFunctionParameters({ params: [] })
  const paramsSignature = declarationPrinter.print(paramsNode) ?? ''
  const keys = (transformer ?? mutationKeyTransformer)({ node, casing: paramsCasing })

  return (
    <File.Source name={name} isExportable isIndexable>
      <Function.Arrow name={name} export params={paramsSignature} singleLine>
        {`[${keys.join(', ')}] as const`}
      </Function.Arrow>
    </File.Source>
  )
}
