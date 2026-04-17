import { URLPath } from '@internals/utils'
import { ast } from '@kubb/core'
import type { PluginTs } from '@kubb/plugin-ts'
import { functionPrinter } from '@kubb/plugin-ts'
import { File, Function, Type } from '@kubb/renderer-jsx'
import type { KubbReactNode } from '@kubb/renderer-jsx/types'
import type { Transformer } from '../types.ts'
import { buildQueryKeyParams } from '../utils.ts'

type Props = {
  name: string
  typeName: string
  node: ast.OperationNode
  tsResolver: PluginTs['resolver']
  paramsCasing: 'camelcase' | undefined
  pathParamsType: 'object' | 'inline'
  transformer: Transformer | undefined
}

const declarationPrinter = functionPrinter({ mode: 'declaration' })
const callPrinter = functionPrinter({ mode: 'call' })

function wrapWithMaybeRefOrGetter(paramsNode: ast.FunctionParametersNode): ast.FunctionParametersNode {
  const wrappedParams = paramsNode.params.map((param) => {
    if ('kind' in param && (param as ast.ParameterGroupNode).kind === 'ParameterGroup') {
      const group = param as ast.ParameterGroupNode
      return {
        ...group,
        properties: group.properties.map((p) => ({
          ...p,
          type: p.type ? ast.createParamsType({ variant: 'reference', name: `MaybeRefOrGetter<${printType(p.type)}>` }) : p.type,
        })),
      }
    }
    const fp = param as ast.FunctionParameterNode
    return {
      ...fp,
      type: fp.type ? ast.createParamsType({ variant: 'reference', name: `MaybeRefOrGetter<${printType(fp.type)}>` }) : fp.type,
    }
  })
  return ast.createFunctionParameters({ params: wrappedParams })
}

function printType(typeNode: ast.ParamsTypeNode | undefined): string {
  if (!typeNode) return 'unknown'
  if (typeNode.variant === 'reference') return typeNode.name
  if (typeNode.variant === 'member') return `${typeNode.base}['${typeNode.key}']`
  return 'unknown'
}

function getParams(
  node: ast.OperationNode,
  options: { pathParamsType: 'object' | 'inline'; paramsCasing: 'camelcase' | undefined; resolver: PluginTs['resolver'] },
): ast.FunctionParametersNode {
  return wrapWithMaybeRefOrGetter(buildQueryKeyParams(node, options))
}

const getTransformer: Transformer = ({ node, casing }) => {
  const path = new URLPath(node.path, { casing })
  const hasQueryParams = node.parameters.some((p) => p.in === 'query')
  const hasRequestBody = !!node.requestBody?.schema

  return [
    path.toObject({ type: 'path', stringify: true }),
    hasQueryParams ? '...(params ? [params] : [])' : undefined,
    hasRequestBody ? '...(data ? [data] : [])' : undefined,
  ].filter(Boolean) as string[]
}

export function QueryKey({ name, node, tsResolver, paramsCasing, pathParamsType, typeName, transformer = getTransformer }: Props): KubbReactNode {
  const paramsNode = getParams(node, { pathParamsType, paramsCasing, resolver: tsResolver })
  const paramsSignature = declarationPrinter.print(paramsNode) ?? ''
  const keys = transformer({ node, casing: paramsCasing })

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

QueryKey.getParams = getParams
QueryKey.getTransformer = getTransformer
QueryKey.callPrinter = callPrinter
