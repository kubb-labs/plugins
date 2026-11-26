import type { ast } from '@internals/ast'
import type { OperationTypeNames } from '@internals/client'
import type { ReturnTypeOption } from '../types.ts'
import { buildCallConfig } from './callConfig.ts'
import { buildEventStreamReturn, buildReturnStatement } from './returnStatement.ts'
import type { SecurityRequirement } from './security.ts'
import { buildGroupedOptionsSignature } from './signature.ts'
import type { ValidatorHooks } from './validator.ts'

export type BuildOperationBodyOptions = {
  node: ast.HttpOperationNode
  types: OperationTypeNames
  validatorHooks: ValidatorHooks | null
  security?: Array<SecurityRequirement>
  authRequired?: boolean
  baseURL?: string
  returnType: ReturnTypeOption
  throwOnErrorDefault: boolean
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
}: BuildOperationBodyOptions): { generics: Array<string>; paramsSignature: string; returnType?: string; statement: string; mergeContentType: boolean } {
  const { callConfig, mergeContentType, eventStream } = buildCallConfig({ node, validatorHooks, security, baseURL, throwOnErrorDefault, returnType })
  const signature = buildGroupedOptionsSignature({ node, types, returnType, throwOnErrorDefault, eventStream, authRequired })
  const stream = eventStream ? buildEventStreamReturn({ node, types, callConfig, returnType, throwOnErrorDefault }) : null

  return {
    generics: signature.generics,
    paramsSignature: signature.paramsSignature,
    // The call already carries the full result type, so the bundled runtime's return type is inferred instead of written twice.
    // A custom client (`'plain'`) keeps it, since it is the contract that client has to meet.
    returnType: returnType === 'plain' ? (stream?.returnType ?? signature.returnType) : undefined,
    statement: stream?.statement ?? buildReturnStatement({ node, types, callConfig, returnType, throwOnErrorDefault }),
    mergeContentType,
  }
}
