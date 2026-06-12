import { describe, expect, it } from 'vitest'
import { TypedArrayView } from '@kingjs/cursor-view'
import { compose } from '@kingjs/partial-compose'
import {
  FixedStrideVirtualContainerOf,
  VirtualPart,
  RangeContainerOf,
  findSequence,
} from '../index.js'

const Uint8RangeContainer = RangeContainerOf(Uint8Array)
const FixedStrideVirtualContainer = FixedStrideVirtualContainerOf(Uint8Array)

class PairRange extends FixedStrideVirtualContainer {
  constructor() {
    super(new Uint8RangeContainer(), { strideLength: 2 })
  }

  static {
    compose(this, VirtualPart, {
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
  it('marks only fixed-stride page offsets as synchronized', () => {
    const range = pairRangeOf([0, 1, 2, 3])
    const [page] = range.begin().pages(range.end())

    expect(page.isSynchronized(0)).toBe(true)
    expect(page.isSynchronized(1)).toBe(false)
    expect(page.isSynchronized(2)).toBe(true)
    expect(page.virtualize(1)).toBe(null)
    expect(page.virtualize(2)).not.toBe(null)
  })

  it('rejects page-space matches that start between virtual tokens', () => {
    const haystack = pairRangeOf([0, 1, 2, 3])
    const needle = pairRangeOf([1, 2])

    expect(findSequence(haystack, needle)).toBe(null)
  })
})
