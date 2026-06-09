import { describe, expect, it } from 'vitest'
import { iterate } from '@kingjs/cursor-algorithm'
import { SnapshotView } from '@kingjs/cursor-view'
import {
  findSequence,
  matchPrefix,
  RangeContainer,
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
