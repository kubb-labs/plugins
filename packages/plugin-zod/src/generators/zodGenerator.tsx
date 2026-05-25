import { resolveContentTypeVariants } from '@internals/shared'
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

type ZodPrinterEntry = { printer: ReturnType<typeof printerZod>; coercion: unknown; guidType: unknown; dateType: unknown }
type ZodMiniPrinterEntry = { printer: ReturnType<typeof printerZodMini>; guidType: unknown }

// Per-build caches: keyed on resolver (unique per plugin instance per build, GC'd when released)
const zodPrinterCache = new WeakMap<ResolverZod, ZodPrinterEntry>()
const zodMiniPrinterCache = new WeakMap<ResolverZod, ZodMiniPrinterEntry>()

/**
 * Built-in generator for `@kubb/plugin-zod`. Emits one Zod schema per
 * schema in the spec plus per-operation request/response/parameter schemas.
 * When `mini: true`, schemas use the Zod Mini functional API instead of
 * chainable methods.
 */
export const zodGenerator = defineGenerator<PluginZod>({
  name: 'zod',
  renderer: jsxRendererSync,
  schema(node, ctx) {
    const { adapter, config, resolver, root } = ctx
    const { output, coercion, guidType, mini, wrapOutput, inferred, importPath, group, printer } = ctx.options
    const dateType = (adapter as Adapter<AdapterOas>).options.dateType

    if (!node.name) {
      return
    }

    const mode = ctx.getMode(output)
    const isZodImport = ZOD_NAMESPACE_IMPORTS.has(importPath as 'zod' | 'zod/mini')

    const imports = adapter.getImports(node, (schemaName) => ({
      name: resolver.resolveSchemaName(schemaName),
      path: resolver.resolveFile({ name: schemaName, extname: '.ts' }, { root, output, group: group ?? undefined }).path,
    }))

    const meta = {
      name: resolver.resolveSchemaName(node.name),
      file: resolver.resolveFile({ name: node.name, extname: '.ts' }, { root, output, group: group ?? undefined }),
    } as const

    const inferTypeName = inferred ? resolver.resolveSchemaTypeName(node.name) : null

    const cyclicSchemas = new Set<string>(ctx.meta.circularNames)

    const schemaPrinter = mini ? getCachedMiniPrinter() : getCachedStdPrinter()
    function getCachedStdPrinter() {
      const cached = zodPrinterCache.get(resolver)
      if (cached && cached.coercion === coercion && cached.guidType === guidType && cached.dateType === dateType) {
        return cached.printer
      }
      const p = printerZod({ coercion, guidType, dateType, wrapOutput, resolver, cyclicSchemas, nodes: printer?.nodes })
      zodPrinterCache.set(resolver, { printer: p, coercion, guidType, dateType })
      return p
    }
    function getCachedMiniPrinter() {
      const cached = zodMiniPrinterCache.get(resolver)
      if (cached && cached.guidType === guidType) {
        return cached.printer
      }
      const p = printerZodMini({ guidType, wrapOutput, resolver, cyclicSchemas, nodes: printer?.nodes })
      zodMiniPrinterCache.set(resolver, { printer: p, guidType })
      return p
    }

    return (
      <File
        baseName={meta.file.baseName}
        path={meta.file.path}
        meta={meta.file.meta}
        banner={resolver.resolveBanner(ctx.meta, { output, config, file: { path: meta.file.path, baseName: meta.file.baseName } })}
        footer={resolver.resolveFooter(ctx.meta, { output, config, file: { path: meta.file.path, baseName: meta.file.baseName } })}
      >
        <File.Import name={isZodImport ? 'z' : ['z']} path={importPath} isNameSpace={isZodImport} />
        {mode === 'split' && imports.map((imp) => <File.Import key={[node.name, imp.path].join('-')} root={meta.file.path} path={imp.path} name={imp.name} />)}

        <Zod name={meta.name} node={node} printer={schemaPrinter} inferTypeName={inferTypeName} />
      </File>
    )
  },
  operation(node, ctx) {
    if (!ast.isHttpOperationNode(node)) return null
    const { adapter, config, resolver, root } = ctx
    const { output, coercion, guidType, mini, wrapOutput, inferred, importPath, group, paramsCasing, printer } = ctx.options
    const dateType = (adapter as Adapter<AdapterOas>).options.dateType

    const mode = ctx.getMode(output)
    const isZodImport = ZOD_NAMESPACE_IMPORTS.has(importPath as 'zod' | 'zod/mini')

    const params = ast.caseParams(node.parameters, paramsCasing)

    const meta = {
      file: resolver.resolveFile(
        { name: node.operationId, extname: '.ts', tag: node.tags[0] ?? 'default', path: node.path },
        { root, output, group: group ?? undefined },
      ),
    } as const

    const cyclicSchemas = new Set<string>(ctx.meta.circularNames)

    function renderSchemaEntry({ schema, name, keysToOmit }: { schema: ast.SchemaNode | null; name: string; keysToOmit?: Array<string> | null }) {
      if (!schema) return null

      const inferTypeName = inferred ? resolver.resolveTypeName(name) : null

      const imports = adapter.getImports(schema, (schemaName) => ({
        name: resolver.resolveSchemaName(schemaName),
        path: resolver.resolveFile({ name: schemaName, extname: '.ts' }, { root, output, group: group ?? undefined }).path,
      }))

      const cachedStd = zodPrinterCache.get(resolver)
      const cachedMini = zodMiniPrinterCache.get(resolver)
      const schemaPrinter = mini
        ? keysToOmit?.length
          ? printerZodMini({ guidType, wrapOutput, resolver, keysToOmit, cyclicSchemas, nodes: printer?.nodes })
          : cachedMini?.guidType === guidType
            ? cachedMini.printer
            : printerZodMini({ guidType, wrapOutput, resolver, cyclicSchemas, nodes: printer?.nodes })
        : keysToOmit?.length
          ? printerZod({ coercion, guidType, dateType, wrapOutput, resolver, keysToOmit, cyclicSchemas, nodes: printer?.nodes })
          : cachedStd?.coercion === coercion && cachedStd?.guidType === guidType && cachedStd?.dateType === dateType
            ? cachedStd.printer
            : printerZod({ coercion, guidType, dateType, wrapOutput, resolver, cyclicSchemas, nodes: printer?.nodes })

      return (
        <>
          {mode === 'split' &&
            imports.map((imp) => <File.Import key={[name, imp.path, imp.name].join('-')} root={meta.file.path} path={imp.path} name={imp.name} />)}
          <Zod name={name} node={schema} printer={schemaPrinter} inferTypeName={inferTypeName} />
        </>
      )
    }

    // Multiple content types for a single name — emit one schema per content type plus a union alias.
    function buildContentTypeVariants(
      entries: Array<{ contentType: string; schema?: ast.SchemaNode | null; keysToOmit?: Array<string> | null }>,
      baseName: string,
      decorate?: (schema: ast.SchemaNode) => ast.SchemaNode,
    ) {
      const variants = resolveContentTypeVariants(entries, baseName)
      const unionSchema = ast.createSchema({
        type: 'union',
        members: variants.map((variant) => ast.createSchema({ type: 'ref', name: variant.name })),
      })
      return (
        <>
          {variants.map((variant) =>
            renderSchemaEntry({
              schema: decorate ? decorate(variant.schema) : variant.schema,
              name: variant.name,
              keysToOmit: variant.keysToOmit,
            }),
          )}
          {renderSchemaEntry({ schema: unionSchema, name: baseName })}
        </>
      )
    }

    const paramSchemas = params.map((param) => renderSchemaEntry({ schema: param.schema, name: resolver.resolveParamName(node, param) }))

    const responseSchemas = node.responses.map((res) => {
      const variants = (res.content ?? []).filter((entry) => entry.schema)
      if (variants.length > 1) {
        return buildContentTypeVariants(res.content!, resolver.resolveResponseStatusName(node, res.statusCode))
      }
      const primary = variants[0] ?? res.content?.[0]
      return renderSchemaEntry({
        schema: primary?.schema ?? null,
        name: resolver.resolveResponseStatusName(node, res.statusCode),
        keysToOmit: primary?.keysToOmit,
      })
    })

    const responsesWithSchema = node.responses.filter((res) => res.content?.some((entry) => entry.schema))
    const responseUnionSchema =
      responsesWithSchema.length > 0
        ? (() => {
            const responseUnionName = resolver.resolveResponseName(node)

            // Collect all import names from response schemas to detect naming collisions.
            // When a response is a $ref to a component schema whose resolved name matches
            // the response union name, skip generation to avoid redeclaration errors.
            const importedNames = new Set(
              responsesWithSchema.flatMap((res) =>
                (res.content ?? []).flatMap((entry) =>
                  entry.schema
                    ? adapter
                        .getImports(entry.schema, (schemaName) => ({
                          name: resolver.resolveSchemaName(schemaName),
                          path: '',
                        }))
                        .flatMap((imp) => (Array.isArray(imp.name) ? imp.name : [imp.name]))
                    : [],
                ),
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

    const requestBodyContent = node.requestBody?.content ?? []
    const requestSchema = (() => {
      if (requestBodyContent.length === 0) return null
      if (requestBodyContent.length === 1) {
        const entry = requestBodyContent[0]!
        if (!entry.schema) return null
        return renderSchemaEntry({
          schema: { ...entry.schema, description: node.requestBody!.description ?? entry.schema.description },
          name: resolver.resolveDataName(node),
          keysToOmit: entry.keysToOmit,
        })
      }
      return buildContentTypeVariants(requestBodyContent, resolver.resolveDataName(node), (schema) => ({
        ...schema,
        description: node.requestBody!.description ?? schema.description,
      }))
    })()

    return (
      <File
        baseName={meta.file.baseName}
        path={meta.file.path}
        meta={meta.file.meta}
        banner={resolver.resolveBanner(ctx.meta, { output, config, file: { path: meta.file.path, baseName: meta.file.baseName } })}
        footer={resolver.resolveFooter(ctx.meta, { output, config, file: { path: meta.file.path, baseName: meta.file.baseName } })}
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
    const { config, resolver, root } = ctx
    const { output, importPath, group, operations, paramsCasing } = ctx.options

    if (!operations) {
      return
    }
    const isZodImport = ZOD_NAMESPACE_IMPORTS.has(importPath as 'zod' | 'zod/mini')

    const meta = {
      file: resolver.resolveFile({ name: 'operations', extname: '.ts' }, { root, output, group: group ?? undefined }),
    } as const

    const transformedOperations = nodes.filter(ast.isHttpOperationNode).map((node) => {
      const params = ast.caseParams(node.parameters, paramsCasing)

      return {
        node,
        data: buildSchemaNames(node, { params, resolver }),
      }
    })

    const imports = transformedOperations.flatMap(({ node, data }) => {
      const names = [data.request, ...Object.values(data.responses), ...Object.values(data.parameters)].filter(Boolean) as Array<string>
      const opFile = resolver.resolveFile(
        { name: node.operationId, extname: '.ts', tag: node.tags[0] ?? 'default', path: node.path },
        { root, output, group: group ?? undefined },
      )

      return names.map((name) => <File.Import key={[name, opFile.path].join('-')} name={[name]} root={meta.file.path} path={opFile.path} />)
    })

    return (
      <File
        baseName={meta.file.baseName}
        path={meta.file.path}
        meta={meta.file.meta}
        banner={resolver.resolveBanner(ctx.meta, { output, config, file: { path: meta.file.path, baseName: meta.file.baseName } })}
        footer={resolver.resolveFooter(ctx.meta, { output, config, file: { path: meta.file.path, baseName: meta.file.baseName } })}
      >
        <File.Import isTypeOnly name={isZodImport ? 'z' : ['z']} path={importPath} isNameSpace={isZodImport} />
        {imports}
        <Operations name="operations" operations={transformedOperations} />
      </File>
    )
  },
})
