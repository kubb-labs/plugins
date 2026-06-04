import type { ast } from '@kubb/core'
import { Const, File, Type } from '@kubb/renderer-jsx'
import type { KubbReactNode } from '@kubb/renderer-jsx/types'
import type { PrinterValibotFactory } from '../printers/printerValibot.ts'

type Props = {
  name: string
  node: ast.SchemaNode
  printer: ast.Printer<PrinterValibotFactory>
  inferTypeName?: string
  constType?: string
}

export function Valibot({ name, node, printer, inferTypeName, constType }: Props): KubbReactNode {
  const output = printer.print(node)

  if (!output) {
    return
  }

  return (
    <>
      <File.Source name={name} isExportable isIndexable>
        <Const export name={name} type={constType}>
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
