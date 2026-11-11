import type { QueryParamStyle, QuerySerializer, QueryStyle } from '../serializers'
import { defaultQuerySerializer, encodeComponent, isJsonMediaType, isRecord, jsonReplacer, notNullish, toValue } from '../serializers'

const queryDelimiters: Record<QueryStyle, string> = { form: ',', spaceDelimited: '%20', pipeDelimited: '|', deepObject: ',' }

// `allowReserved` keeps reserved characters, but `#`, `&`, and `+` would end the query or change a form value.
function encodeReserved(value: unknown): string {
  return encodeURI(toValue(value)).replace(/[#&+]/g, encodeURIComponent)
}

function serializeDeepObject({ key, value, encode }: { key: string; value: unknown; encode: (value: unknown) => string }): Array<string> {
  if (value === undefined || value === null) return []
  if (Array.isArray(value)) return value.flatMap((item, index) => serializeDeepObject({ key: `${key}[${index}]`, value: item, encode }))
  if (isRecord(value)) {
    return Object.entries(value)
      .filter(([, item]) => notNullish(item))
      .flatMap(([prop, item]) => serializeDeepObject({ key: `${key}[${prop}]`, value: item, encode }))
  }
  return [`${encode(key)}=${encode(value)}`]
}

function serializeStyledQueryArray({
  key,
  value,
  options,
  encode,
}: {
  key: string
  value: Array<unknown>
  options: QueryParamStyle
  encode: (value: unknown) => string
}): Array<string> {
  const items = value.filter(notNullish)
  if (options.explode ?? true) return items.map((item) => `${encode(key)}=${encode(item)}`)
  return [`${encode(key)}=${items.map(encode).join(queryDelimiters[options.style ?? 'form'])}`]
}

function serializeStyledQueryObject({
  key,
  value,
  options,
  encode,
}: {
  key: string
  value: Record<string, unknown>
  options: QueryParamStyle
  encode: (value: unknown) => string
}): Array<string> {
  if ((options.style ?? 'form') === 'deepObject') return serializeDeepObject({ key, value, encode })
  const entries = Object.entries(value).filter(([, item]) => notNullish(item))
  if (options.explode ?? true) return entries.map(([prop, item]) => `${encode(prop)}=${encode(item)}`)
  return [
    `${encode(key)}=${entries
      .flatMap(([prop, item]) => [prop, item])
      .map(encode)
      .join(',')}`,
  ]
}

/**
 * One query parameter or form field with its OpenAPI style, as encoded pairs.
 */
export function serializeStyledQueryParam({ key, value, options }: { key: string; value: unknown; options: QueryParamStyle }): Array<string> {
  if (value === undefined || value === null) return []
  const encode = options.allowReserved ? encodeReserved : encodeComponent
  // OpenAPI leaves arrays under deepObject undefined. Objects in one are indexed, `items[0][price]=p`, as nested arrays are.
  if (Array.isArray(value) && options.style === 'deepObject' && value.some(isRecord)) return serializeDeepObject({ key, value, encode })
  if (Array.isArray(value)) return serializeStyledQueryArray({ key, value, options, encode })
  if (isRecord(value)) return serializeStyledQueryObject({ key, value, options, encode })
  return [`${encode(key)}=${encode(value)}`]
}

/**
 * The query serializer for parameters with an OpenAPI style, `allowReserved` or a JSON content type. A parameter without
 * a style entry uses the default serializer.
 */
export const serializeQuery: QuerySerializer = (params, options) => {
  const parts: Array<string> = []
  for (const [key, value] of Object.entries(params)) {
    const paramOptions = options?.[key]
    if (!paramOptions) {
      parts.push(defaultQuerySerializer({ [key]: value }))
    } else if (notNullish(value) && isJsonMediaType(paramOptions.contentType)) {
      const json = encodeComponent(JSON.stringify(value, jsonReplacer))
      parts.push(paramOptions.querystring ? json : `${encodeComponent(key)}=${json}`)
    } else {
      parts.push(...serializeStyledQueryParam({ key, value, options: paramOptions }))
    }
  }
  return parts.filter(Boolean).join('&')
}
