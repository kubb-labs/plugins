import type { MediaType } from '../mediaTypes'
import type { BodyEncoding } from '../serializers'
import { isEncodedBody } from '../mediaTypes'
import { isJsonMediaType, jsonReplacer, notNullish, toValue } from '../serializers'

function appendFormDataValue({
  formData,
  key,
  value,
  contentType,
}: {
  formData: FormData
  key: string
  value: unknown
  contentType?: string | undefined
}): void {
  if (value === undefined || value === null) return
  if (value instanceof Blob) {
    formData.append(key, value)
    return
  }
  // A JSON part sends a scalar as JSON too, so a string arrives quoted.
  if ((typeof value === 'object' && !(value instanceof Date)) || isJsonMediaType(contentType)) {
    const encoded = JSON.stringify(value, jsonReplacer)
    // A part's media type can only be set by wrapping the value in a typed Blob.
    formData.append(key, contentType ? new Blob([encoded], { type: contentType }) : encoded)
    return
  }
  formData.append(key, toValue(value))
}

const formDelimiters: Partial<Record<string, string>> = { spaceDelimited: ' ', pipeDelimited: '|' }

function toFormData(body: Record<string, unknown>, encoding: Record<string, BodyEncoding> | undefined): FormData {
  const formData = new FormData()
  for (const [key, value] of Object.entries(body)) {
    const { contentType, style, explode } = encoding?.[key] ?? {}
    // `explode: false`, the default for the delimited styles, sends an array of scalars as one part, its items joined by the style's delimiter.
    if (
      Array.isArray(value) &&
      !(explode ?? (style !== 'spaceDelimited' && style !== 'pipeDelimited')) &&
      value.every((item) => typeof item !== 'object' || item === null || item instanceof Date)
    ) {
      const delimiter = formDelimiters[style ?? 'form'] ?? ','
      formData.append(key, value.filter(notNullish).map(toValue).join(delimiter))
      continue
    }
    for (const item of Array.isArray(value) ? value : [value]) appendFormDataValue({ formData, key, value: item, contentType })
  }
  return formData
}

/**
 * The `multipart/form-data` handler, which follows `config.styles.body`.
 */
export const multipartFormData: MediaType = {
  encode: (body, { config }) => (isEncodedBody(body) ? body : toFormData(body as Record<string, unknown>, config.styles?.body)),
  decode: (response) => response.formData(),
}
