import { ast } from '@internals/ast'
import { Function } from '@kubb/renderer-jsx'
import type { KubbReactNode } from '@kubb/renderer-jsx'
import { responseReturn } from '../utils.ts'

export type ResponseProps = {
  typeName: string
  name: string
  response: ast.ResponseNode
  encoder?: string
}

export function Response({ name, typeName, response, encoder }: ResponseProps): KubbReactNode {
  // Optional, since a handler passes on the `data` it got, which may be left out.
  const params = `data?: ${typeName}`

  const responseName = `${name}Response${response.statusCode}`

  return (
    <Function name={responseName} export params={params}>
      {`
    ${responseReturn('data', ast.http.status.toCode(response), response, encoder)}`}
    </Function>
  )
}
