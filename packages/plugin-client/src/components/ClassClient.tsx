import { buildOperationComments, buildParamsMapping, buildRequestParamsSignature, getContentTypeInfo, getOperationParameters } from '@internals/shared'
import { Url } from '@internals/utils'
import { buildJSDoc, stringify } from '@kubb/ast/utils'
import { ast } from '@kubb/core'
import type { ResolverTs } from '@kubb/plugin-ts'
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
}

function generateMethod({ node, name, tsResolver, zodResolver, baseURL, dataReturnType, parser }: GenerateMethodProps): string {
  if (!ast.isHttpOperationNode(node)) return ''
  const { defaultContentType: contentType, isMultipleContentTypes, hasFormData } = getContentTypeInfo(node)
  const isFormData = !isMultipleContentTypes && contentType === 'multipart/form-data'
  const { query: queryParams, header: headerParams } = getOperationParameters(node)
  const { query: casedQueryParams, header: casedHeaderParams } = getOperationParameters(node, { paramsCasing: 'camelcase' })

  const queryParamsMapping = buildParamsMapping(queryParams, casedQueryParams)
  const headerParamsMapping = buildParamsMapping(headerParams, casedHeaderParams)

  const headerParamsName = headerParams.length > 0 ? tsResolver.resolveHeaderParamsName(node, headerParams[0]!) : null
  const queryParamsName = queryParams.length > 0 ? tsResolver.resolveQueryParamsName(node, queryParams[0]!) : null
  const headerSpread = headerParamsMapping ? '...mappedHeaders' : '...headers'
  const headers = isMultipleContentTypes ? (headerParamsName ? [headerSpread] : []) : buildHeaders(contentType, !!headerParamsName, headerSpread)
  const generics = buildGenerics(node, tsResolver, { dataReturnType, zodResolver, parser })
  const { signature: paramsSignature } = buildRequestParamsSignature(node, tsResolver, { isConfigurable: true })
  const zodQueryParamsName =
    zodResolver && resolveQueryParamsParser(parser) === 'zod' && queryParams.length > 0 ? zodResolver.resolveQueryParamsName?.(node, queryParams[0]!) : null
  const clientParams = buildClassClientParams({
    node,
    url: Url.toTemplateString(node.path, { casing: 'camelcase', replacer: (name) => `path.${name}` }),
    baseURL,
    tsResolver,
    isFormData,
    isMultipleContentTypes,
    hasFormData,
    headers,
    zodQueryParamsName,
    queryParamsMapping,
  })
  const jsdoc = buildJSDoc(buildOperationComments(node, { link: 'urlPath', linkPosition: 'beforeDeprecated', splitLines: true }))

  const mappedParamsLine =
    queryParamsMapping && queryParamsName
      ? `const mappedParams = query ? { ${Object.entries(queryParamsMapping)
          .map(([originalName, camelCaseName]) => `"${originalName}": query.${camelCaseName}`)
          .join(', ')} } : undefined`
      : ''
  const mappedHeadersLine =
    headerParamsMapping && headerParamsName
      ? `const mappedHeaders = headers ? { ${Object.entries(headerParamsMapping)
          .map(([originalName, camelCaseName]) => `"${originalName}": headers.${camelCaseName}`)
          .join(', ')} } : undefined`
      : ''

  const requestDataLine = buildRequestDataLine({ parser, node, zodResolver })
  const queryParamsLine = buildQueryParamsLine({ parser, node, zodResolver })
  const formDataLine = buildFormDataLine(isFormData || (isMultipleContentTypes && hasFormData), !!node.requestBody?.content?.[0]?.schema)
  const returnStatement = buildReturnStatement({ dataReturnType, parser, node, zodResolver, tsResolver })

  const methodBody = [
    `const { client: request = client, ${isMultipleContentTypes ? `contentType = ${stringify(contentType)}, ` : ''}...requestConfig } = mergeConfig(this.#config, config)`,
    '',
    mappedParamsLine,
    mappedHeadersLine,
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

export function ClassClient({ name, isExportable = true, isIndexable = true, operations, baseURL, dataReturnType, parser, children }: Props): KubbReactNode {
  const methods = operations.map(({ node, name: methodName, tsResolver, zodResolver }) =>
    generateMethod({
      node,
      name: methodName,
      tsResolver,
      zodResolver,
      baseURL,
      dataReturnType,
      parser,
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
