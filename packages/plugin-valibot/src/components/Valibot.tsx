import type { ast } from '@kubb/kit'
import { Const, File, Function, Type } from '@kubb/renderer-jsx'
import type { KubbReactNode } from '@kubb/renderer-jsx'
import type { PrinterValibotFactory } from '../printers/printerValibot.ts'
import type { PluginValibot } from '../types.ts'

type Props = {
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
}

export function Valibot({ name, node, printer, inferTypeName, inferKind = 'InferOutput', typeGuards, isName, assertName, cyclic }: Props): KubbReactNode {
  const output = printer.print(node)
  const printerImports = printer.drainImports()

  if (!output) {
    return
  }

  // `v.is` and `v.assert` narrow to the value the schema accepts, before any conversion.
  const guardType = `v.InferInput<typeof ${name}>`
  const shouldGenerateIs = isName && (typeof typeGuards === 'object' ? (typeGuards.is ?? true) : Boolean(typeGuards))
  const shouldGenerateAssert = assertName && (typeof typeGuards === 'object' ? (typeGuards.assert ?? true) : Boolean(typeGuards))

  return (
    <>
      {printerImports.map((imp) => (
        <File.Import
          key={[name, imp.path, imp.name].join('-')}
          name={imp.name}
          path={imp.path}
          root={imp.root}
          isTypeOnly={imp.isTypeOnly}
          isNameSpace={imp.isNameSpace}
        />
      ))}
      <File.Source name={name} isExportable isIndexable>
        <Const export name={name} type={cyclic ? 'v.GenericSchema' : undefined}>
          {output}
        </Const>
      </File.Source>
      {inferTypeName && (
        <File.Source name={inferTypeName} isExportable isIndexable isTypeOnly>
          <Type export name={inferTypeName}>
            {`v.${inferKind}<typeof ${name}>`}
          </Type>
        </File.Source>
      )}
      {shouldGenerateIs && (
        <File.Source name={isName} isExportable isIndexable>
          <Const export name={isName} JSDoc={{ comments: [`Type guard for {@link ${name}}`] }}>
            {`(data: unknown): data is ${guardType} => v.is(${name}, data)`}
          </Const>
        </File.Source>
      )}
      {shouldGenerateAssert && (
        <File.Source name={assertName} isExportable isIndexable>
          <Function
            export
            name={assertName}
            params="data: unknown"
            returnType={`asserts data is ${guardType}`}
            JSDoc={{ comments: [`Asserter for {@link ${name}}`, '@throws {v.ValiError} If data is invalid'] }}
          >
            {`v.assert(${name}, data)`}
          </Function>
        </File.Source>
      )}
    </>
  )
}
