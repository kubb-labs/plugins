import { ast, defineGenerator } from '@kubb/core'
import { pluginTsName, type PluginTs } from '@kubb/plugin-ts'
import { File, jsxRenderer } from '@kubb/renderer-jsx'
import { Faker } from '../components/Faker.tsx'
import { printerFaker } from '../printers/printerFaker.ts'
import type { PluginFaker } from '../types.ts'
import { buildGroupedParamsSchema, buildLegacyResponseUnionSchema, canOverrideSchema } from '../utils.ts'

export const fakerGeneratorLegacy = defineGenerator<PluginFaker>({
  name: 'faker-legacy',
  renderer: jsxRenderer,
  schema(node, ctx) {
    const { adapter, config, resolver, root } = ctx
    const { output, group, dateParser, regexGenerator, mapper, seed, printer } = ctx.options
    const pluginTs = ctx.driver.getPlugin<PluginTs>(pluginTsName)

    if (!node.name || !pluginTs?.resolver) {
      return
    }

    const mode = ctx.getMode(output)
    const meta = {
      name: resolver.resolveName(node.name),
      file: resolver.resolveFile({ name: node.name, extname: '.ts' }, { root, output, group }),
      typeName: pluginTs.resolver.resolveTypeName(node.name),
      typeFile: pluginTs.resolver.resolveFile({ name: node.name, extname: '.ts' }, { root, output: pluginTs.options.output, group: pluginTs.options.group }),
    } as const

    const imports = adapter
      .getImports(node, (schemaName) => ({
        name: resolver.resolveName(schemaName),
        path: resolver.resolveFile({ name: schemaName, extname: '.ts' }, { root, output, group }).path,
      }))
      .filter((entry) => entry.path !== meta.file.path)

    return (
      <File
        baseName={meta.file.baseName}
        path={meta.file.path}
        meta={meta.file.meta}
        banner={resolver.resolveBanner(adapter.inputNode, { output, config })}
        footer={resolver.resolveFooter(adapter.inputNode, { output, config })}
      >
        <File.Import name={['faker']} path="@faker-js/faker" />
        {regexGenerator === 'randexp' && <File.Import name={'RandExp'} path={'randexp'} />}
        {dateParser !== 'faker' && <File.Import path={dateParser} name={dateParser} />}
        <File.Import isTypeOnly root={meta.file.path} path={meta.typeFile.path} name={[meta.typeName]} />
        {mode === 'split' &&
          imports.map((imp) => <File.Import key={[node.name, imp.path, imp.name].join('-')} root={meta.file.path} path={imp.path} name={imp.name} />)}
        <Faker
          name={meta.name}
          typeName={meta.typeName}
          description={node.description}
          node={node}
          printer={printerFaker({
            resolver,
            schemaName: node.name,
            typeName: meta.typeName,
            dateParser,
            regexGenerator,
            mapper,
            nodes: printer?.nodes,
          })}
          seed={seed}
          canOverride={canOverrideSchema(node)}
        />
      </File>
    )
  },
  operation(node, ctx) {
    const { adapter, config, resolver, root } = ctx
    const { output, group, paramsCasing, dateParser, regexGenerator, mapper, seed, printer } = ctx.options
    const pluginTs = ctx.driver.getPlugin<PluginTs>(pluginTsName)

    if (!pluginTs?.resolver) {
      return
    }

    const params = ast.caseParams(node.parameters, paramsCasing)
    const pathParams = params.filter((param) => param.in === 'path')
    const queryParams = params.filter((param) => param.in === 'query')
    const headerParams = params.filter((param) => param.in === 'header')
    const meta = {
      file: resolver.resolveFile({ name: node.operationId, extname: '.ts', tag: node.tags[0] ?? 'default', path: node.path }, { root, output, group }),
      typeFile: pluginTs.resolver.resolveFile(
        {
          name: node.operationId,
          extname: '.ts',
          tag: node.tags[0] ?? 'default',
          path: node.path,
        },
        {
          root,
          output: pluginTs.options.output,
          group: pluginTs.options.group,
        },
      ),
    } as const

    function resolveMockImports(schema: ast.SchemaNode) {
      return adapter
        .getImports(schema, (schemaName) => ({
          name: resolver.resolveName(schemaName),
          path: resolver.resolveFile({ name: schemaName, extname: '.ts' }, { root, output, group }).path,
        }))
        .filter((entry) => entry.path !== meta.file.path)
    }

    function renderEntry({
      schema,
      name,
      typeName,
      description,
      skipImportNames = [],
    }: {
      schema: ast.SchemaNode | null
      name: string
      typeName: string
      description?: string
      skipImportNames?: Array<string>
    }) {
      if (!schema) {
        return null
      }

      const imports = resolveMockImports(schema).filter((entry) => (typeof entry.name === 'string' ? !skipImportNames.includes(entry.name) : true))

      return (
        <>
          <File.Import isTypeOnly root={meta.file.path} path={meta.typeFile.path} name={[typeName]} />
          {imports.map((imp) => (
            <File.Import key={[name, imp.path, imp.name].join('-')} root={meta.file.path} path={imp.path} name={imp.name} />
          ))}
          <Faker
            name={name}
            typeName={typeName}
            description={description}
            node={schema}
            printer={printerFaker({
              resolver,
              schemaName: name,
              typeName,
              dateParser,
              regexGenerator,
              mapper,
              nodes: printer?.nodes,
            })}
            seed={seed}
            canOverride={canOverrideSchema(schema)}
          />
        </>
      )
    }

    return (
      <File
        baseName={meta.file.baseName}
        path={meta.file.path}
        meta={meta.file.meta}
        banner={resolver.resolveBanner(adapter.inputNode, { output, config })}
        footer={resolver.resolveFooter(adapter.inputNode, { output, config })}
      >
        <File.Import name={['faker']} path="@faker-js/faker" />
        {regexGenerator === 'randexp' && <File.Import name={'RandExp'} path={'randexp'} />}
        {dateParser !== 'faker' && <File.Import path={dateParser} name={dateParser} />}
        {pathParams[0] &&
          renderEntry({
            schema: buildGroupedParamsSchema(pathParams),
            name: resolver.resolvePathParamsName(node, pathParams[0]),
            typeName: pluginTs.resolver.resolvePathParamsName(node, pathParams[0]),
          })}
        {queryParams[0] &&
          renderEntry({
            schema: buildGroupedParamsSchema(queryParams),
            name: resolver.resolveQueryParamsName(node, queryParams[0]),
            typeName: pluginTs.resolver.resolveQueryParamsName(node, queryParams[0]),
          })}
        {headerParams[0] &&
          renderEntry({
            schema: buildGroupedParamsSchema(headerParams),
            name: resolver.resolveHeaderParamsName(node, headerParams[0]),
            typeName: pluginTs.resolver.resolveHeaderParamsName(node, headerParams[0]),
          })}
        {node.responses.map((response) =>
          renderEntry({
            schema: response.schema,
            name: resolver.resolveResponseStatusName(node, response.statusCode),
            typeName: pluginTs.resolver.resolveResponseStatusName(node, response.statusCode),
            description: response.description,
          }),
        )}
        {node.requestBody?.schema
          ? renderEntry({
              schema: {
                ...node.requestBody.schema,
                description: node.requestBody.description ?? node.requestBody.schema.description,
              },
              name: resolver.resolveDataName(node),
              typeName: pluginTs.resolver.resolveDataName(node),
              description: node.requestBody.description ?? node.requestBody.schema.description,
            })
          : null}
        {renderEntry({
          schema: buildLegacyResponseUnionSchema(node, resolver),
          name: resolver.resolveResponseName(node),
          typeName: pluginTs.resolver.resolveResponseName(node),
          skipImportNames: node.responses.map((response) => resolver.resolveResponseStatusName(node, response.statusCode)),
        })}
      </File>
    )
  },
})
