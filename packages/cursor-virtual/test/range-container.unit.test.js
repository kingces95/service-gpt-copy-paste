import { describe, expect, it } from 'vitest'
import {
  iterate,
  toArray,
} from '@kingjs/cursor-algorithm'
import {
  SnapshotView,
} from '@kingjs/cursor-view'
import {
  BidirectionalRangeShape,
} from '@kingjs/cursor-shape'
import {
  TrivialForwardRange,
} from '../../cursor/trivial-cursors.js'
import {
  RangeOfRangesShape,
  RangeContainerOf,
  RangeContainer,
} from '../index.js'

function valuesOf(range) {
  return [...iterate(range)]
}

function rangeValuesOf(ranges) {
  return toArray(ranges, valuesOf)
}

describe('RangeContainer', () => {
  it('allows repeated reads until the client commits consumption', () => {
    const ranges = new RangeContainer()

    ranges
      .pushRange(new SnapshotView(['a', 'b']))
      .pushRange(new SnapshotView(['c']))

    expect([...iterate(ranges)]).toEqual(['a', 'b', 'c'])
    expect([...iterate(ranges)]).toEqual(['a', 'b', 'c'])

    const commit = ranges.begin()
    commit.step()
    commit.step()

    expect([...iterate(ranges.popRange(commit))]).toEqual(['a', 'b'])
    expect([...iterate(ranges)]).toEqual(['c'])
  })

  it('iterates pushed ranges as one joined range', () => {
    const ranges = new RangeContainer()

    ranges
      .pushRange(new SnapshotView([1, 2]))
      .pushRange(new SnapshotView([3]))
      .pushRange(new SnapshotView([4, 5]))

    expect([...iterate(ranges)]).toEqual([1, 2, 3, 4, 5])
    expect(ranges).toBeInstanceOf(BidirectionalRangeShape)
    expect(ranges).toBeInstanceOf(RangeOfRangesShape)
    expect(ranges.isEmpty).toBe(false)
  })

  it('carries span type on generic specializations', () => {
    const Uint8RangeContainer = RangeContainerOf(Uint8Array)
    const ranges = new Uint8RangeContainer()

    expect(Uint8RangeContainer.cursorType.spanType).toBe(Uint8Array)
    expect(ranges.constructor.cursorType.spanType).toBe(Uint8Array)
    expect(ranges).toBeInstanceOf(RangeOfRangesShape)
  })

  it('steps backward within a stored range', () => {
    const ranges = new RangeContainer()

    ranges.pushRange(new SnapshotView([1, 2]))

    const cursor = ranges.end()
    cursor.stepBack()

    expect(cursor.value).toBe(2)

    cursor.stepBack()

    expect(cursor.value).toBe(1)
  })

  it('steps backward across stored ranges', () => {
    const ranges = new RangeContainer()

    ranges
      .pushRange(new SnapshotView([1]))
      .pushRange(new SnapshotView([2, 3]))

    const cursor = ranges.end()

    cursor.stepBack()
    expect(cursor.value).toBe(3)

    cursor.stepBack()
    expect(cursor.value).toBe(2)

    cursor.stepBack()
    expect(cursor.value).toBe(1)
  })

  it('pops a committed prefix while preserving the remaining suffix', () => {
    const ranges = new RangeContainer()

    ranges
      .pushRange(new SnapshotView([1, 2]))
      .pushRange(new SnapshotView([3, 4, 5]))

    const commit = ranges.begin()
    commit.step()
    commit.step()
    commit.step()

    expect([...iterate(ranges.popRange(commit))]).toEqual([1, 2, 3])
    expect([...iterate(ranges)]).toEqual([4, 5])
  })

  it('returns consumed stored ranges through ranges()', () => {
    const ranges = new RangeContainer()

    ranges
      .pushRange(new SnapshotView([1]))
      .pushRange(new SnapshotView([2, 3]))

    const commit = ranges.begin()
    commit.step()
    commit.step()

    const consumed = ranges.popRange(commit)

    expect(rangeValuesOf(consumed.ranges())).toEqual([[1], [2]])
    expect(rangeValuesOf(ranges.ranges())).toEqual([[3]])
  })

  it('projects pages between cursors', () => {
    const ranges = new RangeContainer()

    ranges
      .pushRange(new SnapshotView([1, 2]))
      .pushRange(new SnapshotView([3, 4]))

    const pages = [...ranges.begin().pages(ranges.end())]

    expect(pages.map(valuesOf)).toEqual([[1, 2], [3, 4]])
    expect(pages[1].cursorAt(1).value).toBe(4)
  })

  it('materializes pages between cursors', () => {
    const ranges = new RangeContainer()

    ranges
      .pushRange(new SnapshotView([1, 2]))
      .pushRange(new SnapshotView([3, 4]))

    const end = ranges.begin()
    end.step()
    end.step()
    end.step()

    const materialized = ranges.begin().materialize(end)

    expect(valuesOf(materialized)).toEqual([1, 2, 3])
    expect(rangeValuesOf(materialized.ranges())).toEqual([[1, 2], [3]])
  })

  it('keeps retained cursors stable when whole front ranges pop', () => {
    const ranges = new RangeContainer()

    ranges
      .pushRange(new SnapshotView([1, 2]))
      .pushRange(new SnapshotView([3, 4]))

    const commit = ranges.begin()
    commit.step()
    commit.step()

    const retained = commit.clone()
    retained.step()

    expect([...iterate(ranges.popRange(commit))]).toEqual([1, 2])
    expect(retained.value).toBe(4)
  })

  it('clones cursors without sharing their inner cursor position', () => {
    const ranges = new RangeContainer()

    ranges.pushRange(new SnapshotView([1, 2]))

    const cursor = ranges.begin()
    const clone = cursor.clone()

    expect(cursor.equals(clone)).toBe(true)
    cursor.step()

    expect(clone.value).toBe(1)
    expect(cursor.value).toBe(2)
    expect(cursor.equals(clone)).toBe(false)
  })

  it('asserts public argument contracts', () => {
    const ranges = new RangeContainer()
    const other = new RangeContainer()

    expect(() => ranges.pushRange([1, 2])).toThrow(
      'Argument 0 must be BidirectionalRangeShape.')
    expect(() => ranges.pushRange(new TrivialForwardRange())).toThrow(
      'Argument 0 must be BidirectionalRangeShape.')
    expect(() => ranges.popRange(other.begin())).toThrow(
      'Cursor is from another container.')
  })

  it('asserts when stepping back before begin', () => {
    const ranges = new RangeContainer()

    ranges.pushRange(new SnapshotView([1]))

    expect(() => ranges.begin().stepBack()).toThrow(
      'Cannot move cursor out of bounds.')
  })

  it('asserts when reading a cursor at end', () => {
    const ranges = new RangeContainer()

    ranges.pushRange(new SnapshotView([1]))

    expect(() => ranges.end().value).toThrow(
      'Argument this must be HasValue.')
  })
})
