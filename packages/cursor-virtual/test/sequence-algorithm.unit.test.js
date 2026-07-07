import { describe, expect, it } from 'vitest'
import {
  iterate,
  retreat,
} from '@kingjs/cursor-algorithm'
import { TypedArrayView } from '@kingjs/cursor-view'
import {
  matchPrefix,
  VirtualContainer,
} from '../index.js'

function rangeOf(...chunks) {
  const result = new VirtualContainer()
  for (const chunk of chunks)
    result.pushRange(new TypedArrayView(Uint8Array.from(chunk)))
  return result
}

function valuesOf(range) {
  return [...iterate(range)]
}

describe('VirtualContainer split', () => {
  it('commits an empty clone for an empty container sequence', () => {
    const range = rangeOf([1, 2])
    const committed = range.split(Uint8Array.from([]))

    expect(committed).toBeInstanceOf(VirtualContainer)
    expect(valuesOf(committed)).toEqual([])
    expect(valuesOf(range)).toEqual([1, 2])
  })

  it('commits through a virtual byte needle', () => {
    const range = rangeOf([1, 2], [3, 4])
    const committed = range.split(Uint8Array.from([2, 3]))

    expect(valuesOf(committed)).toEqual([1, 2, 3])
  })

  it('falls back when a byte match crosses spans', () => {
    const range = new VirtualContainer()

    range
      .pushRange(new TypedArrayView(Uint8Array.from([1, 2])))
      .pushRange(new TypedArrayView(Uint8Array.from([3, 4])))

    const committed = range.split(Uint8Array.from([2, 3]))

    expect(valuesOf(committed)).toEqual([1, 2, 3])
  })

  it('continues after a failed cross-page fallback', () => {
    const range = new VirtualContainer()

    range
      .pushRange(new TypedArrayView(Uint8Array.from([1, 2])))
      .pushRange(new TypedArrayView(Uint8Array.from([3, 4])))
      .pushRange(new TypedArrayView(Uint8Array.from([5, 6])))

    const committed = range.split(Uint8Array.from([5, 6]))

    expect(valuesOf(committed)).toEqual([1, 2, 3, 4, 5, 6])
  })

  it('returns range container cursors from a byte span match', () => {
    const range = new VirtualContainer()

    range.pushRange(new TypedArrayView(Uint8Array.from([1, 2, 3, 4])))

    const committed = range.split(Uint8Array.from([2, 3]))

    expect(valuesOf(committed)).toEqual([1, 2, 3])
  })

  it('lets callers omit the matched needle from the committed range', () => {
    const range = rangeOf([1, 2], [3, 4])
    const needle = Uint8Array.from([2, 3])
    let committed = range.split(needle)
    committed = committed.popRangeAt(
      retreat(committed.end(), needle.length))

    expect(valuesOf(committed)).toEqual([1])
    expect(valuesOf(range)).toEqual([4])
  })

  it('returns null for absent virtual byte needles', () => {
    const range = rangeOf([1], [2])

    expect(range.split(Uint8Array.from([9]))).toBe(null)
  })

  it('rejects non-byte needles', () => {
    const range = rangeOf([1], [2])

    expect(() => range.split([1])).toThrow(
      'Range needle must be a Uint8Array.')
  })
})

describe('matchPrefix', () => {
  it('matches a complete prefix', () => {
    const range = rangeOf([0xff], [0xfe, 1])
    const match = matchPrefix(range, {
      little: [0xff, 0xfe],
      big: [0xfe, 0xff],
    })

    expect(match.state).toBe('matched')
    expect(match.key).toBe('little')
    expect(valuesOf(range.popRangeAt(match.end))).toEqual([0xff, 0xfe])
  })

  it('reports pending when a prefix can still match', () => {
    const range = rangeOf([0xff])
    const match = matchPrefix(range, {
      little: [0xff, 0xfe],
      big: [0xfe, 0xff],
    })

    expect(match.state).toBe('pending')
  })

  it('reports missed when no prefix can match', () => {
    const range = rangeOf([0x00])
    const match = matchPrefix(range, {
      little: [0xff, 0xfe],
      big: [0xfe, 0xff],
    })

    expect(match.state).toBe('missed')
  })
})
