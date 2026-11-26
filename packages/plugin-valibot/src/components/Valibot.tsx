import type { ast } from '@internals/ast'
import { resolveTypeGuards } from '@internals/shared'
import { Const, Function, Schema, Type } from '@kubb/renderer-jsx'
import type { KubbReactNode } from '@kubb/renderer-jsx'
import type { PrinterValibotFactory } from '../printers/printerValibot.ts'
import type { PluginValibot } from '../types.ts'

export type ValibotProps = {
  name: string
  node: ast.SchemaNode
  /**
   * Printer instance the generator created for this node.
   */
  printer: ast.Printer<PrinterValibotFactory>
  /**
   * Name of the inferred type alias to export, or `null` for no alias.
   */
  inferTypeName?: string | null
  /**
   * The helper the alias is printed with. `InferInput` is the value a request schema accepts,
   * `InferOutput` the value a schema returns. They differ for a schema that converts.
   *
   * @default 'InferOutput'
   */
  inferKind?: 'InferInput' | 'InferOutput'
  typeGuards?: PluginValibot['resolvedOptions']['typeGuards']
  isName?: string | null
  assertName?: string | null
  /**
   * Set when the schema is part of a circular reference. Its initializer reaches itself through
   * `v.lazy(() => …)`, which is implicitly `any` under `strict`, so the const gets a `v.GenericSchema` annotation.
   */
  cyclic?: boolean
  /**
   * JSDoc lines above the schema const, so an editor shows them on hover.
   */
  comments?: Array<string>
}

export function Valibot({
  name,
  node,
  printer,
  inferTypeName,
  inferKind = 'InferOutput',
  typeGuards,
  isName,
  assertName,
  cyclic,
  comments = [],
}: ValibotProps): KubbReactNode {
  // `v.is` and `v.assert` narrow to the value the schema accepts, before any conversion.
  const guardType = `v.InferInput<typeof ${name}>`
  const guards = resolveTypeGuards(typeGuards)
  const shouldGenerateIs = isName && guards.is
  const shouldGenerateAssert = assertName && guards.assert

  return (
    <Schema node={node} printer={printer}>
      {(output) => (
        <>
          <Const export name={name} type={cyclic ? 'v.GenericSchema' : undefined} JSDoc={comments.length ? { comments } : undefined}>
            {output}
          </Const>
          {inferTypeName && (
            <Type export name={inferTypeName}>
              {`v.${inferKind}<typeof ${name}>`}
            </Type>
          )}
          {shouldGenerateIs && (
            <Const export name={isName} JSDoc={{ comments: [`Type guard for {@link ${name}}`] }}>
              {`(data: unknown): data is ${guardType} => v.is(${name}, data)`}
            </Const>
          )}
          {shouldGenerateAssert && (
            <Function
              export
              name={assertName}
              params="data: unknown"
              returnType={`asserts data is ${guardType}`}
              JSDoc={{ comments: [`Asserter for {@link ${name}}`, '@throws {v.ValiError} If data is invalid'] }}
            >
              {`v.assert(${name}, data)`}
            </Function>
          )}
        </>
      )}
    </Schema>
  )
}
