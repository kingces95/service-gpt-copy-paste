import { describe, it, expect } from 'vitest'
import { 
  ContiguousRangeShape,
  RandomAccessRangeShape,
  WritableRandomAccessRangeShape,
  RangeShape,
} from '@kingjs/cursor-shape'
import { ArrayMap } from '@kingjs/cursor-container-standard'
import { iterate } from '@kingjs/cursor-algorithm'
import {
  snapshot,
  subrange,
  TypedArrayView,
} from '@kingjs/cursor-view'

function createArrayMap(...values) {
  const result = new ArrayMap()

  for (const value of values)
    result.pushBack(value)

  return result
}

describe('subrange', () => {
  it('should adapt a cursor pair to a range', () => {
    const source = createArrayMap(1, 2, 3)
    const first = source.begin()
    const last = source.end()
    const range = subrange(first, last)

    expect(range).toBeInstanceOf(RangeShape)
    expect(range).toBeInstanceOf(RandomAccessRangeShape)
    expect(range).toBeInstanceOf(WritableRandomAccessRangeShape)
    expect(range.cursorType).toBe(first.constructor)
    expect(range.begin().equals(first)).toBe(true)
    expect(range.end().equals(last)).toBe(true)
  })

  it('should clone begin and end cursors when possible', () => {
    const source = createArrayMap(1, 2, 3)
    const first = source.begin()
    const last = source.end()
    const range = subrange(first, last)

    expect(range.begin()).not.toBe(first)
    expect(range.end()).not.toBe(last)
  })

  it('should not mutate the original begin cursor while iterating', () => {
    const source = createArrayMap(1, 2, 3)
    const first = source.begin()
    first.step()

    const range = subrange(first, source.end())

    expect([...iterate(range)]).toEqual([2, 3])
    expect(first.value).toBe(2)
  })
})

describe('snapshot', () => {
  it('should copy a range into an independent random-access range', () => {
    const source = createArrayMap(1, 2, 3)
    const range = snapshot(source)

    source.clear()

    expect(range).toBeInstanceOf(RangeShape)
    expect(range).toBeInstanceOf(RandomAccessRangeShape)
    expect(range).not.toBeInstanceOf(WritableRandomAccessRangeShape)
    expect([...iterate(range)]).toEqual([1, 2, 3])
  })
})

describe('TypedArrayView', () => {
  it('should borrow typed-array storage without copying', () => {
    const bytes = Uint8Array.from([1, 2, 3, 4])
    const view = new TypedArrayView(bytes)

    expect(view).toBeInstanceOf(RangeShape)
    expect(view).toBeInstanceOf(RandomAccessRangeShape)
    expect(view).toBeInstanceOf(ContiguousRangeShape)
    expect([...iterate(view)]).toEqual([1, 2, 3, 4])

    const first = view.begin()
    first.step()

    const span = view.span(first, view.end())
    expect(span).toBeInstanceOf(Uint8Array)
    expect([...span]).toEqual([2, 3, 4])

    bytes[1] = 9
    expect(first.value).toBe(9)
    expect(span[0]).toBe(9)
  })
})
