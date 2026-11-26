import { ast } from '@internals/ast'
import { ensureValidVarName } from '@internals/utils'
import { casing, memo, useKubb } from '@kubb/kit'
import type { FileTarget, TemplateContext, Group, Output, PrinterContext, Resolver, ResolverFileParams } from '@kubb/kit'

/**
 * The shared top-level `name` of the operation plugins, computed once per operation name and build.
 */
export function resolveOperationName(this: Resolver, name: string): string {
  return this.memo(`operation:${name}`, () => ensureValidVarName(casing.camel(name)))
}

/** `ctx.file(node)` for a file that no single node owns, such as `handlers.ts`: path, banner and footer from the current plugin. */
export function namedFile(entry: Pick<ResolverFileParams, 'name' | 'tag'> & { extname?: ResolverFileParams['extname'] }): FileTarget {
  const ctx = useKubb<TemplateContext>()
  const { output, group } = ctx.options as { output: Output; group?: Group | null }
  const file = ctx.resolver.file({ extname: '.ts', ...entry, root: ctx.root, output, group: group ?? undefined })
  const fileContext = { output, config: ctx.config, file: { path: file.path, baseName: file.baseName } }

  return {
    baseName: file.baseName,
    path: file.path,
    meta: file.meta,
    banner: ctx.resolver.default.banner(ctx.meta, fileContext),
    footer: ctx.resolver.default.footer(ctx.meta, fileContext),
  }
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
      operationTypeNames: Array<string>
    }
  }
}
