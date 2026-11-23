import { ast } from '@internals/ast'
import {
  buildContentTypeEntries,
  buildOptionsSchema,
  buildParamRefsSchema,
  buildParamsSchema,
  buildResponseUnionSchema,
  buildResponses,
  schemaComments,
  toResponseContent,
} from '@internals/shared'
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
  kind: 'Operation',
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
        <File.Import names={[isZodImport ? { name: '*', alias: 'z', space: 'value' } : { name: 'z', space: 'value' }]} path={importPath} />
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
