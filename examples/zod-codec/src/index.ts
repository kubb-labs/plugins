/**
 * Custom zod codecs end to end. `pnpm generate` writes one client from `petStore.yaml` with:
 * - `customCodecs` (`codecs.ts`): every `date` / `date-time` field is a `Date`, every `int64` a `bigint`,
 *   and every `uri` a `URL` in application code, while the wire keeps their string forms
 * - `pluginZod({ inferred: 'codec' })`: request types take the domain value the encode schemas accept
 *   (`z.input`), response types return the one the decode schemas produce (`z.output`)
 * - `validator: { request, params, response }`: the client encodes the body, path, query, and headers
 *   before sending and decodes the responses
 *
 * `pnpm start` runs it against an in-memory server and prints what goes over the wire.
 */
import { client, type ResolvedRequest, type Transport, type ValidationErrorContext } from './gen/.kubb/client.ts'
import { listPets } from './gen/clients/listPets.ts'
import { scheduleVisit } from './gen/clients/scheduleVisit.ts'

/**
 * Stands in for the server: records every request and answers with wire JSON, every codec value as a string.
 */
function createServer() {
  const requests: Array<ResolvedRequest> = []
  const transport: Transport = async (request) => {
    requests.push(request)
    const data = request.url.includes('/visits/')
      ? { petId: '9007199254740993', day: '2026-10-01', startsAt: '2026-10-01T09:00:00.000Z', notes: 'Yearly check-up' }
      : [{ id: '9007199254740993', name: 'Odie', homepage: 'https://odie.example.com', birthDate: '2020-04-01', createdAt: '2020-04-02T10:30:00.000Z' }]
    return {
      data,
      status: 200,
      statusText: 'OK',
      headers: new Headers({ 'Content-Type': 'application/json' }),
      request: new Request(request.url),
      response: new Response(),
    }
  }
  return { requests, transport }
}

function printRequest(request: ResolvedRequest | undefined) {
  console.log('  sent    ', request?.method, request?.url)
  if (request?.headers['X-Requested-At']) console.log('  header  ', 'X-Requested-At:', request.headers['X-Requested-At'])
  if (request?.body) console.log('  body    ', request.body)
}

async function main() {
  const server = createServer()
  client.setConfig({ baseURL: 'https://petstore.example.com/api', transport: server.transport })

  // Every codec slot takes its domain value: a `bigint` id, `Date`s, and a `URL`. The validators encode them.
  // 2^53 + 1 is beyond Number.MAX_SAFE_INTEGER, so only an exact bigint round trip keeps it.
  console.log('scheduleVisit')
  const visit = await scheduleVisit({
    path: { petId: 9007199254740993n, day: new Date('2026-10-01') },
    query: { callback: new URL('https://hooks.example.com/visits?pet=odie') },
    headers: { 'X-Requested-At': new Date('2026-09-28T12:00:00.000Z') },
    body: { startsAt: new Date('2026-10-01T09:00:00.000Z'), notes: 'Yearly check-up' },
  })
  printRequest(server.requests.at(-1))
  // The response validator decodes the wire strings back into domain values.
  const petId: bigint = visit.data.petId
  const startsAt: Date = visit.data.startsAt
  console.log('  received', 'petId:', petId, '| startsAt instanceof Date:', startsAt instanceof Date)

  console.log('listPets')
  const pets = await listPets({ query: { bornAfter: new Date('2020-01-01'), limit: 10 } })
  printRequest(server.requests.at(-1))
  const [odie] = pets.data
  const homepage: URL | undefined = odie?.homepage
  console.log('  received', 'id:', odie?.id, '| homepage instanceof URL:', homepage instanceof URL, '| birthDate:', odie?.birthDate.toISOString())

  // An invalid param is rejected before anything is sent. `source` names the slot that failed;
  // returning nothing from `onValidationError` rethrows the `ParseError`.
  console.log('invalid param')
  const sentBefore = server.requests.length
  const error = await scheduleVisit({
    path: { petId: 1n, day: new Date('not a date') },
    body: { startsAt: new Date() },
    onValidationError: (_error, context: ValidationErrorContext) => {
      console.log('  rejected', `direction: ${context.direction}, source: ${context.source}`)
    },
  }).catch((reason: unknown) => reason)
  console.log('  thrown  ', (error as Error).name, '| requests sent:', server.requests.length - sentBefore)
}

/**
 * Never called: shows that every codec slot takes the domain value and rejects the wire value.
 */
export function typeChecks() {
  const body = { startsAt: new Date() }

  // @ts-expect-error a `date` path param takes a `Date`, not its wire string
  void scheduleVisit({ path: { petId: 1n, day: '2026-10-01' }, body })
  // @ts-expect-error an `int64` path param takes a `bigint`, not its wire string
  void scheduleVisit({ path: { petId: '1', day: new Date() }, body })
  // @ts-expect-error a `uri` query param takes a `URL`, not its wire string
  void scheduleVisit({ path: { petId: 1n, day: new Date() }, query: { callback: 'https://hooks.example.com' }, body })
  // @ts-expect-error a `date-time` header takes a `Date`, not its wire string
  void scheduleVisit({ path: { petId: 1n, day: new Date() }, headers: { 'X-Requested-At': '2026-09-28T12:00:00.000Z' }, body })
  // @ts-expect-error a `date-time` body field takes a `Date`, not its wire string
  void scheduleVisit({ path: { petId: 1n, day: new Date() }, body: { startsAt: '2026-10-01T09:00:00.000Z' } })
  // @ts-expect-error a `date` query param takes a `Date`, not its wire string
  void listPets({ query: { bornAfter: '2020-01-01' } })

  // The domain values are accepted in every slot.
  void scheduleVisit({
    path: { petId: 1n, day: new Date() },
    query: { callback: new URL('https://hooks.example.com') },
    headers: { 'X-Requested-At': new Date() },
    body,
  })
  void listPets({ query: { bornAfter: new Date(), limit: 10 } })
}

await main()
