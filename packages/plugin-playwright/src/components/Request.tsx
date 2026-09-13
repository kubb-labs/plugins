import { File, Function, type KubbReactNode } from 'kubb/jsx'
import type { ast } from 'kubb/kit'

type Props = {
  name: string
  node: ast.HttpOperationNode
  responseType: string
}

/**
 * Prints a request that returns Playwright's response without reading its body.
 */
export function Request({ name, node, responseType }: Props): KubbReactNode {
  return (
    <File.Source name={name} isIndexable isExportable>
      <Function name={name} export params="{ request }: { request: APIRequestContext }" returnType={`Promise<APIResponse<${responseType}>>`}>
        {`return request.fetch<${responseType}>(${JSON.stringify(node.path)}, { method: ${JSON.stringify(node.method)} })`}
      </Function>
    </File.Source>
  )
}
