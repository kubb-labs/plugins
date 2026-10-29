import { ast } from 'kubb/kit'
import { File } from 'kubb/jsx'
import type { KubbReactNode } from 'kubb/jsx'
import { printerTs, type PrinterTsFactory } from '../printers/printerTs.ts'
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
  /**
   * Marks the source inline, so importing files absorb the type. Set by `pluginTs({ operations: 'inline' })`.
   */
  inline?: boolean
}

export function Type({ name, node, printer, enum: enumOptions, resolver, inline }: Props): KubbReactNode {
  if (inline) {
    // An inline type has no file to declare its enums in, so they print as literal unions.
    const withoutEnums = ast.transform(node, { schema: (n) => (n.type === ast.schemaTypes.enum && n.name ? { ...n, name: undefined } : undefined) })
    // Property JSDoc would repeat in every file that absorbs the type; the schema files keep theirs.
    const expression = printerTs({ ...printer.options, name: undefined })
      .print(withoutEnums)
      ?.replace(/\/\*\*[\s\S]*?\*\/\s*/g, '')
    if (!expression) return

    // The file is never written; the expression as its text keeps the imports it needs in use.
    return (
      <File.Source name={name} isTypeOnly isExportable isIndexable inline={{ expression }}>
        {expression}
      </File.Source>
    )
  }

  const enumSchemaNodes = ast.collectSync<ast.EnumSchemaNode>(node, {
    schema(n): ast.EnumSchemaNode | undefined {
      const enumNode = ast.narrowSchema(n, ast.schemaTypes.enum)
      // Skip an inline `const` (single-value enum the adapter did not register): it renders as a
      // literal, so it gets no runtime enum declaration.
      if (enumNode?.name && !isInlineConstEnum(enumNode, printer.options.enumSchemaNames)) return enumNode
    },
  })

  const output = printer.print(node)
  const printerImports = printer.drainImports()

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
        <>
          {printerImports.map((imp) => (
            <File.Import key={[name, imp.path, imp.name].join('-')} {...imp} />
          ))}
          <File.Source name={name} pointer={node.pointer} isTypeOnly isExportable isIndexable>
            {output}
          </File.Source>
        </>
      )}
    </>
  )
}
