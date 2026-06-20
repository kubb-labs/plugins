import { client } from './gen/.kubb/client.ts'

// Configure the slim runtime the generated SWR hooks call. There is no runtime dependency on
// @kubb/plugin-fetch. The hooks return the response body and surface `ResponseError` (typed as
// `ResponseErrorConfig`) on `useSWR().error`, with `error.response` reachable.
client.setConfig({ baseURL: 'https://petstore3.swagger.io/api/v3' })
