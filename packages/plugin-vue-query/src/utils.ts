export {
  buildGroupParam,
  buildQueryKeyParams,
  resolveHeaderGroupType,
  resolveOperationOverrides,
  resolvePathParamType,
  resolveQueryGroupType,
  resolveZodSchemaNames,
} from '@internals/tanstack-query'
export {
  buildOperationComments as getComments,
  buildRequestConfigType,
  getContentTypeInfo,
  resolveErrorNames,
  resolveRequestTypeName,
  resolveStatusCodeNames,
  resolveSuccessNames,
} from '@internals/shared'

import { ast } from '@kubb/core'

export function printType(typeNode: ast.ParamsTypeNode | undefined): string {
  if (!typeNode) return 'unknown'
  if (typeNode.variant === 'reference') return typeNode.name
  if (typeNode.variant === 'member') return `${typeNode.base}['${typeNode.key}']`
  if (typeNode.variant === 'struct') {
    const parts = typeNode.properties.map((p) => {
      const typeStr = printType(p.type)
      const key = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(p.name) ? p.name : JSON.stringify(p.name)
      return p.optional ? `${key}?: ${typeStr}` : `${key}: ${typeStr}`
    })
    return `{ ${parts.join('; ')} }`
  }
  return 'unknown'
}

export function wrapWithMaybeRefOrGetter(paramsNode: ast.FunctionParametersNode, skip?: (name: string) => boolean): ast.FunctionParametersNode {
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
    if (skip?.(fp.name)) return fp
    return {
      ...fp,
      type: fp.type ? ast.createParamsType({ variant: 'reference', name: `MaybeRefOrGetter<${printType(fp.type)}>` }) : fp.type,
    }
  })
  return ast.createFunctionParameters({ params: wrappedParams })
}
