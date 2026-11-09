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
 * `text/event-stream` operation is wired to `toEventStream` in one place.
 */
export function buildOperationBody({
  node,
  types,
  validatorHooks,
  security,
  baseURL,
  returnType,
  throwOnErrorDefault,
}: {
  node: ast.HttpOperationNode
  types: OperationTypeNames
  validatorHooks: ValidatorHooks | null
  security?: Array<Auth>
  baseURL?: string
  returnType: ReturnTypeOption
  throwOnErrorDefault: boolean
}): { generics: Array<string>; paramsSignature: string; returnType: string; statement: string; mergeContentType: boolean } {
  const { callConfig, mergeContentType, eventStream } = buildCallConfig({ node, validatorHooks, security, baseURL, throwOnErrorDefault, returnType })
  const signature = buildGroupedOptionsSignature({ node, types, returnType, throwOnErrorDefault, eventStream })
  const stream = eventStream ? buildEventStreamReturn({ node, types, callConfig, returnType, validatorHooks, throwOnErrorDefault }) : null

  return {
    generics: signature.generics,
    paramsSignature: signature.paramsSignature,
    returnType: stream?.returnType ?? signature.returnType,
    statement: stream?.statement ?? buildReturnStatement({ node, types, callConfig, returnType, throwOnErrorDefault }),
    mergeContentType,
  }
}
