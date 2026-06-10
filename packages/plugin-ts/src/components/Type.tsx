import { ast } from '@kubb/core'
import { File } from '@kubb/renderer-jsx'
import type { KubbReactNode } from '@kubb/renderer-jsx/types'
import type { PrinterTsFactory } from '../printers/printerTs.ts'
import type { PluginTs, ResolverTs } from '../types.ts'
import { Enum, getEnumNames } from './Enum.tsx'

type Props = {
  name: string
  node: ast.SchemaNode
  /**
   * Pre-configured printer instance created by the generator.
   * Created with `printerTs({ ..., nodes: options.printer?.nodes })`.
   */
  printer: ast.Printer<PrinterTsFactory>
  enumType: PluginTs['resolvedOptions']['enum']['type']
  enumConstCasing: PluginTs['resolvedOptions']['enum']['constCasing']
  enumTypeSuffix: PluginTs['resolvedOptions']['enum']['typeSuffix']
  enumKeyCasing: PluginTs['resolvedOptions']['enum']['keyCasing']
  resolver: ResolverTs
}

export function Type({ name, node, printer, enumType, enumConstCasing, enumTypeSuffix, enumKeyCasing, resolver }: Props): KubbReactNode {
  const enumSchemaNodes = ast.collect<ast.EnumSchemaNode>(node, {
    schema(n): ast.EnumSchemaNode | undefined {
      const enumNode = ast.narrowSchema(n, ast.schemaTypes.enum)
      if (enumNode?.name) return enumNode
    },
  })

  const output = printer.print(node)

  if (!output) {
    return
  }

  const enums = [...new Map(enumSchemaNodes.map((n) => [n.name, n])).values()].map((node) => {
    return {
      node,
      ...getEnumNames({ node, enumType, enumConstCasing, enumTypeSuffix, resolver }),
    }
  })

  // Skip enum exports when using inlineLiteral
  const shouldExportEnums = enumType !== 'inlineLiteral'
  const shouldExportType = enumType === 'inlineLiteral' || enums.every((item) => item.typeName !== name)

  return (
    <>
      {shouldExportEnums &&
        enums.map(({ node }) => (
          <Enum
            key={node.name}
            node={node}
            enumType={enumType}
            enumConstCasing={enumConstCasing}
            enumTypeSuffix={enumTypeSuffix}
            enumKeyCasing={enumKeyCasing}
            resolver={resolver}
          />
        ))}
      {shouldExportType && (
        <File.Source name={name} isTypeOnly isExportable isIndexable>
          {output}
        </File.Source>
      )}
    </>
  )
}
