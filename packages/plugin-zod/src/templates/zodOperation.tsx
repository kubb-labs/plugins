import { ast } from '@internals/ast'
import { buildOperationSchemaEntries, schemaComments } from '@internals/shared'
import { File } from '@kubb/renderer-jsx'
import { defineTemplate } from '@kubb/kit'
import { Zod } from '../components/Zod.tsx'
import type { PluginZod } from '../types.ts'
import { aliasKind } from '../utils.ts'
import { collectDirectionalRefNames } from '../printers/printerZod.ts'
import type { PrinterZodOptions } from '../printers/printerZod.ts'

/**
 * Writes one file per operation with the schemas of its parameters, request body and responses.
 */
export const zodOperation = defineTemplate<PluginZod>({
  kind: ast.node.kinds.operation,
  render(node, ctx) {
    if (!ast.http.isOperation(node)) return null
    const { output, compile, mini, inferred, importPath, group } = ctx.options

    const isZodImport = importPath === 'zod' || importPath === 'zod/mini'

    const meta = {
      file: ctx.file(node),
    } as const

    const printerOptions = ctx.printer.options as PrinterZodOptions
    // The schemas of this file by name, so a union of them can tell what its members print.
    const siblings = new Map<string, ast.SchemaNode>()

    function renderSchemaEntry({
      schema,
      name,
      keysToOmit,
      direction = 'decode',
    }: {
      schema: ast.SchemaNode | null
      name: string
      keysToOmit?: Array<string> | null
      direction?: 'encode' | 'decode'
    }) {
      if (!schema) return null
      siblings.set(name, schema)

      const directionalRefNames = direction === 'encode' ? new Set(collectDirectionalRefNames({ node: schema, printerOptions, mini })) : null
      const schemaPrinter = ctx.printer.with({ keysToOmit, direction })
      const imports = ctx.resolver.imports({
        node: schema,
        root: ctx.root,
        output,
        group: group ?? undefined,
        checks: true,
        name: (schemaName) => (directionalRefNames?.has(schemaName) ? ctx.resolver.schema.inputName(schemaName) : ctx.resolver.name(schemaName)),
      })

      return (
        <>
          {imports.map((imp) => (
            <File.Import key={[name, imp.path].join('-')} names={ast.file.getNames(imp)} root={meta.file.path} path={imp.path} />
          ))}
          {/* Operation schemas reference (and import) the component schemas, which carry the
              `z.ZodType` annotation at their own definition when cyclic. Annotating the operation
              schema too would only erase its inferred type to `unknown`, breaking typed consumers
              (e.g. the MCP server's request types), so it is never marked cyclic here. */}
          <Zod
            name={name}
            node={schema}
            printer={schemaPrinter}
            inferTypeName={inferred ? ctx.resolver.schema.type(name) : null}
            inferKind={aliasKind(inferred, direction)}
            cyclic={false}
            compile={compile}
            siblings={siblings}
            comments={schemaComments(schema)}
          />
        </>
      )
    }

    const entries = buildOperationSchemaEntries({ node, resolver: ctx.resolver, inferred: !!inferred })

    return (
      <File {...meta.file}>
        <File.Import names={[isZodImport ? { name: '*', alias: 'z', space: 'value' } : { name: 'z', space: 'value' }]} path={importPath} />
        {entries.map(renderSchemaEntry)}
      </File>
    )
  },
})
