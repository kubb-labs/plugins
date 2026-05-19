// Minimal axios stub for benchmark resolution.
// Kubb's plugin-client uses axios as an optional peer dep;
// this stub prevents Vite from erroring when it cannot resolve it.
const axios = {
  create: () => axios,
  get: async () => ({}),
  post: async () => ({}),
  put: async () => ({}),
  delete: async () => ({}),
  patch: async () => ({}),
  request: async () => ({}),
  interceptors: {
    request: { use: () => {}, eject: () => {} },
    response: { use: () => {}, eject: () => {} },
  },
  defaults: { headers: { common: {} } },
}

export default axios
export const { create, get, post, put, patch, request, interceptors, defaults } = axios
export type AxiosError = Error & { isAxiosError: boolean; response?: any; config?: any }
export type AxiosRequestConfig = Record<string, any>
export type AxiosResponse<T = any> = { data: T; status: number; headers: any; config: any }
