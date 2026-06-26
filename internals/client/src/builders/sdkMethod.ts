import { buildOperationComments } from '@internals/shared'
import { Url } from '@internals/utils'
import type { HttpOperationNode } from '@kubb/ast'
import { buildJSDoc } from '@kubb/ast/utils'
import { ast } from '@kubb/core'
import type { ResolverTs } from '@kubb/plugin-ts'
import type { ResolverZod } from '@kubb/plugin-zod'
import type { ParserOptions } from '../types.ts'
import { buildReturnStatement } from './returnStatement.ts'
import { type Auth, buildSecurityMetadata } from './security.ts'
import { buildGroupedOptionsSignature } from './signature.ts'
import { buildParserHooks } from './validator.ts'

/**
 * Builds the call config literal forwarded to the contract client, mirroring the shared `Operation`
 * component: `{ method, url, security?, parser?, meta, ...config }`. The `...config` spread carries every
 * per-call field (including `throwOnError`), so the method stays a thin wrapper over the contract.
 */
function buildCallConfig({
  node,
  parser,
  zodResolver,
  security,
}: {
  node: HttpOperationNode
  parser: ParserOptions | undefined
  zodResolver?: ResolverZod | null
  security?: Array<Auth>
}): string {
  const parsers = buildParserHooks({ node, parser, zodResolver })
  const parserEntries = [parsers.request ? `request: ${parsers.request}` : null, parsers.response ? `response: ${parsers.response}` : null].filter(Boolean)
  const parserLiteral = parserEntries.length ? `parser: { ${parserEntries.join(', ')} }` : null
  const securityLiteral = buildSecurityMetadata({ security })

  const escape = (value: string) => value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")
  const metaLiteral = `meta: { operationId: '${escape(node.operationId)}', schemaPath: '${escape(node.path)}' }`

  return `{ ${[
    `method: '${node.method.toUpperCase()}'`,
    `url: '${Url.toCasedTemplate(node.path, { casing: 'camelcase' })}'`,
    securityLiteral ? `security: ${securityLiteral}` : null,
    parserLiteral,
    metaLiteral,
    '...config',
  ]
    .filter(Boolean)
    .join(', ')} }`
}

/**
 * Builds a single instance method for a generated SDK class. The body forwards the single grouped
 * `options` object to the instance's own client (`this.client`, built once in the constructor) and
 * returns the `RequestResult`. A per-call `options.client` still overrides the instance client, so
 * one operation can be routed to a different environment without a new instance.
 */
export function buildSdkMethod({
  node,
  name,
  tsResolver,
  zodResolver,
  parser,
  security,
}: {
  node: ast.OperationNode
  name: string
  tsResolver: ResolverTs
  zodResolver?: ResolverZod | null
  parser: ParserOptions | undefined
  security?: Array<Auth>
}): string {
  if (!ast.isHttpOperationNode(node)) return ''

  const signature = buildGroupedOptionsSignature({ node, tsResolver })
  const callConfig = buildCallConfig({ node, parser, zodResolver, security })
  const returnStatement = buildReturnStatement({ node, tsResolver, callConfig })
  const generics = signature.generics.length ? `<${signature.generics.join(', ')}>` : ''
  const jsdoc = buildJSDoc(buildOperationComments(node, { link: 'urlPath', linkPosition: 'beforeDeprecated', splitLines: true }))

  const methodBody = ['const { client: request = this.client, ...config } = options', '', returnStatement].map((line) => (line ? `    ${line}` : '')).join('\n')

  return `${jsdoc}  public ${name}${generics}(${signature.paramsSignature}): ${signature.returnType} {\n${methodBody}\n  }`
}
