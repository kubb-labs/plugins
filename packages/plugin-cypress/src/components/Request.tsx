import { buildParamsMapping, buildRequestParamsSignature, getOperationParameters } from '@internals/shared'
import { Url } from '@internals/utils'
import { ast } from '@kubb/core'
import type { ResolverTs } from '@kubb/plugin-ts'
import { File, Function } from '@kubb/renderer-jsx'
import type { KubbReactNode } from '@kubb/renderer-jsx/types'
import type { PluginCypress } from '../types.ts'

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
  dataReturnType: PluginCypress['resolvedOptions']['dataReturnType']
}

export function Request({ baseURL = '', name, dataReturnType, resolver, node }: Props): KubbReactNode {
  if (!ast.isHttpOperationNode(node)) return null

  const { query: originalQueryParams, header: originalHeaderParams } = getOperationParameters(node)
  const { query: casedQueryParams, header: casedHeaderParams } = getOperationParameters(node, { paramsCasing: 'camelcase' })

  const queryParamsMapping = buildParamsMapping(originalQueryParams, casedQueryParams)
  const headerParamsMapping = buildParamsMapping(originalHeaderParams, casedHeaderParams)

  const { signature, groups } = buildRequestParamsSignature(node, resolver, { isConfigurable: false })
  const paramsSignature = [signature, 'options: Partial<Cypress.RequestOptions> = {}'].filter(Boolean).join(', ')

  const responseType = resolver.resolveResponseName(node)
  const returnType = dataReturnType === 'data' ? `Cypress.Chainable<${responseType}>` : `Cypress.Chainable<Cypress.Response<${responseType}>>`

  // Reference the path object straight in the URL with camelCase placeholders.
  const urlTemplate = Url.toGroupedTemplateString(node.path, { prefix: baseURL })

  const requestOptions: Array<string> = [`method: '${node.method}'`, `url: ${urlTemplate}`]

  if (groups.query) {
    if (queryParamsMapping) {
      // When paramsCasing renames query params (e.g. page_size → pageSize), we must remap
      // the camelCase keys back to the original API names before passing them to `qs`.
      const pairs = Object.entries(queryParamsMapping)
        .map(([originalName, camelCaseName]) => `${originalName}: query.${camelCaseName}`)
        .join(', ')
      requestOptions.push(`qs: query ? { ${pairs} } : undefined`)
    } else {
      requestOptions.push('qs: query')
    }
  }

  if (groups.headers) {
    if (headerParamsMapping) {
      // When paramsCasing renames header params (e.g. x-api-key → xApiKey), we must remap
      // the camelCase keys back to the original API names before passing them to `headers`.
      const pairs = Object.entries(headerParamsMapping)
        .map(([originalName, camelCaseName]) => `'${originalName}': headers.${camelCaseName}`)
        .join(', ')
      requestOptions.push(`headers: headers ? { ${pairs} } : undefined`)
    } else {
      requestOptions.push('headers')
    }
  }

  if (groups.body) {
    requestOptions.push('body')
  }

  requestOptions.push('...options')

  const requestCall =
    dataReturnType === 'data'
      ? `return cy.request<${responseType}>({
  ${requestOptions.join(',\n  ')}
}).then((res) => res.body)`
      : `return cy.request<${responseType}>({
  ${requestOptions.join(',\n  ')}
})`

  return (
    <File.Source name={name} isIndexable isExportable>
      <Function name={name} export params={paramsSignature} returnType={returnType}>
        {requestCall}
      </Function>
    </File.Source>
  )
}
