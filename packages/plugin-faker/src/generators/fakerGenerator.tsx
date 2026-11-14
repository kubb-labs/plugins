import { getCircularNames, getPerContentTypeName, resolveContentTypeVariants, resolveOperationFile, toResponseContent } from '@internals/shared'
import { jsDocEscape } from '@internals/utils'
import { aliasConflictingImports, filterUsedImports, rewriteAliasedImports } from '../utils/imports.ts'
import { ast, defineGenerator } from '@kubb/kit'
import { buildParams, enumTypeName, pluginTsName } from '@kubb/plugin-ts'
import { File, Function, jsxRenderer } from '@kubb/renderer-jsx'
import { Faker } from '../components/Faker.tsx'
import { printerFaker } from '../printers/printerFaker.ts'
import type { PluginFaker } from '../types.ts'
import {
  buildResponseUnionSchema,
  canOverrideSchema,
  dateParserName,
  localeToFakerImport,
  resolveFakerTypeUsage,
  resolveTypeReference,
  SCALAR_TYPES,
} from '../utils.ts'

type RenderUnit = {
  schema: ast.SchemaNode | null
  name: string
  typeName: string
  description?: string
  keysToOmit?: Array<string> | null
  skipImportNames?: Array<string>
  /** Factories a union unit picks one of. */
  factories?: Array<RenderUnit>
}

/**
 * Built-in generator for `@kubb/plugin-faker`. Emits one `createX` factory
 * per schema in the spec plus per-operation request/response factories. Each
 * factory returns a value matching the corresponding TypeScript type from
 * `@kubb/plugin-ts`.
 */
export const fakerGenerator = defineGenerator<PluginFaker>({
  name: 'faker',
  renderer: jsxRenderer,
  schema(node, ctx) {
    const { config, resolver, root } = ctx
    const { output, group, dateParser, regexGenerator, seed, locale, printer, typeMode } = ctx.options
    const pluginTs = ctx.requirePlugin(pluginTsName)

    if (!node.name) {
      return
    }

    const tsResolver = ctx.driver.getResolver(pluginTsName)

    const schemaName = node.name
    const isEnumSchema = !!ast.schema.narrow(node, ast.schema.types.enum)
    const schemaTypeName = enumTypeName({ resolver: tsResolver, name: schemaName, enumOptions: pluginTs.options?.enum, isEnum: isEnumSchema })
    const meta = {
      name: resolver.name(schemaName),
      file: resolver.file({ name: schemaName, extname: '.ts', root, output, group: group ?? undefined }),
      typeName: schemaTypeName,
      typeFile: tsResolver.file({
        name: schemaName,
        extname: '.ts',
        root,
        output: pluginTs.options?.output ?? output,
        group: pluginTs.options?.group ?? undefined,
      }),
    } as const
    const canOverride = canOverrideSchema(node)
    const cyclicSchemas = getCircularNames(ctx)
    const printerInstance = printerFaker({
      resolver,
      schemaName,
      typeName: meta.typeName,
      dateParser,
      regexGenerator,
      nodes: printer?.nodes,
      cyclicSchemas,
    })
    const fakerText = printerInstance.print(node) ?? 'undefined'
    const typeReference = resolveTypeReference({
      node,
      canOverride,
      name: meta.name,
      typeName: meta.typeName,
      filePath: meta.file.path,
      typeFilePath: meta.typeFile.path,
    })

    const imports = resolver.imports({ node, root, output, group: group ?? undefined, checks: true })
    const usedImports = filterUsedImports(imports, fakerText)

    return (
      <File
        baseName={meta.file.baseName}
        path={meta.file.path}
        meta={meta.file.meta}
        banner={resolver.default.banner(ctx.meta, { output, config, file: { path: meta.file.path, baseName: meta.file.baseName } })}
        footer={resolver.default.footer(ctx.meta, { output, config, file: { path: meta.file.path, baseName: meta.file.baseName } })}
      >
        <File.Import name={locale ? [{ propertyName: localeToFakerImport(locale), name: 'faker' }] : ['faker']} path="@faker-js/faker" />
        {regexGenerator === 'randexp' && <File.Import name={'RandExp'} path={'randexp'} />}
        {dateParser !== 'faker' && <File.Import path={dateParser} name={dateParserName(dateParser)} />}
        {typeReference.importPath && <File.Import isTypeOnly root={meta.file.path} path={typeReference.importPath} name={[meta.typeName]} />}
        {usedImports.map((imp) => (
          <File.Import key={[schemaName, imp.path, imp.name].join('-')} root={meta.file.path} path={imp.path} name={imp.name} />
        ))}
        {seed !== undefined ? <File.Source name="faker-seed">{`faker.seed(${JSON.stringify(seed)})`}</File.Source> : undefined}
        <Faker
          name={meta.name}
          typeName={typeReference.typeName}
          description={node.description}
          node={node}
          printer={printerInstance}
          canOverride={canOverride}
          typeMode={typeMode}
        />
      </File>
    )
  },
  operation(node, ctx) {
    const { config, resolver, root } = ctx
    const { output, group, dateParser, regexGenerator, seed, locale, printer, typeMode } = ctx.options
    const pluginTs = ctx.requirePlugin(pluginTsName)

    const tsResolver = ctx.driver.getResolver(pluginTsName)

    const { path: pathParams, query: queryParams, header: headerParams, cookie: cookieParams } = ast.http.groupParameters(node)
    const paramGroups = (
      [
        { params: pathParams, name: resolver.param.path, typeName: tsResolver.param.path },
        { params: queryParams, name: resolver.param.query, typeName: tsResolver.param.query },
        { params: headerParams, name: resolver.param.headers, typeName: tsResolver.param.headers },
        { params: cookieParams, name: resolver.param.cookies, typeName: tsResolver.param.cookies },
      ] as const
    )
      .filter((group) => group.params.length > 0)
      .map((group) => ({
        schema: buildParams({ params: group.params }),
        name: group.name(node, group.params[0]!),
        typeName: group.typeName(node, group.params[0]!),
      }))
    // Expands a content array into render units: one faker per content type plus a union faker
    // (named `baseName`) when more than one content type carries a schema, else a single faker.
    function expandContentUnits(
      entries: Array<ast.ContentNode>,
      baseName: string,
      tsBaseName: string,
      description: string | undefined,
      decorate?: (schema: ast.SchemaNode) => ast.SchemaNode,
    ): Array<RenderUnit> {
      const withSchema = entries.filter((entry) => entry.schema)
      if (withSchema.length <= 1) {
        const primary = withSchema[0] ?? entries[0]
        if (!primary?.schema) return []
        return [
          {
            schema: decorate ? decorate(primary.schema) : primary.schema,
            name: baseName,
            typeName: tsBaseName,
            description,
            keysToOmit: primary.keysToOmit,
          },
        ]
      }
      const variants = resolveContentTypeVariants(entries, baseName)
      const unionSchema = ast.factory.createSchema({
        type: 'union',
        members: variants.map((variant) => ast.factory.createSchema({ type: 'ref', name: variant.name, schema: variant.schema })),
      })
      const variantUnits = variants.map((variant) => ({
        schema: decorate ? decorate(variant.schema) : variant.schema,
        name: variant.name,
        typeName: getPerContentTypeName(tsBaseName, variant.suffix),
        description,
        keysToOmit: variant.keysToOmit,
      }))
      return [...variantUnits, { schema: unionSchema, name: baseName, typeName: tsBaseName, description, factories: variantUnits }]
    }

    const responseUnits = node.responses.flatMap((response) =>
      expandContentUnits(
        (response.content ?? []).map((entry, _, content) => toResponseContent(entry, content)),
        resolver.response.status(node, response.statusCode),
        tsResolver.response.status(node, response.statusCode),
        response.description,
      ),
    )
    const dataUnits = expandContentUnits(
      node.requestBody?.content ?? [],
      resolver.response.body(node),
      tsResolver.response.body(node),
      node.requestBody?.description,
      (schema) => ({ ...schema, description: node.requestBody?.description ?? schema.description }),
    )
    const responseName = resolver.response.response(node)
    const importedResponseNames = new Set(ast.http.responses.getImportedNames(node.responses).map((name) => resolver.name(name)))
    const hasResponseNameCollision = importedResponseNames.has(responseName)
    const localHelperNames = new Set([
      ...paramGroups.map((group) => group.name),
      ...responseUnits.map((unit) => unit.name),
      ...dataUnits.map((unit) => unit.name),
      ...(hasResponseNameCollision ? [] : [responseName]),
    ])
    const cyclicSchemas = getCircularNames(ctx)

    const meta = {
      file: resolveOperationFile({ ctx, node, resolver, root, output, group }),
      typeFile: resolveOperationFile({
        ctx,
        node,
        resolver: tsResolver,
        root,
        output: pluginTs.options?.output ?? output,
        group: pluginTs.options?.group,
      }),
    } as const

    function resolveMockImports(schema: ast.SchemaNode) {
      return resolver.imports({ node: schema, root, output, group: group ?? undefined, checks: true }).filter((entry) => entry.path !== meta.file.path)
    }

    function renderEntry({ schema, name, typeName, description, keysToOmit, skipImportNames = [], factories }: RenderUnit) {
      if (!schema) {
        return null
      }
      if (factories) {
        return renderFactoryUnion({ name, typeName, description, factories }, schema)
      }

      if (schema.type === ast.schema.types.object && keysToOmit?.length) {
        schema = { ...schema, properties: schema.properties.filter((property) => !keysToOmit?.includes(property.name)) }
        keysToOmit = undefined
      }

      const canOverride = canOverrideSchema(schema)
      const printerInstance = printerFaker({
        resolver,
        schemaName: name,
        typeName,
        dateParser,
        regexGenerator,
        nodes: printer?.nodes,
        cyclicSchemas,
        nestedInObject: !!keysToOmit?.length,
      })
      const fakerText = printerInstance.print(schema) ?? 'undefined'
      const usedImports = filterUsedImports(resolveMockImports(schema), fakerText, skipImportNames)
      const { imports, aliases } = aliasConflictingImports(usedImports, localHelperNames)
      const rewrittenFakerText = rewriteAliasedImports(fakerText, aliases)
      const typeReference = resolveTypeReference({
        node: schema,
        canOverride,
        name,
        typeName,
        filePath: meta.file.path,
        typeFilePath: meta.typeFile.path,
      })

      return (
        <>
          {typeReference.importPath && <File.Import isTypeOnly root={meta.file.path} path={typeReference.importPath} name={[typeName]} />}
          {imports.map((imp) => (
            <File.Import key={[name, imp.path, imp.name].join('-')} root={meta.file.path} path={imp.path} name={imp.name} />
          ))}
          <Faker
            name={name}
            typeName={typeReference.typeName}
            description={description}
            node={schema}
            printer={{ ...printerInstance, print: () => rewrittenFakerText }}
            canOverride={canOverride}
            typeMode={typeMode}
            keysToOmit={keysToOmit}
          />
        </>
      )
    }

    // A union of local factories, such as one per status or per content type. `data ?? arrayElement([...])` alone
    // would return a partial object override as is, without the fields the picked factory generates.
    function renderFactoryUnion(
      { name, typeName, description, factories }: Omit<RenderUnit, 'schema'> & { factories: Array<RenderUnit> },
      schema: ast.SchemaNode,
    ) {
      const reference = (unit: Pick<RenderUnit, 'name' | 'typeName'>, node: ast.SchemaNode) =>
        resolveTypeReference({ node, canOverride: true, name: unit.name, typeName: unit.typeName, filePath: meta.file.path, typeFilePath: meta.typeFile.path })
      const typeReference = reference({ name, typeName }, schema)
      // An object override merges into an object factory. Any other override (an array, a scalar) is complete, so it is returned as is.
      const objectMembers = factories.flatMap((unit) => {
        if (!unit.schema || !canOverrideSchema(unit.schema)) return []
        const target = ast.ref.getSchema(unit.schema).type
        // An unresolved ref has no known shape, so it could be an array factory that would throw on an object.
        if (target === 'ref' || target === 'array' || target === 'tuple' || SCALAR_TYPES.has(target)) return []
        return [`() => ${unit.name}(data as ${resolveFakerTypeUsage(unit.schema, reference(unit, unit.schema).typeName, true).dataType})`]
      })
      const generated = `data ?? faker.helpers.arrayElement([${factories.map((unit) => `${unit.name}()`).join(', ')}])`
      const body = objectMembers.length
        ? `typeof data === 'object' && data !== null && !Array.isArray(data) ? faker.helpers.arrayElement([${objectMembers.join(', ')}])() : ${generated}`
        : generated

      return (
        <>
          {typeReference.importPath && <File.Import isTypeOnly root={meta.file.path} path={typeReference.importPath} name={[typeName]} />}
          <File.Source name={name} isExportable isIndexable>
            <Function
              export
              name={name}
              JSDoc={{ comments: description ? [`@description ${jsDocEscape(description)}`] : [] }}
              params={`data?: Partial<${typeReference.typeName}>`}
              returnType={typeReference.typeName}
            >
              {`return (${body}) as ${typeReference.typeName}`}
            </Function>
          </File.Source>
        </>
      )
    }

    const responseUnionSchema = hasResponseNameCollision ? null : buildResponseUnionSchema(node, resolver)
    // A union of status factories, not the inline union of a single response schema.
    const statusMembers = responseUnionSchema?.type === 'union' ? (responseUnionSchema.members ?? []) : []
    const statusUnits = statusMembers.flatMap((member) => responseUnits.filter((unit) => unit.name === ast.ref.getName(member)))

    return (
      <File
        baseName={meta.file.baseName}
        path={meta.file.path}
        meta={meta.file.meta}
        banner={resolver.default.banner(ctx.meta, { output, config, file: { path: meta.file.path, baseName: meta.file.baseName } })}
        footer={resolver.default.footer(ctx.meta, { output, config, file: { path: meta.file.path, baseName: meta.file.baseName } })}
      >
        <File.Import name={locale ? [{ propertyName: localeToFakerImport(locale), name: 'faker' }] : ['faker']} path="@faker-js/faker" />
        {regexGenerator === 'randexp' && <File.Import name={'RandExp'} path={'randexp'} />}
        {dateParser !== 'faker' && <File.Import path={dateParser} name={dateParserName(dateParser)} />}
        {seed !== undefined ? <File.Source name="faker-seed">{`faker.seed(${JSON.stringify(seed)})`}</File.Source> : undefined}
        {paramGroups.map((group) => renderEntry(group))}
        {responseUnits.map((unit) => renderEntry(unit))}
        {dataUnits.map((unit) => renderEntry(unit))}
        {renderEntry({
          schema: responseUnionSchema,
          name: responseName,
          typeName: tsResolver.response.response(node),
          skipImportNames: responseUnits.map((unit) => unit.name),
          factories: statusMembers.length && statusUnits.length === statusMembers.length ? statusUnits : undefined,
        })}
      </File>
    )
  },
})
