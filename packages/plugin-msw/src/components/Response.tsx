import type { ast } from '@kubb/kit'
import { File, Function } from '@kubb/renderer-jsx'
import type { KubbReactNode } from '@kubb/renderer-jsx'
import { hasResponseSchema, responseReturn } from '../utils.ts'

type Props = {
  typeName: string
  name: string
  response: ast.ResponseNode
}

export function Response({ name, typeName, response }: Props): KubbReactNode {
  const statusCode = Number(response.statusCode)

  const params = `data${hasResponseSchema(response) ? '' : '?'}: ${typeName}`

  const responseName = `${name}Response${statusCode}`

  return (
    <File.Source name={responseName} isIndexable isExportable>
      <Function name={responseName} export params={params}>
        {`
    ${responseReturn('data', statusCode, response)}`}
      </Function>
    </File.Source>
  )
}
