import { getPrimarySuccessResponse } from '@internals/shared'
import { ast, Url } from 'kubb/kit'
import { createFunctionParameter, createFunctionParameters, functionPrinter } from '@kubb/plugin-ts'
import { File, Function } from 'kubb/jsx'
import type { KubbReactNode } from 'kubb/jsx'
import type { BaseURLImport } from '../types.ts'
import { getContentType, getMswMethod, hasResponseSchema } from '../utils.ts'

type Props = {
  name: string
  typeName: string
  requestTypeName?: string | null
  fakerName?: string
  baseURL: string | BaseURLImport | null | undefined
  node: ast.OperationNode
}

const declarationPrinter = functionPrinter({ mode: 'declaration' })

export function Mock({ baseURL = '', name, fakerName, typeName, requestTypeName, node }: Props): KubbReactNode {
  const method = getMswMethod(node)
  const successResponse = getPrimarySuccessResponse(node)
  const statusCode = successResponse ? Number(successResponse.statusCode) : 200
  const contentType = getContentType(successResponse)
  const url = ast.isHttpOperationNode(node) ? Url.toPath(node.path) : ''

  const headers = [contentType ? `'Content-Type': '${contentType}'` : null].filter(Boolean)
  const responseHasSchema = hasResponseSchema(successResponse)
  const dataType = responseHasSchema ? typeName : 'string | number | boolean | null | object'
  const paramType = fakerName ? typeName : dataType

  const callbackType = requestTypeName
    ? `HttpResponseResolver<Record<string, string>, ${requestTypeName}>`
    : `((info: Parameters<Parameters<typeof http.${method}>[1]>[0]) => Response | Promise<Response>)`

  const params = declarationPrinter.print(
    createFunctionParameters({
      params: [
        createFunctionParameter({
          name: 'data',
          type: `${paramType} | ${callbackType}`,
          optional: true,
        }),
        createFunctionParameter({
          name: 'options',
          type: '{ baseURL?: string }',
          optional: true,
        }),
      ],
    }),
  )

  const httpCall = requestTypeName ? `http.${method}<Record<string, string>, ${requestTypeName}>` : `http.${method}`

  const defaultBaseURL = baseURL && typeof baseURL === 'object' ? `${baseURL.name}()` : baseURL ? `\`${baseURL}\`` : "''"
  const urlLiteral = `\`\${options?.baseURL ?? ${defaultBaseURL}}${url.replace(/([^/]):/g, '$1\\\\:')}\``
  const responseBody = fakerName ? `JSON.stringify(data || ${fakerName}(data))` : 'JSON.stringify(data)'
  const headersBlock = headers.length ? `\n      headers: {\n        ${headers.join(', \n')}\n      },` : ''

  return (
    <File.Source name={name} isIndexable isExportable>
      <Function name={name} export params={params ?? ''}>
        {`return ${httpCall}(${urlLiteral}, function handler(info) {
    if(typeof data === 'function') return data(info)

    return new Response(${responseBody}, {
      status: ${statusCode},${headersBlock}
    })
  })`}
      </Function>
    </File.Source>
  )
}
