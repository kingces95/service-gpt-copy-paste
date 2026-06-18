import { describe, expect, it } from 'vitest'
import {
  advance,
  iterate,
  toArray,
} from '@kingjs/cursor-algorithm'
import {
  TypedArrayView,
} from '@kingjs/cursor-view'
import {
  BidirectionalRangeShape,
} from '@kingjs/cursor-shape'
import {
  TrivialForwardRange,
} from '../../cursor/trivial-cursors.js'
import {
  VirtualContainerShape,
  VirtualContainer,
} from '../index.js'

function valuesOf(range) {
  return [...iterate(range)]
}

function rangeValuesOf(ranges) {
  return toArray(ranges, valuesOf)
}

function cursorAt(range, offset) {
  const cursor = range.begin()
  advance(cursor, offset)
  return cursor
}

function bytesOf(values) {
  return new TypedArrayView(Uint8Array.from(values))
}

describe('VirtualContainer', () => {
  it('allows repeated reads until the client commits consumption', () => {
    const ranges = new VirtualContainer()

    ranges
      .pushRange(bytesOf([1, 2]))
      .pushRange(bytesOf([3]))

    expect([...iterate(ranges)]).toEqual([1, 2, 3])
    expect([...iterate(ranges)]).toEqual([1, 2, 3])

    const commit = ranges.begin()
    commit.step()
    commit.step()

    expect([...iterate(ranges.popRange(commit))]).toEqual([1, 2])
    expect([...iterate(ranges)]).toEqual([3])
  })

  it('iterates pushed ranges as one joined range', () => {
    const ranges = new VirtualContainer()

    ranges
      .pushRange(bytesOf([1, 2]))
      .pushRange(bytesOf([3]))
      .pushRange(bytesOf([4, 5]))

    expect([...iterate(ranges)]).toEqual([1, 2, 3, 4, 5])
    expect(ranges).toBeInstanceOf(BidirectionalRangeShape)
    expect(ranges).toBeInstanceOf(VirtualContainerShape)
    expect(ranges.isEmpty).toBe(false)
  })

  it('steps backward within a stored range', () => {
    const ranges = new VirtualContainer()

    ranges.pushRange(bytesOf([1, 2]))

    const cursor = ranges.end()
    cursor.stepBack()

    expect(cursor.value).toBe(2)

    cursor.stepBack()

    expect(cursor.value).toBe(1)
  })

  it('steps backward across stored ranges', () => {
    const ranges = new VirtualContainer()

    ranges
      .pushRange(bytesOf([1]))
      .pushRange(bytesOf([2, 3]))

    const cursor = ranges.end()

    cursor.stepBack()
    expect(cursor.value).toBe(3)

    cursor.stepBack()
    expect(cursor.value).toBe(2)

    cursor.stepBack()
    expect(cursor.value).toBe(1)
  })

  it('pops a committed prefix while preserving the remaining suffix', () => {
    const ranges = new VirtualContainer()

    ranges
      .pushRange(bytesOf([1, 2]))
      .pushRange(bytesOf([3, 4, 5]))

    const commit = ranges.begin()
    commit.step()
    commit.step()
    commit.step()

    expect([...iterate(ranges.popRange(commit))]).toEqual([1, 2, 3])
    expect([...iterate(ranges)]).toEqual([4, 5])
  })

  it('returns consumed stored ranges through ranges()', () => {
    const ranges = new VirtualContainer()

    ranges
      .pushRange(bytesOf([1]))
      .pushRange(bytesOf([2, 3]))

    const commit = ranges.begin()
    commit.step()
    commit.step()

    const consumed = ranges.popRange(commit)

    expect(rangeValuesOf(consumed.ranges())).toEqual([[1], [2]])
    expect(rangeValuesOf(ranges.ranges())).toEqual([[3]])
  })

  it('projects pages between cursors', () => {
    const ranges = new VirtualContainer()

    ranges
      .pushRange(bytesOf([1, 2]))
      .pushRange(bytesOf([3, 4]))

    const pages = [...ranges.pages()]

    expect(pages.map(valuesOf)).toEqual([[1, 2], [3, 4]])
    expect(cursorAt(pages[1], 1).value).toBe(4)
  })

  it('materializes pages between cursors', () => {
    const ranges = new VirtualContainer()

    ranges
      .pushRange(bytesOf([1, 2]))
      .pushRange(bytesOf([3, 4]))

    const end = ranges.begin()
    end.step()
    end.step()
    end.step()

    const materialized = ranges.materialize(ranges.begin(), end)

    expect(valuesOf(materialized)).toEqual([1, 2, 3])
    expect(rangeValuesOf(materialized.ranges())).toEqual([[1, 2], [3]])
  })

  it('tracks physical offsets after committed prefixes are popped', () => {
    const ranges = new VirtualContainer()

    ranges
      .pushRange(bytesOf([1, 2]))
      .pushRange(bytesOf([3, 4, 5]))

    expect(ranges.offsetOf(cursorAt(ranges, 0))).toBe(0)
    expect(ranges.offsetOf(cursorAt(ranges, 3))).toBe(3)
    expect(ranges.offsetOf(ranges.end())).toBe(5)

    const commit = cursorAt(ranges, 3)
    ranges.popRange(commit)

    expect(valuesOf(ranges)).toEqual([4, 5])
    expect(ranges.offsetOf(ranges.begin())).toBe(3)
    expect(ranges.offsetOf(ranges.end())).toBe(5)
  })

  it('keeps retained cursors stable when whole front ranges pop', () => {
    const ranges = new VirtualContainer()

    ranges
      .pushRange(bytesOf([1, 2]))
      .pushRange(bytesOf([3, 4]))

    const commit = ranges.begin()
    commit.step()
    commit.step()

    const retained = commit.clone()
    retained.step()

    expect([...iterate(ranges.popRange(commit))]).toEqual([1, 2])
    expect(retained.value).toBe(4)
  })

  it('clones cursors without sharing their inner cursor position', () => {
    const ranges = new VirtualContainer()

    ranges.pushRange(bytesOf([1, 2]))

    const cursor = ranges.begin()
    const clone = cursor.clone()

    expect(cursor.equals(clone)).toBe(true)
    cursor.step()

    expect(clone.value).toBe(1)
    expect(cursor.value).toBe(2)
    expect(cursor.equals(clone)).toBe(false)
  })

  it('asserts public argument contracts', () => {
    const ranges = new VirtualContainer()
    const other = new VirtualContainer()

    expect(() => ranges.pushRange([1, 2])).toThrow(
      'Argument 0 must be ContiguousRangeShape.')
    expect(() => ranges.pushRange(new TrivialForwardRange())).toThrow(
      'Argument 0 must be ContiguousRangeShape.')
    expect(() => ranges.popRange(other.begin())).toThrow(
      'Cursor is from another container.')
  })

  it('asserts when stepping back before begin', () => {
    const ranges = new VirtualContainer()

    ranges.pushRange(bytesOf([1]))

    expect(() => ranges.begin().stepBack()).toThrow(
      'Cannot move cursor out of bounds.')
  })

  it('asserts when reading a cursor at end', () => {
    const ranges = new VirtualContainer()

    ranges.pushRange(bytesOf([1]))

    expect(() => ranges.end().value).toThrow(
      'Argument this must be HasValue.')
  })
})
