import type { Adapter } from '@kubb/core'
import { ast, defineGenerator } from '@kubb/core'
import type { AdapterOas } from '@kubb/adapter-oas'
import { File, jsxRendererSync } from '@kubb/renderer-jsx'
import { Operations } from '../components/Operations.tsx'
import { Zod } from '../components/Zod.tsx'
import { ZOD_NAMESPACE_IMPORTS } from '../constants.ts'
import { printerZod } from '../printers/printerZod.ts'
import { printerZodMini } from '../printers/printerZodMini.ts'
import type { PluginZod, ResolverZod } from '../types'
import { buildSchemaNames } from '../utils.ts'

// Per-build caches: keyed on resolver (unique per plugin instance per build, GC'd when released)
const zodPrinterCache = new WeakMap<ResolverZod, ReturnType<typeof printerZod>>()
const zodMiniPrinterCache = new WeakMap<ResolverZod, ReturnType<typeof printerZodMini>>()

export const zodGenerator = defineGenerator<PluginZod>({
  name: 'zod',
  renderer: jsxRendererSync,
  schema(node, ctx) {
    const { adapter, config, resolver, root, inputNode } = ctx
    const { output, coercion, guidType, mini, wrapOutput, inferred, importPath, group, printer } = ctx.options
    const dateType = (adapter as Adapter<AdapterOas>).options.dateType

    if (!node.name) {
      return
    }

    const mode = ctx.getMode(output)
    const isZodImport = ZOD_NAMESPACE_IMPORTS.has(importPath as 'zod' | 'zod/mini')

    const imports = adapter.getImports(node, (schemaName) => ({
      name: resolver.resolveSchemaName(schemaName),
      path: resolver.resolveFile({ name: schemaName, extname: '.ts' }, { root, output, group }).path,
    }))

    const meta = {
      name: resolver.resolveSchemaName(node.name),
      file: resolver.resolveFile({ name: node.name, extname: '.ts' }, { root, output, group }),
    } as const

    const inferTypeName = inferred ? resolver.resolveSchemaTypeName(node.name) : undefined

    const cyclicSchemas = ast.findCircularSchemas(inputNode.schemas)

    const schemaPrinter = mini ? getCachedMiniPrinter() : getCachedStdPrinter()
    function getCachedStdPrinter() {
      let p = zodPrinterCache.get(resolver)
      if (!p) {
        p = printerZod({ coercion, guidType, dateType, wrapOutput, resolver, cyclicSchemas, nodes: printer?.nodes })
        zodPrinterCache.set(resolver, p)
      }
      return p
    }
    function getCachedMiniPrinter() {
      let p = zodMiniPrinterCache.get(resolver)
      if (!p) {
        p = printerZodMini({ guidType, wrapOutput, resolver, cyclicSchemas, nodes: printer?.nodes })
        zodMiniPrinterCache.set(resolver, p)
      }
      return p
    }

    return (
      <File
        baseName={meta.file.baseName}
        path={meta.file.path}
        meta={meta.file.meta}
        banner={resolver.resolveBanner(inputNode, { output, config })}
        footer={resolver.resolveFooter(inputNode, { output, config })}
      >
        <File.Import name={isZodImport ? 'z' : ['z']} path={importPath} isNameSpace={isZodImport} />
        {mode === 'split' && imports.map((imp) => <File.Import key={[node.name, imp.path].join('-')} root={meta.file.path} path={imp.path} name={imp.name} />)}

        <Zod name={meta.name} node={node} printer={schemaPrinter} inferTypeName={inferTypeName} />
      </File>
    )
  },
  operation(node, ctx) {
    const { adapter, config, resolver, root, inputNode } = ctx
    const { output, coercion, guidType, mini, wrapOutput, inferred, importPath, group, paramsCasing, printer } = ctx.options
    const dateType = (adapter as Adapter<AdapterOas>).options.dateType

    const mode = ctx.getMode(output)
    const isZodImport = ZOD_NAMESPACE_IMPORTS.has(importPath as 'zod' | 'zod/mini')

    const params = ast.caseParams(node.parameters, paramsCasing)

    const meta = {
      file: resolver.resolveFile({ name: node.operationId, extname: '.ts', tag: node.tags[0] ?? 'default', path: node.path }, { root, output, group }),
    } as const

    const cyclicSchemas = ast.findCircularSchemas(inputNode.schemas)

    function renderSchemaEntry({ schema, name, keysToOmit }: { schema: ast.SchemaNode | null; name: string; keysToOmit?: Array<string> }) {
      if (!schema) return null

      const inferTypeName = inferred ? resolver.resolveTypeName(name) : undefined

      const imports = adapter.getImports(schema, (schemaName) => ({
        name: resolver.resolveSchemaName(schemaName),
        path: resolver.resolveFile({ name: schemaName, extname: '.ts' }, { root, output, group }).path,
      }))

      const schemaPrinter = mini
        ? keysToOmit?.length
          ? printerZodMini({ guidType, wrapOutput, resolver, keysToOmit, cyclicSchemas, nodes: printer?.nodes })
          : (zodMiniPrinterCache.get(resolver) ?? printerZodMini({ guidType, wrapOutput, resolver, cyclicSchemas, nodes: printer?.nodes }))
        : keysToOmit?.length
          ? printerZod({ coercion, guidType, dateType, wrapOutput, resolver, keysToOmit, cyclicSchemas, nodes: printer?.nodes })
          : (zodPrinterCache.get(resolver) ?? printerZod({ coercion, guidType, dateType, wrapOutput, resolver, cyclicSchemas, nodes: printer?.nodes }))

      return (
        <>
          {mode === 'split' &&
            imports.map((imp) => <File.Import key={[name, imp.path, imp.name].join('-')} root={meta.file.path} path={imp.path} name={imp.name} />)}
          <Zod name={name} node={schema} printer={schemaPrinter} inferTypeName={inferTypeName} />
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

            // Collect all import names from response schemas to detect naming collisions.
            // When a response is a $ref to a component schema whose resolved name matches
            // the response union name, skip generation to avoid redeclaration errors.
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
        banner={resolver.resolveBanner(inputNode, { output, config })}
        footer={resolver.resolveFooter(inputNode, { output, config })}
      >
        <File.Import name={isZodImport ? 'z' : ['z']} path={importPath} isNameSpace={isZodImport} />
        {paramSchemas}
        {responseSchemas}
        {responseUnionSchema}
        {requestSchema}
      </File>
    )
  },
  operations(nodes, ctx) {
    const { config, resolver, root, inputNode } = ctx
    const { output, importPath, group, operations, paramsCasing } = ctx.options

    if (!operations) {
      return
    }
    const isZodImport = ZOD_NAMESPACE_IMPORTS.has(importPath as 'zod' | 'zod/mini')

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
        banner={resolver.resolveBanner(inputNode, { output, config })}
        footer={resolver.resolveFooter(inputNode, { output, config })}
      >
        <File.Import isTypeOnly name={isZodImport ? 'z' : ['z']} path={importPath} isNameSpace={isZodImport} />
        {imports}
        <Operations name="operations" operations={transformedOperations} />
      </File>
    )
  },
})
