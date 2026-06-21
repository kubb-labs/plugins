import { buildOperationComments } from '@internals/shared'
import type { HttpOperationNode } from '@kubb/ast'
import { buildJSDoc } from '@kubb/ast/utils'
import { ast } from '@kubb/core'
import type { ResolverTs } from '@kubb/plugin-ts'
import type { ResolverZod } from '@kubb/plugin-zod'
import type { ParserOptions } from '../types.ts'
import { buildReturnStatement } from './returnStatement.ts'
import { buildGroupedOptionsSignature } from './signature.ts'
import { buildParserHooks } from './validator.ts'

/**
 * Builds the call config literal forwarded to the contract client, mirroring the shared `Operation`
 * component: `{ method, url, parser?, ...config }`. The `...config` spread carries every per-call
 * field (including `throwOnError`), so the static method stays a thin wrapper over the contract.
 */
function buildCallConfig({
  node,
  parser,
  zodResolver,
}: {
  node: HttpOperationNode
  parser: ParserOptions | undefined
  zodResolver?: ResolverZod | null
}): string {
  const parsers = buildParserHooks({ node, parser, zodResolver })
  const parserEntries = [parsers.request ? `request: ${parsers.request}` : null, parsers.response ? `response: ${parsers.response}` : null].filter(Boolean)
  const parserLiteral = parserEntries.length ? `parser: { ${parserEntries.join(', ')} }` : null

  return `{ ${[`method: '${node.method.toUpperCase()}'`, `url: '${node.path}'`, parserLiteral, '...config'].filter(Boolean).join(', ')} }`
}

/**
 * Builds a single `public static` method for a generated SDK class. The body is identical to the
 * standalone `Operation` function: it forwards the single grouped `options` object to the contract
 * client and returns the `RequestResult`. Methods are self-contained, so the class needs no
 * constructor or shared state and stays tree-shakeable per call.
 */
export function buildSdkMethod({
  node,
  name,
  tsResolver,
  zodResolver,
  parser,
}: {
  node: ast.OperationNode
  name: string
  tsResolver: ResolverTs
  zodResolver?: ResolverZod | null
  parser: ParserOptions | undefined
}): string {
  if (!ast.isHttpOperationNode(node)) return ''

  const signature = buildGroupedOptionsSignature({ node, tsResolver })
  const callConfig = buildCallConfig({ node, parser, zodResolver })
  const returnStatement = buildReturnStatement({ node, tsResolver, callConfig })
  const generics = signature.generics.length ? `<${signature.generics.join(', ')}>` : ''
  const jsdoc = buildJSDoc(buildOperationComments(node, { link: 'urlPath', linkPosition: 'beforeDeprecated', splitLines: true }))

  const methodBody = ['const { client: request = client, ...config } = options', '', returnStatement].map((line) => (line ? `    ${line}` : '')).join('\n')

  return `${jsdoc}  public static ${name}${generics}(${signature.paramsSignature}): ${signature.returnType} {\n${methodBody}\n  }`
}
