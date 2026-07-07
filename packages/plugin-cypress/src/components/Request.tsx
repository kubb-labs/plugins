import { buildParamsMapping, buildParamsRemapExpression, buildRequestParamsSignature, getOperationParameters } from '@internals/shared'
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

  const { query: originalQueryParams, header: originalHeaderParams } = getOperationParameters(node, { paramsCasing: 'original' })
  const { query: casedQueryParams, header: casedHeaderParams } = getOperationParameters(node)

  const queryParamsMapping = buildParamsMapping(originalQueryParams, casedQueryParams)
  const headerParamsMapping = buildParamsMapping(originalHeaderParams, casedHeaderParams)

  const { signature, groups } = buildRequestParamsSignature(node, resolver, { isConfigurable: false })
  const paramsSignature = [signature, 'options: Partial<Cypress.RequestOptions> = {}'].filter(Boolean).join(', ')

  const responseType = resolver.response.response(node)
  const returnType = `Cypress.Chainable<${responseType}>`

  // Reference the path object straight in the URL with camelCase placeholders.
  const urlTemplate = Url.toGroupedTemplateString(node.path, { prefix: baseURL })

  const requestOptions: Array<string> = [`method: '${node.method}'`, `url: ${urlTemplate}`]

  if (groups.query) {
    requestOptions.push(queryParamsMapping ? `qs: ${buildParamsRemapExpression({ source: 'query', mapping: queryParamsMapping })}` : 'qs: query')
  }

  if (groups.headers) {
    requestOptions.push(headerParamsMapping ? `headers: ${buildParamsRemapExpression({ source: 'headers', mapping: headerParamsMapping })}` : 'headers')
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
