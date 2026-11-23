import { ast } from '@internals/ast'
import { buildOptionsSchema, buildResponses, getEnumNames, resolveContentTypeVariants, toResponseContent, typeNames } from '@internals/shared'
import { defineGenerator } from '@kubb/kit'
import { File, jsxRenderer } from '@kubb/renderer-jsx'
import { Type } from '../components/Type.tsx'
import type { PluginTs } from '../types'
import { buildParams, buildResponseComments, enumTypeName, getExampleValues, isInlineConstEnum, resolveInlineEnumNames } from '../utils.ts'

/**
 * Built-in generator for `@kubb/plugin-ts`. Emits one TypeScript file per
 * schema in the spec plus per-operation request, response, and parameter
 * types. Drop-replace with a custom `Generator<PluginTs>` to change how
 * TypeScript output is produced.
 */
export const typeGenerator = defineGenerator<PluginTs>({
  name: 'typescript',
  renderer: jsxRenderer,
  schema(node, ctx) {
    const { enum: enumOptions, output, group } = ctx.options
    const { resolver, root } = ctx

    if (enumOptions.type !== 'inlineLiteral') node = resolveInlineEnumNames({ node, owner: node.name ?? '', resolver, enumOptions })
    if (!node.name) {
      return
    }
    // Enum schema names, so the ref handler and the imports
    // name callback can use the suffixed type name (e.g. `StatusKey`) for those refs.
    const enumSchemaNames = getEnumNames()
    const importName = (schemaName: string) => enumTypeName({ resolver, name: schemaName, enumOptions, isEnum: enumSchemaNames.has(schemaName) })

    const imports = resolver.imports({ node, root, output, group: group ?? undefined, name: importName })

    const enumNode = ast.schema.narrow(node, ast.schema.types.enum)
    // An inline `const` (single-value enum the adapter did not register) renders as a literal type,
    // so it keeps its plain name instead of the suffixed enum-key name.
    const isEnumSchema = !!enumNode && !isInlineConstEnum(enumNode, enumSchemaNames)

    const meta = {
      name: enumOptions.type === 'asConst' && isEnumSchema ? resolver.enum.keyName(node, enumOptions.typeSuffix) : resolver.name(node.name),
      file: ctx.file(node),
    } as const

    const schemaPrinter = ctx.printer.with({ name: meta.name, description: node.description })

    return (
      <File {...meta.file}>
        {imports.map((imp) => (
          <File.Import key={[node.name, imp.path].join('-')} names={typeNames(imp)} root={meta.file.path} path={imp.path} />
        ))}
        <Type name={meta.name} node={node} enum={enumOptions} resolver={resolver} printer={schemaPrinter} />
      </File>
    )
  },
  operation(node, ctx) {
    const { enum: enumOptions, group, output, operations } = ctx.options
    const { resolver, root } = ctx
    const inline = operations === 'inline'

    const meta = {
      file: ctx.file(node),
    } as const

    // Enum schema names, so the ref handler and the imports
    // name callback can use the suffixed type name (e.g. `StatusKey`) for those refs.
    const enumSchemaNames = getEnumNames()
    const importName = (schemaName: string) => enumTypeName({ resolver, name: schemaName, enumOptions, isEnum: enumSchemaNames.has(schemaName) })
    const inlinePrinter = inline ? ctx.printer : null

    function renderSchemaType({
      schema,
      name,
      keysToOmit,
      examples,
      comments,
    }: {
      schema: ast.SchemaNode | null
      name: string
      keysToOmit?: Array<string> | null
      examples?: Array<ast.ExampleNode>
      comments?: Array<string>
    }) {
      if (!schema) return null
      if (!inline && enumOptions.type !== 'inlineLiteral') schema = resolveInlineEnumNames({ node: schema, owner: node.operationId, resolver, enumOptions })

      const imports = resolver.imports({ node: schema, root, output, group: group ?? undefined, name: importName })

      const schemaPrinter = ctx.printer.with({ name, description: schema.description, examples: getExampleValues(examples, true), comments, keysToOmit })

      return (
        <>
          {imports.map((imp) => (
            <File.Import key={[name, imp.path].join('-')} names={typeNames(imp)} root={meta.file.path} path={imp.path} />
          ))}
          <Type name={name} node={schema} enum={enumOptions} resolver={resolver} printer={schemaPrinter} inline={inline} />
        </>
      )
    }

    /**
     * Emits an individual type per content type plus a plain union alias under `baseName`. Shared by
     * the request body and multi-content-type responses. The response record discriminates these
     * variants by content type in {@link buildResponses}; the standalone alias stays a plain union so
     * query hooks and `result.data` keep the bare body.
     */
    function buildContentTypeVariants(
      entries: Array<{ contentType: string; schema?: ast.SchemaNode | null; keysToOmit?: Array<string> | null; examples?: Array<ast.ExampleNode> }>,
      baseName: string,
      pointer: string | undefined,
      { decorate, comments }: { decorate?: (schema: ast.SchemaNode) => ast.SchemaNode; comments?: Array<string> },
    ) {
      const variants = resolveContentTypeVariants(entries, baseName)
      // Inline, content types that print the same type would repeat it in the union (`Order | Order`).
      const keys = variants.map((variant) => (inlinePrinter ? `${inlinePrinter.print(variant.schema)}:${variant.keysToOmit ?? ''}` : variant.name))
      const members = variants.filter((_, index) => keys.indexOf(keys[index]!) === index)
      const unionSchema = ast.factory.createSchema({
        type: 'union',
        pointer,
        members: members.map((variant) => ast.factory.createSchema({ type: 'ref', name: variant.name })),
      })
      return (
        <>
          {variants.map((variant) =>
            renderSchemaType({
              schema: decorate ? decorate(variant.schema) : variant.schema,
              name: variant.name,
              keysToOmit: variant.keysToOmit,
              examples: entries.find((entry) => entry.contentType === variant.contentType)?.examples,
            }),
          )}
          {renderSchemaType({ schema: unionSchema, name: baseName, comments })}
        </>
      )
    }

    const { path, query, header, cookie } = ast.http.groupParameters(node)

    const paramGroupTypes = (
      [
        [path, resolver.param.path],
        [query, resolver.param.query],
        [header, resolver.param.headers],
        [cookie, resolver.param.cookies],
      ] as const
    ).map(
      ([params, resolveName]) =>
        params.length > 0 &&
        renderSchemaType({ schema: buildParams({ params, serializedExamples: true }), name: resolveName.call(resolver.param, node, params[0]!) }),
    )

    const requestBodyContent = node.requestBody?.content ?? []

    function buildRequestType() {
      if (requestBodyContent.length === 0) return null
      if (requestBodyContent.length === 1) {
        const entry = requestBodyContent[0]!
        if (!entry.schema) return null
        return renderSchemaType({
          schema: {
            ...entry.schema,
            pointer: node.requestBody!.pointer ?? entry.schema.pointer,
            description: node.requestBody!.description ?? entry.schema.description,
          },
          name: resolver.response.body(node),
          keysToOmit: entry.keysToOmit,
          examples: entry.examples,
        })
      }
      // Multiple content types — generate individual types + union alias
      return buildContentTypeVariants(requestBodyContent, resolver.response.body(node), node.requestBody!.pointer, {
        decorate: (schema) => ({ ...schema, description: node.requestBody!.description ?? schema.description }),
      })
    }

    const requestType = buildRequestType()

    const responseTypes = node.responses.map((res) => {
      const content = (res.content ?? []).map((entry, _, content) => toResponseContent(entry, content))
      const variants = content.filter((entry) => entry.schema)
      // Multiple content types for a single status code — generate per-variant types + a plain union.
      // The `<Name>Responses` record discriminates them by content type (see buildResponses).
      if (variants.length > 1) {
        return buildContentTypeVariants(variants, resolver.response.status(node, res.statusCode), res.pointer, { comments: buildResponseComments(res) })
      }
      const primary = variants[0] ?? content[0]
      return renderSchemaType({
        schema: primary?.schema ? { ...primary.schema, pointer: res.pointer ?? primary.schema.pointer } : ast.factory.createSchema({ type: 'unknown' }),
        name: resolver.response.status(node, res.statusCode),
        keysToOmit: primary?.keysToOmit,
        examples: primary?.examples,
        comments: buildResponseComments(res),
      })
    })

    const responseHeaderTypes = node.responses.map((res) =>
      res.headers?.length
        ? renderSchemaType({ schema: buildParams({ params: res.headers, serializedExamples: true }), name: resolver.response.headers(node, res.statusCode) })
        : null,
    )

    const optionsType = renderSchemaType({
      schema: buildOptionsSchema(node, resolver, { pairContentTypes: true }),
      name: resolver.response.options(node),
    })

    const responsesType = renderSchemaType({
      // A stream variant next to another content type comes back as the unread body, as the client's `SuccessVariant` types it.
      schema: buildResponses(node, resolver, { streamData: ast.factory.createSchema({ type: 'ref', name: 'ReadableStream<Uint8Array>' }) }),
      name: resolver.response.responses(node),
    })

    function buildResponseType() {
      const hasSchema = (res: ast.ResponseNode) => (res.content ?? []).some((entry) => entry.schema)
      const responseName = resolver.response.response(node)

      const responsesWithSchema = node.responses.filter(hasSchema)
      const importedNames = new Set(ast.http.responses.getImportedNames(responsesWithSchema).map(importName))

      if (importedNames.has(responseName)) {
        return null
      }

      return renderSchemaType({
        schema: {
          ...(ast.http.responses.getUnion(node, resolver) ?? ast.factory.createSchema({ type: 'unknown' })),
          description: 'Union of all possible responses',
        },
        name: responseName,
      })
    }

    const responseType = buildResponseType()

    return (
      <File {...meta.file} inline={inline}>
        {paramGroupTypes}
        {responseTypes}
        {responseHeaderTypes}
        {requestType}
        {optionsType}
        {responsesType}
        {responseType}
      </File>
    )
  },
})
