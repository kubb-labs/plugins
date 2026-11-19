import type { DefaultBodyType } from 'msw'

// A generic alias keeps an object body spreadable, where the inline conditional does not (TS2698).
export type MswBody<T> = T extends DefaultBodyType ? T : DefaultBodyType
