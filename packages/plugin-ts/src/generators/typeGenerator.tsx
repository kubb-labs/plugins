import { caseParams, getOasAdapter, getOperationParameters, resolveContentTypeVariants } from '@internals/shared'
import { ast, defineGenerator } from 'kubb/kit'
import { File, jsxRenderer } from 'kubb/jsx'
import { Type } from '../components/Type.tsx'
import { ENUM_TYPES_WITH_KEY_SUFFIX } from '../constants.ts'
import { printerTs } from '../printers/printerTs.ts'
import type { PluginTs, ResolvedEnumOptions, ResolverTs } from '../types'
import { buildOptions, buildParams, buildResponses, buildResponseUnion, isInlineConstEnum } from '../utils.ts'

type ResolveImportNameParams = {
  schemaName: string
  enumOptions: ResolvedEnumOptions
  enumSchemaNames: Set<string>
  resolver: ResolverTs
}

/**
 * Resolves the imported type name for a referenced schema. An enum schema emitted
 * as a `const` object imports its suffixed key alias (e.g. `StatusKey`); every other
 * schema imports its plain resolved name.
 */
function resolveImportName({ schemaName, enumOptions, enumSchemaNames, resolver }: ResolveImportNameParams): string {
  if (ENUM_TYPES_WITH_KEY_SUFFIX.has(enumOptions.type) && enumOptions.typeSuffix && enumSchemaNames.has(schemaName)) {
    return resolver.enum.keyName({ name: schemaName }, enumOptions.typeSuffix)
  }
  return resolver.name(schemaName)
}

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
    const { enum: enumOptions, syntaxType, optionalType, arrayType, output, group, printer } = ctx.options
    const { adapter, config, resolver, root } = ctx

    if (!node.name) {
      return
    }
    // Build a set of schema names that are enums so the ref handler and the imports
    // name callback can use the suffixed type name (e.g. `StatusKey`) for those refs.
    const enumSchemaNames = new Set<string>(ctx.meta.enumNames)

    const imports = resolver.imports({
      node,
      meta: ctx.meta,
      root,
      output,
      group: group ?? undefined,
      name: (schemaName) => resolveImportName({ schemaName, enumOptions, enumSchemaNames, resolver }),
    })

    const enumNode = ast.narrowSchema(node, ast.schemaTypes.enum)
    // An inline `const` (single-value enum the adapter did not register) renders as a literal type,
    // so it keeps its plain name instead of the suffixed enum-key name.
    const isEnumSchema = !!enumNode && !isInlineConstEnum(enumNode, enumSchemaNames)

    const meta = {
      name: ENUM_TYPES_WITH_KEY_SUFFIX.has(enumOptions.type) && isEnumSchema ? resolver.enum.keyName(node, enumOptions.typeSuffix) : resolver.name(node.name),
      file: resolver.file({ name: node.name, extname: '.ts', root, output, group: group ?? undefined }),
    } as const

    const schemaPrinter = printerTs({
      optionalType,
      arrayType,
      enum: enumOptions,
      name: meta.name,
      syntaxType,
      description: node.description,
      resolver,
      enumSchemaNames,
      nameMapping: getOasAdapter(adapter).options.nameMapping,
      nodes: printer?.nodes,
    })

    return (
      <File
        baseName={meta.file.baseName}
        path={meta.file.path}
        meta={meta.file.meta}
        banner={resolver.default.banner(ctx.meta, { output, config, file: { path: meta.file.path, baseName: meta.file.baseName } })}
        footer={resolver.default.footer(ctx.meta, { output, config, file: { path: meta.file.path, baseName: meta.file.baseName } })}
      >
        {imports.map((imp) => (
          <File.Import key={[node.name, imp.path, imp.isTypeOnly].join('-')} root={meta.file.path} path={imp.path} name={imp.name} isTypeOnly />
        ))}
        <Type name={meta.name} node={node} enum={enumOptions} resolver={resolver} printer={schemaPrinter} />
      </File>
    )
  },
  operation(node, ctx) {
    const { enum: enumOptions, optionalType, arrayType, syntaxType, group, output, printer } = ctx.options
    const { adapter, config, resolver, root } = ctx

    const params = caseParams(node.parameters, 'camelcase')

    const meta = {
      file: resolver.file({ name: node.operationId, extname: '.ts', tag: node.tags[0] ?? 'default', path: node.path, root, output, group: group ?? undefined }),
    } as const

    // Build a set of schema names that are enums so the ref handler and the imports
    // name callback can use the suffixed type name (e.g. `StatusKey`) for those refs.
    const enumSchemaNames = new Set<string>(ctx.meta.enumNames)

    function renderSchemaType({ schema, name, keysToOmit }: { schema: ast.SchemaNode | null; name: string; keysToOmit?: Array<string> | null }) {
      if (!schema) return null

      const imports = resolver.imports({
        node: schema,
        meta: ctx.meta,
        root,
        output,
        group: group ?? undefined,
        name: (schemaName) => resolveImportName({ schemaName, enumOptions, enumSchemaNames, resolver }),
      })

      const schemaPrinter = printerTs({
        optionalType,
        arrayType,
        enum: enumOptions,
        name,
        syntaxType,
        description: schema.description,
        keysToOmit,
        resolver,
        enumSchemaNames,
        nameMapping: getOasAdapter(adapter).options.nameMapping,
        nodes: printer?.nodes,
      })

      return (
        <>
          {imports.map((imp) => (
            <File.Import key={[name, imp.path, imp.isTypeOnly].join('-')} root={meta.file.path} path={imp.path} name={imp.name} isTypeOnly />
          ))}
          <Type name={name} node={schema} enum={enumOptions} resolver={resolver} printer={schemaPrinter} />
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
      entries: Array<{ contentType: string; schema?: ast.SchemaNode | null; keysToOmit?: Array<string> | null }>,
      baseName: string,
      decorate?: (schema: ast.SchemaNode) => ast.SchemaNode,
    ) {
      const variants = resolveContentTypeVariants(entries, baseName)
      const unionSchema = ast.factory.createSchema({
        type: 'union',
        members: variants.map((variant) => ast.factory.createSchema({ type: 'ref', name: variant.name })),
      })
      return (
        <>
          {variants.map((variant) =>
            renderSchemaType({
              schema: decorate ? decorate(variant.schema) : variant.schema,
              name: variant.name,
              keysToOmit: variant.keysToOmit,
            }),
          )}
          {renderSchemaType({ schema: unionSchema, name: baseName })}
        </>
      )
    }

    const { path: pathParams, query: queryParams, header: headerParams } = getOperationParameters({ ...node, parameters: params }, { paramsCasing: 'original' })

    const paramGroupTypes = [
      pathParams.length > 0 && renderSchemaType({ schema: buildParams({ params: pathParams }), name: resolver.param.path(node, pathParams[0]!) }),
      queryParams.length > 0 && renderSchemaType({ schema: buildParams({ params: queryParams }), name: resolver.param.query(node, queryParams[0]!) }),
      headerParams.length > 0 && renderSchemaType({ schema: buildParams({ params: headerParams }), name: resolver.param.headers(node, headerParams[0]!) }),
    ]

    const requestBodyContent = node.requestBody?.content ?? []

    function buildRequestType() {
      if (requestBodyContent.length === 0) return null
      if (requestBodyContent.length === 1) {
        const entry = requestBodyContent[0]!
        if (!entry.schema) return null
        return renderSchemaType({
          schema: {
            ...entry.schema,
            description: node.requestBody!.description ?? entry.schema.description,
          },
          name: resolver.response.body(node),
          keysToOmit: entry.keysToOmit,
        })
      }
      // Multiple content types — generate individual types + union alias
      return buildContentTypeVariants(requestBodyContent, resolver.response.body(node), (schema) => ({
        ...schema,
        description: node.requestBody!.description ?? schema.description,
      }))
    }

    const requestType = buildRequestType()

    const responseTypes = node.responses.map((res) => {
      const variants = (res.content ?? []).filter((entry) => entry.schema)
      // Multiple content types for a single status code — generate per-variant types + a plain union.
      // The `<Name>Responses` record discriminates them by content type (see buildResponses).
      if (variants.length > 1) {
        return buildContentTypeVariants(variants, resolver.response.status(node, res.statusCode))
      }
      const primary = variants[0] ?? res.content?.[0]
      return renderSchemaType({
        schema: primary?.schema ?? null,
        name: resolver.response.status(node, res.statusCode),
        keysToOmit: primary?.keysToOmit,
      })
    })

    const optionsType = renderSchemaType({
      schema: buildOptions({ ...node, parameters: params }, { resolver }),
      name: resolver.response.options(node),
    })

    const responsesType = renderSchemaType({
      schema: buildResponses(node, { resolver }),
      name: resolver.response.responses(node),
    })

    function buildResponseType() {
      const hasSchema = (res: ast.ResponseNode) => (res.content ?? []).some((entry) => entry.schema)
      if (!node.responses.some(hasSchema)) {
        return null
      }

      const responseName = resolver.response.response(node)

      const responsesWithSchema = node.responses.filter(hasSchema)
      const importedNames = new Set(
        responsesWithSchema.flatMap((res) =>
          (res.content ?? []).flatMap((entry) =>
            entry.schema
              ? resolver
                  .imports({
                    node: entry.schema,
                    meta: ctx.meta,
                    root,
                    output,
                    group: group ?? undefined,
                    name: (schemaName) => resolveImportName({ schemaName, enumOptions, enumSchemaNames, resolver }),
                  })
                  .flatMap((imp) => (Array.isArray(imp.name) ? imp.name : [imp.name]))
              : [],
          ),
        ),
      )

      if (importedNames.has(responseName)) {
        return null
      }

      return renderSchemaType({
        schema: {
          ...buildResponseUnion(node, { resolver })!,
          description: 'Union of all possible responses',
        },
        name: responseName,
      })
    }

    const responseType = buildResponseType()

    return (
      <File
        baseName={meta.file.baseName}
        path={meta.file.path}
        meta={meta.file.meta}
        banner={resolver.default.banner(ctx.meta, { output, config, file: { path: meta.file.path, baseName: meta.file.baseName } })}
        footer={resolver.default.footer(ctx.meta, { output, config, file: { path: meta.file.path, baseName: meta.file.baseName } })}
      >
        {paramGroupTypes}
        {responseTypes}
        {requestType}
        {optionsType}
        {responsesType}
        {responseType}
      </File>
    )
  },
})
