import type { Transformer } from '@internals/tanstack-query'
import { MutationKey as SharedMutationKey } from '@internals/tanstack-query'
import type { ast } from '@kubb/core'
import { File, Type } from '@kubb/renderer-jsx'
import type { KubbReactNode } from '@kubb/renderer-jsx/types'

type Props = {
  name: string
  typeName: string
  node: ast.OperationNode
  paramsCasing: 'camelcase' | undefined
  pathParamsType: 'object' | 'inline'
  transformer: Transformer | undefined
}

export function MutationKey({ name, typeName, node, paramsCasing, pathParamsType, transformer }: Props): KubbReactNode {
  return (
    <>
      <SharedMutationKey name={name} node={node} paramsCasing={paramsCasing} pathParamsType={pathParamsType} transformer={transformer} />
      <File.Source name={typeName} isExportable isIndexable isTypeOnly>
        <Type export name={typeName}>{`ReturnType<typeof ${name}>`}</Type>
      </File.Source>
    </>
  )
}
