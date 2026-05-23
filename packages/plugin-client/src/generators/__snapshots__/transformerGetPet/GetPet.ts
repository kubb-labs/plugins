/* eslint-disable no-alert, no-console */

import { toDate, toDateISO } from '../.kubb/dates'

export function serializeGetPetData<T>(data: T): T {
  const _data = data as any
  return (_data == null ? _data : { ..._data, bornAt: toDateISO(_data.bornAt) }) as T
}

export function transformGetPetStatus200<T>(data: T): T {
  const _data = data as any
  return (_data == null ? _data : { ..._data, createdAt: toDate(_data.createdAt) }) as T
}
