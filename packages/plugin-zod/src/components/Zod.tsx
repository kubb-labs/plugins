import { ast } from '@internals/ast'
import { Const, Function, Schema, Type } from '@kubb/renderer-jsx'
import type { KubbReactNode } from '@kubb/renderer-jsx'
import type { PrinterZodFactory } from '../printers/printerZod.ts'
import type { PrinterZodMiniFactory } from '../printers/printerZodMini.ts'
import { throwsOnStrictCompile } from '../printers/zodNodes.ts'

import type { CompileOptions } from '../types.ts'
import type { TypeGuardsOptions } from '@internals/shared/types'

export type ZodProps = {
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
   * The helper the `inferTypeName` alias is printed with. `infer` and `output` name the parsed value,
   * `input` the value the schema accepts; they differ only for a codec.
   *
   * @default 'infer'
   */
  inferKind?: 'infer' | 'input' | 'output'
  typeGuards?: TypeGuardsOptions
  isName?: string | null
  assertName?: string | null
  mini?: boolean
  /**
   * Set when the schema references itself. A self-referential initializer (e.g. a `z.lazy(() => …)`
   * back to the same const) is implicitly `any` under `strict`, so the const is annotated with an
   * explicit `z.ZodType` to break the inference cycle, or `z.ZodMiniType` for `zod/mini`, which has no `ZodType`.
   */
  cyclic?: boolean
  /**
   * Wrap the schema initializer in `z.compile(...)` for fast-path validation.
   * Pass `{ strict: true }` to enforce strict compilation without silent fallback.
   *
   * @note Only compatible with Zod v4.5.0 or above.
   */
  compile?: boolean | CompileOptions
  /**
   * The schemas already rendered in the same file, by name. A generated ref to one of them carries no
   * target, so strict compilation looks it up here.
   */
  siblings?: ReadonlyMap<string, ast.SchemaNode>
  /**
   * JSDoc lines above the schema const, so an editor shows them on hover.
   */
  comments?: Array<string>
}

/**
 * Whether the schema reaches a circular schema through its refs. `containsCircular` reads the refs the node holds,
 * while Zod refuses to compile a cycle anywhere below the root. A generated ref carries no target, so `siblings` resolves it.
 */
function reachesCycle({
  node,
  siblings,
  cyclicSchemas,
  seen = new Set(),
}: {
  node: ast.SchemaNode
  siblings?: ReadonlyMap<string, ast.SchemaNode>
  cyclicSchemas?: ReadonlySet<string>
  seen?: Set<ast.SchemaNode>
}): boolean {
  if (!cyclicSchemas?.size || seen.has(node)) return false
  seen.add(node)

  return (
    ast.schema.find(node, {
      follow: ['ref'],
      predicate(schema) {
        if (schema.type !== ast.schema.types.ref) return false
        const name = ast.ref.getName(schema)
        if (name && cyclicSchemas.has(name)) return true
        const sibling = schema.ref || !schema.name ? undefined : siblings?.get(schema.name)
        return !!sibling && reachesCycle({ node: sibling, siblings, cyclicSchemas, seen })
      },
    }) !== undefined
  )
}

export function Zod({
  name,
  node,
  printer,
  inferTypeName,
  inferKind = 'infer',
  typeGuards,
  isName,
  assertName,
  mini,
  cyclic,
  compile,
  siblings,
  comments = [],
}: ZodProps): KubbReactNode {
  // A cyclic object emits its self-references as deferred getters (`get prop() { … }`), so its
  // initializer never references itself directly and TypeScript infers it fine — annotating it would
  // only strip the `ZodObject` methods (`.omit()`, `.strict()`). Only non-object cyclic schemas (a
  // union/array with a top-level `z.lazy(() => self)`) are implicitly `any` and need the annotation.
  const needsAnnotation = cyclic && node.type !== 'object'
  const isAlias = ast.ref.isAlias(node, printer.options.keysToOmit)
  const isCyclic = Boolean(cyclic || (printer.options.cyclicSchemas && ast.graph.containsCircular(node, { circularSchemas: printer.options.cyclicSchemas })))
  const isStrict = typeof compile === 'object' && Boolean(compile.strict)
  // Strict compilation throws when the module loads, so a schema Zod refuses stays uncompiled.
  const throwsOnCompile =
    isStrict &&
    // The `zod/mini` date handler coerces in both directions, so judge it as decoding.
    (throwsOnStrictCompile({ node, options: printer.name === 'zod-mini' ? { ...printer.options, direction: undefined } : printer.options, siblings }) ||
      reachesCycle({ node, siblings, cyclicSchemas: printer.options.cyclicSchemas }))
  const shouldCompile = Boolean(compile) && !isAlias && !isCyclic && !throwsOnCompile
  const toValue = (output: string) => (shouldCompile ? (isStrict ? `z.compile(${output}, { strict: true })` : `z.compile(${output})`) : output)

  const targetType = inferTypeName ?? `z.infer<typeof ${name}>`
  const shouldGenerateIs = isName && (typeof typeGuards === 'object' ? (typeGuards.is ?? true) : Boolean(typeGuards))
  const shouldGenerateAssert = assertName && (typeof typeGuards === 'object' ? (typeGuards.assert ?? true) : Boolean(typeGuards))

  return (
    <Schema node={node} printer={printer}>
      {(output) => (
        <>
          <Const
            export
            name={name}
            type={needsAnnotation ? (mini ? 'z.ZodMiniType' : 'z.ZodType') : undefined}
            JSDoc={comments.length ? { comments } : undefined}
          >
            {toValue(output)}
          </Const>
          {inferTypeName && (
            <Type export name={inferTypeName}>
              {`z.${inferKind}<typeof ${name}>`}
            </Type>
          )}
          {shouldGenerateIs && (
            <Const export name={isName} JSDoc={{ comments: [`Type guard for {@link ${name}}`] }}>
              {mini
                ? `(data: unknown): data is ${targetType} => z.validate(${name}, data)`
                : `(data: unknown): data is ${targetType} => ${name}.validate(data)`}
            </Const>
          )}
          {shouldGenerateAssert && (
            <Function
              export
              name={assertName}
              params="data: unknown"
              returnType={`asserts data is ${targetType}`}
              JSDoc={{ comments: [`Asserter for {@link ${name}}`, '@throws {z.ZodError} If data is invalid'] }}
            >
              {mini ? `if (!z.validate(${name}, data)) {\n  z.parse(${name}, data)\n}` : `if (!${name}.validate(data)) {\n  ${name}.parse(data)\n}`}
            </Function>
          )}
        </>
      )}
    </Schema>
  )
}
