import { describe, expect, it } from 'vitest'
import { SnapshotView } from '@kingjs/cursor-view'
import { ArrayMap } from '@kingjs/cursor-container-standard'
import { toArray } from '@kingjs/cursor-algorithm'

function rangeOf(values) {
  const result = new ArrayMap()
  result.assignRange(new SnapshotView(values))
  return result
}

describe('toArray', () => {
  it('materializes a range', () => {
    expect(toArray(rangeOf([1, 2, 3]))).toEqual([1, 2, 3])
  })

  it('maps while materializing', () => {
    expect(toArray(rangeOf([1, 2, 3]), value => value * 2))
      .toEqual([2, 4, 6])
  })
})
