import { describe, expect, it } from 'vitest'
import { mapKeys } from '@kingjs/map-keys'

describe('mapKeys', () => {
  it('should map values and preserve keys', () => {
    expect(mapKeys({ a: 1, b: 2 }, (value, key) => `${key}:${value}`))
      .toEqual({ a: 'a:1', b: 'b:2' })
  })

  it('should return undefined when given undefined', () => {
    expect(mapKeys(undefined, value => value)).toBeUndefined()
  })
})
