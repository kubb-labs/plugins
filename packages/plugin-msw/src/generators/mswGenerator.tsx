import { ast } from '@internals/ast'
import { getEnumNames } from '@internals/shared'
import { code, defineGenerator } from '@kubb/kit'
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
    const { parser, baseURL } = ctx.options

    const mock = {
      name: ctx.resolver.handler.name(node),
      file: ctx.file(node),
    }

    if (parser === 'faker') ctx.requirePlugin(pluginFakerName)
    const faker = parser === 'faker' ? ctx.from(pluginFakerName).resolver.response.response(node) : null

    const pluginTs = ctx.requirePlugin(pluginTsName)
    const tsResolver = ctx.getResolver(pluginTsName)
    const typeRefs = ctx.from(pluginTsName).resolver
    const responseType = typeRefs.response.response(node)

    const successResponses = ast.http.responses.filterSuccess(node)
    const referencedNames = ast.http.responses.getImportedNames(node.responses)
    const enumOptions = pluginTs.options?.enum
    const enumNames = getEnumNames()
    const hasResponseNameCollision = referencedNames.some((name) => {
      return enumTypeName({ resolver: tsResolver, name, enumOptions, isEnum: enumNames.has(name) }) === responseType.name
    })
    // One helper per documented status, a range such as `4xx` included. `default` has no status to mock,
    // and the Fetch `Response` constructor rejects a `1xx` status.
    const types = node.responses
      .filter((response) => response.statusCode !== 'default' && ast.http.status.getClass(response) !== 1)
      .map((response) => {
        const isResponseType = ast.http.status.isSuccess(response) && !hasResponseNameCollision
        return [response, isResponseType ? responseType : typeRefs.response.status(node, response.statusCode)] as const
      })
    const mockResponseName =
      hasResponseNameCollision && successResponses[0] ? tsResolver.response.status(node, successResponses[0].statusCode) : responseType.name
    const hasSuccessSchema = successResponses.some((response) => hasResponseSchema(response))
    // The handler calls the helper of the response it mocks when that helper takes the handler's own data type.
    const primaryResponse = ast.http.responses.findPrimary(node)
    const responseHelperName =
      primaryResponse &&
      hasResponseSchema(primaryResponse) &&
      types.some(([response, typeName]) => response.statusCode === primaryResponse.statusCode && typeName.name === mockResponseName)
        ? `${mock.name}Response${primaryResponse.statusCode}`
        : undefined

    const request = ast.http.requestBody.getSchema(node) ? typeRefs.response.body(node) : null
    const requestName = request?.name ?? null
    const { imports: typeImports } = code.join([...(hasResponseNameCollision ? [] : [responseType]), ...types.map(([, typeName]) => typeName), request])
    const fakerImport = hasSuccessSchema ? faker?.import : null

    return (
      <File {...mock.file}>
        <File.Import name={['http', 'HttpResponse']} path="msw/http" />
        <File.Import name={['HttpResponseResolver']} isTypeOnly path="msw/http" />
        {requestName && <File.Import name={['MswBody']} isTypeOnly root={mock.file.path} path={mswBodyPath(ctx.config)} />}
        {typeImports.map((imp) => (
          <File.Import key={imp.path} name={imp.name} root={mock.file.path} path={imp.path} isTypeOnly />
        ))}
        {fakerImport && <File.Import name={fakerImport.name} root={mock.file.path} path={fakerImport.path} />}

        {types.map(([response, typeName]) => (
          <Response key={response.statusCode} typeName={typeName.name} response={response} name={mock.name} />
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
