import { ast } from '@kubb/core'
import { File } from '@kubb/renderer-jsx'
import type { KubbReactNode } from '@kubb/renderer-jsx/types'
import type { PrinterTsFactory } from '../printers/printerTs.ts'
import type { PluginTs, ResolverTs } from '../types.ts'
import { isInlineConstEnum } from '../utils.ts'
import { Enum, getEnumNames } from './Enum.tsx'

type Props = {
  name: string
  node: ast.SchemaNode
  /**
   * Pre-configured printer instance created by the generator.
   * Created with `printerTs({ ..., nodes: options.printer?.nodes })`.
   */
  printer: ast.Printer<PrinterTsFactory>
  enum: PluginTs['resolvedOptions']['enum']
  resolver: ResolverTs
}

export function Type({ name, node, printer, enum: enumOptions, resolver }: Props): KubbReactNode {
  const enumSchemaNodes = ast.collect<ast.EnumSchemaNode>(node, {
    schema(n): ast.EnumSchemaNode | undefined {
      const enumNode = ast.narrowSchema(n, ast.schemaTypes.enum)
      // Skip an inline `const` (single-value enum the adapter did not register): it renders as a
      // literal, so it gets no runtime enum declaration.
      if (enumNode?.name && !isInlineConstEnum(enumNode, printer.options.enumSchemaNames)) return enumNode
    },
  })

  const output = printer.print(node)

  if (!output) {
    return
  }

  const enums = [...new Map(enumSchemaNodes.map((n) => [n.name, n])).values()].map((node) => {
    return {
      node,
      ...getEnumNames({ node, enum: enumOptions, resolver }),
    }
  })

  // Skip enum exports when using inlineLiteral
  const shouldExportEnums = enumOptions.type !== 'inlineLiteral'
  const shouldExportType = enumOptions.type === 'inlineLiteral' || enums.every((item) => item.typeName !== name)

  return (
    <>
      {shouldExportEnums && enums.map(({ node }) => <Enum key={node.name} node={node} enum={enumOptions} resolver={resolver} />)}
      {shouldExportType && (
        <File.Source name={name} isTypeOnly isExportable isIndexable>
          {output}
        </File.Source>
      )}
    </>
  )
}
