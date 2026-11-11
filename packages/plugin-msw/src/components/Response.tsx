import type { ast } from '@kubb/kit'
import { File, Function } from '@kubb/renderer-jsx'
import type { KubbReactNode } from '@kubb/renderer-jsx'
import { getMockStatus, hasResponseSchema, responseReturn } from '../utils.ts'

type Props = {
  typeName: string
  name: string
  response: ast.ResponseNode
}

export function Response({ name, typeName, response }: Props): KubbReactNode {
  const params = `data${hasResponseSchema(response) ? '' : '?'}: ${typeName}`

  const responseName = `${name}Response${response.statusCode}`

  return (
    <File.Source name={responseName} isIndexable isExportable>
      <Function name={responseName} export params={params}>
        {`
    ${responseReturn('data', getMockStatus(response.statusCode), response)}`}
      </Function>
    </File.Source>
  )
}
