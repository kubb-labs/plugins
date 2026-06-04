import type { ast, Exclude, Generator, Group, Include, Output, Override, PluginFactoryOptions, Resolver } from '@kubb/core'
import type { PrinterValibotNodes } from './printers/printerValibot.ts'

export type ResolverValibot = Resolver &
  ast.OperationParamsResolver & {
    resolveSchemaName(this: ResolverValibot, name: string): string
    resolveSchemaTypeName(this: ResolverValibot, name: string): string
    resolveTypeName(this: ResolverValibot, name: string): string
    resolvePathName(this: ResolverValibot, name: string, type?: 'file' | 'function' | 'type' | 'const'): string
    resolveResponseStatusName(this: ResolverValibot, node: ast.OperationNode, statusCode: ast.StatusCode): string
    resolveResponsesName(this: ResolverValibot, node: ast.OperationNode): string
    resolveResponseName(this: ResolverValibot, node: ast.OperationNode): string
    resolvePathParamsName(this: ResolverValibot, node: ast.OperationNode, param: ast.ParameterNode): string
    resolveQueryParamsName(this: ResolverValibot, node: ast.OperationNode, param: ast.ParameterNode): string
    resolveHeaderParamsName(this: ResolverValibot, node: ast.OperationNode, param: ast.ParameterNode): string
  }

export type Options = {
  output?: Output
  group?: Group
  exclude?: Array<Exclude>
  include?: Array<Include>
  override?: Array<Override<ResolvedOptions>>
  importPath?: 'valibot' | (string & {})
  dateType?: false | 'string' | 'stringOffset' | 'stringLocal' | 'date'
  typed?: boolean
  inferred?: boolean
  coercion?: boolean | { dates?: boolean; strings?: boolean; numbers?: boolean }
  operations?: boolean
  guidType?: 'uuid' | 'guid'
  /**
   * Valibot-specific handling for optional object entries.
   * `exactOptional` follows TypeScript's exact optional property semantics.
   */
  optionalType?: 'optional' | 'exactOptional' | 'undefinedable'
  /**
   * Valibot distinguishes between plain schema defaults and fallback behavior.
   * `default` keeps required schema defaults out of the runtime validator, while
   * `fallback` wraps required schemas with `v.fallback(...)`.
   */
  defaultMode?: 'fallback' | 'default'
  /**
   * Valibot metadata actions let us preserve title, description, examples,
   * and vendor extensions as part of the schema pipeline.
   */
  metadata?: boolean | { title?: boolean; description?: boolean; examples?: boolean; extensions?: boolean }
  /**
   * Valibot can mark schemas as readonly at the schema level, which is useful
   * for OpenAPI `readOnly: true` fields.
   */
  readonly?: boolean
  wrapOutput?: (arg: { output: string; schema: ast.SchemaNode }) => string | undefined
  paramsCasing?: 'camelcase'
  generators?: Array<Generator<PluginValibot>>
  resolver?: Partial<ResolverValibot> & ThisType<ResolverValibot>
  printer?: {
    nodes?: PrinterValibotNodes
  }
  transformer?: ast.Visitor
}

type ResolvedOptions = {
  output: Output
  exclude: Array<Exclude>
  include: Array<Include> | undefined
  override: Array<Override<ResolvedOptions>>
  group: Group | undefined
  dateType: NonNullable<Options['dateType']>
  typed: NonNullable<Options['typed']>
  inferred: NonNullable<Options['inferred']>
  importPath: NonNullable<Options['importPath']>
  coercion: NonNullable<Options['coercion']>
  operations: NonNullable<Options['operations']>
  guidType: NonNullable<Options['guidType']>
  optionalType: NonNullable<Options['optionalType']>
  defaultMode: NonNullable<Options['defaultMode']>
  metadata: NonNullable<Options['metadata']>
  readonly: NonNullable<Options['readonly']>
  wrapOutput: Options['wrapOutput']
  paramsCasing: Options['paramsCasing']
  printer: Options['printer']
}

export type PluginValibot = PluginFactoryOptions<'plugin-valibot', Options, ResolvedOptions, ResolverValibot>

declare global {
  namespace Kubb {
    interface PluginRegistry {
      'plugin-valibot': PluginValibot
    }
  }
}
