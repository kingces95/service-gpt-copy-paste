import { describe, expect, it } from 'vitest'
import { TypedArrayView } from '@kingjs/cursor-view'
import { compose } from '@kingjs/partial-compose'
import {
  FixedStrideRangeContainerOf,
  ProjectedRangePart,
  RangeContainerOf,
  findSequence,
} from '../index.js'

const Uint8RangeContainer = RangeContainerOf(Uint8Array)
const FixedStrideRangeContainer = FixedStrideRangeContainerOf(Uint8Array)

class PairRange extends FixedStrideRangeContainer {
  constructor() {
    super(new Uint8RangeContainer(), { strideLength: 2 })
  }

  static {
    compose(this, ProjectedRangePart, {
      decodeToken$(sourceCursor) {
        const first = sourceCursor.value
        sourceCursor.step()
        return [first, sourceCursor.value]
      },
    })
  }
}

function pairRangeOf(values) {
  const result = new PairRange()
  result.pushRange(new TypedArrayView(Uint8Array.from(values)))
  return result
}

describe('fixed stride page synchronization', () => {
  it('rejects page-space matches that start between virtual tokens', () => {
    const haystack = pairRangeOf([0, 1, 2, 3])
    const needle = pairRangeOf([1, 2])

    expect(findSequence(haystack, needle)).toBe(null)
  })
})
