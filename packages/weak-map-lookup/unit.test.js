import { describe, it, expect } from 'vitest'
import { WeakMapLookup } from '@kingjs/weak-map-lookup'

describe('WeakMapLookup', () => {
  it('should return the same weak map for the same tuple', () => {
    const lookup = new WeakMapLookup()
    const a = { }
    const b = { }

    expect(lookup.of(a, b)).toBe(lookup.of(a, b))
  })

  it('should return different weak maps for different tuples', () => {
    const lookup = new WeakMapLookup()
    const a = { }
    const b = { }
    const c = { }

    expect(lookup.of(a, b)).not.toBe(lookup.of(a, c))
  })

  it('should expose the leaf weak map', () => {
    const lookup = new WeakMapLookup()
    const a = { }
    const b = { }
    const key = { }
    const value = { }

    const leaf = lookup.of(a, b)
    leaf.set(key, value)

    expect(lookup.of(a, b).get(key)).toBe(value)
  })
})
