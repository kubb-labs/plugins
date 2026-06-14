import { getPrimarySuccessResponse } from '@internals/shared'
import { Url } from '@internals/utils'
import { ast } from '@kubb/core'
import { functionPrinter } from '@kubb/plugin-ts'
import { File, Function } from '@kubb/renderer-jsx'
import type { KubbReactNode } from '@kubb/renderer-jsx/types'
import { getContentType, getMswMethod, getMswUrl, hasResponseSchema } from '../utils.ts'

type Props = {
  name: string
  typeName: string
  requestTypeName?: string | null
  baseURL: string | null | undefined
  node: ast.OperationNode
}

const declarationPrinter = functionPrinter({ mode: 'declaration' })

export function Mock({ baseURL = '', name, typeName, requestTypeName, node }: Props): KubbReactNode {
  const method = getMswMethod(node)
  const successResponse = getPrimarySuccessResponse(node)
  const statusCode = successResponse ? Number(successResponse.statusCode) : 200
  const contentType = getContentType(successResponse)
  const url = Url.toPath(getMswUrl(node))

  const headers = [contentType ? `'Content-Type': '${contentType}'` : null].filter(Boolean)
  const responseHasSchema = hasResponseSchema(successResponse)
  const dataType = responseHasSchema ? typeName : 'string | number | boolean | null | object'

  const callbackType = requestTypeName
    ? `HttpResponseResolver<Record<string, string>, ${requestTypeName}, any>`
    : `((info: Parameters<Parameters<typeof http.${method}>[1]>[0]) => Response | Promise<Response>)`

  const params = declarationPrinter.print(
    ast.createFunctionParameters({
      params: [
        ast.createFunctionParameter({
          name: 'data',
          type: `${dataType} | ${callbackType}`,
          optional: true,
        }),
      ],
    }),
  )

  const httpCall = requestTypeName ? `http.${method}<Record<string, string>, ${requestTypeName}, any>` : `http.${method}`

  return (
    <File.Source name={name} isIndexable isExportable>
      <Function name={name} export params={params ?? ''}>
        {`return ${httpCall}(\`${baseURL}${url.replace(/([^/]):/g, '$1\\\\:')}\`, function handler(info) {
    if(typeof data === 'function') return data(info)

    return new Response(JSON.stringify(data), {
      status: ${statusCode},
      ${
        headers.length
          ? `  headers: {
        ${headers.join(', \n')}
      },`
          : ''
      }
    })
  })`}
      </Function>
    </File.Source>
  )
}
