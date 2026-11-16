import type { ast } from '@kubb/kit'
import type { OperationTypeNames } from '@internals/client'
import type { ReturnTypeOption } from '../types.ts'
import { buildCallConfig } from './callConfig.ts'
import { buildEventStreamReturn, buildReturnStatement } from './returnStatement.ts'
import type { SecurityRequirement } from './security.ts'
import { buildGroupedOptionsSignature } from './signature.ts'
import type { ValidatorHooks } from './validator.ts'

export type OperationBody = {
  generics: Array<string>
  paramsSignature: string
  optionsType: string
  isOptional: boolean
  returnType: string
  statement: string
  mergeContentType: boolean
}

/**
 * The pieces of a generated operation: its generics, `options` parameter, return type, return statement, and whether the
 * body destructures `contentType` from `options`. Shared by the standalone functions and the SDK methods, so a
 * streamed operation is wired to `apiClient.stream` in one place.
 */
export function buildOperationBody({
  node,
  types,
  validatorHooks,
  security,
  authRequired = false,
  baseURL,
  returnType,
  throwOnErrorDefault,
  stream,
  accept,
}: {
  node: ast.HttpOperationNode
  types: OperationTypeNames
  validatorHooks: ValidatorHooks | null
  security?: Array<SecurityRequirement>
  authRequired?: boolean
  baseURL?: string
  returnType: ReturnTypeOption
  throwOnErrorDefault: boolean
  stream?: boolean
  accept?: string
}): OperationBody {
  const { callConfig, mergeContentType, eventStream } = buildCallConfig({
    node,
    validatorHooks,
    security,
    baseURL,
    throwOnErrorDefault,
    returnType,
    stream,
    accept,
  })
  const signature = buildGroupedOptionsSignature({ node, types, returnType, throwOnErrorDefault, eventStream, authRequired })
  const streamReturn = eventStream ? buildEventStreamReturn({ node, types, callConfig, returnType, throwOnErrorDefault }) : null

  return {
    generics: signature.generics,
    paramsSignature: signature.paramsSignature,
    optionsType: signature.optionsType,
    isOptional: signature.isOptional,
    returnType: streamReturn?.returnType ?? signature.returnType,
    statement: streamReturn?.statement ?? buildReturnStatement({ node, types, callConfig, returnType, throwOnErrorDefault }),
    mergeContentType,
  }
}
