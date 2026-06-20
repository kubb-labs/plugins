import { client } from './gen/.kubb/client.ts'

// Configure the slim runtime the generated Vue Query composables call. There is no runtime dependency
// on @kubb/plugin-fetch. The composables return the response body and surface `ResponseError` (typed
// as `ResponseErrorConfig`) on `useQuery().error`, with `error.response` reachable.
client.setConfig({ baseURL: 'https://petstore3.swagger.io/api/v3' })
