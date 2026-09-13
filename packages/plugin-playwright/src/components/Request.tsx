import { getRequestGroupOptionality } from '@internals/shared'
import { File, Function, type KubbReactNode } from 'kubb/jsx'
import type { ast } from 'kubb/kit'

type Props = {
  name: string
  node: ast.HttpOperationNode
  responseType: string
  pathType?: string
  baseURL?: string
}

/**
 * Prints a request that returns Playwright's response without reading its body.
 */
export function Request({ name, node, responseType, pathType, baseURL }: Props): KubbReactNode {
  const { hasRequiredPath } = getRequestGroupOptionality(node)
  const names = ['request']
  const types = ['request: APIRequestContext']
  if (pathType) {
    names.push('path')
    types.push(`path${hasRequiredPath ? '' : '?'}: ${pathType}`)
  }

  const prefix = baseURL?.replace(/\/+$/, '') ?? ''
  const url = node.path
    .split(/\{([^}]+)\}/)
    .map((part, index) => {
      if (index % 2 === 1) return `encodeURIComponent(String(path${hasRequiredPath ? '' : '?.'}[${JSON.stringify(part)}]))`
      const literal = index === 0 ? prefix + part : part
      return literal ? JSON.stringify(literal) : null
    })
    .filter(Boolean)
    .join(' + ')

  return (
    <File.Source name={name} isIndexable isExportable>
      <Function name={name} export params={`{ ${names.join(', ')} }: { ${types.join('; ')} }`} returnType={`Promise<APIResponse<${responseType}>>`}>
        {`return request.fetch<${responseType}>(${url}, { method: ${JSON.stringify(node.method)} })`}
      </Function>
    </File.Source>
  )
}
