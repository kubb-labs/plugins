import { buildRequestParamsSignature } from '@internals/shared'

import { ast, code, Url } from '@kubb/kit'
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
  const cookieText =
    "value instanceof Date ? value.toISOString() : Array.isArray(value) ? value.join(',') : typeof value === 'object' ? JSON.stringify(value) : String(value)"
  // The OpenAPI 3.2 `cookie` style sends a value as it is, and throws on one it cannot send, like the generated clients do.
  // With `explode` (its default) an array sends one cookie per item and an object one cookie per key, otherwise both join with commas.
  const rawParameters = node.parameters.filter((parameter) => parameter.in === 'cookie' && parameter.style === 'cookie')
  // Only an array or object needs the join and explode code. A value with one primitive type goes out as one cookie.
  const isComposite = (parameter: ast.ParameterNode) =>
    !['string', 'number', 'integer', 'bigint', 'boolean'].includes(ast.resolveRef(parameter.schema).primitive ?? '')
  const isExploded = (parameter: ast.ParameterNode) => parameter.explode !== false && isComposite(parameter)
  const explodedCookies = rawParameters.filter(isExploded).map((parameter) => code.string(parameter.name))
  const joinedCookies = rawParameters.filter((parameter) => !isExploded(parameter)).map((parameter) => code.string(parameter.name))
  // A `form` cookie explodes only when the spec sets `explode: true`, like the generated clients, and its items stay percent-encoded.
  const explodedFormCookies = node.parameters
    .filter((parameter) => parameter.in === 'cookie' && parameter.style !== 'cookie' && parameter.explode === true && isComposite(parameter))
    .map((parameter) => code.string(parameter.name))
  const compositeLines = rawParameters.some(isComposite)
    ? `  if (Array.isArray(value)) return value.filter((item) => item != null).map(rawCookie).join(',')
  if (typeof value === 'object' && value !== null && !(value instanceof Date)) return Object.entries(value).filter(([, item]) => item != null).flat().map(rawCookie).join(',')\n`
    : ''
  const explodeCookieLine =
    explodedCookies.length || explodedFormCookies.length
      ? `const explodeCookie = (name: string, value: unknown, encode: (item: unknown) => string): Array<string> => {
  if (Array.isArray(value)) return value.filter((item) => item != null).map((item) => \`\${name}=\${encode(item)}\`)
  if (typeof value === 'object' && value !== null && !(value instanceof Date)) return Object.entries(value).filter(([, item]) => item != null).map(([key, item]) => \`\${encode(key)}=\${encode(item)}\`)
  return [\`\${name}=\${encode(value)}\`]
}\n`
      : ''
  const formCookieLine = explodedFormCookies.length
    ? 'const formCookie = (item: unknown): string => encodeURIComponent(item instanceof Date ? item.toISOString() : String(item))\n'
    : ''
  // Keep the cookie-octet pattern in step with `rawCookieValue` in plugin-client's `templates/serializers.ts`.
  const rawCookieLine = rawParameters.length
    ? `const rawCookie = (value: unknown): string => {
${compositeLines}  const text = value instanceof Date ? value.toISOString() : String(value)
  if (!/^[\\x21\\x23-\\x2B\\x2D-\\x3A\\x3C-\\x5B\\x5D-\\x7E]*$/.test(text)) throw new TypeError('A cookie has characters the cookie style cannot send, escape it first.')
  return text
}\n`
    : ''
  const encodeCookie = joinedCookies.length
    ? `([${joinedCookies.join(', ')}].includes(name) ? rawCookie(value) : encodeURIComponent(${cookieText}))`
    : `encodeURIComponent(${cookieText})`
  const explodeRaw = explodedCookies.length ? `[${explodedCookies.join(', ')}].includes(name) ? explodeCookie(name, value, rawCookie) : ` : ''
  const explodeForm = explodedFormCookies.length ? `[${explodedFormCookies.join(', ')}].includes(name) ? explodeCookie(name, value, formCookie) : ` : ''
  const toCookies =
    explodeRaw || explodeForm
      ? `.flatMap(([name, value]) => (${explodeRaw}${explodeForm}[\`\${name}=\${${encodeCookie}}\`]))`
      : `.map(([name, value]) => \`\${name}=\${${encodeCookie}}\`)`
  // Built first and sent only when non-empty, so a call without cookies keeps the cookies Cypress attaches itself.
  const cookieLine = `${rawCookieLine}${explodeCookieLine}${formCookieLine}const cookie = (Object.entries(cookies ?? {}) as Array<[string, unknown]>).filter(([, value]) => value != null)${toCookies}.join('; ')\n`

  // Cypress types a body as a string or an object, so a body that is one number or has no schema type is cast.
  const bodySchema = node.requestBody?.content?.[0]?.schema && ast.resolveRef(node.requestBody.content[0].schema)
  const castBody = bodySchema && (['number', 'integer'].includes(bodySchema.primitive ?? '') || ['unknown', 'any'].includes(bodySchema.type))

  const requestOptions = [
    `method: ${code.string(node.method)}`,
    `url: ${urlTemplate}`,
    groups.query && 'qs: query',
    groups.cookies ? `headers: { ${groups.headers ? '...headers, ' : ''}...(cookie ? { Cookie: cookie } : {}) }` : groups.headers && 'headers',
    groups.body && (castBody ? 'body: body as unknown as Cypress.RequestBody' : 'body'),
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
