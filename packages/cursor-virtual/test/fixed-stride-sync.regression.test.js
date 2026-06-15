import { describe, expect, it } from 'vitest'
import { advance } from '@kingjs/cursor-algorithm'
import { TypedArrayView } from '@kingjs/cursor-view'
import { compose } from '@kingjs/partial-compose'
import {
  FixedStrideProjectedRangeContainer,
  ProjectedRangePart,
  VirtualContainer,
  findSequence,
} from '../index.js'

function cursorAt(range, offset) {
  const cursor = range.begin()
  advance(cursor, offset)
  return cursor
}

class PairRange extends FixedStrideProjectedRangeContainer {
  constructor({ throwOnFirst = false } = { }) {
    super(new VirtualContainer(), { strideLength: 2 })
    this.throwOnFirst = throwOnFirst
  }

  static {
    compose(this, ProjectedRangePart, {
      decodeToken$(sourceCursor) {
        const first = sourceCursor.value
        if (this.throwOnFirst && first == 0)
          throw new Error('Fallback should start at the page tail.')

        sourceCursor.step()
        return first
      },
    })
  }
}

function pairRangeOf(...chunks) {
  const result = new PairRange()

  for (const chunk of chunks)
    result.pushRange(new TypedArrayView(Uint8Array.from(chunk)))

  return result
}

function throwingPairRangeOf(...chunks) {
  const result = new PairRange({ throwOnFirst: true })

  for (const chunk of chunks)
    result.pushRange(new TypedArrayView(Uint8Array.from(chunk)))

  return result
}

describe('fixed stride page synchronization', () => {
  it('marks only fixed-stride page offsets as synchronized', () => {
    const range = pairRangeOf([0, 1, 2, 3])
    const [page] = range.source$.begin().pages(range.source$.end())
    const projector = range.projector$

    expect(projector.isSynchronized(page, cursorAt(page, 0))).toBe(true)
    expect(projector.isSynchronized(page, cursorAt(page, 1))).toBe(false)
    expect(projector.isSynchronized(page, cursorAt(page, 2))).toBe(true)
    expect(projector.projectCursor(page, cursorAt(page, 2))).not.toBe(null)
  })

  it('rejects page-space matches that start between virtual tokens', () => {
    const haystack = pairRangeOf([0, 1, 2, 3])
    const needle = pairRangeOf([1, 2])

    expect(findSequence(haystack, needle)).toBe(null)
  })

  it('bounds cross-page fallback to the fixed-stride page tail', () => {
    const haystack = throwingPairRangeOf([0, 1, 2, 3], [4, 5])
    const needle = pairRangeOf([2, 3, 4, 5])
    const match = findSequence(haystack, needle)

    expect(match.begin.value).toBe(2)
    expect(match.end.equals(haystack.end())).toBe(true)
  })
})
