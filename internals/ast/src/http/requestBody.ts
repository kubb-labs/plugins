import type { OperationNode, SchemaNode } from '@kubb/ast'

/** The schema of the first request body entry, else `undefined` when the operation takes no body. */
export function getSchema(node: Pick<OperationNode, 'requestBody'>): SchemaNode | undefined {
  return node.requestBody?.content?.[0]?.schema
}
