import { ast } from '@kubb/kit'
import { File, Function } from '@kubb/renderer-jsx'
import type { KubbReactNode } from '@kubb/renderer-jsx'
import { responseReturn } from '../utils.ts'

type Props = {
  typeName: string
  name: string
  response: ast.ResponseNode
}

export function Response({ name, typeName, response }: Props): KubbReactNode {
  // Optional, since a handler passes on the `data` it got, which may be left out.
  const params = `data?: ${typeName}`

  const responseName = `${name}Response${response.statusCode}`

  return (
    <File.Source name={responseName} isIndexable isExportable>
      <Function name={responseName} export params={params}>
        {`
    ${responseReturn('data', ast.http.status.toCode(response.statusCode), response)}`}
      </Function>
    </File.Source>
  )
}
