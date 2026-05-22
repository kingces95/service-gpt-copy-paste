import { describe, it, expect } from 'vitest'
import { implement } from '@kingjs/partial-implement'
import { CursorConcept } from '@kingjs/cursor'
import {
  ArrayMap,
  UnorderedMap,
  Vector,
} from '@kingjs/cursor-container'
import {
  BacktrackableCursorConcept,
  CloneableCursorConcept,
  ComparableToCursorConcept,
  CursorConcept as BaseCursorConcept,
  MeasurableCursorConcept,
  MovableCursorConcept,
  ReadableAtCursorConcept,
  ReadableCursorConcept,
  SteppableCursorConcept,
  WritableAtCursorConcept,
  WritableCursorConcept,
} from '@kingjs/cursor'
import {
  BidirectionalCursorShape,
  ContiguousCursorShape,
  ForwardCursorShape,
  InputCursorShape,
  OutputCursorShape,
  RandomAccessCursorShape,
  RangeShape,
  WritableContiguousCursorShape,
  WritableRandomAccessCursorShape,
} from '@kingjs/cursor-shape'

class MyRandomAccessCursor { }

implement(MyRandomAccessCursor, BaseCursorConcept, {
  get range() { },
  step() { },
})
implement(MyRandomAccessCursor, SteppableCursorConcept, {
  step() { },
})
implement(MyRandomAccessCursor, ReadableCursorConcept, {
  get value() { },
})
implement(MyRandomAccessCursor, CloneableCursorConcept, {
  clone() { },
})
implement(MyRandomAccessCursor, BacktrackableCursorConcept, {
  stepBack() { },
})
implement(MyRandomAccessCursor, MovableCursorConcept, {
  move() { },
})
implement(MyRandomAccessCursor, ComparableToCursorConcept, {
  compareTo() { },
})
implement(MyRandomAccessCursor, MeasurableCursorConcept, {
  distanceTo() { },
})
implement(MyRandomAccessCursor, ReadableAtCursorConcept, {
  at() { },
})

class MyWritableRandomAccessCursor extends MyRandomAccessCursor { }

implement(MyWritableRandomAccessCursor, WritableCursorConcept, {
  set value(value) { },
})
implement(MyWritableRandomAccessCursor, WritableAtCursorConcept, {
  setAt() { },
})

describe('cursor shapes', () => {
  it('structurally matches concept-composed cursor types', () => {
    expect(new MyRandomAccessCursor())
      .toBeInstanceOf(RandomAccessCursorShape)
  })

  it('structurally matches included cursor shapes', () => {
    const cursor = new MyRandomAccessCursor()

    expect(cursor).toBeInstanceOf(BidirectionalCursorShape)
    expect(cursor).toBeInstanceOf(ForwardCursorShape)
    expect(cursor).toBeInstanceOf(InputCursorShape)
  })

  it('does not publish shape matching as nominal cursor composition', () => {
    const cursor = new MyRandomAccessCursor()

    expect(cursor).toBeInstanceOf(RandomAccessCursorShape)
    expect(cursor).toBeInstanceOf(CursorConcept)
  })

  it('supports writable random access as a composed shape', () => {
    const cursor = new MyWritableRandomAccessCursor()

    expect(cursor).toBeInstanceOf(RandomAccessCursorShape)
    expect(cursor).toBeInstanceOf(OutputCursorShape)
    expect(cursor).toBeInstanceOf(WritableRandomAccessCursorShape)
  })

  it('matches real indexable cursors', () => {
    const cursor = new ArrayMap().begin()

    expect(cursor).toBeInstanceOf(RandomAccessCursorShape)
    expect(cursor).toBeInstanceOf(WritableRandomAccessCursorShape)
  })

  it('matches real iterator cursors', () => {
    const cursor = new UnorderedMap().begin()

    expect(cursor).toBeInstanceOf(InputCursorShape)
  })

  it('matches real contiguous cursors structurally', () => {
    const cursor = new Vector().begin()

    expect(cursor).toBeInstanceOf(ContiguousCursorShape)
    expect(cursor).toBeInstanceOf(WritableContiguousCursorShape)
  })

  it('matches real ranges structurally', () => {
    const range = new ArrayMap()

    expect(range).toBeInstanceOf(RangeShape)
  })
})
