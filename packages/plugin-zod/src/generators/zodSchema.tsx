import { ast } from '@internals/ast'
import { getCircularNames, schemaComments } from '@internals/shared'
import { File } from '@kubb/renderer-jsx'
import { defineTemplate } from '@kubb/kit'
import { Zod } from '../components/Zod.tsx'
import type { PluginZod } from '../types.ts'
import { aliasKind } from '../utils.ts'
import { collectDirectionalRefNames, containsDirectionalNode } from '../printers/printerZod.ts'
import type { PrinterZodOptions } from '../printers/printerZod.ts'

/**
 * Writes one file per schema: the Zod schema, plus an `Input` variant when encoding differs from decoding.
 */
export const zodSchema = defineTemplate<PluginZod>({
  kind: 'Schema',
  render(node, ctx) {
    const { compile, mini, inferred, typeGuards, importPath } = ctx.options

    if (!node.name) {
      return null
    }

    const isZodImport = importPath === 'zod' || importPath === 'zod/mini'
    const printerOptions = ctx.printer.options as PrinterZodOptions
    const cyclicSchemas = getCircularNames()

    // Rendered twice: the canonical schema decodes, the `${name}InputSchema` variant encodes.
    const hasDirectionalNode = containsDirectionalNode({ node, printerOptions, mini })

    const directionalRefNames = new Set(hasDirectionalNode ? collectDirectionalRefNames({ node, printerOptions, mini }) : [])
    const zod = ctx.from().resolver
    const importEntries = ast.graph.getImportedNames(node, { checks: true }).flatMap((schemaName) => zod.name(schemaName).import ?? [])
    const inputImportEntries = [...directionalRefNames].flatMap((schemaName) => zod.schema.inputName(schemaName).import ?? [])
    const imports = [...importEntries, ...inputImportEntries]

    const meta = {
      name: ctx.resolver.name(node.name),
      file: ctx.file(node),
    } as const

    const isName = typeGuards ? ctx.resolver.schema.isName(node.name) : null
    const assertName = typeGuards ? ctx.resolver.schema.assertName(node.name) : null

    const schemaPrinter = ctx.printer.with({ direction: 'decode' })

    return (
      <File {...meta.file}>
        <File.Import names={[isZodImport ? { name: '*', alias: 'z' } : { name: 'z' }]} path={importPath} />
        {imports.map((imp) => (
          <File.Import key={[node.name, imp.path, imp.name].join('-')} root={meta.file.path} path={imp.path} name={imp.name} />
        ))}

        <Zod
          name={meta.name}
          node={node}
          printer={schemaPrinter}
          inferTypeName={inferred ? ctx.resolver.schema.typeName(node.name) : null}
          inferKind={aliasKind(inferred, 'decode')}
          typeGuards={typeGuards}
          isName={isName}
          assertName={assertName}
          mini={mini}
          cyclic={cyclicSchemas.has(node.name)}
          compile={compile}
          comments={schemaComments(node)}
        />
        {hasDirectionalNode && (
          <Zod
            name={ctx.resolver.schema.inputName(node.name)}
            node={node}
            printer={ctx.printer.with({ direction: 'encode' })}
            inferTypeName={inferred ? ctx.resolver.schema.inputTypeName(node.name) : null}
            inferKind={aliasKind(inferred, 'encode')}
            typeGuards={typeGuards}
            isName={typeGuards ? ctx.resolver.schema.isName(ctx.resolver.schema.inputName(node.name)) : null}
            assertName={typeGuards ? ctx.resolver.schema.assertName(ctx.resolver.schema.inputName(node.name)) : null}
            mini={mini}
            cyclic={cyclicSchemas.has(node.name)}
            compile={compile}
            comments={schemaComments(node)}
          />
        )}
      </File>
    )
  },
})
