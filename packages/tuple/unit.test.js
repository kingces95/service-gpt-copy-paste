import { describe, it, expect } from 'vitest'
import { Tuple } from '@kingjs/tuple'

describe('Tuple', () => {
  it('creates a frozen array subtype', () => {
    const tuple = Tuple.of('left', 'right')

    expect(tuple).toBeInstanceOf(Tuple)
    expect(tuple).toEqual([ 'left', 'right' ])
    expect(Object.isFrozen(tuple)).toBe(true)
  })
})
