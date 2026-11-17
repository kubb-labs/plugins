import type { ast } from '@kubb/kit'
import { Const, File, Type } from '@kubb/renderer-jsx'
import type { KubbReactNode } from '@kubb/renderer-jsx'
import type { PrinterValibotFactory } from '../printers/printerValibot.ts'

type Props = {
  name: string
  node: ast.SchemaNode
  /**
   * Printer instance the generator created for this node.
   */
  printer: ast.Printer<PrinterValibotFactory>
  /**
   * Name of the `v.InferOutput` alias to export, or `null` for no alias.
   */
  inferTypeName?: string | null
  /**
   * Set when the schema is part of a circular reference. Its initializer reaches itself through
   * `v.lazy(() => …)`, which is implicitly `any` under `strict`, so the const gets a `v.GenericSchema` annotation.
   */
  cyclic?: boolean
}

export function Valibot({ name, node, printer, inferTypeName, cyclic }: Props): KubbReactNode {
  const output = printer.print(node)
  const printerImports = printer.drainImports()

  if (!output) {
    return
  }

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
            {`v.InferOutput<typeof ${name}>`}
          </Type>
        </File.Source>
      )}
    </>
  )
}
