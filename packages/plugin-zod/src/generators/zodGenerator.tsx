import { ast } from '@internals/ast'
import {
  buildContentTypeEntries,
  buildOptionsSchema,
  buildParamRefsSchema,
  buildParamsSchema,
  buildResponseUnionSchema,
  buildResponses,
  getCircularNames,
  getOasAdapter,
  schemaComments,
  toResponseContent,
} from '@internals/shared'
import { defineGenerator, type PrinterFactory } from '@kubb/kit'
import { File, jsxRenderer } from '@kubb/renderer-jsx'
import { Zod } from '../components/Zod.tsx'
import { collectDirectionalRefNames, containsDirectionalNode, printerZod } from '../printers/printerZod.ts'
import type { PrinterZodOptions } from '../printers/printerZod.ts'
import { printerZodMini } from '../printers/printerZodMini.ts'
import type { PrinterZodMiniOptions } from '../printers/printerZodMini.ts'
import type { PluginZod } from '../types'

/**
 * The helper an inferred alias is printed with. `'codec'` reads a request (encode) schema from its
 * input and a response (decode) schema from its output; `true` keeps `z.infer` for both.
 */
function aliasKind(inferred: PluginZod['resolvedOptions']['inferred'], direction: 'encode' | 'decode'): 'infer' | 'input' | 'output' {
  if (inferred !== 'codec') return 'infer'
  return direction === 'encode' ? 'input' : 'output'
}

/**
 * The `setPrinter` factory of `@kubb/plugin-zod`: `printerZod`, or `printerZodMini` with `mini: true`.
 * Generators pass `direction` and `keysToOmit` per node through `printer.with(...)`.
 */
export const createPrinterZod: PrinterFactory<PluginZod> = (ctx) => {
  const { coercion, guidType, regexType, oneOfType, mini, printer } = ctx.options
  const options: PrinterZodOptions = {
    coercion,
    guidType,
    regexType,
    oneOfType,
    dateType: getOasAdapter(ctx.adapter).options.dateType,
    resolver: ctx.resolver,
    // A `printer.nodes` override can print differently per call, so its lookups are not cached.
    directionalCache: printer?.nodes ? undefined : new WeakMap(),
    cyclicSchemas: getCircularNames(),
    nodes: printer?.nodes,
  }
  return mini ? printerZodMini(options as PrinterZodMiniOptions) : printerZod(options)
}

/**
 * Built-in generator for `@kubb/plugin-zod`. Emits one Zod schema per
 * schema in the spec plus per-operation request/response/parameter schemas.
 * When `mini: true`, schemas use the Zod Mini functional API instead of
 * chainable methods.
 */
export const zodGenerator = defineGenerator<PluginZod>({
  name: 'zod',
  renderer: jsxRenderer,
  schema(node, ctx) {
    const { output, compile, mini, inferred, typeGuards, importPath, group } = ctx.options

    if (!node.name) {
      return
    }

    const isZodImport = importPath === 'zod' || importPath === 'zod/mini'
    const printerOptions = ctx.printer.options as PrinterZodOptions
    const cyclicSchemas = getCircularNames()

    // Rendered twice: the canonical schema decodes, the `${name}InputSchema` variant encodes.
    const hasDirectionalNode = containsDirectionalNode({ node, printerOptions, mini })

    const directionalRefNames = new Set(hasDirectionalNode ? collectDirectionalRefNames({ node, printerOptions, mini }) : [])
    const importEntries = ctx.resolver.imports({ node, root: ctx.root, output, group: group ?? undefined, checks: true })
    const zod = ctx.from().resolver
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
        <File.Import name={isZodImport ? 'z' : ['z']} path={importPath} isNameSpace={isZodImport} />
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
  operation(node, ctx) {
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
            <File.Import key={[name, imp.path, imp.name].join('-')} root={meta.file.path} path={imp.path} name={imp.name} />
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

    // Several content types for one name: one schema per content type, then the union of them.
    const renderContentTypeVariants = (
      entries: Parameters<typeof buildContentTypeEntries>[0],
      baseName: string,
      decorate?: (schema: ast.SchemaNode) => ast.SchemaNode,
      direction?: 'encode' | 'decode',
    ) => <>{buildContentTypeEntries(entries, baseName, decorate).map((entry) => renderSchemaEntry({ ...entry, direction }))}</>
    const renderResponseUnion = (responses: Array<ast.ResponseNode>, name: string, fallbackUnknown: boolean) =>
      renderSchemaEntry({ schema: buildResponseUnionSchema({ node, responses, name, resolver: ctx.resolver, fallbackUnknown }), name })

    const paramSchemas = node.parameters.map((param) =>
      renderSchemaEntry({ schema: param.schema, name: ctx.resolver.param.name(node, param), direction: 'encode' }),
    )

    const responseSchemas = node.responses.map((res) => {
      const content = (res.content ?? []).map((entry, _, content) => toResponseContent(entry, content))
      const variants = content.filter((entry) => entry.schema)
      if (variants.length > 1) {
        return renderContentTypeVariants(content, ctx.resolver.response.status(node, res.statusCode))
      }
      const primary = variants[0] ?? content[0]
      return renderSchemaEntry({
        schema: primary?.schema ?? null,
        name: ctx.resolver.response.status(node, res.statusCode),
        keysToOmit: primary?.keysToOmit,
      })
    })

    const responseHeaderSchemas = node.responses.map((res) =>
      res.headers?.length ? renderSchemaEntry({ schema: buildParamsSchema(res.headers), name: ctx.resolver.response.headers(node, res.statusCode) }) : null,
    )

    const responsesWithSchema = node.responses.filter((res) => res.content?.some((entry) => entry.schema))
    // Validate success (2xx) bodies only. Error bodies are surfaced unparsed, typed by plugin-ts (#369).
    const successResponsesWithSchema = responsesWithSchema.filter((res) => ast.http.status.isSuccess(res))
    const responseUnionSchema =
      responsesWithSchema.length > 0 ? renderResponseUnion(successResponsesWithSchema, ctx.resolver.response.response(node), true) : null

    // Validate error bodies on the non-throw path. Mirrors the success union but selects every
    // non-2xx response (including the OpenAPI `default`) so it lines up with plugin-ts `ErrorOf` (#369).
    const errorResponsesWithSchema = responsesWithSchema.filter((res) => !ast.http.status.isSuccess(res))
    const errorUnionSchema =
      errorResponsesWithSchema.length > 0 ? renderResponseUnion(errorResponsesWithSchema, ctx.resolver.response.error(node), false) : null

    const requestBodyContent = node.requestBody?.content ?? []
    const requestSchema = (() => {
      if (requestBodyContent.length === 0) return null
      if (requestBodyContent.length === 1) {
        const entry = requestBodyContent[0]!
        if (!entry.schema) return null
        return renderSchemaEntry({
          schema: { ...entry.schema, description: node.requestBody!.description ?? entry.schema.description },
          name: ctx.resolver.response.body(node),
          keysToOmit: entry.keysToOmit,
          direction: 'encode',
        })
      }
      return renderContentTypeVariants(
        requestBodyContent,
        ctx.resolver.response.body(node),
        (schema) => ({
          ...schema,
          description: node.requestBody!.description ?? schema.description,
        }),
        'encode',
      )
    })()

    // Grouped path/query/headers/cookies schemas, one object per group: what a client's `validator.path` /
    // `query` / `headers` runs at request time, and what the options schema below references.
    const { path, query, header, cookie } = ast.http.groupParameters(node)

    const paramGroupSchemas = (
      [
        { kind: 'path', params: path },
        { kind: 'query', params: query },
        { kind: 'headers', params: header },
        { kind: 'cookies', params: cookie },
      ] as const
    )
      .filter(({ params }) => params.length > 0)
      .map(({ kind, params }) =>
        renderSchemaEntry({
          schema: buildParamRefsSchema({ node, params, resolver: ctx.resolver }),
          name: ctx.resolver.param[kind](node, params[0]!),
          direction: 'encode',
        }),
      )

    // The combined `{ body, path, query, headers }` options and per-status `responses` schemas exist
    // only to back `resolver.response.options(node)` and `resolver.response.responses(node)` for
    // consumers sourcing types from this plugin instead of `plugin-ts`. Not worth generating when
    // nothing will import them.
    const optionsSchema = inferred
      ? renderSchemaEntry({ schema: buildOptionsSchema(node, ctx.resolver), name: ctx.resolver.name(`${node.operationId} Options`), direction: 'encode' })
      : null

    // The per-status record a client's `RequestResult` is keyed on. Response bodies, so `output`.
    const responsesSchema = inferred ? renderSchemaEntry({ schema: buildResponses(node, ctx.resolver), name: ctx.resolver.response.responses(node) }) : null

    return (
      <File {...meta.file}>
        <File.Import name={isZodImport ? 'z' : ['z']} path={importPath} isNameSpace={isZodImport} />
        {paramSchemas}
        {responseSchemas}
        {responseHeaderSchemas}
        {responseUnionSchema}
        {errorUnionSchema}
        {requestSchema}
        {paramGroupSchemas}
        {optionsSchema}
        {responsesSchema}
      </File>
    )
  },
})
