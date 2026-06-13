import { buildOperationComments, getContentTypeInfo, getOperationParameters } from '@internals/shared'
import { Url } from '@internals/utils'
import { buildJSDoc, stringify } from '@kubb/ast/utils'
import { ast } from '@kubb/core'
import type { ResolverTs } from '@kubb/plugin-ts'
import { functionPrinter } from '@kubb/plugin-ts'
import type { ResolverZod } from '@kubb/plugin-zod'
import { File } from '@kubb/renderer-jsx'
import type { KubbReactNode } from '@kubb/renderer-jsx/types'
import type { PluginClient } from '../types.ts'
import {
  buildClassClientParams,
  buildFormDataLine,
  buildGenerics,
  buildHeaders,
  buildQueryParamsLine,
  buildRequestDataLine,
  buildReturnStatement,
  resolveQueryParamsParser,
} from '../utils.ts'
import { buildClientParamsNode } from './Client.tsx'

type OperationData = {
  node: ast.OperationNode
  name: string
  tsResolver: ResolverTs
  zodResolver?: ResolverZod | null
}

type Props = {
  name: string
  isExportable?: boolean
  isIndexable?: boolean
  operations: Array<OperationData>
  baseURL: string | null | undefined
  dataReturnType: PluginClient['resolvedOptions']['dataReturnType']
  paramsCasing: PluginClient['resolvedOptions']['paramsCasing']
  paramsType: PluginClient['resolvedOptions']['pathParamsType']
  pathParamsType: PluginClient['resolvedOptions']['pathParamsType']
  parser: PluginClient['resolvedOptions']['parser'] | undefined
  children?: KubbReactNode
}

type GenerateMethodProps = {
  node: ast.OperationNode
  name: string
  tsResolver: ResolverTs
  zodResolver?: ResolverZod | null
  baseURL: string | null | undefined
  dataReturnType: PluginClient['resolvedOptions']['dataReturnType']
  parser: PluginClient['resolvedOptions']['parser'] | undefined
  paramsType: PluginClient['resolvedOptions']['paramsType']
  paramsCasing: PluginClient['resolvedOptions']['paramsCasing']
  pathParamsType: PluginClient['resolvedOptions']['pathParamsType']
}

const declarationPrinter = functionPrinter({ mode: 'declaration' })

function generateMethod({
  node,
  name,
  tsResolver,
  zodResolver,
  baseURL,
  dataReturnType,
  parser,
  paramsType,
  paramsCasing,
  pathParamsType,
}: GenerateMethodProps): string {
  if (!ast.isHttpOperationNode(node)) return ''
  const { defaultContentType: contentType, isMultipleContentTypes, hasFormData } = getContentTypeInfo(node)
  const isFormData = !isMultipleContentTypes && contentType === 'multipart/form-data'
  const { header: headerParams } = getOperationParameters(node)
  const headerParamsName = headerParams.length > 0 ? tsResolver.resolveHeaderParamsName(node, headerParams[0]!) : null
  const headers = isMultipleContentTypes ? (headerParamsName ? ['...headers'] : []) : buildHeaders(contentType, !!headerParamsName)
  const generics = buildGenerics(node, tsResolver, { dataReturnType, zodResolver, parser })
  const paramsNode = buildClientParamsNode({ paramsType, paramsCasing, pathParamsType, node, tsResolver, isConfigurable: true })
  const paramsSignature = declarationPrinter.print(paramsNode) ?? ''
  const { query: queryParams } = getOperationParameters(node)
  const zodQueryParamsName =
    zodResolver && resolveQueryParamsParser(parser) === 'zod' && queryParams.length > 0 ? zodResolver.resolveQueryParamsName?.(node, queryParams[0]!) : null
  const clientParams = buildClassClientParams({
    node,
    url: Url.toTemplateString(node.path, { casing: paramsCasing }),
    baseURL,
    tsResolver,
    isFormData,
    isMultipleContentTypes,
    hasFormData,
    headers,
    zodQueryParamsName,
  })
  const jsdoc = buildJSDoc(buildOperationComments(node, { link: 'urlPath', linkPosition: 'beforeDeprecated', splitLines: true }))

  const requestDataLine = buildRequestDataLine({ parser, node, zodResolver })
  const queryParamsLine = buildQueryParamsLine({ parser, node, zodResolver })
  const formDataLine = buildFormDataLine(isFormData || (isMultipleContentTypes && hasFormData), !!node.requestBody?.content?.[0]?.schema)
  const returnStatement = buildReturnStatement({ dataReturnType, parser, node, zodResolver, tsResolver })

  const methodBody = [
    `const { client: request = client, ${isMultipleContentTypes ? `contentType = ${stringify(contentType)}, ` : ''}...requestConfig } = mergeConfig(this.#config, config)`,
    '',
    requestDataLine,
    queryParamsLine,
    formDataLine,
    `const res = await request<${generics.join(', ')}>(${clientParams.toCall()})`,
    returnStatement,
  ]
    .filter(Boolean)
    .map((line) => `    ${line}`)
    .join('\n')

  return `${jsdoc}async ${name}(${paramsSignature}) {\n${methodBody}\n  }`
}

export function ClassClient({
  name,
  isExportable = true,
  isIndexable = true,
  operations,
  baseURL,
  dataReturnType,
  parser,
  paramsType,
  paramsCasing,
  pathParamsType,
  children,
}: Props): KubbReactNode {
  const methods = operations.map(({ node, name: methodName, tsResolver, zodResolver }) =>
    generateMethod({
      node,
      name: methodName,
      tsResolver,
      zodResolver,
      baseURL,
      dataReturnType,
      parser,
      paramsType,
      paramsCasing,
      pathParamsType,
    }),
  )

  const classCode = `export class ${name} {
  #config: Partial<RequestConfig> & { client?: Client }

  constructor(config: Partial<RequestConfig> & { client?: Client } = {}) {
    this.#config = config
  }

${methods.join('\n\n')}
}`

  return (
    <File.Source name={name} isExportable={isExportable} isIndexable={isIndexable}>
      {classCode}
      {children}
    </File.Source>
  )
}
