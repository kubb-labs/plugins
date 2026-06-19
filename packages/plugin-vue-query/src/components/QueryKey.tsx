import type { ast } from '@kubb/core'
import type { ResolverTs } from '@kubb/plugin-ts'
import { functionPrinter } from '@kubb/plugin-ts'
import { File, Function, Type } from '@kubb/renderer-jsx'
import type { KubbReactNode } from '@kubb/renderer-jsx/types'
import { getEnabledParamNames, markParamsOptional, queryKeyTransformer } from '@internals/tanstack-query'
import type { Transformer } from '../types.ts'
import { buildQueryKeyParams, wrapWithMaybeRefOrGetter } from '../utils.ts'

type Props = {
  name: string
  typeName: string
  node: ast.OperationNode
  tsResolver: ResolverTs
  transformer: Transformer | null | undefined
}

const declarationPrinter = functionPrinter({ mode: 'declaration' })

export function buildQueryKeyParamsNode(node: ast.OperationNode, options: { resolver: ResolverTs }): ast.FunctionParametersNode {
  return wrapWithMaybeRefOrGetter(buildQueryKeyParams(node, options))
}

export function QueryKey({ name, node, tsResolver, typeName, transformer }: Props): KubbReactNode {
  const baseParamsNode = buildQueryKeyParamsNode(node, { resolver: tsResolver })
  const paramsNode = markParamsOptional(baseParamsNode, getEnabledParamNames(baseParamsNode))
  const paramsSignature = declarationPrinter.print(paramsNode) ?? ''
  const keys = (transformer ?? queryKeyTransformer)({
    node,
    casing: 'camelcase',
  })

  return (
    <>
      <File.Source name={name} isExportable isIndexable>
        <Function.Arrow name={name} export params={paramsSignature} singleLine>
          {`[${keys.join(', ')}] as const`}
        </Function.Arrow>
      </File.Source>
      <File.Source name={typeName} isExportable isIndexable isTypeOnly>
        <Type name={typeName} export>
          {`ReturnType<typeof ${name}>`}
        </Type>
      </File.Source>
    </>
  )
}
