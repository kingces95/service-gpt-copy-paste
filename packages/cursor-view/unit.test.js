import { describe, it, expect } from 'vitest'
import { RangeConcept, RandomAccessRangeProbe } from '@kingjs/cursor'
import { VectorMap } from '@kingjs/cursor-container'
import { iterate } from '@kingjs/cursor-algorithm'
import { snapshot, subrange } from '@kingjs/cursor-view'

function createVectorMap(...values) {
  const result = new VectorMap()

  for (const value of values)
    result.push(value)

  return result
}

describe('subrange', () => {
  it('should adapt a cursor pair to a range', () => {
    const source = createVectorMap(1, 2, 3)
    const first = source.begin()
    const last = source.end()
    const range = subrange(first, last)

    expect(range).toBeInstanceOf(RangeConcept)
    expect(range).toBeInstanceOf(RandomAccessRangeProbe)
    expect(range.prototypeCursor).toBe(first)
    expect(range.begin().equals(first)).toBe(true)
    expect(range.end().equals(last)).toBe(true)
  })

  it('should clone begin and end cursors when possible', () => {
    const source = createVectorMap(1, 2, 3)
    const first = source.begin()
    const last = source.end()
    const range = subrange(first, last)

    expect(range.begin()).not.toBe(first)
    expect(range.end()).not.toBe(last)
  })

  it('should not mutate the original begin cursor while iterating', () => {
    const source = createVectorMap(1, 2, 3)
    const first = source.begin()
    first.step()

    const range = subrange(first, source.end())

    expect([...iterate(range)]).toEqual([2, 3])
    expect(first.value).toBe(2)
  })
})

describe('snapshot', () => {
  it('should copy a range into an independent random-access range', () => {
    const source = createVectorMap(1, 2, 3)
    const range = snapshot(source)

    source.clear()

    expect(range).toBeInstanceOf(RangeConcept)
    expect(range).toBeInstanceOf(RandomAccessRangeProbe)
    expect([...iterate(range)]).toEqual([1, 2, 3])
  })
})
