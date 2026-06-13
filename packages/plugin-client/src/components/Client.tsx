import {
  buildOperationComments,
  buildParamsMapping,
  buildRequestConfigType,
  getContentTypeInfo,
  getOperationParameters,
  getResponseType,
  resolveSuccessNames,
} from '@internals/shared'
import { isValidVarName, Url } from '@internals/utils'
import { stringify } from '@kubb/ast/utils'
import { ast } from '@kubb/core'
import type { ResolverTs } from '@kubb/plugin-ts'
import { functionPrinter } from '@kubb/plugin-ts'
import type { ResolverZod } from '@kubb/plugin-zod'
import { File, Function } from '@kubb/renderer-jsx'
import type { KubbReactNode } from '@kubb/renderer-jsx/types'
import { createFunctionParams } from '../functionParams.ts'
import type { PluginClient } from '../types.ts'
import { buildStatusUnionType, resolveQueryParamsParser, resolveRequestParser, resolveResponseParser } from '../utils.ts'
import { buildUrlParamsNode } from './Url.tsx'

type Props = {
  name: string
  urlName?: string
  isExportable?: boolean
  isIndexable?: boolean
  isConfigurable?: boolean
  returnType?: string

  baseURL: string | null | undefined
  dataReturnType: PluginClient['resolvedOptions']['dataReturnType']
  paramsCasing: PluginClient['resolvedOptions']['paramsCasing']
  paramsType: PluginClient['resolvedOptions']['pathParamsType']
  pathParamsType: PluginClient['resolvedOptions']['pathParamsType']
  parser: PluginClient['resolvedOptions']['parser'] | undefined
  node: ast.OperationNode
  tsResolver: ResolverTs
  zodResolver?: ResolverZod | null
  children?: KubbReactNode
}

type GetParamsProps = {
  paramsCasing: PluginClient['resolvedOptions']['paramsCasing']
  paramsType: PluginClient['resolvedOptions']['paramsType']
  pathParamsType: PluginClient['resolvedOptions']['pathParamsType']
  node: ast.OperationNode
  tsResolver: ResolverTs
  isConfigurable: boolean
}

const declarationPrinter = functionPrinter({ mode: 'declaration' })

export function buildClientParamsNode({
  paramsType,
  paramsCasing,
  pathParamsType,
  node,
  tsResolver,
  isConfigurable,
}: GetParamsProps): ast.FunctionParametersNode {
  return ast.createOperationParams(node, {
    paramsType,
    pathParamsType: paramsType === 'object' ? 'object' : pathParamsType === 'object' ? 'object' : 'inline',
    paramsCasing,
    resolver: tsResolver,
    extraParams: [
      ...(isConfigurable
        ? [
            ast.createFunctionParameter({
              name: 'config',
              type: ast.createParamsType({
                variant: 'reference',
                name: buildRequestConfigType(node, tsResolver),
              }),
              default: '{}',
            }),
          ]
        : []),
    ],
  })
}

export function Client({
  name,
  isExportable = true,
  isIndexable = true,
  returnType,
  baseURL,
  dataReturnType,
  parser,
  paramsType,
  paramsCasing,
  pathParamsType,
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

  const { path: originalPathParams, query: originalQueryParams, header: originalHeaderParams } = getOperationParameters(node)
  const { path: casedPathParams, query: casedQueryParams, header: casedHeaderParams } = getOperationParameters(node, { paramsCasing })

  const pathParamsMapping = paramsCasing && !urlName ? buildParamsMapping(originalPathParams, casedPathParams) : null
  const queryParamsMapping = paramsCasing ? buildParamsMapping(originalQueryParams, casedQueryParams) : null
  const headerParamsMapping = paramsCasing ? buildParamsMapping(originalHeaderParams, casedHeaderParams) : null

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
  // z.output<> reflects the post-transform type (e.g. date coercion turns Date → string), avoiding a compile error on the generated call
  const requestGenericType = parser === 'zod' && zodRequestName ? `z.output<typeof ${zodRequestName}>` : requestName || 'unknown'
  const generics = [genericsResponseName, TError, requestGenericType].filter(Boolean)
  const paramsNode = buildClientParamsNode({
    paramsType,
    paramsCasing,
    pathParamsType,
    node,
    tsResolver,
    isConfigurable,
  })
  const paramsSignature = declarationPrinter.print(paramsNode) ?? ''

  const urlParamsNode = buildUrlParamsNode({
    paramsType,
    paramsCasing,
    pathParamsType,
    node,
    tsResolver,
  })
  const callPrinter = functionPrinter({ mode: 'call' })
  const urlParamsCall = callPrinter.print(urlParamsNode) ?? ''

  const clientParams = createFunctionParams({
    config: {
      mode: 'object',
      children: {
        method: {
          value: stringify(node.method.toUpperCase()),
        },
        url: {
          value: urlName ? `${urlName}(${urlParamsCall}).url.toString()` : Url.toTemplateString(node.path),
        },
        baseURL:
          baseURL && !urlName
            ? {
                value: `\`${baseURL}\``,
              }
            : null,
        params: queryParamsName ? (zodQueryParamsName ? { value: 'requestParams' } : queryParamsMapping ? { value: 'mappedParams' } : {}) : null,
        data: requestName
          ? {
              value:
                isMultipleContentTypes && hasFormData
                  ? "contentType === 'multipart/form-data' ? formData as FormData : requestData"
                  : isFormData
                    ? 'formData as FormData'
                    : 'requestData',
            }
          : null,
        contentType: isConfigurable && isMultipleContentTypes ? {} : null,
        responseType: responseType ? { value: stringify(responseType) } : null,
        requestConfig: isConfigurable
          ? {
              mode: 'inlineSpread',
            }
          : null,
        headers: headers.length
          ? {
              value: isConfigurable ? `{ ${headers.join(', ')}, ...requestConfig.headers }` : `{ ${headers.join(', ')} }`,
            }
          : null,
      },
    },
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
          {pathParamsMapping &&
            Object.entries(pathParamsMapping)
              .filter(([originalName, camelCaseName]) => isValidVarName(originalName) && originalName !== camelCaseName)
              .map(([originalName, camelCaseName]) => `const ${originalName} = ${camelCaseName}`)
              .join('\n')}
          {pathParamsMapping && <br />}
          {queryParamsMapping && queryParamsName && (
            <>
              {`const mappedParams = params ? { ${Object.entries(queryParamsMapping)
                .map(([originalName, camelCaseName]) => `"${originalName}": params.${camelCaseName}`)
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
          {requestParser === 'zod' && zodRequestName ? `const requestData = ${zodRequestName}.parse(data)` : requestName && 'const requestData = data'}
          {zodQueryParamsName && `const requestParams = ${zodQueryParamsName}.parse(params)`}
          {(isFormData || (isMultipleContentTypes && hasFormData)) && requestName && 'const formData = buildFormData(requestData)'}
          <br />
          {isConfigurable
            ? `const res = await request<${generics.join(', ')}>(${clientParams.toCall()})`
            : `const res = await client<${generics.join(', ')}>(${clientParams.toCall()})`}
          <br />
          {childrenElement}
        </Function>
      </File.Source>
    </>
  )
}
