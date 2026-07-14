import { buildRequestParamsSignature, getOperationParameters } from '@internals/shared'
import { Url } from '@internals/utils'
import { ast } from 'kubb/kit'
import type { ResolverTs } from '@kubb/plugin-ts'
import { File, Function } from 'kubb/jsx'
import type { KubbReactNode } from 'kubb/jsx'

type Props = {
  /**
   * Name of the function
   */
  name: string
  /**
   * AST operation node
   */
  node: ast.OperationNode
  /**
   * TypeScript resolver for resolving param/data/response type names
   */
  resolver: ResolverTs
  baseURL: string | null | undefined
}

export function Request({ baseURL = '', name, resolver, node }: Props): KubbReactNode {
  if (!ast.isHttpOperationNode(node)) return null

  const { signature, groups } = buildRequestParamsSignature(node, resolver, { isConfigurable: false })
  const paramsSignature = [signature, 'options: Partial<Cypress.RequestOptions> = {}'].filter(Boolean).join(', ')

  const responseType = resolver.response.response(node)
  const returnType = `Cypress.Chainable<${responseType}>`

  // Reference the path object straight in the URL, using the resolved path-param names that the
  // generated `path` type uses (not the placeholder's own text, which can differ from a param's
  // declared name in a loosely-specced document).
  const { path: pathParams } = getOperationParameters(node)
  const urlTemplate = Url.toGroupedTemplateString(node.path, { prefix: baseURL, names: pathParams.map((param) => param.name) })

  const requestOptions: Array<string> = [`method: '${node.method}'`, `url: ${urlTemplate}`]

  if (groups.query) {
    requestOptions.push('qs: query')
  }

  if (groups.headers) {
    requestOptions.push('headers')
  }

  if (groups.body) {
    requestOptions.push('body')
  }

  requestOptions.push('...options')

  const requestCall = `return cy.request<${responseType}>({
  ${requestOptions.join(',\n  ')}
}).then((res) => res.body)`

  return (
    <File.Source name={name} isIndexable isExportable>
      <Function name={name} export params={paramsSignature} returnType={returnType}>
        {requestCall}
      </Function>
    </File.Source>
  )
}
