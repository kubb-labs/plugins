import { getRequestGroupOptionality } from '@internals/shared'
import { File, Function, type KubbReactNode } from 'kubb/jsx'
import type { ast } from 'kubb/kit'

type Props = {
  name: string
  node: ast.HttpOperationNode
  responseType: string
  pathType?: string
  queryType?: string
  headersType?: string
  baseURL?: string
}

/**
 * Prints a request that returns Playwright's response without reading its body.
 */
export function Request({ name, node, responseType, pathType, queryType, headersType, baseURL }: Props): KubbReactNode {
  const { hasRequiredPath, hasRequiredQuery, hasRequiredHeader } = getRequestGroupOptionality(node)
  const names = ['request']
  const types = ['request: APIRequestContext']
  for (const [group, type, required] of [
    ['path', pathType, hasRequiredPath],
    ['query', queryType, hasRequiredQuery],
    ['headers', headersType, hasRequiredHeader],
  ] as const) {
    if (!type) continue
    names.push(group)
    types.push(`${group}${required ? '' : '?'}: ${type}`)
  }

  const options = [...names, `method: ${JSON.stringify(node.method)}`, `url: ${JSON.stringify(node.path)}`]
  if (baseURL !== undefined) options.push(`baseURL: ${JSON.stringify(baseURL)}`)

  return (
    <File.Source name={name} isIndexable isExportable>
      <Function name={name} export params={`{ ${names.join(', ')} }: { ${types.join('; ')} }`} returnType={`Promise<APIResponse<${responseType}>>`}>
        {`return playwrightRequest<${responseType}>({ ${options.join(', ')} })`}
      </Function>
    </File.Source>
  )
}
