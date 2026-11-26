import { ast } from '@internals/ast'
import { buildOperationSchemaEntries, getCircularNames, schemaComments } from '@internals/shared'
import { defineTemplate } from '@kubb/kit'
import { File } from '@kubb/renderer-jsx'
import { Valibot } from '../components/Valibot.tsx'
import { collectDirectionalRefNames, containsDirectionalNode } from '../printers/printerValibot.ts'
import type { PluginValibot } from '../types.ts'
import type { Direction } from '@internals/shared/types'

// A request schema is typed by the value the caller passes, every other schema by the value it returns.
const inferKinds = { encode: 'InferInput', decode: 'InferOutput' } as const

/**
 * Built-in template for `@kubb/plugin-valibot`. Emits one Valibot schema per schema in the spec,
 * plus the parameter, request, and response schemas of each operation.
 */
export const valibotSchema = defineTemplate<PluginValibot>({
  kind: ast.node.kinds.schema,
  render(node, ctx) {
    const { output, inferred, typeGuards, importPath, group } = ctx.options

    if (!node.name) {
      return
    }

    const cyclicSchemas = getCircularNames()
    const printerOptions = ctx.printer.options
    // Rendered twice: the schema decodes, and its `${name}InputSchema` variant encodes.
    const hasDirectionalNode = containsDirectionalNode({ node, printerOptions })
    const valibot = ctx.from().resolver
    const inputImports = hasDirectionalNode
      ? collectDirectionalRefNames({ node, printerOptions }).flatMap((schemaName) => valibot.schema.inputName(schemaName).import ?? [])
      : []
    const imports = [...ctx.resolver.imports({ node, root: ctx.root, output, group: group ?? undefined, checks: true }), ...inputImports]
    const inputName = ctx.resolver.schema.inputName(node.name)
    const meta = {
      name: ctx.resolver.name(node.name),
      file: ctx.file(node),
    } as const

    return (
      <File {...meta.file}>
        <File.Import names={[{ name: '*', alias: 'v', space: 'value' }]} path={importPath} />
        {imports.map((imp) => (
          <File.Import key={[node.name, imp.path].join('-')} names={ast.file.getNames(imp)} root={meta.file.path} path={imp.path} />
        ))}

        <Valibot
          name={meta.name}
          node={node}
          printer={ctx.printer.with({ direction: 'decode' })}
          inferTypeName={inferred ? ctx.resolver.schema.typeName(node.name) : null}
          typeGuards={typeGuards}
          isName={ctx.resolver.schema.isName(node.name)}
          assertName={ctx.resolver.schema.assertName(node.name)}
          cyclic={cyclicSchemas.has(node.name)}
          comments={schemaComments(node)}
        />
        {hasDirectionalNode && (
          <Valibot
            name={inputName}
            node={node}
            printer={ctx.printer.with({ direction: 'encode' })}
            inferTypeName={inferred ? ctx.resolver.schema.inputTypeName(node.name) : null}
            inferKind="InferInput"
            typeGuards={typeGuards}
            isName={ctx.resolver.schema.isName(inputName)}
            assertName={ctx.resolver.schema.assertName(inputName)}
            cyclic={cyclicSchemas.has(node.name)}
            comments={schemaComments(node)}
          />
        )}
      </File>
    )
  },
})

export const valibotOperation = defineTemplate<PluginValibot>({
  kind: ast.node.kinds.operation,
  render(node, ctx) {
    if (!ast.http.isOperation(node)) return null
    const { output, inferred, importPath, group } = ctx.options

    const meta = {
      file: ctx.file(node),
    } as const

    const cyclicSchemas = getCircularNames()
    const printerOptions = ctx.printer.options

    function renderSchemaEntry({
      schema,
      name,
      keysToOmit,
      direction = 'decode',
    }: {
      schema: ast.SchemaNode | null
      name: string
      keysToOmit?: Array<string> | null
      direction?: Direction
    }) {
      if (!schema) return null
      // A circular const is typed `v.GenericSchema`, which `v.omit` does not take, so its object prints here without the keys.
      const refName = schema.type === 'ref' ? ast.ref.getName(schema) : null
      const target = schema.type === 'ref' ? schema.schema : undefined
      if (keysToOmit?.length && target && refName && cyclicSchemas.has(refName)) {
        const declaresKey = (node: ast.SchemaNode) => keysToOmit.some((propertyName) => ast.schema.findProperties({ node, propertyName }).length > 0)
        // Drops the keys from an object, from every `allOf` member, and from a `$ref` member that declares one, which prints inline.
        const withoutKeys = (node: ast.SchemaNode, seen = new Set<ast.SchemaNode>()): ast.SchemaNode => {
          if (node.type === 'object') return { ...node, properties: node.properties.filter((property) => !keysToOmit.includes(property.name)) }
          if (node.type === 'intersection') return { ...node, members: (node.members ?? []).map((member) => withoutKeys(member, seen)) }
          if (node.type !== 'ref' || !node.schema || seen.has(node.schema) || !declaresKey(node.schema)) return node

          // A copy per branch: the set stops a cycle, and a schema that two members reference prints inline in both.
          return withoutKeys(node.schema, new Set(seen).add(node.schema))
        }
        const inline = withoutKeys(target)
        if (inline.type === 'object' || inline.type === 'intersection') return renderSchemaEntry({ schema: inline, name, direction })
      }

      const inputRefNames = direction === 'encode' ? new Set(collectDirectionalRefNames({ node: schema, printerOptions })) : null
      const imports = ctx.resolver.imports({
        node: schema,
        root: ctx.root,
        output,
        group: group ?? undefined,
        checks: true,
        name: (schemaName) => (inputRefNames?.has(schemaName) ? ctx.resolver.schema.inputName(schemaName) : ctx.resolver.name(schemaName)),
      })

      return (
        <>
          {imports.map((imp) => (
            <File.Import key={[name, imp.path].join('-')} names={ast.file.getNames(imp)} root={meta.file.path} path={imp.path} />
          ))}
          {/* A circular component schema carries the `v.GenericSchema` annotation at its own definition.
              Annotating the operation schema too would erase its inferred type to `unknown`. */}
          <Valibot
            name={name}
            node={schema}
            printer={ctx.printer.with({ keysToOmit, direction })}
            inferTypeName={inferred ? ctx.resolver.schema.type(name) : null}
            inferKind={inferKinds[direction]}
            comments={schemaComments(schema)}
          />
        </>
      )
    }

    const entries = buildOperationSchemaEntries({ node, resolver: ctx.resolver, inferred: !!inferred })

    return (
      <File {...meta.file}>
        <File.Import names={[{ name: '*', alias: 'v', space: 'value' }]} path={importPath} />
        {entries.map(renderSchemaEntry)}
      </File>
    )
  },
})
