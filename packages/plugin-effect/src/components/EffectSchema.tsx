import type { ast } from 'kubb/kit'
import { Const, File, Type } from 'kubb/jsx'
import type { KubbReactNode } from 'kubb/jsx'
import type { PrinterEffectFactory } from '../printers/printerEffect.ts'

type Props = {
  name: string
  node: ast.SchemaNode
  printer: ast.Printer<PrinterEffectFactory>
  cyclic?: boolean
}

/**
 * Renders a same-name Effect schema value and decoded TypeScript type.
 */
export function EffectSchema({ name, node, printer, cyclic }: Props): KubbReactNode {
  const output = printer.print(node)
  if (!output) return

  const encodedName = `${name}Encoded`

  return (
    <>
      <File.Source name={name} isIndexable={false} isExportable={false} isTypeOnly>
        <Type export name={name}>
          {output.type}
        </Type>
      </File.Source>
      {cyclic && (
        <File.Source name={encodedName} isIndexable={false} isExportable={false} isTypeOnly>
          <Type name={encodedName}>{output.encoded}</Type>
        </File.Source>
      )}
      <File.Source name={name} isExportable isIndexable>
        <Const export name={name} type={cyclic ? `Schema.Codec<${name}, ${encodedName}>` : undefined}>
          {output.runtime}
        </Const>
      </File.Source>
    </>
  )
}
