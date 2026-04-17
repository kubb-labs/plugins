import { URLPath } from '@internals/utils'
import { ast } from '@kubb/core'
import { functionPrinter } from '@kubb/plugin-ts'
import { File, Function } from '@kubb/renderer-jsx'
import type { KubbReactNode } from '@kubb/renderer-jsx/types'
import { getContentType, getMswMethod, getMswUrl, getPrimarySuccessResponse } from '../utils.ts'

type Props = {
  name: string
  typeName: string
  fakerName: string
  baseURL: string | undefined
  node: ast.OperationNode
}

const declarationPrinter = functionPrinter({ mode: 'declaration' })

export function MockWithFaker({ baseURL = '', name, fakerName, typeName, node }: Props): KubbReactNode {
  const method = getMswMethod(node)
  const successResponse = getPrimarySuccessResponse(node)
  const statusCode = successResponse ? Number(successResponse.statusCode) : 200
  const contentType = getContentType(successResponse)
  const url = new URLPath(getMswUrl(node)).toURLPath()

  const headers = [contentType ? `'Content-Type': '${contentType}'` : undefined].filter(Boolean)

  const params = declarationPrinter.print(
    ast.createFunctionParameters({
      params: [
        ast.createFunctionParameter({
          name: 'data',
          type: ast.createParamsType({
            variant: 'reference',
            name: `${typeName} | ((info: Parameters<Parameters<typeof http.${method}>[1]>[0]) => Response | Promise<Response>)`,
          }),
          optional: true,
        }),
      ],
    }),
  )

  return (
    <File.Source name={name} isIndexable isExportable>
      <Function name={name} export params={params ?? ''}>
        {`return http.${method}('${baseURL}${url.replace(/([^/]):/g, '$1\\\\:')}', function handler(info) {
    if(typeof data === 'function') return data(info)

    return new Response(JSON.stringify(data || ${fakerName}(data)), {
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
