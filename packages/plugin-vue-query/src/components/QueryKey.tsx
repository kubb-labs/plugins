import type { ast } from 'kubb/kit'
import type { FunctionParametersNode, ResolverTs } from '@kubb/plugin-ts'
import { createFunctionParameters, functionPrinter } from '@kubb/plugin-ts'
import { File, Function, Type } from 'kubb/jsx'
import type { KubbReactNode } from 'kubb/jsx'
import { buildGroupedRequestParam, queryKeyTransformer } from '@internals/tanstack-query'
import type { Transformer } from '../types.ts'
import { maybeRefOrGetter } from '../utils.ts'

type Props = {
  name: string
  typeName: string
  node: ast.OperationNode
  tsResolver: ResolverTs
  transformer: Transformer | null | undefined
}

const declarationPrinter = functionPrinter({ mode: 'declaration' })

export function buildQueryKeyParamsNode(node: ast.OperationNode, options: { resolver: ResolverTs }): FunctionParametersNode {
  const groupedParam = buildGroupedRequestParam(node, { resolver: options.resolver, keys: ['path', 'query', 'body'], memberTypeWrapper: maybeRefOrGetter })

  return createFunctionParameters({ params: groupedParam ? [groupedParam] : [] })
}

export function QueryKey({ name, node, tsResolver, typeName, transformer }: Props): KubbReactNode {
  const paramsNode = buildQueryKeyParamsNode(node, { resolver: tsResolver })
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
