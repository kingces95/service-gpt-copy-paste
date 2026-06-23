import { describe, expect, it } from 'vitest'
import {
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
  RangesContainerShape,
  VirtualContainer,
} from '../index.js'

function valuesOf(range) {
  return [...iterate(range)]
}

function rangeValuesOf(ranges) {
  return toArray(ranges, valuesOf)
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

    expect([...iterate(ranges.popRangeAt(commit))]).toEqual([1, 2])
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
    expect(ranges).toBeInstanceOf(RangesContainerShape)
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

    expect([...iterate(ranges.popRangeAt(commit))]).toEqual([1, 2, 3])
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

    const consumed = ranges.popRangeAt(commit)

    expect(rangeValuesOf(consumed.ranges())).toEqual([[1], [2]])
    expect(rangeValuesOf(ranges.ranges())).toEqual([[3]])
  })

  it('materializes ranges into a byte span', () => {
    const ranges = new VirtualContainer()

    ranges
      .pushRange(bytesOf([1, 2]))
      .pushRange(bytesOf([3, 4]))

    const materialized = ranges.materialize()

    expect(materialized).toBeInstanceOf(Uint8Array)
    expect([...materialized]).toEqual([1, 2, 3, 4])
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

    expect([...iterate(ranges.popRangeAt(commit))]).toEqual([1, 2])
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
    expect(() => ranges.popRangeAt(other.begin())).toThrow(
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
