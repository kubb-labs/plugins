import { ast, Resolver, type Generator, type PluginType } from 'kubb/kit'

type Names = { used: Set<string>; resolved: Map<string, string> }
const registries = new WeakMap<Resolver, Names>()

function claim({
  resolver,
  key,
  name,
  normalize = (name: string) => name,
}: {
  resolver: Resolver
  key: string
  name: string
  normalize?: (name: string) => string
}): string {
  let names = registries.get(resolver)
  if (!names) {
    names = { used: new Set(), resolved: new Map() }
    registries.set(resolver, names)
  }
  const previous = names.resolved.get(key)
  if (previous) return previous
  let result = name
  for (let suffix = 2; names.used.has(normalize(result)); suffix++) result = `${name}${suffix}`
  names.used.add(normalize(result))
  names.resolved.set(key, result)
  return result
}

type OperationName = (node: ast.OperationNode, ...arguments_: Array<never>) => string
type SchemaResolver = Resolver & { param: Record<string, OperationName>; response: Record<string, OperationName> }

/** Keeps operation names separate from component names while preserving the plugin's resolver. */
export function createCollisionResolver<T extends SchemaResolver>(base: T): T {
  function wrap(methods: Record<string, OperationName>): Record<string, OperationName> {
    return Object.fromEntries(
      Object.entries(methods).map(([method, resolve]) => [
        method,
        function (this: Resolver, node: ast.OperationNode, ...arguments_: Array<never>) {
          const name = resolve(node, ...arguments_)
          return claim({ resolver: this, key: `operation:${node.method}:${node.path}:${name}`, name })
        },
      ]),
    )
  }
  return Resolver.merge(base as SchemaResolver, { param: wrap(base.param), response: wrap(base.response) }) as T
}

function reserve(ctx: Parameters<NonNullable<Generator<PluginType>['schema']>>[1]) {
  if (registries.has(ctx.resolver)) return
  const names: Names = { used: new Set(), resolved: new Map() }
  registries.set(ctx.resolver, names)
  for (const schema of ctx.driver.inputNode?.schemas ?? []) {
    if (schema.name) names.used.add(ctx.resolver.name(schema.name))
  }
}

/** Reserves component names before generating operation declarations. */
export const reserveSchemaNames = {
  name: 'reserve-schema-names',
  schema(_node, ctx) {
    reserve(ctx)
  },
  operation(_node, ctx) {
    reserve(ctx)
  },
} satisfies Generator<PluginType>

/** Renames inline enums and their uses together using the shared AST transformer. */
export function resolveInlineEnumNames({ node, owner, resolver }: { node: ast.SchemaNode; owner: string; resolver: Resolver }): ast.SchemaNode {
  if (!registries.has(resolver)) return node
  return ast.transform(node, {
    schema(child) {
      if (child === node || child.type !== 'enum' || !child.name) return
      const name = claim({ resolver, key: `enum:${owner}:${child.pointer ?? child.name}`, name: child.name, normalize: resolver.name.bind(resolver) })
      return name === child.name ? undefined : { ...child, name }
    },
  })
}
