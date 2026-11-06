import type { SuccessOf } from '@kubb/plugin-client/templates/core.ts'
import type { StreamResult, TypedEvent } from '@kubb/plugin-client/templates/sse.ts'
import { describe, expectTypeOf, test } from 'vitest'

type ChatEvent = { event: 'delta'; data: { text: string } }
type RateLimited = { retryAfter: number }
type StreamChatResponses = { '200': ChatEvent; '429': RateLimited }
type ChatResult<ThrowOnError extends boolean> = StreamResult<StreamChatResponses, ThrowOnError, TypedEvent<SuccessOf<StreamChatResponses>>>

// `pnpm typecheck` enforces these assertions; at run time `expectTypeOf` does nothing.
describe('StreamResult', () => {
  test('narrows error to the declared body when status is checked, with throwOnError false', () => {
    const read = (result: ChatResult<false>) => {
      if (result.status === 429) {
        expectTypeOf(result.error).toEqualTypeOf<RateLimited>()
        return
      }
      expectTypeOf(result.error).toEqualTypeOf<undefined>()
      expectTypeOf(result.stream).toEqualTypeOf<AsyncGenerator<TypedEvent<ChatEvent>>>()
    }

    expectTypeOf(read).parameter(0).toHaveProperty('status').toEqualTypeOf<200 | 429>()
  })

  test('keeps only the success variant with throwOnError true', () => {
    expectTypeOf<ChatResult<true>['status']>().toEqualTypeOf<200>()
    expectTypeOf<ChatResult<true>['error']>().toEqualTypeOf<undefined>()
  })
})
