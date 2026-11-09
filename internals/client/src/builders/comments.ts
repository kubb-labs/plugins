import { buildOperationComments, getRequestGroups, isEventStream, requestGroupOrder } from '@internals/shared'
import type { ast } from '@kubb/kit'
import type { ReturnTypeOption } from '../types.ts'

/**
 * The JSDoc lines of a generated client function or SDK method: the request line, description, summary, `@param` for the
 * `options` argument, `@returns` for the result the `returnType` produces, and `@deprecated`.
 */
export function buildClientComments({ node, returnType }: { node: ast.OperationNode; returnType: ReturnTypeOption }): Array<string> {
  const groups = requestGroupOrder.filter((key) => getRequestGroups(node)[key]).map((key) => `\`${key}\``)
  const request = groups.length ? `The request (${groups.join(', ')}) and per-call settings` : 'Per-call settings'
  const param = `@param options - ${request}, such as \`client\` and \`throwOnError\`.`

  const stream = isEventStream(node)
  const result = stream
    ? 'The stream result, whose `data` yields each item as it arrives.'
    : 'The result with `data` or `error`, `status`, `request`, and `response`.'
  const data = stream ? 'An async iterator of the streamed items' : 'The response body'
  const returns = `@returns ${returnType === 'data' ? `${data}, or the full result when \`throwOnError\` is \`false\`.` : result}`

  return buildOperationComments(node, { splitLines: true, tags: [param, returns] })
}
