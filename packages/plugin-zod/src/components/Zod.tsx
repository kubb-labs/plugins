import { containsCircularRef } from 'kubb/kit'
import type { ast } from 'kubb/kit'
import { Const, File, Type } from 'kubb/jsx'
import type { KubbReactNode } from 'kubb/jsx'
import type { PrinterZodFactory } from '../printers/printerZod.ts'
import type { PrinterZodMiniFactory } from '../printers/printerZodMini.ts'

import type { CompileOptions } from '../types.ts'
import { isBareRef } from '../utils.ts'

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

export function Zod({ name, node, printer, inferTypeName, cyclic, compile }: Props): KubbReactNode {
  const output = printer.print(node)

  if (!output) {
    return
  }

  // A cyclic object emits its self-references as deferred getters (`get prop() { … }`), so its
  // initializer never references itself directly and TypeScript infers it fine — annotating it would
  // only strip the `ZodObject` methods (`.omit()`, `.strict()`). Only non-object cyclic schemas (a
  // union/array with a top-level `z.lazy(() => self)`) are implicitly `any` and need the annotation.
  const needsAnnotation = cyclic && node.type !== 'object'
  const isBare = isBareRef(node, printer.options.keysToOmit)
  const isCyclic = Boolean(cyclic || (printer.options.cyclicSchemas && containsCircularRef(node, { circularSchemas: printer.options.cyclicSchemas })))
  const shouldCompile = Boolean(compile) && !isBare && !isCyclic
  const value = shouldCompile ? (typeof compile === 'object' && compile.strict ? `z.compile(${output}, { strict: true })` : `z.compile(${output})`) : output

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
    </>
  )
}
