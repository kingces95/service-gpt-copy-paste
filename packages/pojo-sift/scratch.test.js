import { describe, it, expect } from 'vitest'
import { beforeEach } from 'vitest'
import { siftPojos } from '@kingjs/pojo-sift'

describe('siftPojos user record alice and bob', () => {
  let records
  beforeEach(() => {
    records = [
      { name: 'alice', age: 30, city: 'new york' },
      { name: 'bob', age: 25, city: 'los angeles' },
    ]
  })

  it('sifts by single filter', () => {
    const filters = [
      { city: 'new york' }
    ]
    const result = Array.from(siftPojos(records, filters))
    expect(result).toEqual([
      { name: 'alice', age: 30, city: 'new york' }
    ])
  })

  it('sifts by missing record coreced to false', () => {
    const filters = [
      { city: 'new york', employed: false }
    ]
    const result = Array.from(siftPojos(records, filters))
    expect(result).toEqual([
      { name: 'alice', age: 30, city: 'new york' }
    ])
  })

  it('sifts by a single unwrapped filter', () => {
    const filter = { age: 25 }
    const result = Array.from(siftPojos(records, filter))
    expect(result).toEqual([
      { name: 'bob', age: 25, city: 'los angeles' }
    ])
  })

  it('sifts by multiple filters', () => {
    const filters = [
      { city: 'new york' },
      { age: 25 }
    ]
    const result = Array.from(siftPojos(records, filters))
    expect(result).toEqual([
      { name: 'alice', age: 30, city: 'new york' },
      { name: 'bob', age: 25, city: 'los angeles' }
    ])
  })

  it('returns empty when no matches', () => {
    const filters = [
      { city: 'chicago' }
    ]
    const result = Array.from(siftPojos(records, filters))
    expect(result).toEqual([])
  })

  it('a filter with multiple criteria', () => {
    const filters = [
      { city: 'new york', age: 30 }
    ]
    const result = Array.from(siftPojos(records, filters))
    expect(result).toEqual([
      { name: 'alice', age: 30, city: 'new york' }
    ])
  })
})