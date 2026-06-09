import { describe, expect, it } from 'vitest'
import { iterate } from '@kingjs/cursor-algorithm'
import { SnapshotView, TypedArrayView } from '@kingjs/cursor-view'
import { spanTypeOfRange, spansOfRange } from '@kingjs/cursor-shape'
import {
  findSequence,
  matchPrefix,
  RangeContainer,
  RangeContainerOf,
} from '../index.js'

function rangeOf(...chunks) {
  const result = new RangeContainer()
  for (const chunk of chunks)
    result.pushRange(new SnapshotView(chunk))
  return result
}

function valuesOf(range) {
  return [...iterate(range)]
}

describe('findSequence', () => {
  it('finds a sequence within a range', () => {
    const range = rangeOf([1, 2], [3, 4])
    const match = findSequence(range, [2, 3])

    expect(valuesOf(range.popRange(match.end))).toEqual([1, 2, 3])
  })

  it('returns null when a sequence is absent', () => {
    const range = rangeOf([1, 2], [3, 4])

    expect(findSequence(range, [2, 4])).toBe(null)
  })

  it('can start from an existing cursor', () => {
    const range = rangeOf([1, 2, 1, 2])
    const from = range.begin()
    from.step()

    const match = findSequence(range, [1, 2], { from })

    expect(valuesOf(range.popRange(match.begin))).toEqual([1, 2])
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
    expect(valuesOf(range.popRange(match.end))).toEqual([0xff, 0xfe])
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

describe('span projections', () => {
  it('projects spans through a range of ranges', () => {
    const Uint8RangeContainer = RangeContainerOf(Uint8Array)
    const range = new Uint8RangeContainer()

    range
      .pushRange(new TypedArrayView(Uint8Array.from([1, 2])))
      .pushRange(new TypedArrayView(Uint8Array.from([3])))

    expect([...spansOfRange(range)].map(span => [...span]))
      .toEqual([[1, 2], [3]])
  })

  it('reports the declared span type', () => {
    const Uint8RangeContainer = RangeContainerOf(Uint8Array)

    expect(spanTypeOfRange(new Uint8RangeContainer())).toBe(Uint8Array)
  })

  it('asserts homogeneous spans', () => {
    const Uint8RangeContainer = RangeContainerOf(Uint8Array)
    const range = new Uint8RangeContainer()

    range.pushRange(new TypedArrayView(Int8Array.from([1])))

    expect(() => [...spansOfRange(range)]).toThrow(
      'Range span type must match spanType.')
  })
})
