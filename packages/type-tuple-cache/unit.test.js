import { describe, it, expect } from 'vitest'
import { TypeTupleCache } from '@kingjs/type-tuple-cache'

class Type {
}

class OtherType {
}

class ThirdType {
}

describe('TypeTupleCache', () => {
  it('caches a value by type tuple', () => {
    const cache = new TypeTupleCache()
    const value = { }

    expect(cache.has([Type, OtherType])).toBe(false)
    expect(cache.set([Type, OtherType], value)).toBe(value)
    expect(cache.has([Type, OtherType])).toBe(true)
    expect(cache.get([Type, OtherType])).toBe(value)
  })

  it('separates different type tuples', () => {
    const cache = new TypeTupleCache()
    const value = { }

    cache.set([Type, OtherType], value)

    expect(cache.has([Type, ThirdType])).toBe(false)
    expect(cache.get([Type, ThirdType])).toBe(undefined)
  })

  it('gets or creates a cached value', () => {
    const cache = new TypeTupleCache()
    const value = { }
    let calls = 0

    const create = () => {
      calls++
      return value
    }

    expect(cache.getOrCreate([Type], create)).toBe(value)
    expect(cache.getOrCreate([Type], create)).toBe(value)
    expect(calls).toBe(1)
  })
})
