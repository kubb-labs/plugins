import { buildRequestParamsSignature } from '@internals/shared'
import { Url } from '@kubb/kit'
import type { ast } from '@kubb/kit'
import type { ResolverTs } from '@kubb/plugin-ts'
import { File, Function } from '@kubb/renderer-jsx'
import type { KubbReactNode } from '@kubb/renderer-jsx'

type Props = {
  /**
   * Name of the function
   */
  name: string
  /**
   * AST operation node
   */
  node: ast.HttpOperationNode
  /**
   * TypeScript resolver for resolving param/data/response type names
   */
  resolver: ResolverTs
  baseURL: string | null | undefined
}

export function Request({ baseURL = '', name, resolver, node }: Props): KubbReactNode {
  const { signature, groups } = buildRequestParamsSignature(node, resolver, { isConfigurable: false })
  const paramsSignature = [signature, 'options: Partial<Cypress.RequestOptions> = {}'].filter(Boolean).join(', ')

  const responseType = resolver.response.response(node)
  const returnType = `Cypress.Chainable<${responseType}>`

  // Bracket-access the path object with the raw OpenAPI param names, matching the generated `path` type's keys.
  const urlTemplate = Url.toGroupedTemplateString(node.path, { prefix: baseURL })

  const requestOptions = [
    `method: '${node.method}'`,
    `url: ${urlTemplate}`,
    groups.query && 'qs: query',
    groups.headers && 'headers',
    groups.body && 'body',
    '...options',
  ].filter(Boolean)

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
