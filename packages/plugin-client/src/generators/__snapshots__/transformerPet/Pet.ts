/* eslint-disable no-alert, no-console */

import { toDate, toISO } from '../.kubb/dates'
import { transformCategory, serializeCategory } from './Category'

export function transformPet<T>(data: T): T {
  const _data = data as any
  return (
    _data == null
      ? _data
      : { ..._data, createdAt: toDate(_data.createdAt), category: transformCategory(_data.category), visits: _data.visits?.map((item: any) => toDate(item)) }
  ) as T
}

export function serializePet<T>(data: T): T {
  const _data = data as any
  return (
    _data == null
      ? _data
      : { ..._data, createdAt: toISO(_data.createdAt), category: serializeCategory(_data.category), visits: _data.visits?.map((item: any) => toISO(item)) }
  ) as T
}
