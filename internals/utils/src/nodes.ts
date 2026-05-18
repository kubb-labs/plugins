export async function collectNodes<T>(nodes: T[] | AsyncIterable<T>): Promise<T[]> {
  if (Array.isArray(nodes)) return nodes
  const result: T[] = []
  for await (const node of nodes) result.push(node)
  return result
}
