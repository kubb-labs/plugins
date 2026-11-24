import type { ast } from '@internals/ast'
import type { ResolverTs } from '@kubb/plugin-ts'
import type { ResolverZod } from '../types.ts'

/** A `plugin-ts` shaped resolver over the types `pluginZod({ inferred })` exports next to each schema. */
export function toZodTypeResolver(resolver: ResolverZod): ResolverTs {
  const type = (name: string) => resolver.schema.type(name)

  return {
    ...resolver,
    // A spread drops class methods, and `file` reads private fields. `memo` gets its own key space, apart from the zod names.
    file: resolver.file.bind(resolver),
    memo: (key: string, compute: () => unknown) => resolver.memo(`plugin-zod:types:${key}`, compute),
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
    // An inferred enum has one type and no separate key type, whatever the suffix.
    enum: {
      keyName: (node: { name?: string | null }) => type(resolver.name(node.name ?? '')),
    },
    // `Resolver` is a class with private fields, which an object literal cannot satisfy.
  } as unknown as ResolverTs
}

declare global {
  namespace Kubb {
    interface MemoRegistry {
      /** Every key the zod-backed `ResolverTs` memoizes. */
      'plugin-zod:types': unknown
    }
  }
}
