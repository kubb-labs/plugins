import type { Transformer } from '@internals/tanstack-query'
import { MutationKey as SharedMutationKey } from '@internals/tanstack-query'
import type { ast } from 'kubb/kit'
import { File, Type } from 'kubb/jsx'
import type { KubbReactNode } from 'kubb/jsx'

type Props = {
  name: string
  typeName: string
  node: ast.OperationNode
  transformer: Transformer | undefined
}

export function MutationKey({ name, typeName, node, transformer }: Props): KubbReactNode {
  return (
    <>
      <SharedMutationKey name={name} node={node} transformer={transformer} />
      <File.Source name={typeName} isExportable isIndexable isTypeOnly>
        <Type export name={typeName}>{`ReturnType<typeof ${name}>`}</Type>
      </File.Source>
    </>
  )
}
