import { containsCircularRef } from 'kubb/kit'
import type { ast } from 'kubb/kit'
import { Const, File, Function, Type } from 'kubb/jsx'
import type { KubbReactNode } from 'kubb/jsx'
import type { PrinterZodFactory } from '../printers/printerZod.ts'
import type { PrinterZodMiniFactory } from '../printers/printerZodMini.ts'

import type { CompileOptions } from '../types.ts'

type Props = {
  name: string
  node: ast.SchemaNode
  /**
   * Pre-configured printer instance created by the generator.
   * The generator selects `printerZod` or `printerZodMini` based on the `mini` option,
   * then merges in any user-supplied `printer.nodes` overrides.
   */
  printer: ast.Printer<PrinterZodFactory> | ast.Printer<PrinterZodMiniFactory>
  inferTypeName?: string | null
  typeGuards?: boolean | { is?: boolean; assert?: boolean }
  isName?: string | null
  assertName?: string | null
  mini?: boolean
  /**
   * Set when the schema references itself. A self-referential initializer (e.g. a `z.lazy(() => …)`
   * back to the same const) is implicitly `any` under `strict`, so the const is annotated with an
   * explicit `z.ZodType` to break the inference cycle.
   */
  cyclic?: boolean
  /**
   * Wrap the schema initializer in `z.compile(...)` for fast-path validation.
   * Pass `{ strict: true }` to enforce strict compilation without silent fallback.
   *
   * @note Only compatible with Zod v4.5.0 or above.
   */
  compile?: boolean | CompileOptions
}

export function Zod({ name, node, printer, inferTypeName, typeGuards, isName, assertName, mini, cyclic, compile }: Props): KubbReactNode {
  const output = printer.print(node)

  if (!output) {
    return
  }

  // A cyclic object emits its self-references as deferred getters (`get prop() { … }`), so its
  // initializer never references itself directly and TypeScript infers it fine — annotating it would
  // only strip the `ZodObject` methods (`.omit()`, `.strict()`). Only non-object cyclic schemas (a
  // union/array with a top-level `z.lazy(() => self)`) are implicitly `any` and need the annotation.
  const needsAnnotation = cyclic && node.type !== 'object'
  const isBare = ast.isBareRef(node, printer.options.keysToOmit)
  const isCyclic = Boolean(cyclic || (printer.options.cyclicSchemas && containsCircularRef(node, { circularSchemas: printer.options.cyclicSchemas })))
  const shouldCompile = Boolean(compile) && !isBare && !isCyclic
  const value = shouldCompile ? (typeof compile === 'object' && compile.strict ? `z.compile(${output}, { strict: true })` : `z.compile(${output})`) : output

  const targetType = inferTypeName ?? `z.infer<typeof ${name}>`
  const shouldGenerateIs = isName && (typeof typeGuards === 'object' ? (typeGuards.is ?? true) : Boolean(typeGuards))
  const shouldGenerateAssert = assertName && (typeof typeGuards === 'object' ? (typeGuards.assert ?? true) : Boolean(typeGuards))

  return (
    <>
      <File.Source name={name} isExportable isIndexable>
        <Const export name={name} type={needsAnnotation ? 'z.ZodType' : undefined}>
          {value}
        </Const>
      </File.Source>
      {inferTypeName && (
        <File.Source name={inferTypeName} isExportable isIndexable isTypeOnly>
          <Type export name={inferTypeName}>
            {`z.infer<typeof ${name}>`}
          </Type>
        </File.Source>
      )}
      {shouldGenerateIs && (
        <File.Source name={isName} isExportable isIndexable>
          <Const export name={isName} JSDoc={{ comments: [`Type guard for {@link ${name}}`] }}>
            {mini ? `(data: unknown): data is ${targetType} => z.validate(${name}, data)` : `(data: unknown): data is ${targetType} => ${name}.validate(data)`}
          </Const>
        </File.Source>
      )}
      {shouldGenerateAssert && (
        <File.Source name={assertName} isExportable isIndexable>
          <Function
            export
            name={assertName}
            params="data: unknown"
            returnType={`asserts data is ${targetType}`}
            JSDoc={{ comments: [`Asserter for {@link ${name}}`, '@throws {z.ZodError} If data is invalid'] }}
          >
            {mini ? `if (!z.validate(${name}, data)) {\n  z.parse(${name}, data)\n}` : `if (!${name}.validate(data)) {\n  ${name}.parse(data)\n}`}
          </Function>
        </File.Source>
      )}
    </>
  )
}
