import type { ast } from '@internals/ast'
import type { ResolverTs } from '@kubb/plugin-ts'
import type { ResolverZod } from '../types.ts'

/**
 * A `plugin-ts` shaped resolver whose operation type names point at the types `pluginZod({ inferred })`
 * exports next to each schema, so code written against `plugin-ts` names picks up the zod types.
 */
export function toZodTypeResolver(resolver: ResolverZod): ResolverTs {
  const type = (name: string) => resolver.schema.type(name)

  return {
    ...resolver,
    isTypeOnly: true,
    // Class methods, so a spread drops them. `file` reads private fields, and `memo` gets its own key
    // space so these type names never share an entry with the zod names.
    file: resolver.file.bind(resolver),
    memo: (key: string, compute: () => unknown) => resolver.memo(`zodTypes:${key}`, compute),
    param: {
      name: (node: ast.OperationNode, p: ast.ParameterNode) => type(resolver.param.name(node, p)),
      path: (node: ast.OperationNode, p: ast.ParameterNode) => type(resolver.param.path(node, p)),
      query: (node: ast.OperationNode, p: ast.ParameterNode) => type(resolver.param.query(node, p)),
      headers: (node: ast.OperationNode, p: ast.ParameterNode) => type(resolver.param.headers(node, p)),
      cookies: (node: ast.OperationNode, p: ast.ParameterNode) => type(resolver.param.cookies(node, p)),
    },
    response: {
      body: (node: ast.OperationNode) => type(resolver.response.body(node)),
      status: (node: ast.OperationNode, statusCode: ast.StatusCode) => type(resolver.response.status(node, statusCode)),
      response: (node: ast.OperationNode) => type(resolver.response.response(node)),
      responses: (node: ast.OperationNode) => type(resolver.response.responses(node)),
      headers: (node: ast.OperationNode, statusCode: ast.StatusCode) => type(resolver.response.headers(node, statusCode)),
      options: (node: ast.OperationNode) => resolver.response.options(node),
    },
  } as unknown as ResolverTs
}

declare global {
  namespace Kubb {
    interface MemoRegistry {
      /**
       * Nests every key the zod-backed `ResolverTs` memoizes, so it holds each of their value types.
       */
      zodTypes: unknown
    }
  }
}
