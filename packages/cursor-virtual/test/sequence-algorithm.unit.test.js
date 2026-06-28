import { describe, expect, it } from 'vitest'
import { iterate } from '@kingjs/cursor-algorithm'
import { TypedArrayView } from '@kingjs/cursor-view'
import { compose } from '@kingjs/partial-compose'
import {
  matchPrefix,
  ProjectedRangeContainer,
  ProjectedRangePart,
  VirtualContainer,
} from '../index.js'

function rangeOf(...chunks) {
  const result = new VirtualContainer()
  for (const chunk of chunks)
    result.pushRange(new TypedArrayView(Uint8Array.from(chunk)))
  return result
}

function bytesOf(values) {
  return new TypedArrayView(Uint8Array.from(values))
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

  it('finds virtual values by materializing a virtual needle', () => {
    const range = virtualRangeOf([1, 2, 3])
    const needle = virtualRangeOf([2])
    const materialized = needle.materialize()
    const committed = range.split(needle)

    expect(materialized).toBeInstanceOf(Uint8Array)
    expect([...materialized]).toEqual([2])
    expect(valuesOf(committed)).toEqual([101, 102])
  })

  it('rejects a plain logical needle for a virtual range', () => {
    const range = virtualRangeOf([1, 2, 3])

    expect(() => range.split(bytesOf([102]))).toThrow(
      'Range needle must be a Uint8Array or materializable range.')
  })

  it('finds virtual values across virtual pages', () => {
    const range = virtualRangeOf([1, 2], [3, 4])
    const needle = virtualRangeOf([2, 3])
    const committed = range.split(needle)

    expect(valuesOf(committed)).toEqual([101, 102, 103])
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

  it('can omit the matched needle from the committed range', () => {
    const range = rangeOf([1, 2], [3, 4])
    const committed = range.split(Uint8Array.from([2, 3]), {
      includeNeedle: false,
    })

    expect(valuesOf(committed)).toEqual([1])
    expect(valuesOf(range)).toEqual([4])
  })

  it('returns null for absent virtual byte needles', () => {
    const range = rangeOf([1], [2])

    expect(range.split(Uint8Array.from([9]))).toBe(null)
  })
})
const VirtualByteRange = (() => {
  return class VirtualByteRange extends ProjectedRangeContainer {
    constructor() {
      super(new VirtualContainer())
    }

    static {
      compose(this, ProjectedRangePart, {
        decodeValue$(sourceCursor) {
          return sourceCursor.value + 100
        },
      })
    }
  }
})()

function virtualRangeOf(...chunks) {
  const result = new VirtualByteRange()

  for (const chunk of chunks)
    result.pushRange(new TypedArrayView(Uint8Array.from(chunk)))

  return result
}

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
