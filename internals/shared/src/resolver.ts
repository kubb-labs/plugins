import { ast } from '@internals/ast'
import { ensureValidVarName } from '@internals/utils'
import { casing } from '@kubb/kit'
import type { GeneratorContext, Resolver } from '@kubb/kit'

/**
 * The shared top-level `name` of the operation plugins, computed once per operation name and build.
 */
export function resolveOperationName(this: Resolver, name: string): string {
  return this.memo(`operation:${name}`, () => ensureValidVarName(casing.camel(name)))
}

type SchemaIndexContext = Pick<GeneratorContext, 'memo' | 'schemas'>

/**
 * Names of the schemas in a circular reference chain, computed once per build.
 */
export function getCircularNames(ctx: SchemaIndexContext): ReadonlySet<string> {
  return ctx.memo('circularNames:set', () => ast.graph.getCircularNames(ctx.schemas))
}

/**
 * Names of the schemas whose type is `enum`, computed once per build.
 */
export function getEnumNames(ctx: SchemaIndexContext): ReadonlySet<string> {
  return ctx.memo('enumNames:set', () => new Set(ctx.schemas.flatMap((schema) => (schema.type === 'enum' && schema.name ? [schema.name] : []))))
}

declare global {
  namespace Kubb {
    interface MemoRegistry {
      operation: string
      file: ast.FileNode['baseName']
      operationTypeNames: Array<string>
    }
  }
}
