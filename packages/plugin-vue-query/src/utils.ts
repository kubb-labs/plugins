export { buildQueryKeyParams, resolveOperationOverrides, resolveZodSchemaNames } from '@internals/tanstack-query'
export {
  buildOperationComments as getComments,
  buildRequestConfigType,
  buildStatusUnionType,
  getContentTypeInfo,
  resolveErrorNames,
  resolveStatusCodeNames,
  resolveSuccessNames,
} from '@internals/shared'

import { ast } from '@kubb/core'
import { renderType } from '@kubb/plugin-ts'

/**
 * Wraps each parameter type in `MaybeRefOrGetter<…>` so a vue-query signature
 * accepts refs or getters. Group members are wrapped individually; `skip` opts a
 * plain parameter out by name.
 */
export function wrapWithMaybeRefOrGetter(paramsNode: ast.FunctionParametersNode, skip?: (name: string) => boolean): ast.FunctionParametersNode {
  const wrappedParams = paramsNode.params.map((param) => {
    if (typeof param.name !== 'string') {
      const type = param.type
      if (type && typeof type !== 'string' && type.kind === 'TypeLiteral') {
        return {
          ...param,
          type: ast.createTypeLiteral({ members: type.members.map((member) => ({ ...member, type: `MaybeRefOrGetter<${renderType(member.type)}>` })) }),
        }
      }
      return param
    }
    if (skip?.(param.name)) return param
    return { ...param, type: param.type ? `MaybeRefOrGetter<${renderType(param.type)}>` : param.type }
  })
  return ast.createFunctionParameters({ params: wrappedParams })
}
