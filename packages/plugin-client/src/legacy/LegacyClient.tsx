import { resolveQueryParamsParser, resolveRequestParser, resolveResponseParser } from '@internals/client'
import {
  buildOperationComments,
  buildParamsMapping,
  buildRequestParamsSignature,
  getContentTypeInfo,
  getOperationParameters,
  getResponseType,
  resolveSuccessNames,
} from '@internals/shared'
import { Url } from '@internals/utils'
import { stringify } from '@kubb/ast/utils'
import { ast } from '@kubb/core'
import type { ResolverTs } from '@kubb/plugin-ts'
import type { ResolverZod } from '@kubb/plugin-zod'
import { File, Function } from '@kubb/renderer-jsx'
import type { KubbReactNode } from '@kubb/renderer-jsx/types'
import { buildClientRequestArgs } from '../callArgs.ts'
import { buildBodyParamDescriptor, buildQueryParamDescriptor, buildStatusUnionType } from './legacyUtils.ts'

/**
 * The legacy data-returning client component, preserved verbatim for the query plugins until they
 * move to the `RequestResult` contract (their future `client: 'legacy'`). It branches on
 * `dataReturnType` (`'data'` returns `res.data`, `'full'` returns a status-discriminated union) and
 * targets the legacy `client` runtime (`Client` / `RequestConfig` / `ResponseErrorConfig`).
 *
 * @deprecated plugin-client's own output is contract-only and never renders this. Kept exported so a
 * later phase can render the old behavior.
 */
type DataReturnType = 'data' | 'full'

type Props = {
  name: string
  urlName?: string
  isExportable?: boolean
  isIndexable?: boolean
  isConfigurable?: boolean
  returnType?: string

  baseURL: string | null | undefined
  dataReturnType: DataReturnType
  parser: false | 'zod' | { request?: 'zod'; response?: 'zod' } | undefined
  node: ast.OperationNode
  tsResolver: ResolverTs
  zodResolver?: ResolverZod | null
  children?: KubbReactNode
}

export function LegacyClient({
  name,
  isExportable = true,
  isIndexable = true,
  returnType,
  baseURL,
  dataReturnType,
  parser,
  node,
  tsResolver,
  zodResolver,
  urlName,
  children,
  isConfigurable = true,
}: Props): KubbReactNode {
  if (!ast.isHttpOperationNode(node)) return null
  const { defaultContentType: contentType, isMultipleContentTypes, hasFormData } = getContentTypeInfo(node)
  const isFormData = !isMultipleContentTypes && contentType === 'multipart/form-data'
  const responseType = getResponseType(node)

  const { query: originalQueryParams, header: originalHeaderParams } = getOperationParameters(node, { paramsCasing: 'original' })
  const { query: casedQueryParams, header: casedHeaderParams } = getOperationParameters(node)

  const queryParamsMapping = buildParamsMapping(originalQueryParams, casedQueryParams)
  const headerParamsMapping = buildParamsMapping(originalHeaderParams, casedHeaderParams)

  const requestName = node.requestBody?.content?.[0]?.schema ? tsResolver.resolveDataName(node) : null
  const successNames = resolveSuccessNames(node, tsResolver)
  const responseName = successNames.length > 0 ? successNames.join(' | ') : tsResolver.resolveResponseName(node)
  const queryParamsName = originalQueryParams.length > 0 ? tsResolver.resolveQueryParamsName(node, originalQueryParams[0]!) : null
  const headerParamsName = originalHeaderParams.length > 0 ? tsResolver.resolveHeaderParamsName(node, originalHeaderParams[0]!) : null

  const requestParser = resolveRequestParser(parser)
  const responseParser = resolveResponseParser(parser)
  const zodResponseName = zodResolver && responseParser === 'zod' ? zodResolver.resolveResponseName?.(node) : null
  const zodRequestName = zodResolver && requestParser === 'zod' && node.requestBody?.content?.[0]?.schema ? zodResolver.resolveDataName?.(node) : null
  const queryParamsParser = resolveQueryParamsParser(parser)
  const zodQueryParamsName =
    zodResolver && queryParamsParser === 'zod' && originalQueryParams.length > 0 ? zodResolver.resolveQueryParamsName?.(node, originalQueryParams[0]!) : null

  const errorNames = node.responses
    .filter((r) => {
      const code = Number.parseInt(r.statusCode, 10)
      return code >= 400
    })
    .map((r) => tsResolver.resolveResponseStatusName(node, r.statusCode))

  const headers = [
    !isMultipleContentTypes && contentType !== 'application/json' && contentType !== 'multipart/form-data' ? `'Content-Type': '${contentType}'` : null,
    headerParamsName ? (headerParamsMapping ? '...mappedHeaders' : '...headers') : null,
  ].filter(Boolean)

  const TError = `ResponseErrorConfig<${errorNames.length > 0 ? errorNames.join(' | ') : 'Error'}>`

  const allStatusNames = node.responses.map((r) => tsResolver.resolveResponseStatusName(node, r.statusCode))
  const genericsResponseName = dataReturnType === 'full' ? (allStatusNames.length > 0 ? allStatusNames.join(' | ') : responseName) : responseName
  // z.input<> matches what the user provides before zod transforms/defaults are applied, keeping it compatible with the TS model types
  const requestGenericType = parser === 'zod' && zodRequestName ? `z.input<typeof ${zodRequestName}>` : requestName || 'unknown'
  const generics = [genericsResponseName, TError, requestGenericType].filter(Boolean)
  const { signature: paramsSignature, groups } = buildRequestParamsSignature(node, tsResolver, { isConfigurable })
  const urlParamsCall = groups.path ? 'path' : ''

  const clientParams = buildClientRequestArgs({
    method: stringify(node.method.toUpperCase()),
    url: urlName ? `${urlName}(${urlParamsCall}).url.toString()` : Url.toGroupedTemplateString(node.path),
    baseURL: baseURL && !urlName ? `\`${baseURL}\`` : null,
    query: buildQueryParamDescriptor({ queryParamsName, zodQueryParamsName, queryParamsMapping }),
    body: buildBodyParamDescriptor({ requestName, isFormData, isMultipleContentTypes, hasFormData }),
    contentType: isConfigurable && isMultipleContentTypes,
    responseType: responseType ? stringify(responseType) : null,
    headers: headers.length ? (isConfigurable ? `{ ${headers.join(', ')}, ...requestConfig.headers }` : `{ ${headers.join(', ')} }`) : null,
    requestConfigPlacement: isConfigurable ? 'last' : null,
  })

  const statusUnionType = dataReturnType === 'full' ? buildStatusUnionType(node, tsResolver) : null

  const childrenElement = children ? (
    children
  ) : (
    <>
      {dataReturnType === 'full' &&
        responseParser === 'zod' &&
        zodResponseName &&
        statusUnionType &&
        `return {...res, data: ${zodResponseName}.parse(res.data)} as ${statusUnionType}`}
      {dataReturnType === 'full' && responseParser !== 'zod' && statusUnionType && `return res as ${statusUnionType}`}
      {dataReturnType === 'data' && responseParser === 'zod' && zodResponseName && `return ${zodResponseName}.parse(res.data)`}
      {dataReturnType === 'data' && responseParser !== 'zod' && 'return res.data'}
    </>
  )

  return (
    <>
      <br />

      <File.Source name={name} isExportable={isExportable} isIndexable={isIndexable}>
        <Function
          name={name}
          async
          export={isExportable}
          params={paramsSignature}
          JSDoc={{
            comments: buildOperationComments(node, { link: 'urlPath', linkPosition: 'beforeDeprecated', splitLines: true }),
          }}
          returnType={returnType}
        >
          {isConfigurable
            ? `const { client: request = client, ${isMultipleContentTypes ? `contentType = ${stringify(contentType)}, ` : ''}...requestConfig } = config`
            : ''}
          <br />
          {queryParamsMapping && queryParamsName && (
            <>
              {`const mappedParams = query ? { ${Object.entries(queryParamsMapping)
                .map(([originalName, camelCaseName]) => `"${originalName}": query.${camelCaseName}`)
                .join(', ')} } : undefined`}
              <br />
            </>
          )}
          {headerParamsMapping && headerParamsName && (
            <>
              {`const mappedHeaders = headers ? { ${Object.entries(headerParamsMapping)
                .map(([originalName, camelCaseName]) => `"${originalName}": headers.${camelCaseName}`)
                .join(', ')} } : undefined`}
              <br />
            </>
          )}
          {requestParser === 'zod' && zodRequestName ? `const requestBody = ${zodRequestName}.parse(body)` : requestName && 'const requestBody = body'}
          {zodQueryParamsName && `const requestParams = ${zodQueryParamsName}.parse(query)`}
          {(isFormData || (isMultipleContentTypes && hasFormData)) && requestName && 'const formData = buildFormData(requestBody)'}
          <br />
          {isConfigurable
            ? `const res = await request<${generics.join(', ')}>(${clientParams})`
            : `const res = await client<${generics.join(', ')}>(${clientParams})`}
          <br />
          {childrenElement}
        </Function>
      </File.Source>
    </>
  )
}
