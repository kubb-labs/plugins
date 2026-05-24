/* eslint-disable no-alert, no-console */

import { toDate, toISO } from '../.kubb/dates'
import { parseCategory, serializeCategory } from './Category'

export function parsePet<T>(data: T): T {
  const _data = data as any
  return (
    _data == null
      ? _data
      : { ..._data, createdAt: toDate(_data.createdAt), category: parseCategory(_data.category), visits: _data.visits?.map((item: any) => toDate(item)) }
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
