import { getEnumNames, resolveOperationFile } from '@internals/shared'
import { ast, defineGenerator } from '@kubb/kit'
import { pluginFakerName } from '@kubb/plugin-faker'
import { enumTypeName, pluginTsName } from '@kubb/plugin-ts'
import { File, jsxRenderer } from '@kubb/renderer-jsx'
import { Mock } from '../components/Mock.tsx'
import { Response } from '../components/Response.tsx'
import type { PluginMsw } from '../types'
import { hasResponseSchema } from '../utils.ts'

/**
 * Built-in operation generator for `@kubb/plugin-msw`. Emits one MSW handler
 * per OpenAPI operation. With `parser: 'faker'` the handler returns a value
 * from `@kubb/plugin-faker`; with `parser: 'data'` it returns a typed empty
 * payload for tests to fill in.
 */
export const mswGenerator = defineGenerator<PluginMsw>({
  name: 'msw',
  renderer: jsxRenderer,
  operation(node, ctx) {
    if (!ast.http.is(node)) return null
    const { driver, resolver, config, root } = ctx
    const { output, parser, baseURL, group } = ctx.options

    const fileName = resolver.name(node.operationId)
    const mock = {
      name: resolver.handler.name(node),
      file: resolver.file({ name: fileName, extname: '.ts', tag: node.tags[0] ?? 'default', path: node.path, root, output, group: group ?? undefined }),
    }

    const fakerPlugin = parser === 'faker' ? ctx.requirePlugin(pluginFakerName) : null
    const fakerResolver = fakerPlugin ? driver.getResolver(pluginFakerName) : null
    const faker =
      fakerPlugin && fakerResolver
        ? {
            name: fakerResolver.response.response(node),
            file: resolveOperationFile({
              ctx,
              node,
              resolver: fakerResolver,
              root,
              output: fakerPlugin.options?.output ?? output,
              group: fakerPlugin.options?.group ?? undefined,
            }),
          }
        : null

    const pluginTs = ctx.requirePlugin(pluginTsName)
    const tsResolver = driver.getResolver(pluginTsName)

    const type = {
      file: resolveOperationFile({
        ctx,
        node,
        resolver: tsResolver,
        root,
        output: pluginTs.options?.output ?? output,
        group: pluginTs.options?.group,
      }),
      responseName: tsResolver.response.response(node),
    }

    const successResponses = ast.http.responses.success(node)
    const referencedNames = node.responses.flatMap((response) =>
      (response.content ?? []).flatMap((entry) => (entry.schema ? ast.graph.importedNames(entry.schema) : [])),
    )
    const enumOptions = pluginTs.options?.enum
    const enumNames = getEnumNames(ctx)
    const hasResponseNameCollision = referencedNames.some((name) => {
      return enumTypeName({ resolver: tsResolver, name, enumOptions, isEnum: enumNames.has(name) }) === type.responseName
    })
    // One helper per documented status, a range such as `4xx` included. `default` has no status to mock,
    // and the Fetch `Response` constructor rejects a `1xx` status.
    const types = node.responses
      .filter((response) => response.statusCode !== 'default' && ast.http.status.class(response) !== 1)
      .map((response) => {
        const isResponseType = ast.http.status.isSuccess(response) && !hasResponseNameCollision
        return [response, isResponseType ? type.responseName : tsResolver.response.status(node, response.statusCode)] as const
      })
    const responseTypeNames = types.map(([, typeName]) => typeName)
    const mockResponseName =
      hasResponseNameCollision && successResponses[0] ? tsResolver.response.status(node, successResponses[0].statusCode) : type.responseName
    const hasSuccessSchema = successResponses.some((response) => hasResponseSchema(response))
    // The handler calls the helper of the response it mocks when that helper takes the handler's own data type.
    const primaryResponse = ast.http.responses.primary(node)
    const responseHelperName =
      primaryResponse &&
      hasResponseSchema(primaryResponse) &&
      types.some(([response, typeName]) => response.statusCode === primaryResponse.statusCode && typeName === mockResponseName)
        ? `${mock.name}Response${primaryResponse.statusCode}`
        : undefined

    const requestName = node.requestBody?.content?.[0]?.schema ? tsResolver.response.body(node) : null

    return (
      <File
        baseName={mock.file.baseName}
        path={mock.file.path}
        meta={mock.file.meta}
        banner={resolver.default.banner(ctx.meta, { output, config, file: { path: mock.file.path, baseName: mock.file.baseName } })}
        footer={resolver.default.footer(ctx.meta, { output, config, file: { path: mock.file.path, baseName: mock.file.baseName } })}
      >
        <File.Import name={['http', 'HttpResponse']} path="msw/http" />
        <File.Import name={['HttpResponseResolver']} isTypeOnly path="msw/http" />
        {requestName && <File.Import name={['DefaultBodyType']} isTypeOnly path="msw" />}
        <File.Import
          name={Array.from(new Set([...(hasResponseNameCollision ? [] : [type.responseName]), ...responseTypeNames, ...(requestName ? [requestName] : [])]))}
          path={type.file.path}
          root={mock.file.path}
          isTypeOnly
        />
        {faker && hasSuccessSchema && <File.Import name={[faker.name]} root={mock.file.path} path={faker.file.path} />}

        {types.map(([response, typeName]) => (
          <Response key={response.statusCode} typeName={typeName} response={response} name={mock.name} />
        ))}

        <Mock
          name={mock.name}
          typeName={mockResponseName}
          requestTypeName={requestName}
          fakerName={faker && hasSuccessSchema ? faker.name : undefined}
          responseName={responseHelperName}
          node={node}
          baseURL={baseURL}
        />
      </File>
    )
  },
})
