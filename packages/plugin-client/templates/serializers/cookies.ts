import { isJsonMediaType, jsonReplacer, toValue } from '../serializers.ts'
import type { CookieSerializer } from '../serializers.ts'

// RFC 6265 cookie-octets, which the `cookie` style sends unescaped.
const cookieOctets = /^[\x21\x23-\x2B\x2D-\x3A\x3C-\x5B\x5D-\x7E]*$/

function rawCookieValue(name: string, item: unknown): string {
  const value = toValue(item)
  // The message leaves the value out, since cookies often carry session tokens.
  if (!cookieOctets.test(value)) throw new TypeError(`Cookie ${name} has characters the cookie style cannot send, escape it first.`)
  return value
}

function notNullish(value: unknown): boolean {
  return value !== undefined && value !== null
}

function serializeCookie({ name, value, explode, raw }: { name: string; value: unknown; explode: boolean; raw: boolean }): string {
  const encode = (item: unknown) => (raw ? rawCookieValue(name, item) : encodeURIComponent(toValue(item)))
  if (Array.isArray(value)) {
    const items = value.filter(notNullish).map(encode)
    return explode ? items.map((item) => `${name}=${item}`).join('; ') : `${name}=${items.join(',')}`
  }
  // A `Date` is a unit, not an object to expand.
  if (typeof value === 'object' && value !== null && !(value instanceof Date)) {
    const entries = Object.entries(value).filter(([, item]) => notNullish(item))
    // An exploded key becomes a cookie name, so the cookie style checks it like a value.
    if (explode) return entries.map(([key, item]) => `${raw ? rawCookieValue(name, key) : encodeURIComponent(key)}=${encode(item)}`).join('; ')
    return `${name}=${entries
      .flatMap(([key, item]) => [key, item])
      .map(encode)
      .join(',')}`
  }
  return `${name}=${encode(value)}`
}

/**
 * Joins cookie parameters into a `Cookie` header value with the OpenAPI `form` style, or the `cookie` style when a parameter sets it.
 */
export const serializeCookies: CookieSerializer = (cookies, styles) => {
  const parts: Array<string> = []
  for (const [name, value] of Object.entries(cookies)) {
    if (value === undefined || value === null) continue
    const style = styles?.[name]
    if (isJsonMediaType(style?.contentType)) {
      parts.push(`${name}=${encodeURIComponent(JSON.stringify(value, jsonReplacer))}`)
      continue
    }
    // OpenAPI 3.2 defaults `explode` to true for the `cookie` style.
    const raw = style?.style === 'cookie'
    parts.push(serializeCookie({ name, value, explode: style?.explode ?? raw, raw }))
  }
  return parts.join('; ')
}
