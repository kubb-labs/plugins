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
import { buildSchemaNames, containsDateRepresentation } from '../utils.ts'

type StdPrinters = { output: ReturnType<typeof printerZod>; input: ReturnType<typeof printerZod> }
type ZodPrinterEntry = StdPrinters & { coercion: unknown; guidType: unknown; dateType: unknown }
type ZodMiniPrinterEntry = { printer: ReturnType<typeof printerZodMini>; guidType: unknown }

// Per-build caches: keyed on resolver (unique per plugin instance per build, GC'd when released)
const zodPrinterCache = new WeakMap<ResolverZod, ZodPrinterEntry>()
const zodMiniPrinterCache = new WeakMap<ResolverZod, ZodMiniPrinterEntry>()

type StdPrinterParams = { coercion: unknown; guidType: unknown; dateType: unknown; wrapOutput: unknown; cyclicSchemas: ReadonlySet<string>; nodes: unknown }

/**
 * Returns the cached `output`/`input` direction printers for a resolver, building them on
 * first use. The `input` printer encodes `Date → string` for request bodies; `output` decodes
 * `string → Date` for responses. Schemas without `dateType: 'date'` fields print identically.
 */
function getStdPrinters(resolver: ResolverZod, params: StdPrinterParams): StdPrinters {
  const cached = zodPrinterCache.get(resolver)
  if (cached && cached.coercion === params.coercion && cached.guidType === params.guidType && cached.dateType === params.dateType) {
    return { output: cached.output, input: cached.input }
  }
  const base = { ...params, resolver } as Parameters<typeof printerZod>[0]
  const output = printerZod({ ...base, direction: 'output' })
  const input = printerZod({ ...base, direction: 'input' })
  zodPrinterCache.set(resolver, { output, input, coercion: params.coercion, guidType: params.guidType, dateType: params.dateType })
  return { output, input }
}

function getMiniPrinter(resolver: ResolverZod, params: { guidType: unknown; wrapOutput: unknown; cyclicSchemas: ReadonlySet<string>; nodes: unknown }) {
  const cached = zodMiniPrinterCache.get(resolver)
  if (cached && cached.guidType === params.guidType) return cached.printer
  const p = printerZodMini({ ...params, resolver } as Parameters<typeof printerZodMini>[0])
  zodMiniPrinterCache.set(resolver, { printer: p, guidType: params.guidType })
  return p
}

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
    const cyclicSchemas = new Set<string>(ctx.meta.circularNames)

    // A date-bearing component is rendered twice: the canonical (output) schema decodes
    // `string → Date`, and an `${name}InputSchema` variant encodes `Date → string` for requests.
    const isDateBearing = !mini && containsDateRepresentation(node)

    const dateBearingRefNames = new Set(
      isDateBearing
        ? ast.collect<string>(node, {
            schema: (n) => (n.type === 'ref' && n.ref && containsDateRepresentation(n) ? (ast.extractRefName(n.ref) ?? undefined) : undefined),
          })
        : [],
    )
    const importEntries = adapter.getImports(node, (schemaName) => ({
      name: resolver.resolveSchemaName(schemaName),
      path: resolver.resolveFile({ name: schemaName, extname: '.ts' }, { root, output, group: group ?? undefined }).path,
    }))
    const inputImportEntries = isDateBearing
      ? [...dateBearingRefNames].map((schemaName) => ({
          name: resolver.resolveSchemaName(`${schemaName} input`),
          path: resolver.resolveFile({ name: schemaName, extname: '.ts' }, { root, output, group: group ?? undefined }).path,
        }))
      : []
    const seenImports = new Set<string>()
    const imports = [...importEntries, ...inputImportEntries].filter((imp) => {
      const key = `${Array.isArray(imp.name) ? imp.name.join(',') : imp.name}|${imp.path}`
      if (seenImports.has(key)) return false
      seenImports.add(key)
      return true
    })

    const meta = {
      name: resolver.resolveSchemaName(node.name),
      file: resolver.resolveFile({ name: node.name, extname: '.ts' }, { root, output, group: group ?? undefined }),
    } as const

    const inferTypeName = inferred ? resolver.resolveSchemaTypeName(node.name) : null

    const stdPrinters = mini ? null : getStdPrinters(resolver, { coercion, guidType, dateType, wrapOutput, cyclicSchemas, nodes: printer?.nodes })
    const schemaPrinter = mini ? getMiniPrinter(resolver, { guidType, wrapOutput, cyclicSchemas, nodes: printer?.nodes }) : stdPrinters!.output

    return (
      <File
        baseName={meta.file.baseName}
        path={meta.file.path}
        meta={meta.file.meta}
        banner={resolver.resolveBanner(ctx.meta, { output, config, file: { path: meta.file.path, baseName: meta.file.baseName } })}
        footer={resolver.resolveFooter(ctx.meta, { output, config, file: { path: meta.file.path, baseName: meta.file.baseName } })}
      >
        <File.Import name={isZodImport ? 'z' : ['z']} path={importPath} isNameSpace={isZodImport} />
        {mode === 'split' &&
          imports.map((imp) => <File.Import key={[node.name, imp.path, imp.name].join('-')} root={meta.file.path} path={imp.path} name={imp.name} />)}

        <Zod name={meta.name} node={node} printer={schemaPrinter} inferTypeName={inferTypeName} />
        {isDateBearing && stdPrinters && (
          <Zod
            name={resolver.resolveSchemaName(`${node.name} input`)}
            node={node}
            printer={stdPrinters.input}
            inferTypeName={inferred ? resolver.resolveSchemaTypeName(`${node.name} input`) : null}
          />
        )}
      </File>
    )
  },
  operation(node, ctx) {
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

    function renderSchemaEntry({
      schema,
      name,
      keysToOmit,
      direction = 'output',
    }: {
      schema: ast.SchemaNode | null
      name: string
      keysToOmit?: Array<string> | null
      direction?: 'input' | 'output'
    }) {
      if (!schema) return null

      const inferTypeName = inferred ? resolver.resolveTypeName(name) : null

      // In the input direction, refs to date-bearing components resolve to their input variant.
      const dateBearingRefNames =
        direction === 'input' && !mini
          ? new Set(
              ast.collect<string>(schema, {
                schema: (n) => (n.type === 'ref' && n.ref && containsDateRepresentation(n) ? (ast.extractRefName(n.ref) ?? undefined) : undefined),
              }),
            )
          : null
      const imports = adapter.getImports(schema, (schemaName) => ({
        name: dateBearingRefNames?.has(schemaName) ? resolver.resolveSchemaName(`${schemaName} input`) : resolver.resolveSchemaName(schemaName),
        path: resolver.resolveFile({ name: schemaName, extname: '.ts' }, { root, output, group: group ?? undefined }).path,
      }))

      const schemaPrinter = mini
        ? keysToOmit?.length
          ? printerZodMini({ guidType, wrapOutput, resolver, keysToOmit, cyclicSchemas, nodes: printer?.nodes })
          : getMiniPrinter(resolver, { guidType, wrapOutput, cyclicSchemas, nodes: printer?.nodes })
        : keysToOmit?.length
          ? printerZod({ coercion, guidType, dateType, wrapOutput, resolver, keysToOmit, cyclicSchemas, nodes: printer?.nodes, direction })
          : getStdPrinters(resolver, { coercion, guidType, dateType, wrapOutput, cyclicSchemas, nodes: printer?.nodes })[direction]

      return (
        <>
          {mode === 'split' &&
            imports.map((imp) => <File.Import key={[name, imp.path, imp.name].join('-')} root={meta.file.path} path={imp.path} name={imp.name} />)}
          <Zod name={name} node={schema} printer={schemaPrinter} inferTypeName={inferTypeName} />
        </>
      )
    }

    const paramSchemas = params.map((param) => renderSchemaEntry({ schema: param.schema, name: resolver.resolveParamName(node, param), direction: 'input' }))

    const responseSchemas = node.responses.map((res) =>
      renderSchemaEntry({
        schema: res.content?.[0]?.schema ?? null,
        name: resolver.resolveResponseStatusName(node, res.statusCode),
        keysToOmit: res.content?.[0]?.keysToOmit,
      }),
    )

    const responsesWithSchema = node.responses.filter((res) => res.content?.[0]?.schema)
    const responseUnionSchema =
      responsesWithSchema.length > 0
        ? (() => {
            const responseUnionName = resolver.resolveResponseName(node)

            // Collect all import names from response schemas to detect naming collisions.
            // When a response is a $ref to a component schema whose resolved name matches
            // the response union name, skip generation to avoid redeclaration errors.
            const importedNames = new Set(
              responsesWithSchema.flatMap((res) =>
                res.content?.[0]?.schema
                  ? adapter
                      .getImports(res.content[0].schema, (schemaName) => ({
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
          direction: 'input',
        })
      : null

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

    const transformedOperations = nodes.map((node) => {
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
