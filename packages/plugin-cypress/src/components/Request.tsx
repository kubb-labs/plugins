import { buildRequestParamsSignature } from '@internals/shared'
import { singleQuote } from '@internals/utils'
import { ast, Url } from '@kubb/kit'
import type { ResolverTs } from '@kubb/plugin-ts'
import { File, Function } from '@kubb/renderer-jsx'
import type { KubbReactNode } from '@kubb/renderer-jsx'

type Props = {
  /**
   * Name of the function
   */
  name: string
  /**
   * AST operation node
   */
  node: ast.HttpOperationNode
  /**
   * TypeScript resolver for resolving param/data/response type names
   */
  resolver: ResolverTs
  baseURL: string | null | undefined
}

export function Request({ baseURL = '', name, resolver, node }: Props): KubbReactNode {
  const { signature, groups } = buildRequestParamsSignature(node, resolver, { isConfigurable: false })
  const paramsSignature = [signature, 'options: Partial<Cypress.RequestOptions> = {}'].filter(Boolean).join(', ')

  const responseType = resolver.response.response(node)
  const returnType = `Cypress.Chainable<${responseType}>`

  // Bracket-access the path object with the raw OpenAPI param names, matching the generated `path` type's keys.
  const urlTemplate = Url.toGroupedTemplateString(node.path, { prefix: baseURL })

  // `cy.request` has no cookie option, so the cookie group goes out as a `Cookie` header. An array joins with commas, a Date
  // is ISO 8601, and an object is JSON.
  // shortcut: ignores per-cookie `explode`, upgrade when a spec needs exploded cookie arrays in Cypress.
  const cookieText =
    "value instanceof Date ? value.toISOString() : Array.isArray(value) ? value.join(',') : typeof value === 'object' ? JSON.stringify(value) : String(value)"
  // The OpenAPI 3.2 `cookie` style sends a value as it is, and throws on one it cannot send, like the generated clients do.
  // An array or object is checked item by item and joined with commas, as the clients do for `explode: false`.
  const rawCookies = node.parameters
    .filter((parameter) => parameter.in === 'cookie' && parameter.style === 'cookie')
    .map((parameter) => singleQuote(parameter.name))
  const rawCookieLine = rawCookies.length
    ? `const rawCookie = (value: unknown): string => {
  if (Array.isArray(value)) return value.filter((item) => item != null).map(rawCookie).join(',')
  if (typeof value === 'object' && value !== null && !(value instanceof Date)) return Object.entries(value).filter(([, item]) => item != null).flat().map(rawCookie).join(',')
  const text = value instanceof Date ? value.toISOString() : String(value)
  if (!/^[\\x21\\x23-\\x2B\\x2D-\\x3A\\x3C-\\x5B\\x5D-\\x7E]*$/.test(text)) throw new TypeError('A cookie has characters the cookie style cannot send, escape it first.')
  return text
}\n`
    : ''
  const encodeCookie = rawCookies.length
    ? `([${rawCookies.join(', ')}].includes(name) ? rawCookie(value) : encodeURIComponent(${cookieText}))`
    : `encodeURIComponent(${cookieText})`
  // Built first and sent only when non-empty, so a call without cookies keeps the cookies Cypress attaches itself.
  const cookieLine = `${rawCookieLine}const cookie = (Object.entries(cookies ?? {}) as Array<[string, unknown]>).filter(([, value]) => value != null).map(([name, value]) => \`\${name}=\${${encodeCookie}}\`).join('; ')\n`

  // Cypress types a body as a string or an object, so a body that is one number or has no schema type is cast, and an
  // `int64` is sent as a number.
  const bodySchema = node.requestBody?.content?.[0]?.schema && ast.resolveRef(node.requestBody.content[0].schema)
  const castBody = bodySchema && (['number', 'integer', 'bigint'].includes(bodySchema.primitive ?? '') || ['unknown', 'any'].includes(bodySchema.type))

  const requestOptions = [
    `method: '${node.method}'`,
    `url: ${urlTemplate}`,
    groups.query && 'qs: query',
    groups.cookies ? `headers: { ${groups.headers ? '...headers, ' : ''}...(cookie ? { Cookie: cookie } : {}) }` : groups.headers && 'headers',
    groups.body && (castBody ? "body: (typeof body === 'bigint' ? Number(body) : body) as unknown as Cypress.RequestBody" : 'body'),
    '...options',
  ].filter(Boolean)

  // Cypress's catch-all `then` overload types a union body as `Chainable<Response | Pet> | Chainable<Response | string>`, so cast to the declared return type.
  const requestCall = `${groups.cookies ? cookieLine : ''}return cy.request<${responseType}>({
  ${requestOptions.join(',\n  ')}
}).then((res) => res.body) as ${returnType}`

  return (
    <File.Source name={name} isIndexable isExportable>
      <Function name={name} export params={paramsSignature} returnType={returnType}>
        {requestCall}
      </Function>
    </File.Source>
  )
}
