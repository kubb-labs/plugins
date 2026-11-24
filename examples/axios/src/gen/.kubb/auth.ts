import type { Auth, AuthResolver, SecurityRequirement } from './types'

/**
 * The value of a header, matched by name in any letter case.
 */
export function getHeader(headers: Record<string, string>, name: string): string | undefined {
  const key = Object.keys(headers).find((k) => k.toLowerCase() === name.toLowerCase())
  return key ? headers[key] : undefined
}

function placeToken({ scheme, token, headers, query }: { scheme: Auth; token: string; headers: Record<string, string>; query: Record<string, unknown> }): void {
  if (scheme.type !== 'apiKey') {
    if (getHeader(headers, 'Authorization') === undefined) {
      headers['Authorization'] = scheme.scheme === 'basic' ? `Basic ${btoa(String.fromCharCode(...new TextEncoder().encode(token)))}` : `Bearer ${token}`
    }
    return
  }
  const name = scheme.name ?? 'Authorization'
  if (scheme.in === 'query') {
    if (query[name] === undefined) query[name] = token
    return
  }
  if (scheme.in === 'cookie') {
    appendCookie(headers, cookiePair(name, token))
    return
  }
  if (getHeader(headers, name) === undefined) headers[name] = token
}

/**
 * Adds the tokens of the first security requirement whose schemes all get one to `headers` and `query`.
 */
export async function resolveAuth(params: {
  security: Array<SecurityRequirement> | undefined
  auth: AuthResolver | undefined
  headers: Record<string, string>
  query: Record<string, unknown>
}): Promise<void> {
  const { security, auth, headers, query } = params
  if (!security?.length || auth === undefined) return

  for (const requirement of security) {
    const schemes = Array.isArray(requirement) ? requirement : [requirement]
    const tokens = await Promise.all(schemes.map((scheme) => (typeof auth === 'function' ? auth(scheme) : auth)))
    if (tokens.some((token) => token === undefined)) continue
    schemes.forEach((scheme, index) => placeToken({ scheme, token: tokens[index]!, headers, query }))
    return
  }
}

// Outside the RFC 6265 cookie-octets, such as a `;`, the token would start another cookie. The message leaves the token out.
function cookiePair(name: string, token: string): string {
  if (!/^[\x21\x23-\x2B\x2D-\x3A\x3C-\x5B\x5D-\x7E]*$/.test(token))
    throw new TypeError(`The ${name} API key has characters a cookie cannot carry, escape it first.`)
  return `${name}=${token}`
}

export function appendCookie(headers: Record<string, string>, cookie: string): void {
  const key = Object.keys(headers).find((name) => name.toLowerCase() === 'cookie') ?? 'Cookie'
  headers[key] = [headers[key], cookie].filter(Boolean).join('; ')
}
