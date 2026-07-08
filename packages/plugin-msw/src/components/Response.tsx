import type { ast } from 'kubb/kit'
import { createFunctionParameter, createFunctionParameters, functionPrinter } from '@kubb/plugin-ts'
import { File, Function } from 'kubb/jsx'
import type { KubbReactNode } from 'kubb/jsx'
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
  const headers = [contentType ? `'Content-Type': '${contentType}'` : null].filter(Boolean)

  const params = declarationPrinter.print(
    createFunctionParameters({
      params: [
        createFunctionParameter({
          name: 'data',
          type: typeName,
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
