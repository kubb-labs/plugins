import { ast } from '@kubb/core'
import { functionPrinter } from '@kubb/plugin-ts'
import { File, Function } from '@kubb/renderer-jsx'
import type { KubbReactNode } from '@kubb/renderer-jsx/types'
import { getContentType, hasResponseSchema } from '../utils.ts'

type Props = {
  typeName: string
  name: string
  response: ast.ResponseNode
}

const declarationPrinter = functionPrinter({ mode: 'declaration' })

export function Response({ name, typeName, response }: Props): KubbReactNode {
  const statusCode = Number(response.statusCode)
  const contentType = getContentType(response)
  const headers = [contentType ? `'Content-Type': '${contentType}'` : undefined].filter(Boolean)

  const params = declarationPrinter.print(
    ast.createFunctionParameters({
      params: [
        ast.createFunctionParameter({
          name: 'data',
          type: ast.createParamsType({ variant: 'reference', name: typeName }),
          optional: !hasResponseSchema(response),
        }),
      ],
    }),
  )

  const responseName = `${name}Response${statusCode}`

  return (
    <File.Source name={responseName} isIndexable isExportable>
      <Function name={responseName} export params={params ?? ''}>
        {`
    return new Response(JSON.stringify(data), {
      status: ${statusCode},
      ${
        headers.length
          ? `  headers: {
        ${headers.join(', \n')}
      },`
          : ''
      }
    })`}
      </Function>
    </File.Source>
  )
}
