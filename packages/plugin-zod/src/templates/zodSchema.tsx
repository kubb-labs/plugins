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
  kind: ast.node.kinds.schema,
  render(node, ctx) {
    const { output, compile, mini, inferred, typeGuards, importPath, group } = ctx.options

    if (!node.name) {
      return null
    }

    const isZodImport = importPath === 'zod' || importPath === 'zod/mini'
    const printerOptions = ctx.printer.options as PrinterZodOptions
    const cyclicSchemas = getCircularNames()

    // Rendered twice: the canonical schema decodes, the `${name}InputSchema` variant encodes.
    const hasDirectionalNode = containsDirectionalNode({ node, printerOptions, mini })

    const directionalRefNames = new Set(hasDirectionalNode ? collectDirectionalRefNames({ node, printerOptions, mini }) : [])
    const importOptions = { node, root: ctx.root, output, group: group ?? undefined, checks: true }
    const importEntries = ctx.resolver.imports(importOptions)
    const inputNames = new Set([...directionalRefNames].map((schemaName) => ctx.resolver.schema.inputName(schemaName)))
    const inputImportEntries = inputNames.size
      ? ctx.resolver
          .imports({ ...importOptions, name: (schemaName) => ctx.resolver.schema.inputName(schemaName) })
          .filter((imp) => ast.file.getNames(imp).some((item) => inputNames.has(item.name)))
      : []
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
        <File.Import names={[isZodImport ? { name: '*', alias: 'z', space: 'value' } : { name: 'z', space: 'value' }]} path={importPath} />
        {imports.map((imp) => (
          <File.Import key={[node.name, imp.path].join('-')} names={ast.file.getNames(imp)} root={meta.file.path} path={imp.path} />
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
