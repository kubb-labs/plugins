import { ast } from '@internals/ast'
import { getEnumNames } from '@internals/shared'
import { defineGenerator } from '@kubb/kit'
import { pluginFakerName } from '@kubb/plugin-faker'
import { enumTypeName, pluginTsName } from '@kubb/plugin-ts'
import { File, jsxRenderer } from '@kubb/renderer-jsx'
import { Mock } from '../components/Mock.tsx'
import { Response } from '../components/Response.tsx'
import type { PluginMsw } from '../types'
import { hasResponseSchema, mswBodyPath } from '../utils.ts'

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
    if (!ast.http.isOperation(node)) return null
    const { resolver, config } = ctx
    const { parser, baseURL } = ctx.options

    const mock = {
      name: resolver.handler.name(node),
      file: ctx.file(node, { name: resolver.name(node.operationId), suffix: false }),
    }

    const fakerPlugin = parser === 'faker' ? ctx.requirePlugin(pluginFakerName) : null
    const fakerResolver = fakerPlugin ? ctx.getResolver(pluginFakerName) : null
    const faker =
      fakerPlugin && fakerResolver
        ? {
            name: fakerResolver.response.response(node),
            file: ctx.file(node, { plugin: fakerResolver.pluginName }),
          }
        : null

    const pluginTs = ctx.requirePlugin(pluginTsName)
    const tsResolver = ctx.getResolver(pluginTsName)

    const type = {
      file: ctx.file(node, { plugin: tsResolver.pluginName }),
      responseName: tsResolver.response.response(node),
    }

    const successResponses = ast.http.responses.filterSuccess(node)
    const referencedNames = ast.http.responses.getImportedNames(node.responses)
    const enumOptions = pluginTs.options?.enum
    const enumNames = getEnumNames()
    const hasResponseNameCollision = referencedNames.some((name) => {
      return enumTypeName({ resolver: tsResolver, name, enumOptions, isEnum: enumNames.has(name) }) === type.responseName
    })
    // One helper per documented status, a range such as `4xx` included. `default` has no status to mock,
    // and the Fetch `Response` constructor rejects a `1xx` status.
    const types = node.responses
      .filter((response) => response.statusCode !== 'default' && ast.http.status.getClass(response) !== 1)
      .map((response) => {
        const isResponseType = ast.http.status.isSuccess(response) && !hasResponseNameCollision
        return [response, isResponseType ? type.responseName : tsResolver.response.status(node, response.statusCode)] as const
      })
    const responseTypeNames = types.map(([, typeName]) => typeName)
    const mockResponseName =
      hasResponseNameCollision && successResponses[0] ? tsResolver.response.status(node, successResponses[0].statusCode) : type.responseName
    const hasSuccessSchema = successResponses.some((response) => hasResponseSchema(response))
    // The handler calls the helper of the response it mocks when that helper takes the handler's own data type.
    const primaryResponse = ast.http.responses.findPrimary(node)
    const responseHelperName =
      primaryResponse &&
      hasResponseSchema(primaryResponse) &&
      types.some(([response, typeName]) => response.statusCode === primaryResponse.statusCode && typeName === mockResponseName)
        ? `${mock.name}Response${primaryResponse.statusCode}`
        : undefined

    const requestName = ast.http.requestBody.getSchema(node) ? tsResolver.response.body(node) : null

    return (
      <File {...mock.file}>
        <File.Import name={['http', 'HttpResponse']} path="msw/http" />
        <File.Import name={['HttpResponseResolver']} isTypeOnly path="msw/http" />
        {requestName && <File.Import name={['MswBody']} isTypeOnly root={mock.file.path} path={mswBodyPath(config)} />}
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
