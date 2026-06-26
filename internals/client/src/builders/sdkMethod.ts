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
import { buildValidatorHooks } from './validator.ts'

/**
 * Builds the call config literal forwarded to the contract client, mirroring the shared `Operation`
 * component: `{ method, url, security?, parser?, ...config }`. The `...config` spread carries every
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
  const validators = buildValidatorHooks({ node, parser, zodResolver })
  const validatorEntries = [
    validators.request ? `request: ${validators.request}` : null,
    validators.response ? `response: ${validators.response}` : null,
  ].filter(Boolean)
  const validatorLiteral = validatorEntries.length ? `validator: { ${validatorEntries.join(', ')} }` : null
  const securityLiteral = buildSecurityMetadata({ security })

  return `{ ${[
    `method: '${node.method.toUpperCase()}'`,
    `url: '${Url.toCasedTemplate(node.path, { casing: 'camelcase' })}'`,
    securityLiteral ? `security: ${securityLiteral}` : null,
    validatorLiteral,
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
