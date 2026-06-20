import { buildStatusUnionType } from '@internals/shared'
import type { CallArg } from '../callArgs.ts'

export { buildStatusUnionType }

/**
 * Resolves the `query` entry for a legacy data-returning client call: the parsed `requestParams`
 * when zod validates the query, the remapped `mappedParams` when casing renames the wire keys,
 * otherwise the plain `query` binding. Returns `null` when the operation carries no query parameters.
 *
 * @deprecated Part of the legacy data-returning client kept for the query plugins until they move to
 * the `RequestResult` contract. plugin-client's own output no longer uses it.
 */
export function buildQueryParamDescriptor({
  queryParamsName,
  zodQueryParamsName,
  queryParamsMapping,
}: {
  queryParamsName: string | null
  zodQueryParamsName?: string | null
  queryParamsMapping?: Record<string, string> | null
}): CallArg | null {
  if (!queryParamsName) return null
  if (zodQueryParamsName) return { value: 'requestParams' }
  if (queryParamsMapping) return { value: 'mappedParams' }
  return {}
}

/**
 * Resolves the `body` entry for a legacy data-returning client call: the multipart `FormData` branch
 * when several content types include form data, the single `FormData` cast for a form-data-only
 * operation, otherwise the parsed `requestBody`. Returns `null` when the operation has no request body.
 *
 * @deprecated Part of the legacy data-returning client kept for the query plugins until they move to
 * the `RequestResult` contract. plugin-client's own output no longer uses it.
 */
export function buildBodyParamDescriptor({
  requestName,
  isFormData,
  isMultipleContentTypes,
  hasFormData,
}: {
  requestName: string | null
  isFormData: boolean
  isMultipleContentTypes: boolean
  hasFormData: boolean
}): CallArg | null {
  if (!requestName) return null
  if (isMultipleContentTypes && hasFormData) {
    return { value: "contentType === 'multipart/form-data' ? formData as FormData : requestBody" }
  }
  if (isFormData) return { value: 'formData as FormData' }
  return { value: 'requestBody' }
}
