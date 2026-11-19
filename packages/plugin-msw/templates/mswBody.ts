import type { DefaultBodyType } from 'msw'

/**
 * The request body type of a generated handler.
 * A generic alias keeps an object body spreadable, which the same conditional written inline does not (TS2698).
 * Distribution sends `unknown`, `bigint`, `void` or a union holding `unknown` to `DefaultBodyType`.
 */
export type MswBody<T> = T extends DefaultBodyType ? T : DefaultBodyType
