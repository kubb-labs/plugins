import { ast, defineGenerator } from '@kubb/core'
import { File, jsxRenderer } from '@kubb/renderer-jsx'
import { Operations } from '../components/Operations.tsx'
import { Valibot } from '../components/Valibot.tsx'
import { printerValibot } from '../printers/printerValibot.ts'
import type { PluginValibot } from '../types.ts'
import { buildSchemaNames } from '../utils.ts'

export const valibotGenerator = defineGenerator<PluginValibot>({
  name: 'valibot',
  renderer: jsxRenderer,
  schema(node, ctx) {
    const { adapter, config, resolver, root } = ctx
    const { output, coercion, guidType, dateType, optionalType, defaultMode, metadata: metadataOption, readonly, wrapOutput, inferred, importPath, group, printer } = ctx.options

    if (!node.name) {
      return
    }

    const mode = ctx.getMode(output)

    const imports = adapter.getImports(node, (schemaName) => ({
      name: resolver.resolveSchemaName(schemaName),
      path: resolver.resolveFile({ name: schemaName, extname: '.ts' }, { root, output, group }).path,
    }))

    const meta = {
      name: resolver.resolveSchemaName(node.name),
      file: resolver.resolveFile({ name: node.name, extname: '.ts' }, { root, output, group }),
    } as const

    const inferTypeName = inferred ? resolver.resolveSchemaTypeName(node.name) : undefined
    const cyclicSchemas = adapter.inputNode ? ast.findCircularSchemas(adapter.inputNode.schemas) : undefined
    const constType = cyclicSchemas?.has(node.name) ? 'v.GenericSchema' : undefined
    const schemaPrinter = printerValibot({ coercion, guidType, dateType, optionalType, defaultMode, metadata: metadataOption, readonly, wrapOutput, resolver, cyclicSchemas, nodes: printer?.nodes })

    return (
      <File
        baseName={meta.file.baseName}
        path={meta.file.path}
        meta={meta.file.meta}
        banner={resolver.resolveBanner(adapter.inputNode, { output, config })}
        footer={resolver.resolveFooter(adapter.inputNode, { output, config })}
      >
        <File.Import name="v" path={importPath} isNameSpace />
        {mode === 'split' && imports.map((imp) => <File.Import key={[node.name, imp.path].join('-')} root={meta.file.path} path={imp.path} name={imp.name} />)}

        <Valibot name={meta.name} node={node} printer={schemaPrinter} inferTypeName={inferTypeName} constType={constType} />
      </File>
    )
  },
  operation(node, ctx) {
    const { adapter, config, resolver, root } = ctx
    const { output, coercion, guidType, dateType, optionalType, defaultMode, metadata: metadataOption, readonly, wrapOutput, inferred, importPath, group, paramsCasing, printer } = ctx.options

    const mode = ctx.getMode(output)
    const params = ast.caseParams(node.parameters, paramsCasing)

    const meta = {
      file: resolver.resolveFile({ name: node.operationId, extname: '.ts', tag: node.tags[0] ?? 'default', path: node.path }, { root, output, group }),
    } as const

    const cyclicSchemas = adapter.inputNode ? ast.findCircularSchemas(adapter.inputNode.schemas) : undefined

    function renderSchemaEntry({ schema, name, keysToOmit }: { schema: ast.SchemaNode | null; name: string; keysToOmit?: Array<string> }) {
      if (!schema) return null

      const inferTypeName = inferred ? resolver.resolveTypeName(name) : undefined

      const imports = adapter.getImports(schema, (schemaName) => ({
        name: resolver.resolveSchemaName(schemaName),
        path: resolver.resolveFile({ name: schemaName, extname: '.ts' }, { root, output, group }).path,
      }))

      const schemaPrinter = printerValibot({ coercion, guidType, dateType, optionalType, defaultMode, metadata: metadataOption, readonly, wrapOutput, resolver, keysToOmit, cyclicSchemas, nodes: printer?.nodes })
      const constType = schema.name && cyclicSchemas?.has(schema.name) ? 'v.GenericSchema' : undefined

      return (
        <>
          {mode === 'split' &&
            imports.map((imp) => <File.Import key={[name, imp.path, imp.name].join('-')} root={meta.file.path} path={imp.path} name={imp.name} />)}
          <Valibot name={name} node={schema} printer={schemaPrinter} inferTypeName={inferTypeName} constType={constType} />
        </>
      )
    }

    const paramSchemas = params.map((param) => renderSchemaEntry({ schema: param.schema, name: resolver.resolveParamName(node, param) }))
    const responseSchemas = node.responses.map((res) =>
      renderSchemaEntry({
        schema: res.schema,
        name: resolver.resolveResponseStatusName(node, res.statusCode),
        keysToOmit: res.keysToOmit,
      }),
    )

    const responsesWithSchema = node.responses.filter((res) => res.schema)
    const responseUnionSchema =
      responsesWithSchema.length > 0
        ? (() => {
            const responseUnionName = resolver.resolveResponseName(node)
            const importedNames = new Set(
              responsesWithSchema.flatMap((res) =>
                res.schema
                  ? adapter
                      .getImports(res.schema, (schemaName) => ({
                        name: resolver.resolveSchemaName(schemaName),
                        path: '',
                      }))
                      .flatMap((imp) => (Array.isArray(imp.name) ? imp.name : [imp.name]))
                  : [],
              ),
            )

            if (importedNames.has(responseUnionName)) {
              return null
            }

            const members = responsesWithSchema.map((res) => ast.createSchema({ type: 'ref', name: resolver.resolveResponseStatusName(node, res.statusCode) }))
            const unionNode = members.length === 1 ? members[0]! : ast.createSchema({ type: 'union', members })

            return renderSchemaEntry({
              schema: unionNode,
              name: responseUnionName,
            })
          })()
        : null

    const requestSchema = node.requestBody?.content?.[0]?.schema
      ? renderSchemaEntry({
          schema: {
            ...node.requestBody.content![0]!.schema!,
            description: node.requestBody.description ?? node.requestBody.content![0]!.schema!.description,
          },
          name: resolver.resolveDataName(node),
          keysToOmit: node.requestBody.content![0]!.keysToOmit,
        })
      : null

    return (
      <File
        baseName={meta.file.baseName}
        path={meta.file.path}
        meta={meta.file.meta}
        banner={resolver.resolveBanner(adapter.inputNode, { output, config })}
        footer={resolver.resolveFooter(adapter.inputNode, { output, config })}
      >
        <File.Import name="v" path={importPath} isNameSpace />
        {paramSchemas}
        {responseSchemas}
        {responseUnionSchema}
        {requestSchema}
      </File>
    )
  },
  operations(nodes, ctx) {
    const { adapter, config, resolver, root } = ctx
    const { output, importPath, group, operations, paramsCasing } = ctx.options

    if (!operations) {
      return
    }

    const meta = {
      file: resolver.resolveFile({ name: 'operations', extname: '.ts' }, { root, output, group }),
    } as const

    const transformedOperations = nodes.map((node) => {
      const params = ast.caseParams(node.parameters, paramsCasing)

      return {
        node,
        data: buildSchemaNames(node, { params, resolver }),
      }
    })

    const imports = transformedOperations.flatMap(({ node, data }) => {
      const names = [data.request, ...Object.values(data.responses), ...Object.values(data.parameters)].filter(Boolean) as string[]
      const opFile = resolver.resolveFile({ name: node.operationId, extname: '.ts', tag: node.tags[0] ?? 'default', path: node.path }, { root, output, group })

      return names.map((name) => <File.Import key={[name, opFile.path].join('-')} name={[name]} root={meta.file.path} path={opFile.path} />)
    })

    return (
      <File
        baseName={meta.file.baseName}
        path={meta.file.path}
        meta={meta.file.meta}
        banner={resolver.resolveBanner(adapter.inputNode, { output, config })}
        footer={resolver.resolveFooter(adapter.inputNode, { output, config })}
      >
        <File.Import isTypeOnly name="v" path={importPath} isNameSpace />
        {imports}
        <Operations name="operations" operations={transformedOperations} />
      </File>
    )
  },
})
