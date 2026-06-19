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

/**
 * Wraps a type string in `MaybeRefOrGetter<…>` so a vue-query signature accepts refs or getters.
 */
export function maybeRefOrGetter(type: string): string {
  return `MaybeRefOrGetter<${type}>`
}
