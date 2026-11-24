import { ast } from '@internals/ast'
import { File, Origin, Type as TypeDeclaration } from '@kubb/renderer-jsx'
import type { KubbReactNode } from '@kubb/renderer-jsx'
import * as factory from '../factory.ts'
import { getDeclarationParts } from '../printers/printerTs.ts'
import type { PrinterTsFactory } from '../printers/printerTs.ts'
import type { PluginTs, ResolverTs } from '../types.ts'
import { isInlineConstEnum } from '../utils.ts'
import { Enum, resolveEnumNames } from './Enum.tsx'

export type TypeProps = {
  name: string
  node: ast.SchemaNode
  /** The plugin's `ctx.printer`, with per-node options from `printer.with(...)`. */
  printer: ast.Printer<PrinterTsFactory>
  enum: PluginTs['resolvedOptions']['enum']
  resolver: ResolverTs
  /**
   * Marks the source inline, so importing files absorb the type. Set by `pluginTs({ operations: 'inline' })`.
   */
  inline?: boolean
}

export function Type({ name, node, printer, enum: enumOptions, resolver, inline }: TypeProps): KubbReactNode {
  if (inline) {
    // An inline type has no file to declare its enums in, so they print as literal unions.
    const withoutEnums = ast.node.transform(node, { schema: (n) => (n.type === ast.schema.types.enum && n.name ? { ...n, name: undefined } : undefined) })
    // Property JSDoc would repeat in every file that absorbs the type; the schema files keep theirs.
    const expression = printer
      .with({ name: undefined })
      .print(withoutEnums)
      ?.replace(/\/\*\*[\s\S]*?\*\/\s*/g, '')
    if (!expression) return

    // The operation file is `inline`, so it is never written and importers take this body in place of the name.
    return (
      <TypeDeclaration export name={name}>
        {expression}
      </TypeDeclaration>
    )
  }

  const enumSchemaNodes = ast.node.collect<ast.EnumSchemaNode>(node, {
    schema(n): ast.EnumSchemaNode | undefined {
      const enumNode = ast.schema.narrow(n, ast.schema.types.enum)
      // Skip an inline `const` (single-value enum the adapter did not register): it renders as a
      // literal, so it gets no runtime enum declaration.
      if (enumNode?.name && !isInlineConstEnum(enumNode, printer.options.enumSchemaNames)) return enumNode
    },
  })

  const parts = getDeclarationParts(printer, node)
  const printerImports = printer.drainImports()

  if (!parts) {
    return
  }

  const enums = [...new Map(enumSchemaNodes.map((n) => [n.name, n])).values()].map((node) => {
    return {
      node,
      ...resolveEnumNames({ node, enum: enumOptions, resolver }),
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
            <File.Import key={[name, imp.path].join('-')} names={ast.file.getNames(imp)} path={imp.path} root={imp.root} />
          ))}
          <Origin pointer={node.pointer}>
            <TypeDeclaration export name={name} syntax={parts.syntax} JSDoc={{ comments: parts.comments }}>
              {factory.print(parts.type)}
            </TypeDeclaration>
          </Origin>
        </>
      )}
    </>
  )
}
