import { describe, expect, it } from 'vitest'
import { ast } from 'kubb/kit'
import type { OperationParamsResolver } from '@internals/shared'
import { createFunctionParameter } from './functionParams.ts'
import { createOperationParams } from './operationParams.ts'

const { createContent, createOperation, createParameter, createSchema } = ast.factory
type OperationNode = ast.OperationNode
type ParameterNode = ast.ParameterNode

function makeOperation(overrides: Partial<Parameters<typeof createOperation>[0]> = {}) {
  return createOperation({
    operationId: 'getPetById',
    method: 'GET',
    path: '/pets/{petId}',
    ...overrides,
  })
}

function makePathParam(name: string, opts: { required?: boolean } = {}) {
  return createParameter({
    name,
    in: 'path',
    required: opts.required ?? true,
    schema: createSchema({ type: 'string' }),
  })
}

function makeQueryParam(name: string, opts: { required?: boolean } = {}) {
  return createParameter({
    name,
    in: 'query',
    required: opts.required ?? false,
    schema: createSchema({ type: 'string' }),
  })
}

function makeHeaderParam(name: string, opts: { required?: boolean } = {}) {
  return createParameter({
    name,
    in: 'header',
    required: opts.required ?? false,
    schema: createSchema({ type: 'string' }),
  })
}

type ResolverOverrides = {
  resolveParamName?: (node: OperationNode, param: ParameterNode) => string
  resolveBodyName?: (node: OperationNode) => string
  resolvePathName?: (node: OperationNode, param: ParameterNode) => string
  resolveQueryName?: (node: OperationNode, param: ParameterNode) => string
  resolveHeadersName?: (node: OperationNode, param: ParameterNode) => string
}

function makeResolver(overrides: ResolverOverrides = {}): OperationParamsResolver {
  const name = overrides.resolveParamName ?? ((_node: OperationNode, param: ParameterNode) => param.name)
  return {
    param: {
      name,
      path: overrides.resolvePathName ?? name,
      query: overrides.resolveQueryName ?? name,
      headers: overrides.resolveHeadersName ?? name,
    },
    response: {
      body: overrides.resolveBodyName ?? (() => 'unknown'),
    },
  }
}

describe('createOperationParams', () => {
  describe('inline mode with inline path params', () => {
    it('produces inline path params', () => {
      const node = makeOperation({
        parameters: [makePathParam('petId')],
      })

      const params = createOperationParams(node, {
        paramsType: 'inline',
        pathParamsType: 'inline',
        resolver: makeResolver({
          resolveParamName: (_node, param) => `GetPetById["${param.name}"]`,
        }),
      })

      expect(params).toMatchObject({
        kind: 'FunctionParameters',
        params: [
          {
            kind: 'FunctionParameter',
            name: 'petId',
            optional: false,
            type: 'GetPetById["petId"]',
          },
        ],
      })
    })

    it('produces inline path params + data + query + headers + extra', () => {
      const node = makeOperation({
        parameters: [makePathParam('petId'), makeQueryParam('filter'), makeHeaderParam('x-api-key')],
        requestBody: {
          required: true,
          content: [createContent({ contentType: 'application/json', schema: createSchema({ type: 'object' }) })],
        },
      })

      const params = createOperationParams(node, {
        paramsType: 'inline',
        pathParamsType: 'inline',
        resolver: makeResolver({
          resolveParamName: (_node, param) => `Types["${param.name}"]`,
          resolveBodyName: () => 'CreatePetRequest',
        }),
        extraParams: [
          createFunctionParameter({
            name: 'options',
            type: 'Partial<Cypress.RequestOptions>',
            default: '{}',
          }),
        ],
      })

      expect(params.params).toMatchObject([
        {
          kind: 'FunctionParameter',
          name: 'petId',
          optional: false,
          type: 'Types["petId"]',
        },
        {
          kind: 'FunctionParameter',
          name: 'data',
          optional: false,
          type: 'CreatePetRequest',
        },
        {
          kind: 'FunctionParameter',
          name: 'params',
          optional: true,
          type: {
            kind: 'TypeLiteral',
            members: [
              {
                name: 'filter',
                optional: true,
                type: 'Types["filter"]',
              },
            ],
          },
        },
        {
          kind: 'FunctionParameter',
          name: 'headers',
          optional: true,
          type: {
            kind: 'TypeLiteral',
            members: [
              {
                name: 'x-api-key',
                optional: true,
                type: 'Types["x-api-key"]',
              },
            ],
          },
        },
        {
          default: '{}',
          kind: 'FunctionParameter',
          name: 'options',
          optional: false,
          type: 'Partial<Cypress.RequestOptions>',
        },
      ])
    })

    it('handles optional path params with default', () => {
      const node = makeOperation({
        parameters: [makePathParam('petId', { required: false })],
      })

      const params = createOperationParams(node, {
        paramsType: 'inline',
        pathParamsType: 'inline',
        resolver: makeResolver({ resolveParamName: () => 'string' }),
      })

      expect(params).toMatchObject({
        kind: 'FunctionParameters',
        params: [
          {
            kind: 'FunctionParameter',
            name: 'petId',
            optional: true,
            type: 'string',
          },
        ],
      })
    })
  })

  describe('inline mode with object path params', () => {
    it('produces destructured object for path params', () => {
      const node = makeOperation({
        parameters: [makePathParam('petId'), makePathParam('storeId')],
      })

      const params = createOperationParams(node, {
        paramsType: 'inline',
        pathParamsType: 'object',
        resolver: makeResolver({ resolveParamName: () => 'string' }),
      })

      expect(params).toMatchObject({
        kind: 'FunctionParameters',
        params: [
          {
            kind: 'FunctionParameter',
            name: {
              kind: 'ObjectBindingPattern',
              elements: [{ name: 'petId' }, { name: 'storeId' }],
            },
            optional: false,
            type: {
              kind: 'TypeLiteral',
              members: [
                {
                  name: 'petId',
                  optional: false,
                  type: 'string',
                },
                {
                  name: 'storeId',
                  optional: false,
                  type: 'string',
                },
              ],
            },
          },
        ],
      })
    })
  })

  describe('object mode', () => {
    it('wraps all params into a single destructured object', () => {
      const node = makeOperation({
        parameters: [makePathParam('petId'), makeQueryParam('status', { required: true })],
        requestBody: {
          required: false,
          content: [createContent({ contentType: 'application/json', schema: createSchema({ type: 'object' }) })],
        },
      })

      const params = createOperationParams(node, {
        paramsType: 'object',
        pathParamsType: 'inline',
        resolver: makeResolver({
          resolveParamName: (_node, param) => `Types["${param.name}"]`,
          resolveBodyName: () => 'UpdatePetBody',
        }),
        extraParams: [
          createFunctionParameter({
            name: 'options',
            type: 'Options',
            default: '{}',
          }),
        ],
      })

      expect(params).toMatchObject({
        kind: 'FunctionParameters',
        params: [
          {
            kind: 'FunctionParameter',
            name: {
              kind: 'ObjectBindingPattern',
              elements: [{ name: 'petId' }, { name: 'data' }, { name: 'params' }],
            },
            optional: false,
            type: {
              kind: 'TypeLiteral',
              members: [
                {
                  name: 'petId',
                  optional: false,
                  type: 'Types["petId"]',
                },
                {
                  name: 'data',
                  optional: true,
                  type: 'UpdatePetBody',
                },
                {
                  name: 'params',
                  optional: false,
                  type: {
                    kind: 'TypeLiteral',
                    members: [
                      {
                        name: 'status',
                        optional: false,
                        type: 'Types["status"]',
                      },
                    ],
                  },
                },
              ],
            },
          },
          {
            default: '{}',
            kind: 'FunctionParameter',
            name: 'options',
            optional: false,
            type: 'Options',
          },
        ],
      })
    })

    it('adds default {} when all children are optional', () => {
      const node = makeOperation({
        parameters: [makeQueryParam('filter')],
      })

      const params = createOperationParams(node, {
        paramsType: 'object',
        pathParamsType: 'inline',
        resolver: makeResolver({ resolveParamName: () => 'string' }),
      })

      expect(params).toMatchObject({
        kind: 'FunctionParameters',
        params: [
          {
            default: '{}',
            kind: 'FunctionParameter',
            name: {
              kind: 'ObjectBindingPattern',
              elements: [{ name: 'params' }],
            },
            optional: false,
            type: {
              kind: 'TypeLiteral',
              members: [
                {
                  name: 'params',
                  optional: true,
                  type: {
                    kind: 'TypeLiteral',
                    members: [
                      {
                        name: 'filter',
                        optional: true,
                        type: 'string',
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      })
    })
  })

  describe('paramsCasing', () => {
    it('applies camelCase to parameter names', () => {
      const node = makeOperation({
        parameters: [makePathParam('pet_id')],
      })

      const params = createOperationParams(node, {
        paramsType: 'inline',
        pathParamsType: 'inline',
        paramsCasing: 'camelcase',
        resolver: makeResolver({ resolveParamName: () => 'string' }),
      })

      const pathParam = params.params[0]
      expect(pathParam).toBeDefined()
      expect(pathParam?.name).toBe('petId')
    })
  })

  describe('no parameters', () => {
    it('returns empty params when operation has no parameters', () => {
      const node = makeOperation()

      const params = createOperationParams(node, {
        paramsType: 'inline',
        pathParamsType: 'inline',
      })

      expect(params).toMatchObject({
        kind: 'FunctionParameters',
        params: [],
      })
    })

    it('returns only extraParams when operation has no parameters', () => {
      const node = makeOperation()

      const params = createOperationParams(node, {
        paramsType: 'inline',
        pathParamsType: 'inline',
        extraParams: [
          createFunctionParameter({
            name: 'options',
            type: 'Options',
            default: '{}',
          }),
        ],
      })

      expect(params).toMatchObject({
        kind: 'FunctionParameters',
        params: [
          {
            default: '{}',
            kind: 'FunctionParameter',
            name: 'options',
            optional: false,
            type: 'Options',
          },
        ],
      })
    })
  })

  describe('default type resolution', () => {
    it('uses schema primitive type when paramTypes is not provided', () => {
      const node = makeOperation({
        parameters: [makePathParam('petId')],
      })

      const params = createOperationParams(node, {
        paramsType: 'inline',
        pathParamsType: 'inline',
      })

      const pathParam = params.params[0]
      expect(pathParam?.type).toStrictEqual('string')
    })
  })

  describe('requestBody only', () => {
    it('produces data param when operation has only requestBody', () => {
      const node = makeOperation({
        requestBody: {
          required: true,
          content: [createContent({ contentType: 'application/json', schema: createSchema({ type: 'object' }) })],
        },
      })

      const params = createOperationParams(node, {
        paramsType: 'inline',
        pathParamsType: 'inline',
        resolver: makeResolver({
          resolveParamName: () => 'unknown',
          resolveBodyName: () => 'CreatePetRequest',
        }),
      })

      expect(params).toMatchObject({
        kind: 'FunctionParameters',
        params: [
          {
            kind: 'FunctionParameter',
            name: 'data',
            optional: false,
            type: 'CreatePetRequest',
          },
        ],
      })
    })

    it('produces optional data param when requestBody is not required', () => {
      const node = makeOperation({
        requestBody: {
          required: false,
          content: [createContent({ contentType: 'application/json', schema: createSchema({ type: 'object' }) })],
        },
      })

      const params = createOperationParams(node, {
        paramsType: 'inline',
        pathParamsType: 'inline',
        resolver: makeResolver({
          resolveParamName: () => 'unknown',
          resolveBodyName: () => 'UpdatePetRequest',
        }),
      })

      expect(params).toMatchObject({
        kind: 'FunctionParameters',
        params: [
          {
            kind: 'FunctionParameter',
            name: 'data',
            optional: true,
            type: 'UpdatePetRequest',
          },
        ],
      })
    })
  })

  describe('resolver with group methods (named group types)', () => {
    it('uses resolveQueryName for query params in inline mode', () => {
      const node = makeOperation({
        parameters: [makePathParam('petId'), makeQueryParam('filter')],
      })

      const params = createOperationParams(node, {
        paramsType: 'inline',
        pathParamsType: 'inline',
        resolver: makeResolver({
          resolveParamName: (_node, param) => `Types["${param.name}"]`,
          resolveQueryName: () => 'FindPetsQueryParams',
        }),
      })

      const queryParam = params.params.find((p) => p.kind === 'FunctionParameter' && p.name === 'params')
      expect(queryParam).toMatchObject({
        kind: 'FunctionParameter',
        name: 'params',
        optional: true,
        type: 'FindPetsQueryParams',
      })
    })

    it('uses resolveQueryName for query params in object mode', () => {
      const node = makeOperation({
        parameters: [makePathParam('petId'), makeQueryParam('status', { required: true })],
      })

      const params = createOperationParams(node, {
        paramsType: 'object',
        pathParamsType: 'inline',
        resolver: makeResolver({
          resolveParamName: (_node, param) => `Types["${param.name}"]`,
          resolveQueryName: () => 'FindPetsQueryParams',
        }),
      })

      const objParam = params.params[0]
      expect(objParam?.type).toMatchObject({ kind: 'TypeLiteral' })
      if (objParam?.type && typeof objParam.type === 'object' && objParam.type.kind === 'TypeLiteral') {
        const queryChild = objParam.type.members.find((m) => m.name === 'params')
        expect(queryChild).toMatchObject({
          name: 'params',
          optional: false,
          type: 'FindPetsQueryParams',
        })
      }
    })

    it('falls back to inline types when resolveQueryName is not provided', () => {
      const node = makeOperation({
        parameters: [makeQueryParam('filter')],
      })

      const params = createOperationParams(node, {
        paramsType: 'inline',
        pathParamsType: 'inline',
        resolver: makeResolver({
          resolveParamName: (_node, param) => `Types["${param.name}"]`,
        }),
      })

      const queryParam = params.params.find((p) => p.kind === 'FunctionParameter' && p.name === 'params')
      expect(queryParam?.type).toMatchObject({
        kind: 'TypeLiteral',
        members: expect.arrayContaining([expect.objectContaining({ name: 'filter' })]),
      })
    })

    it('uses resolveHeadersName for header params in inline mode', () => {
      const node = makeOperation({
        parameters: [makeHeaderParam('x-api-key', { required: true })],
      })

      const params = createOperationParams(node, {
        paramsType: 'inline',
        pathParamsType: 'inline',
        resolver: makeResolver({
          resolveParamName: () => 'string',
          resolveHeadersName: () => 'FindPetsHeaderParams',
        }),
      })

      expect(params).toMatchObject({
        kind: 'FunctionParameters',
        params: [
          {
            kind: 'FunctionParameter',
            name: 'headers',
            optional: false,
            type: 'FindPetsHeaderParams',
          },
        ],
      })
    })

    it('uses resolveHeadersName for headers in object mode', () => {
      const node = makeOperation({
        parameters: [makePathParam('petId'), makeHeaderParam('x-api-key')],
      })

      const params = createOperationParams(node, {
        paramsType: 'object',
        pathParamsType: 'inline',
        resolver: makeResolver({
          resolveParamName: () => 'string',
          resolveHeadersName: () => 'HeaderParams',
        }),
      })

      const objParam = params.params[0]
      expect(objParam?.type).toMatchObject({ kind: 'TypeLiteral' })
      if (objParam?.type && typeof objParam.type === 'object' && objParam.type.kind === 'TypeLiteral') {
        const headerChild = objParam.type.members.find((m) => m.name === 'headers')
        expect(headerChild).toMatchObject({
          name: 'headers',
          optional: true,
          type: 'HeaderParams',
        })
      }
    })

    it('uses resolvePathName for indexed access types on path params', () => {
      const node = makeOperation({
        parameters: [makePathParam('petId'), makePathParam('name', { required: false })],
      })

      const params = createOperationParams(node, {
        paramsType: 'inline',
        pathParamsType: 'inline',
        resolver: makeResolver({
          resolveParamName: (_node, param) => `DeletePetPath${param.name}`,
          resolvePathName: () => 'DeletePetPathParams',
        }),
      })

      expect(params.params).toMatchObject([
        {
          kind: 'FunctionParameter',
          name: 'petId',
          optional: false,
          type: {
            kind: 'IndexedAccessType',
            target: 'DeletePetPathParams',
            key: 'petId',
          },
        },
        {
          kind: 'FunctionParameter',
          name: 'name',
          optional: true,
          type: {
            kind: 'IndexedAccessType',
            target: 'DeletePetPathParams',
            key: 'name',
          },
        },
      ])
    })
  })

  describe('pathParamsDefault', () => {
    it('uses custom default value for path params', () => {
      const node = makeOperation({
        parameters: [makePathParam('petId', { required: false })],
      })

      const params = createOperationParams(node, {
        paramsType: 'inline',
        pathParamsType: 'object',
        resolver: makeResolver({ resolveParamName: () => 'string' }),
        pathParamsDefault: '[]',
      })

      const pathGroup = params.params[0]
      expect(pathGroup).toBeDefined()
      expect(pathGroup?.default).toBe('[]')
    })

    it('uses fallback default when pathParamsDefault is undefined', () => {
      const node = makeOperation({
        parameters: [makePathParam('petId', { required: false })],
      })

      const params = createOperationParams(node, {
        paramsType: 'inline',
        pathParamsType: 'object',
        resolver: makeResolver({ resolveParamName: () => 'string' }),
        pathParamsDefault: undefined,
      })

      const pathGroup = params.params[0]
      expect(pathGroup).toBeDefined()
      expect(pathGroup?.default).toBe('{}')
    })
  })

  describe('vue-query style type wrapping', () => {
    it('supports MaybeRefOrGetter wrapping via resolver with group methods', () => {
      const node = makeOperation({
        parameters: [makePathParam('petId'), makeQueryParam('filter')],
        requestBody: {
          required: false,
          content: [createContent({ contentType: 'application/json', schema: createSchema({ type: 'object' }) })],
        },
      })

      const params = createOperationParams(node, {
        paramsType: 'inline',
        pathParamsType: 'inline',
        resolver: makeResolver({
          resolveParamName: (_node, param) => `MaybeRefOrGetter<Types["${param.name}"]>`,
          resolveBodyName: () => 'MaybeRefOrGetter<CreatePetRequest>',
          resolveQueryName: () => 'MaybeRefOrGetter<FindPetsQueryParams>',
        }),
      })

      expect(params.params).toMatchObject([
        {
          kind: 'FunctionParameter',
          name: 'petId',
          optional: false,
          type: 'MaybeRefOrGetter<Types["petId"]>',
        },
        {
          kind: 'FunctionParameter',
          name: 'data',
          optional: true,
          type: 'MaybeRefOrGetter<CreatePetRequest>',
        },
        {
          kind: 'FunctionParameter',
          name: 'params',
          optional: true,
          type: 'MaybeRefOrGetter<FindPetsQueryParams>',
        },
      ])
    })
  })

  describe('paramsCasing with query and header params', () => {
    it('applies camelCase to query param names', () => {
      const node = makeOperation({
        parameters: [makeQueryParam('order_status'), makeQueryParam('pet_category')],
      })

      const params = createOperationParams(node, {
        paramsType: 'inline',
        pathParamsType: 'inline',
        paramsCasing: 'camelcase',
        resolver: makeResolver({
          resolveParamName: (_node, param) => `Types["${param.name}"]`,
        }),
      })

      expect(params).toMatchObject({
        kind: 'FunctionParameters',
        params: [
          {
            kind: 'FunctionParameter',
            name: 'params',
            optional: true,
            type: {
              kind: 'TypeLiteral',
              members: [
                {
                  name: 'orderStatus',
                  optional: true,
                  type: 'Types["orderStatus"]',
                },
                {
                  name: 'petCategory',
                  optional: true,
                  type: 'Types["petCategory"]',
                },
              ],
            },
          },
        ],
      })
    })

    it('applies camelCase to path params with object path params type', () => {
      const node = makeOperation({
        parameters: [makePathParam('pet_id'), makePathParam('store_name')],
      })

      const params = createOperationParams(node, {
        paramsType: 'inline',
        pathParamsType: 'object',
        paramsCasing: 'camelcase',
        resolver: makeResolver({ resolveParamName: () => 'string' }),
      })

      const pathGroup = params.params[0]
      expect(pathGroup).toBeDefined()
      expect(pathGroup?.name).toMatchObject({ kind: 'ObjectBindingPattern' })
      if (pathGroup?.name && typeof pathGroup.name === 'object' && pathGroup.name.kind === 'ObjectBindingPattern') {
        expect(pathGroup.name.elements.map((e) => e.name)).toStrictEqual(['petId', 'storeName'])
      }
    })
  })

  describe('client-plugin style (inline path + named query/header groups)', () => {
    it('covers the common client plugin scenario: path inline, query + header as named groups', () => {
      const node = makeOperation({
        parameters: [makePathParam('petId'), makeQueryParam('status'), makeHeaderParam('x-api-key')],
        requestBody: {
          required: true,
          content: [createContent({ contentType: 'application/json', schema: createSchema({ type: 'object' }) })],
        },
      })

      const params = createOperationParams(node, {
        paramsType: 'inline',
        pathParamsType: 'inline',
        resolver: makeResolver({
          resolveParamName: (_node, param) => `Types["${param.name}"]`,
          resolveBodyName: () => 'CreatePetRequest',
          resolveQueryName: () => 'GetPetQueryParams',
          resolveHeadersName: () => 'GetPetHeaderParams',
        }),
      })

      expect(params).toMatchObject({
        kind: 'FunctionParameters',
        params: [
          {
            kind: 'FunctionParameter',
            name: 'petId',
            optional: false,
            type: 'Types["petId"]',
          },
          {
            kind: 'FunctionParameter',
            name: 'data',
            optional: false,
            type: 'CreatePetRequest',
          },
          {
            kind: 'FunctionParameter',
            name: 'params',
            optional: true,
            type: 'GetPetQueryParams',
          },
          {
            kind: 'FunctionParameter',
            name: 'headers',
            optional: true,
            type: 'GetPetHeaderParams',
          },
        ],
      })
    })

    it('covers object paramsType with all param types: path + query + header + body', () => {
      const node = makeOperation({
        parameters: [makePathParam('petId'), makeQueryParam('status', { required: true }), makeHeaderParam('x-api-key', { required: true })],
        requestBody: {
          required: false,
          content: [createContent({ contentType: 'application/json', schema: createSchema({ type: 'object' }) })],
        },
      })

      const params = createOperationParams(node, {
        paramsType: 'object',
        pathParamsType: 'inline',
        resolver: makeResolver({
          resolveParamName: (_node, param) => `Types["${param.name}"]`,
          resolveBodyName: () => 'CreatePetRequest',
          resolveQueryName: () => 'GetPetQueryParams',
          resolveHeadersName: () => 'GetPetHeaderParams',
        }),
      })

      const objParam = params.params[0]
      expect(objParam?.kind).toBe('FunctionParameter')
      expect(objParam?.type).toMatchObject({ kind: 'TypeLiteral' })
      if (objParam?.type && typeof objParam.type === 'object' && objParam.type.kind === 'TypeLiteral') {
        const names = objParam.type.members.map((m) => m.name)
        expect(names).toContain('petId')
        expect(names).toContain('data')
        expect(names).toContain('params')
        expect(names).toContain('headers')
      }
    })
  })

  describe('react-query / solid-query / svelte-query style', () => {
    it('inline paramsType with object path params and named query group (QueryOptions style)', () => {
      const node = makeOperation({
        parameters: [makePathParam('petId', { required: true }), makeQueryParam('limit'), makeQueryParam('offset')],
      })

      const params = createOperationParams(node, {
        paramsType: 'inline',
        pathParamsType: 'object',
        resolver: makeResolver({
          resolveParamName: (_node, param) => `GetPetByIdPathParams["${param.name}"]`,
          resolvePathName: () => 'GetPetByIdPathParams',
          resolveQueryName: () => 'GetPetByIdQueryParams',
        }),
      })

      expect(params).toMatchObject({
        kind: 'FunctionParameters',
        params: [
          {
            kind: 'FunctionParameter',
            name: {
              kind: 'ObjectBindingPattern',
              elements: [{ name: 'petId' }],
            },
            optional: false,
            type: {
              kind: 'TypeLiteral',
              members: [
                {
                  name: 'petId',
                  optional: false,
                  type: {
                    kind: 'IndexedAccessType',
                    target: 'GetPetByIdPathParams',
                    key: 'petId',
                  },
                },
              ],
            },
          },
          {
            kind: 'FunctionParameter',
            name: 'params',
            optional: true,
            type: 'GetPetByIdQueryParams',
          },
        ],
      })
    })

    it('inline paramsType with paramsCasing and named query group', () => {
      const node = makeOperation({
        parameters: [makePathParam('pet_id', { required: true }), makeQueryParam('sort_order')],
      })

      const params = createOperationParams(node, {
        paramsType: 'inline',
        pathParamsType: 'inline',
        paramsCasing: 'camelcase',
        resolver: makeResolver({
          resolveParamName: (_node, param) => `Types["${param.name}"]`,
          resolveQueryName: () => 'ListPetsQueryParams',
        }),
      })

      const pathParam = params.params[0]
      expect(pathParam?.name).toBe('petId')
      const queryParam = params.params.find((p) => p.kind === 'FunctionParameter' && p.name === 'params')
      expect(queryParam?.type).toStrictEqual('ListPetsQueryParams')
    })
  })
})

describe('typeWrapper option', () => {
  it('wraps path param types with the provided function', () => {
    const node = makeOperation({
      parameters: [makePathParam('petId')],
    })

    const params = createOperationParams(node, {
      paramsType: 'inline',
      pathParamsType: 'inline',
      resolver: makeResolver({ resolveParamName: () => 'string' }),
      typeWrapper: (t) => `MaybeRefOrGetter<${t}>`,
    })

    const pathParam = params.params[0]
    expect(pathParam?.type).toStrictEqual('MaybeRefOrGetter<string>')
  })

  it('wraps body type with the provided function', () => {
    const node = makeOperation({
      requestBody: { required: true, content: [createContent({ contentType: 'application/json', schema: createSchema({ type: 'object' }) })] },
    })

    const params = createOperationParams(node, {
      paramsType: 'inline',
      pathParamsType: 'inline',
      resolver: makeResolver({ resolveBodyName: () => 'CreatePetRequest' }),
      typeWrapper: (t) => `MaybeRefOrGetter<${t}>`,
    })

    const bodyParam = params.params.find((p) => p.kind === 'FunctionParameter' && p.name === 'data')
    expect(bodyParam?.type).toStrictEqual('MaybeRefOrGetter<CreatePetRequest>')
  })

  it('wraps query group type with the provided function', () => {
    const node = makeOperation({
      parameters: [makeQueryParam('status')],
    })

    const params = createOperationParams(node, {
      paramsType: 'inline',
      pathParamsType: 'inline',
      resolver: makeResolver({
        resolveQueryName: () => 'ListPetsQueryParams',
      }),
      typeWrapper: (t) => `MaybeRefOrGetter<${t}>`,
    })

    const queryParam = params.params.find((p) => p.kind === 'FunctionParameter' && p.name === 'params')
    expect(queryParam?.type).toStrictEqual('MaybeRefOrGetter<ListPetsQueryParams>')
  })

  it('identity when typeWrapper is not provided', () => {
    const node = makeOperation({
      parameters: [makePathParam('petId')],
    })

    const params = createOperationParams(node, {
      paramsType: 'inline',
      pathParamsType: 'inline',
      resolver: makeResolver({ resolveParamName: () => 'string' }),
    })

    const pathParam = params.params[0]
    expect(pathParam?.type).toStrictEqual('string')
  })
})

describe('pathParamsType: inlineSpread', () => {
  it('emits a single rest parameter for path params', () => {
    const node = makeOperation({
      parameters: [makePathParam('petId'), makePathParam('storeId')],
    })

    const params = createOperationParams(node, {
      paramsType: 'inline',
      pathParamsType: 'inlineSpread',
      resolver: makeResolver({
        resolvePathName: () => 'GetPetByIdPathParams',
      }),
    })

    expect(params.params).toHaveLength(1)
    const restParam = params.params[0]
    expect(restParam?.kind).toBe('FunctionParameter')
    if (restParam?.kind === 'FunctionParameter') {
      expect(restParam.rest).toBe(true)
      expect(restParam.name).toBe('pathParams')
      expect(restParam.type).toStrictEqual('GetPetByIdPathParams')
    }
  })

  it('respects custom path param name via paramNames.path', () => {
    const node = makeOperation({
      parameters: [makePathParam('petId')],
    })

    const params = createOperationParams(node, {
      paramsType: 'inline',
      pathParamsType: 'inlineSpread',
      paramNames: { path: 'args' },
      resolver: makeResolver({
        resolvePathName: () => 'GetPetByIdPathParams',
      }),
    })

    const restParam = params.params[0]
    if (restParam?.kind === 'FunctionParameter') {
      expect(restParam.name).toBe('args')
    }
  })

  it('applies typeWrapper to the spread type', () => {
    const node = makeOperation({
      parameters: [makePathParam('petId')],
    })

    const params = createOperationParams(node, {
      paramsType: 'inline',
      pathParamsType: 'inlineSpread',
      resolver: makeResolver({
        resolvePathName: () => 'GetPetByIdPathParams',
      }),
      typeWrapper: (t) => `MaybeRefOrGetter<${t}>`,
    })

    const restParam = params.params[0]
    if (restParam?.kind === 'FunctionParameter') {
      expect(restParam.type).toStrictEqual('MaybeRefOrGetter<GetPetByIdPathParams>')
    }
  })

  it('emits no path param when operation has no path parameters', () => {
    const node = makeOperation({
      parameters: [makeQueryParam('status')],
    })

    const params = createOperationParams(node, {
      paramsType: 'inline',
      pathParamsType: 'inlineSpread',
      resolver: makeResolver({}),
    })

    const restParam = params.params.find((p) => p.kind === 'FunctionParameter' && p.rest)
    expect(restParam).toBeUndefined()
  })
})
