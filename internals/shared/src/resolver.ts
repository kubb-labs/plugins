import { ast } from '@internals/ast'
import { ensureValidVarName } from '@internals/utils'
import { casing, memo, useKubb } from '@kubb/kit'
import type { PrinterContext, Resolver } from '@kubb/kit'

/**
 * The shared top-level `name` of the operation plugins, computed once per operation name and build.
 */
export function resolveOperationName(this: Resolver, name: string): string {
  return this.memo(`operation:${name}`, () => ensureValidVarName(casing.camel(name)))
}

/**
 * Names of the schemas in a circular reference chain, computed once per build. Reads the current context, so call it
 * in a generator or a printer factory.
 */
export function getCircularNames(): ReadonlySet<string> {
  return memo('circularNames:set', () => ast.graph.getCircularNames(useKubb<PrinterContext>().schemas))
}

/**
 * Names of the schemas whose type is `enum`, computed once per build. Reads the current context, so call it
 * in a generator or a printer factory.
 */
export function getEnumNames(): ReadonlySet<string> {
  return memo(
    'enumNames:set',
    () => new Set(useKubb<PrinterContext>().schemas.flatMap((schema) => (schema.type === 'enum' && schema.name ? [schema.name] : []))),
  )
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
