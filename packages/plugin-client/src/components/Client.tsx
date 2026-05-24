import {
  buildOperationComments,
  buildParamsMapping,
  buildRequestConfigType,
  getContentTypeInfo,
  getOperationParameters,
  resolveSuccessNames,
} from '@internals/shared'
import { isValidVarName, URLPath } from '@internals/utils'
import { ast } from '@kubb/core'
import type { ResolverTs } from '@kubb/plugin-ts'
import { functionPrinter } from '@kubb/plugin-ts'
import type { ResolverZod } from '@kubb/plugin-zod'
import { File, Function } from '@kubb/renderer-jsx'
import type { KubbReactNode } from '@kubb/renderer-jsx/types'
import { createFunctionParams } from '../functionParams.ts'
import type { PluginClient } from '../types.ts'
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
  const path = new URLPath(node.path ?? '')
  const { defaultContentType: contentType, isMultipleContentTypes, hasFormData } = getContentTypeInfo(node)
  const isFormData = !isMultipleContentTypes && contentType === 'multipart/form-data'

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

  const zodResponseName = zodResolver && parser === 'zod' ? zodResolver.resolveResponseName?.(node) : null
  const zodRequestName = zodResolver && parser === 'zod' && node.requestBody?.content?.[0]?.schema ? zodResolver.resolveDataName?.(node) : null

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

  const generics = [responseName, TError, requestName || 'unknown'].filter(Boolean)
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
          value: JSON.stringify(node.method?.toUpperCase()),
        },
        url: {
          value: urlName ? `${urlName}(${urlParamsCall}).url.toString()` : path.template,
        },
        baseURL:
          baseURL && !urlName
            ? {
                value: `\`${baseURL}\``,
              }
            : null,
        params: queryParamsName ? (queryParamsMapping ? { value: 'mappedParams' } : {}) : null,
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

  const childrenElement = children ? (
    children
  ) : (
    <>
      {dataReturnType === 'full' && parser === 'zod' && zodResponseName && `return {...res, data: ${zodResponseName}.parse(res.data)}`}
      {dataReturnType === 'data' && parser === 'zod' && zodResponseName && `return ${zodResponseName}.parse(res.data)`}
      {dataReturnType === 'full' && parser === 'client' && 'return res'}
      {dataReturnType === 'data' && parser === 'client' && 'return res.data'}
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
            ? `const { client: request = client, ${isMultipleContentTypes ? `contentType = ${JSON.stringify(contentType)}, ` : ''}...requestConfig } = config`
            : ''}
          <br />
          <br />
          {pathParamsMapping &&
            Object.entries(pathParamsMapping)
              .filter(([originalName, camelCaseName]) => isValidVarName(originalName) && originalName !== camelCaseName)
              .map(([originalName, camelCaseName]) => `const ${originalName} = ${camelCaseName}`)
              .join('\n')}
          {pathParamsMapping && (
            <>
              <br />
              <br />
            </>
          )}
          {queryParamsMapping && queryParamsName && (
            <>
              {`const mappedParams = params ? { ${Object.entries(queryParamsMapping)
                .map(([originalName, camelCaseName]) => `"${originalName}": params.${camelCaseName}`)
                .join(', ')} } : undefined`}
              <br />
              <br />
            </>
          )}
          {headerParamsMapping && headerParamsName && (
            <>
              {`const mappedHeaders = headers ? { ${Object.entries(headerParamsMapping)
                .map(([originalName, camelCaseName]) => `"${originalName}": headers.${camelCaseName}`)
                .join(', ')} } : undefined`}
              <br />
              <br />
            </>
          )}
          {parser === 'zod' && zodRequestName ? `const requestData = ${zodRequestName}.parse(data)` : requestName && 'const requestData = data'}
          <br />
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
