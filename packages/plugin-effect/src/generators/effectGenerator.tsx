import { caseParams, collectRefNames, getSuccessResponses, isSuccessStatusCode, resolveContentTypeVariants } from '@internals/shared'
import { ast, defineGenerator } from 'kubb/kit'
import { File, jsxRenderer } from 'kubb/jsx'
import { EffectSchema } from '../components/EffectSchema.tsx'
import { printerEffect } from '../printers/printerEffect.ts'
import type { PluginEffect } from '../types.ts'

type ResponseUnionOptions = {
  responses: Array<ast.ResponseNode>
  name: string
  fallbackUnknown: boolean
}

function needsSchemaGetter(node: ast.SchemaNode): boolean {
  return ast
    .collect<boolean>(node, {
      schema(schema) {
        return schema.type === 'date' && schema.representation === 'date' && schema.format === 'date' ? true : undefined
      },
    })
    .some(Boolean)
}

function needsDateTime(node: ast.SchemaNode): boolean {
  return ast
    .collect<boolean>(node, {
      schema(schema) {
        return schema.type === 'date' && schema.representation === 'date' && schema.format !== 'date' ? true : undefined
      },
    })
    .some(Boolean)
}

/**
 * Built-in generator for `@kubb/plugin-effect`.
 */
export const effectGenerator = defineGenerator<PluginEffect>({
  name: 'effect',
  renderer: jsxRenderer,
  schema(node, ctx) {
    if (!node.name) return

    const { config, resolver, root } = ctx
    const { output, importPath, group, regexType, printer } = ctx.options
    const cyclicSchemas = new Set(ctx.meta.circularNames)
    const name = resolver.name(node.name)
    const file = resolver.file({ name: node.name, extname: '.ts', root, output, group: group ?? undefined })
    const schemaPrinter = printerEffect({
      resolver,
      regexType,
      cyclicSchemas,
      currentSchemaName: name,
      nodes: printer?.nodes,
    })
    const imports = resolver.imports({ node, root, output, group: group ?? undefined })

    return (
      <File
        baseName={file.baseName}
        path={file.path}
        meta={file.meta}
        banner={resolver.default.banner(ctx.meta, { output, config, file: { path: file.path, baseName: file.baseName } })}
        footer={resolver.default.footer(ctx.meta, { output, config, file: { path: file.path, baseName: file.baseName } })}
      >
        <File.Import name="Schema" path={importPath} isNameSpace />
        {needsDateTime(node) && <File.Import name="DateTime" path="effect/DateTime" isNameSpace />}
        {needsSchemaGetter(node) && <File.Import name="SchemaGetter" path="effect/SchemaGetter" isNameSpace />}
        {imports.map((entry) => (
          <File.Import key={[node.name, entry.path, entry.name].join('-')} root={file.path} path={entry.path} name={entry.name} />
        ))}
        <EffectSchema name={name} node={node} printer={schemaPrinter} cyclic={cyclicSchemas.has(node.name)} />
      </File>
    )
  },
  operation(node, ctx) {
    if (!ast.isHttpOperationNode(node)) return null

    const { config, resolver, root } = ctx
    const { output, importPath, group, regexType, printer } = ctx.options
    const file = resolver.file({
      name: node.operationId,
      extname: '.ts',
      tag: node.tags[0] ?? 'default',
      path: node.path,
      root,
      output,
      group: group ?? undefined,
    })
    const cyclicSchemas = new Set(ctx.meta.circularNames)
    let usesSchemaGetter = false
    let usesDateTime = false
    let usesStruct = false

    function renderSchema({ schema, name, keysToOmit }: { schema: ast.SchemaNode | null; name: string; keysToOmit?: Array<string> | null }) {
      if (!schema) return null
      usesSchemaGetter ||= needsSchemaGetter(schema)
      usesDateTime ||= needsDateTime(schema)
      usesStruct ||= !!keysToOmit?.length
      const imports = resolver.imports({ node: schema, root, output, group: group ?? undefined })
      const schemaPrinter = printerEffect({
        resolver,
        regexType,
        keysToOmit,
        cyclicSchemas,
        currentSchemaName: name,
        nodes: printer?.nodes,
      })

      return (
        <>
          {imports.map((entry) => (
            <File.Import key={[name, entry.path, entry.name].join('-')} root={file.path} path={entry.path} name={entry.name} />
          ))}
          <EffectSchema name={name} node={schema} printer={schemaPrinter} />
        </>
      )
    }

    function renderContentVariants(
      entries: Array<{ contentType: string; schema?: ast.SchemaNode | null; keysToOmit?: Array<string> | null }>,
      baseName: string,
      decorate?: (schema: ast.SchemaNode) => ast.SchemaNode,
    ) {
      const variants = resolveContentTypeVariants(entries, baseName)
      const union = ast.factory.createSchema({
        type: 'union',
        members: variants.map((variant) => ast.factory.createSchema({ type: 'ref', name: variant.name })),
      })
      return (
        <>
          {variants.map((variant) =>
            renderSchema({
              schema: decorate ? decorate(variant.schema) : variant.schema,
              name: variant.name,
              keysToOmit: variant.keysToOmit,
            }),
          )}
          {renderSchema({ schema: union, name: baseName })}
        </>
      )
    }

    function renderResponseUnion({ responses, name, fallbackUnknown }: ResponseUnionOptions) {
      const importedNames = new Set(
        responses.flatMap((response) =>
          (response.content ?? []).flatMap((entry) => (entry.schema ? collectRefNames(entry.schema).map((refName) => resolver.name(refName)) : [])),
        ),
      )
      if (importedNames.has(name)) return null

      const members = responses.map((response) => ast.factory.createSchema({ type: 'ref', name: resolver.response.status(node, response.statusCode) }))
      if (fallbackUnknown && members.length === 0) return renderSchema({ schema: ast.factory.createSchema({ type: 'unknown' }), name })
      if (!members.length) return null
      return renderSchema({ schema: members.length === 1 ? members[0]! : ast.factory.createSchema({ type: 'union', members }), name })
    }

    const params = caseParams(node.parameters, 'camelcase').map((param) => renderSchema({ schema: param.schema, name: resolver.param.name(node, param) }))
    const responses = node.responses.map((response) => {
      const variants = (response.content ?? []).filter((entry) => entry.schema)
      if (variants.length > 1) return renderContentVariants(response.content!, resolver.response.status(node, response.statusCode))
      const primary = variants[0] ?? response.content?.[0]
      return renderSchema({
        schema: primary?.schema ?? null,
        name: resolver.response.status(node, response.statusCode),
        keysToOmit: primary?.keysToOmit,
      })
    })
    const responsesWithSchema = node.responses.filter((response) => response.content?.some((entry) => entry.schema))
    const successUnion =
      responsesWithSchema.length > 0
        ? renderResponseUnion({ responses: getSuccessResponses(responsesWithSchema), name: resolver.response.response(node), fallbackUnknown: true })
        : null
    const errorResponses = responsesWithSchema.filter((response) => !isSuccessStatusCode(response.statusCode))
    const errorUnion =
      errorResponses.length > 0 ? renderResponseUnion({ responses: errorResponses, name: resolver.response.error(node), fallbackUnknown: false }) : null
    const requestContent = node.requestBody?.content ?? []
    const requestBody = (() => {
      if (!requestContent.length) return null
      if (requestContent.length === 1) {
        const entry = requestContent[0]!
        if (!entry.schema) return null
        return renderSchema({
          schema: { ...entry.schema, description: node.requestBody!.description ?? entry.schema.description },
          name: resolver.response.body(node),
          keysToOmit: entry.keysToOmit,
        })
      }
      return renderContentVariants(requestContent, resolver.response.body(node), (schema) => ({
        ...schema,
        description: node.requestBody!.description ?? schema.description,
      }))
    })()

    return (
      <File
        baseName={file.baseName}
        path={file.path}
        meta={file.meta}
        banner={resolver.default.banner(ctx.meta, { output, config, file: { path: file.path, baseName: file.baseName } })}
        footer={resolver.default.footer(ctx.meta, { output, config, file: { path: file.path, baseName: file.baseName } })}
      >
        <File.Import name="Schema" path={importPath} isNameSpace />
        {usesDateTime && <File.Import name="DateTime" path="effect/DateTime" isNameSpace />}
        {usesSchemaGetter && <File.Import name="SchemaGetter" path="effect/SchemaGetter" isNameSpace />}
        {usesStruct && <File.Import name="Struct" path="effect/Struct" isNameSpace />}
        {params}
        {responses}
        {successUnion}
        {errorUnion}
        {requestBody}
      </File>
    )
  },
})
