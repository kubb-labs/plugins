import type { ast } from '@kubb/kit'
import type { OperationTypeNames } from '../resolveOperationTypes.ts'
import type { ReturnTypeOption } from '../types.ts'
import { buildCallConfig } from './callConfig.ts'
import { buildEventStreamReturn, buildReturnStatement } from './returnStatement.ts'
import type { Auth } from './security.ts'
import { buildGroupedOptionsSignature } from './signature.ts'
import type { ValidatorHooks } from './validator.ts'

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
  returnType,
  throwOnErrorDefault,
}: {
  node: ast.HttpOperationNode
  types: OperationTypeNames
  validatorHooks: ValidatorHooks | null
  security?: Array<Auth>
  returnType: ReturnTypeOption
  throwOnErrorDefault: boolean
}): { generics: Array<string>; paramsSignature: string; returnType: string; statement: string; mergeContentType: boolean } {
  const { callConfig, mergeContentType, eventStream } = buildCallConfig({ node, validatorHooks, security, throwOnErrorDefault, returnType })
  const signature = buildGroupedOptionsSignature({ node, types, returnType, throwOnErrorDefault, eventStream })
  const stream = eventStream ? buildEventStreamReturn({ node, types, callConfig, returnType, throwOnErrorDefault }) : null

  return {
    generics: signature.generics,
    paramsSignature: signature.paramsSignature,
    returnType: stream?.returnType ?? signature.returnType,
    statement: stream?.statement ?? buildReturnStatement({ node, types, callConfig, returnType, throwOnErrorDefault }),
    mergeContentType,
  }
}
