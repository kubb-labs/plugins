import { getPrimarySuccessResponse } from '@internals/shared'
import { singleQuote } from '@internals/utils'
import type { ast } from '@kubb/kit'
import { Url } from '@kubb/kit'
import { File, Function } from '@kubb/renderer-jsx'
import type { KubbReactNode } from '@kubb/renderer-jsx'
import { getExampleBody, getMockStatus, getMswMethod, hasResponseSchema, resolveDefaultBaseURL, responseReturn } from '../utils.ts'

type Props = {
  name: string
  typeName: string
  requestTypeName?: string | null
  fakerName?: string
  baseURL: string | null | undefined
  node: ast.HttpOperationNode
}

export function Mock({ baseURL = '', name, fakerName, typeName, requestTypeName, node }: Props): KubbReactNode {
  const method = getMswMethod(node)
  // `http.all` matches every method on the path, so a handler for a method MSW has no helper for lets the others pass through.
  const methodGuard = method === 'all' ? `if (info.request.method !== ${singleQuote(node.method)}) return\n\n    ` : ''
  const successResponse = getPrimarySuccessResponse(node)
  const statusCode = successResponse ? getMockStatus(successResponse.statusCode) : 200
  const url = Url.toPath(node.path)

  const responseHasSchema = hasResponseSchema(successResponse)
  const dataType = responseHasSchema ? typeName : 'string | number | boolean | null | object'
  const paramType = fakerName ? typeName : dataType
  const requestBodyType = requestTypeName ? `${requestTypeName} extends DefaultBodyType ? ${requestTypeName} : DefaultBodyType` : null

  const callbackType = requestBodyType
    ? `HttpResponseResolver<Record<string, string>, ${requestBodyType}>`
    : `((info: Parameters<Parameters<typeof http.${method}>[1]>[0]) => Response | Promise<Response>)`

  const params = `data?: ${paramType} | ${callbackType}, options?: { baseURL?: string }`

  const httpCall = requestBodyType ? `http.${method}<Record<string, string>, ${requestBodyType}>` : `http.${method}`

  // Escape colons that do not start a param, such as the second one in `/pet/:petId:search`.
  const urlLiteral = `\`\${options?.baseURL ?? ${resolveDefaultBaseURL(baseURL)}}${url.replace(/([^/]):/g, '$1\\\\:')}\``
  // Without Faker, the spec's own response example is the default body. An explicit `null` stays a `null` body.
  const example = fakerName ? null : getExampleBody(successResponse)
  const responseBody = fakerName ? `data ?? ${fakerName}()` : example ? `data === undefined ? ${example} : data` : 'data'

  return (
    <File.Source name={name} isIndexable isExportable>
      <Function name={name} export params={params}>
        {`return ${httpCall}(${urlLiteral}, function handler(info) {
    ${methodGuard}if(typeof data === 'function') return data(info)

    ${responseReturn(responseBody, statusCode, successResponse)}
  })`}
      </Function>
    </File.Source>
  )
}
